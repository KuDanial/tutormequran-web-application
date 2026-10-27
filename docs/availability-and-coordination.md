# Availability and coordination prototype

Availability is shared between the tutor editor, availability list, public tutor profile and booking selector using `tmq-availability-v1` in localStorage. It is local to the browser/origin. Sample lessons are dated 21 October, 28 October and 4 November 2026. Week navigation starts on Monday in the current Malaysia calendar week. Empty weeks show an empty state. Switching weeks clears the booking selection. Booking submission retains the existing static booking destination; this prototype does not create server reservations.

The editor offers hourly start times and durations of 1–24 hours, deriving the end time automatically. This supersedes the original one-hour-only requirement. Slots store `durationMinutes`; existing one-hour records without that field remain compatible. Validation at save time and when reading slots rejects non-hour boundaries, durations outside the supported range, and inconsistent end times. Overnight lessons are labelled as ending the following day. Duplicate and overlapping intervals (including overlaps across midnight), past dates and edits to booked slots are rejected. Adjacent lessons are allowed. Storage failures are reported instead of claiming success.

Lesson cards show duration and separate Online / In person badges. The booking selector updates its duration and estimated fee from the selected slot and the sample RM 40 hourly rate. Switching weeks clears that summary. These estimates do not create a payment or alter the existing sample booking record.

Arrangement completion uses the existing session booking record and requires an accepted booking. It advances progress to Class without setting either participant's class-completion flag or enabling payment. Chat messages and location attachments are page-only previews. Location lookup requires a secure context and permission; a venue address works without geolocation. A location is attached only after the user previews and confirms it.

## Backend integration requirements

Browser validation is not a security boundary. When a backend is introduced, authorize tutor ownership and validate dates, whole-hour boundaries, the allowed 60–1440-minute duration in 60-minute increments, overlap, booking status and class mode on every mutation. Derive the end time and total fee on the server. Store times with the Malaysia timezone and handle midnight rollover. Resolve booking requests from a trusted slot ID, recheck availability, and reserve atomically to prevent concurrent bookings. Do not trust localStorage, hidden fields or client completion flags. Protect state transitions and chat access by booking membership.

Run the validation and state-transition checks with `node --test tests/booking-availability.test.cjs`.
