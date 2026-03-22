# Chiropractic App Use Cases

This document captures the updated workflow model as editable project documentation so the React prototype and the architecture stay aligned.

## Internal Roles

- Patient
- Practitioner
- Admin / Front Desk
- Manager

## External Systems

- Stripe for payment processing
- GoCardless for packages and membership plans
- Website Booking for online booking intake
- SMS/Email Service for automated communications

## Mermaid Diagram

```mermaid
flowchart LR
    Patient([Patient])
    Practitioner([Practitioner])
    AdminFrontDesk([Admin / Front Desk])
    Manager([Manager])
    Stripe([Stripe])
    GoCardless([GoCardless])
    WebsiteBooking([Website Booking])
    Messaging([SMS/Email Service])

    subgraph Chiropractic_App
        direction TB
        Book((Book Appointment))
        Reschedule((Reschedule / Cancel Appointment))
        Forms((Complete Forms))
        CheckIn((Check In))
        Reminders((Receive Reminders))
        Schedule((View Schedule))
        Notes((Write Clinical Notes))
        History((View Patient History))
        Calendar((Manage Calendar))
        Payments((Take Payments))
        Memberships((Manage Packages / Memberships))
        Recalls((Trigger Recalls))
        Communications((Manage Communications))
        Dashboard((View Dashboard))
        Reports((Run Reports))
        Automation((Configure Automation))
    end

    Patient --> Book
    Patient --> Reschedule
    Patient --> Forms
    Patient --> CheckIn
    Patient --> Reminders

    Practitioner --> Schedule
    Practitioner --> Notes
    Practitioner --> History

    AdminFrontDesk --> Calendar
    AdminFrontDesk --> Payments
    AdminFrontDesk --> Memberships
    AdminFrontDesk --> Recalls
    AdminFrontDesk --> Communications

    Manager --> Dashboard
    Manager --> Reports
    Manager --> Automation

    Book --> WebsiteBooking
    Reschedule --> WebsiteBooking
    Calendar --> WebsiteBooking
    Payments --> Stripe
    Memberships --> GoCardless
    Reminders --> Messaging
    Recalls --> Messaging
    Communications --> Messaging
```

## Coverage Notes

- Patient flow covers booking, schedule changes, digital forms, check-in, and reminders.
- Practitioner flow covers daily schedule visibility, note entry, and patient history review.
- Admin / Front Desk flow covers calendar operations, payments, memberships, recalls, and communications.
- Manager flow covers dashboard visibility, reporting, and automation control.
- External system touchpoints are explicit for payments, memberships, online booking, and communications.
