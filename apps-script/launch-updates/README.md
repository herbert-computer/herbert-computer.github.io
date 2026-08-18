# Launch Updates collector

This container-bound Google Apps Script stores website launch-update registrations in the private `Subscribers` sheet.

## Deployment

1. Open the `Herbert Computer — Launch Updates` Google Sheet.
2. Open **Extensions → Apps Script** and paste `Code.gs` into the bound project.
3. Deploy it as a web app that executes as the sheet owner and allows public access.
4. Put the generated `/exec` URL in the website form action.
5. Keep the spreadsheet private to the Herbert Computer team.

## Spam controls

The collector validates email format, rejects a honeypot field, rejects implausibly fast submissions, prevents duplicate rows, and serializes writes. For stronger protection, set a `TURNSTILE_SECRET` Script Property and pass a verified Turnstile token from the website. Never commit the secret to GitHub.
