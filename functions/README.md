# HETTETY — Email Alerts (Cloud Function)

Sends an email to a subscriber when a **new property** matching their saved-search
alert (`alertSubscriptions` collection) is published.

## Requirements
- Firebase **Blaze** plan (Cloud Functions require it).
- An SMTP email provider — a Gmail **App Password**, SendGrid, Mailgun, etc.

## Deploy
```bash
cd functions
npm install

# Set your SMTP credentials as function secrets:
firebase functions:secrets:set SMTP_HOST      # e.g. smtp.gmail.com
firebase functions:secrets:set SMTP_PORT      # e.g. 587
firebase functions:secrets:set SMTP_USER      # your smtp user / email
firebase functions:secrets:set SMTP_PASS      # smtp password / app password
firebase functions:secrets:set SMTP_FROM      # e.g. "HETTETY <no-reply@hettety.com>"

# Bind the secrets to the function in firebase.json (functions.secrets) or via CLI,
# then deploy:
firebase deploy --only functions
```

## How it works
1. A signed-in user clicks **"Email alert"** on the listings page → a doc is written
   to `alertSubscriptions` with their email + current filters.
2. When any `properties/{id}` doc is created, `newListingAlerts` scans the
   subscriptions, matches each against the new listing, and emails the ones that fit.

## Notes
- The Firestore database ID (`ai-studio-...`) is hard-coded to match this project's
  named database — update it if you clone into another project.
- For scale, index/paginate `alertSubscriptions` instead of scanning all docs.
