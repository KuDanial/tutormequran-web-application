# Student navigation and proposal alignment

Reference: PROPOSAL TENGKU AHMAD DANIAL TENGKU NOOR ASHRAF (2025197383).docx.pdf, supplied by the project owner on 14 October 2026.

The student navigation is organized for TutorMeQuran. It does not adopt another platform's booking or payment rules.

## Navigation

- Dashboard: My Profile, Notifications, Invoice (Pending / Receipts). The Dashboard heading links to the student landing page.
- Management: My Bookings (Pending bookings / Past bookings), My Feedbacks.
- Support: Help Centre (Submit a request / Contact Us), FAQ.
- Log Out: separate final action.

## Requirement mapping

| Area | Proposal reference | Implementation boundary |
| --- | --- | --- |
| Profile | FR3, printed page 41 / PDF page 44 | View first, then edit existing personal details. |
| Bookings | FR8–FR10, printed page 41 | Available-slot booking, edit/cancel, upcoming and past bookings remain accessible. “Pending bookings” groups upcoming/in-progress bookings; it does not imply every booking needs new approval. |
| Invoice | FR11–FR13, printed page 41 | A navigation label for lesson fees and DuitNow records. Students upload receipts; tutors acknowledge funds or report issues; admin verifies receipts. No payment gateway or automatic refund is introduced. |
| Usability | NFR1 and NFR8, printed page 42 / PDF page 45 | Grouped dropdown, large targets, expandable supporting records, responsive layouts. |
| Online classes | Sections 1.7 and 3.2.2, printed pages 5 and 37 | Classes continue on external platforms such as Google Meet or WhatsApp. |

## Requested interface additions

Notifications, feedback, support requests, FAQ and invoice terminology are not separately listed in FR1–FR14. They are user-requested interface additions supporting account, booking and payment tasks; they should not be described as original numbered proposal requirements.

The Help Centre offers billing/refund, attendance and other requests, with a required description and optional image. Refund requests are questions for review, not approvals or automatic money movements. Contact links use the contact information already displayed in the site footer; production ownership must be confirmed before launch.

The existing after-class payment sequence and both-participant completion confirmation were requested earlier by the owner. FR11 states receipt upload after booking; it does not explicitly prescribe post-class timing or require both completion confirmations. These are refinements to the proposed flow, not claims about the original requirement text.

## Prototype behavior

Sample notification, booking and receipt records are static. Menu navigation and Pending/Past or Pending/Receipts switching work in the browser. The support form validates and previews input locally; it does not send requests, persist personal data, or upload photos. Log Out returns to the login preview; real session termination needs the account backend.
