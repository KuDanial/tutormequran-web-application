# Tutor booking and payment interface

The tutor menu uses the same grouped layout as the student menu, with tutor-specific destinations:

- Dashboard: profile, notifications, Payments (DuitNow QR / Pending confirmation / Received).
- Management: pending/past bookings, availability, certificate and student feedback.
- Support: Help Centre (request / contact), FAQ.
- Log Out.

## Booking and payment sequence

1. A student requests an available slot. The tutor accepts or rejects the booking. Rejection requires a reason and ends the booking without payment.
2. An accepted booking continues to the booking conversation and class session.
3. Each participant confirms that the class took place using their own page. Neither participant's button confirms completion on the other's behalf.
4. The tutor's bank-issued QR is managed through `tutor-payment-qr.html`, using the existing QR storage mechanism. The student's payment page displays it.
5. The student uploads a PDF, JPG or PNG receipt. Tutor receipt review displays the uploaded file rather than invented proof of a successful transaction.
6. The tutor checks their bank and confirms receipt of funds using a required acknowledgement checkbox, or records a payment issue. A receipt is required for confirmation.
7. `tutor-payment-received.html` displays the tutor acknowledgement. Admin verification remains pending and independent.

## Proposal alignment

FR8–FR10 cover booking and booking management. FR11–FR13 cover student receipt upload, admin verification, and tutor payment acknowledgement/issues. The tutor accept/reject decision and post-class timing are owner-requested refinements; they are not separate requirements explicitly stated in the original FR list. No refund, payment gateway or automatic bank verification is added.

## Implementation boundary

This remains a static HTML application. Booking decisions, participant completion, receipt files and tutor acknowledgement are stored in sessionStorage for TMQ-1024 in the current browser tab. QR storage is also browser-local. Navigate within that same tab to inspect the complementary student/tutor states. They are not transmitted between users or devices, and file:// storage availability varies by browser; serve the site over a local HTTP server for consistent origin storage.

The backend still needs authentication, role/ownership enforcement, available-slot locking, durable file storage, real messaging/support submission, and admin verification writes. Receipt MIME/size checks in the browser are convenience validation and must be repeated on the server. Support and chat controls explicitly avoid claiming a message was sent when no server is connected.

Role-switching demo navigation, Explore the Demo, Explore other steps, and Preview action labels have been removed from the HTML pages. Tutor actions no longer route into student booking/payment pages. Existing backend limitations are documented here instead of shown as navigation controls.
