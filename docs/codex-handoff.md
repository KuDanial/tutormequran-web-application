# TutorMeQuran project handoff

Updated 15 October 2026. This repository is a static HTML/CSS/JavaScript prototype for the TutorMeQuran CSP600 project. The supplied proposal remains the product boundary; the later workflow additions below are interface refinements requested during development.

## Product scope

TutorMeQuran connects Malaysian students with verified Quran tutors. The proposal covers tutor discovery, tutor qualification review, profiles, availability, booking, booking management, student DuitNow receipt upload, tutor payment acknowledgement, admin verification and feedback. Classes use external online tools such as Google Meet or WhatsApp, or an agreed physical venue. The website does not contain a video-call system, payment gateway, automatic bank verification, automatic refund engine or travel-price calculator.

## Current interface work

- Public pages include the landing page, tutor search/detail pages, registration, login, help and FAQ content.
- Student and tutor profile menus use grouped Dashboard, Management, Support and Log Out sections. Student heading is `Student Account`; tutor heading is `Tutor Account`.
- Student registration starts with first name and last name, followed by email, gender and date of birth. Profile pictures are uploaded later in profile edit. The default image is `assets/img/default-avatar-profile.png`.
- Student and tutor profile edit pages use a left profile card and right-side content. Profile view pages display the profile picture. Profile edit pages have a Cancel action returning to profile view.
- Tutor application registration has the simplified progress flow `Apply → Admin verification`. Profile setup and publishing are done from profile edit after approval.
- The original tutor setup/publishing pages were restored as extra reference pages: `tutor-profile-setup.html`, `tutor-profile-ready.html`, `tutor-profile-visibility.html`, `tutor-profile-draft.html` and `tutor-profile-private.html`.
- Tutor dashboard application pages show the same two-step animated progress bar. The extra pages preserve the older four-step flow for reference.
- Booking progress is shared across student and tutor pages with five stages: `Booking → Arrange → Class → Payment → Verified`. Pending/past booking cards also show the bar at the bottom. Dedicated detail pages show their own process context without changing saved booking state.
- Student and tutor booking pages include accept/reject, arrange/chat, class completion, DuitNow payment receipt and tutor acknowledgement screens. Tutor DuitNow QR management is available from `tutor-payment-qr.html` and the Manage DuitNow QR action is aligned to the right of `tutor-payments.html`.
- Session pages no longer show report-session-issue buttons. Users can use the booking conversation or support pages for issues.
- Destructive actions such as cancellation, rejection, delete/remove actions and logout use red styling, warning symbols and confirmation dialogs. Ordinary Back links remain neutral.
- Footer branding spacing was tightened to match the header. Footer “Our Guidelines” was changed to Support, and “Member Log In” was removed from every footer.
- `README.md` now includes the centered logo, badges, project banner, features, booking flow, local setup, structure and backend limitations.

## Local prototype behaviour

On 18 October 2026, the new-booking form's manual appointment date and time controls were replaced with tutor-defined slot cards matching the public tutor detail page. The public available-slot link passes a slot ID; `assets/js/lesson-selection.js` preselects only a matching enabled radio card. Booked cards are disabled, an available selection is required, and class option remains selectable. The existing Reserve destination still displays the sample booking; this change does not create a new persisted booking. In PHP, submit the slot ID and supported class option, derive the date/time and fee from the tutor's availability record, and atomically recheck availability when reserving. Never accept a client-supplied date/time as tutor availability.

`assets/js/tutor-workflow.js` stores the sample booking `TMQ-1024` in `sessionStorage` for the current browser tab. It handles tutor acceptance/rejection, participant completion, receipt upload and tutor payment acknowledgement. `assets/js/booking-progress.js` renders saved booking status on overview/list pages; pages marked `data-progress-source="page"` keep their own explanatory stage. `assets/js/student-workspace.js` handles grouped menus, tabs and support forms. `assets/js/action-confirmation.js` confirms dangerous actions before existing handlers run. `assets/js/duitnow-qr.js` handles local QR/receipt display.

This state is not shared between users, tabs or devices and is not a security boundary. Run the site through a local HTTP server instead of relying on `file://` storage behaviour:

```bash
python -m http.server 8000 --bind 127.0.0.1
```

## Proposal alignment

FR8–FR10 are represented by available slots, booking creation, edit/cancel controls and pending/past booking lists. FR11 is represented by student DuitNow receipt upload. FR12 is represented by admin payment verification pages. FR13 is represented by tutor confirmation or payment issue reporting. Usability and responsive layout support the non-functional requirements. Tutor accept/reject, two-party class completion and post-class payment timing are requested workflow refinements, not replacements for the proposal requirements.

## PHP/backend work still required

Implement authentication and role/ownership checks; durable users, profiles, tutor certificates, availability, bookings, payments, receipts, feedback and support requests; available-slot locking; server-side validation and upload storage; chat/message persistence; DuitNow QR storage; admin verification writes; cancellation/refund policy handling; notifications; CSRF protection; server-side destructive-action authorization; and audit/status history. Never trust `sessionStorage`, page filenames or client-side confirmations for access control or payment verification.

## Useful references

- `README.md` — public project overview and local setup.
- `INTERFACE-GUIDE.md` — page map, proposal/ERD notes and lifecycle explanation.
- `docs/tutor-workflow.md` — tutor booking and payment sequence.
- `docs/booking-progress-and-actions.md` — progress markup, action confirmations and PHP migration notes.
- `docs/student-navigation-scope.md` — student navigation and proposal scope.

Before adding new pages, search existing student/tutor/admin pages and shared CSS/JS first. Keep role-specific routes separate, preserve the five-stage booking status vocabulary, and avoid adding demo/preview navigation back into user-facing menus.
