# ChiroApp-first-version

Interactive first-version prototype for a chiropractic clinic workflow app.

## What's Included

- A browser-run React app in `index.html`, `styles.css`, and `app.js`
- A shared-state clinic command center covering Patient, Practitioner, Admin / Front Desk, and Manager workflows
- Integrated demo data for appointments, forms, check-ins, clinical notes, payments, memberships, recalls, communications, reports, and automation
- External system mapping for Stripe, GoCardless, Website Booking, and SMS/Email service
- Editable use-case documentation in `docs/use-cases.md`

## Open It

This version uses React from CDN scripts, so there is no Node setup required.

You can open `index.html` directly in a browser, or serve the folder locally:

```bash
python3 -m http.server 8000
```

Then visit `http://localhost:8000`.

## Notes

- The app stores demo interactions in browser local storage so actions persist between refreshes.
- Use the `Reset Demo Data` button in the command center to restore the seeded clinic state.
