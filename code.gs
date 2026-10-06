// Oura to Google Calendar Integration Script
const PROPERTIES = PropertiesService.getScriptProperties();

function getOuraAuthService() {
  return OAuth2.createService('Oura')
    .setAuthorizationBaseUrl('https://cloud.ouraring.com/oauth/authorize')
    .setTokenUrl('https://api.ouraring.com/oauth/token')
    .setClientId(PROPERTIES.getProperty('OURA_CLIENT_ID'))
    .setClientSecret(PROPERTIES.getProperty('OURA_CLIENT_SECRET'))
    .setCallbackFunction('authCallback')
    .setPropertyStore(PropertiesService.getUserProperties())
    .setScope('email personal daily heartrate tag workout session spo2 ring_configuration stress heart_health');
}

function authCallback(request) {
  const service = getOuraAuthService();
  const authorized = service.handleCallback(request);
  if (authorized) {
    return HtmlService.createHtmlOutput('Success! You can close this tab.');
  } else {
    return HtmlService.createHtmlOutput('Authentication failed.');
  }
}

function authorizeOura() {
  const service = getOuraAuthService();
  if (!service.hasAccess()) {
    const authorizationUrl = service.getAuthorizationUrl();
    Logger.log('Open this link to authorize Oura: %s', authorizationUrl);
  } else {
    Logger.log('Oura is already authorized.');
  }
}

function syncOuraToCalendar() {
  const service = getOuraAuthService();
  if (!service.hasAccess()) {
    Logger.log('Please run authorizeOura() first.');
    return;
  }

  const calendarId = PROPERTIES.getProperty('CALENDAR_ID') || 'primary';
  const calendar = CalendarApp.getCalendarById(calendarId);

  // Skip if today's event already exists
  const existing = calendar.getEventsForDay(new Date()).filter(function (e) {
    return e.getTitle().indexOf('Oura Sleep Score') === 0;
  });
  if (existing.length > 0) {
    Logger.log('Event already exists today. Skipping.');
    return;
  }

  const today = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd');
  const url = 'https://api.ouraring.com/v2/usercollection/daily_sleep?start_date=' + today + '&end_date=' + today;

  const response = UrlFetchApp.fetch(url, {
    headers: { 'Authorization': 'Bearer ' + service.getAccessToken() },
    muteHttpExceptions: true
  });

  if (response.getResponseCode() !== 200) {
    Logger.log('Oura API error (%s): %s', response.getResponseCode(), response.getContentText());
    return;
  }

  const data = JSON.parse(response.getContentText());
  const sleep = data.data && data.data[0];

  // No score = no event
  if (!sleep || typeof sleep.score !== 'number') {
    Logger.log('Oura: no sleep score for %s. No event added.', today);
    return;
  }

  calendar.createAllDayEvent('Oura Sleep Score: ' + sleep.score, new Date());
  Logger.log('Synced sleep score: ' + sleep.score);
}

function setupHourlyTrigger() {
  // Remove old triggers so there are no duplicates
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (t.getHandlerFunction() === 'syncOuraToCalendar') {
      ScriptApp.deleteTrigger(t);
    }
  });

  ScriptApp.newTrigger('syncOuraToCalendar')
    .timeBased()
    .everyHours(1)
    .create();
  Logger.log('Hourly sync trigger set.');
}
