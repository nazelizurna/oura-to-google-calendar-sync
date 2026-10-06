# Oura to Google Calendar

Google Apps Script that adds your daily Oura sleep score to Google Calendar as an all-day event.

- Runs hourly
- No score from Oura = no event
- One event per day (skips if it already exists)

## Setup

### 1. Oura app
1. Sign in at [developer.ouraring.com](https://developer.ouraring.com/) and create an application.
2. Add this Redirect URI (use your own Script ID):
   ```
   https://script.google.com/macros/d/YOUR_SCRIPT_ID/usercallback
   ```
3. Copy the Client ID and Client Secret.

### 2. Apps Script
1. Create a project at [script.google.com](https://script.google.com/) and paste the script into `Code.gs`.
2. Add the OAuth2 library: **Libraries > +**, Script ID below, identifier `OAuth2`.
   ```
   1B7FSrk5Zi6L1rSxxTDgDEUsPzlukDsi4KGuTMorsTQHhGBzBkMun4iDF
   ```
3. Under **Project Settings > Script Properties**, add:

   | Property | Value |
   |---|---|
   | `OURA_CLIENT_ID` | Oura Client ID |
   | `OURA_CLIENT_SECRET` | Oura Client Secret |
   | `CALENDAR_ID` | Optional. Defaults to `primary` |

### 3. Authorize
1. Run `authorizeOura()`.
2. Open the link from the execution log once, and click **Allow**.
3. Run `authorizeOura()` again. It should log `Oura is already authorized.`

### 4. Test and schedule
1. Run `syncOuraToCalendar()`.
2. Run `setupHourlyTrigger()` once.

## Functions

| Function | Purpose |
|---|---|
| `authorizeOura()` | Prints the Oura authorization link |
| `syncOuraToCalendar()` | Fetches today's sleep score and creates the event |
| `setupHourlyTrigger()` | Replaces existing triggers with one hourly trigger |

## Troubleshooting

| Error | Fix |
|---|---|
| `OAuth2 is not defined` | Add the OAuth2 library with identifier `OAuth2` |
| `400 invalid_request` | Redirect URI in the Oura app must match the script's exactly. Authorization links work only once, so generate a new one |
| `Please run authorizeOura() first` | Authorize in this project. Authorization is stored per project |
| "Unable to open the file" after Allow | Sign in to only one Google account, or use incognito |
| No event created | Oura has no score for today yet. Check the log |

## Notes

- Never commit your Client ID or Client Secret. Keep them in Script Properties.
- Libraries, script properties, and authorization do not copy between Apps Script projects.
- Event titles start with `Oura Sleep Score`. Renaming them breaks the duplicate check.
