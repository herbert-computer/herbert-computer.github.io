# Launch Updates collector

This container-bound Google Apps Script stores website launch-update registrations in the private `업데이트 신청자` sheet.

## Deployment

1. Open the `[H／C] [MASTER] Launch Updates` Google Sheet.
2. Open **Extensions → Apps Script** and paste `Code.gs` into the bound project.
3. Deploy it as a web app that executes as the sheet owner and allows public access.
4. Put the generated `/exec` URL in the website form action.
5. Keep the spreadsheet private to the Herbert Computer team.

## Spam controls

The current deployment validates email format, rejects a honeypot field, rejects implausibly fast submissions, prevents duplicate rows, protects Sheet text fields from formula injection, and serializes writes.

Turnstile hooks are included but are not active. For stronger protection, add the client-side Turnstile widget and token flow first, then set a `TURNSTILE_SECRET` Script Property. Setting the secret before the client token flow is live will reject every legitimate submission. Never commit the secret to GitHub.
