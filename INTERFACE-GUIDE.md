# TutorMeQuran interface guide

This revision follows the supplied CSP600 proposal (sections 1.5, 1.7, 3.2.3, 3.3.3 and 3.4.2) and the two ERD screenshots. It remains a **static HTML/CSS prototype**. There is no PHP backend, database or server authentication yet. Shared JavaScript provides interface interactions and selected local workflow state; see docs/tutor-workflow.md and docs/booking-progress-and-actions.md for the current behaviour and PHP migration notes.

## Page map

1. Start at `index.html`, then browse `tutors.html` and `tutor-detail.html`.
2. Open `register.html#tutor-application`. A tutor applies with personal/account details and one certificate. Pricing and biography are absent from registration.
3. Open `tutor/tutor-dashboard.html`: Nur Hana is awaiting verification. The two-step progress bar shows Apply complete and Admin verification current. Profile setup and publishing are not application steps.
4. `tutor/tutor-application-rejected.html` and `tutor/tutor-application-approved.html` retain the correction and approval outcomes. PHP should select the appropriate application state from the database; users do not choose a state through preview buttons.
5. Use `tutor/tutor-profile-edit.html` for teaching details and `#profile-visibility` on that same page for Draft, Private or Public visibility. The older setup, ready-to-publish, visibility, draft-view and private-view pages are restored as extra reference pages. The main dashboard and registration retain their simplified two-step application progress. Profile view/edit are the shared pages for these states in PHP.
6. Use `tutor/tutor-dashboard-verified.html` for Muhammad Farhan's established tutor account. This is a separate sample tutor with historical bookings. Profile editing, availability, payments and visibility are available.
7. Open `student/student-booking-view.html` and `student/student-payment-view.html` to follow booking TMQ-1024.
8. Open `tutor/tutor-payment-view.html`, then the confirmation or issue screen. `tutor/tutor-payment-received.html` previews an acknowledgement awaiting admin review.
9. Open `admin/admin-dashboard.html`. The sidebar leads to application, payment, booking, user, FAQ and report management. `admin/manage-payments-confirmed.html` previews the point at which an admin can approve an acknowledged receipt.
10. Review `report/report-dashboard.html`: one page containing comparison and composition reports only.

The footer's **Prototype · sample data** disclosure links the role previews. Action buttons deliberately do not persist changes. Navigation labelled as a preview does not simulate saving or approval. Radio buttons, file selection, date inputs, FAQ accordions and the registration tabs use native HTML/CSS behaviour.

## Tutor lifecycle

| State | Personal account | Teaching profile/rate | Availability | Public listing |
| --- | --- | --- | --- | --- |
| Pending application | Editable | Locked | Locked | Not listed |
| Rejected certificate | Editable; certificate can be replaced | Locked | Locked | Not listed |
| Verified + Draft | Editable | Editable | Editable | Not listed/bookable |
| Verified + Private | Editable | Editable | Editable | Not listed/bookable |
| Verified + Public | Editable | Editable | Editable | Listed; available slots bookable |

Public visibility requires a verified, active tutor, completed teaching details and rate, and at least one available slot. Saving a profile does not publish it. Changing to Private does not cancel existing bookings. Verification and visibility are separate concepts.

**Enforcement is future backend work.** Separate HTML files illustrate the states; they cannot restrict direct URL access or protect private data. No security claim is made by the disabled controls. Nur Hana's pending/rejected/approved pages are alternative previews of one application, not simultaneously persisted states.

## DuitNow payment lifecycle

1. Student reserves a lesson and reviews the fee and recipient.
2. Student transfers directly to the tutor outside the website and submits a receipt.
3. Tutor views the same receipt and checks their bank transaction. They acknowledge funds received or report a mismatch.
4. Admin checks the booking, amount, receipt and tutor acknowledgement; the admin records Verified or Rejected.

Tutor acknowledgement **does not** replace admin verification (FR13). In the proposed workflow, pending/mismatched tutor confirmation keeps admin approval unavailable until resolved. A rejected receipt can be replaced on the existing payment record; it does not create a second payment or imply that the student must pay again. Receipt replacement resets the related review/acknowledgement. Cancellation does not automatically refund a bank transfer.

The staged progress and clear participant responsibilities are inspired by [CSFloat's documented confirmation journey](https://blog.csfloat.com/introducing-the-new-csgofloat-market-and-tools/). TutorMeQuran retains direct DuitNow transfers and manual verification: no escrow, wallet, automated funds release, payment gateway or CSFloat integration is included. Sample payment instructions contain no payable bank account or QR code.

## Original ERD coverage

The original attribute spellings below are taken from the screenshots. Labels in the UI use readable names. Foreign keys are represented by associated record references, rather than editable IDs. Names on registration/profile inputs support later mapping; no database is created.

| Entity | Attributes from supplied diagrams | Interface coverage |
| --- | --- | --- |
| Account | `accountID`, `accountUsername`, `accountPassword`, `accountRoleType` | Account references in private profiles; username/password in registration and login; role registration panels and login selector. Passwords are never displayed in account records. |
| Student | `studID`, `studFName`, `studLName`, `studICNum`, `studPhone`, `studEmail`, `studAddress`, `accountID` | Student registration, student profile view/edit, admin student view/edit. IC is collected at registration and masked in sample private views. |
| Tutor | `tutorID`, `tutorFName`, `tutorLName`, `tutorICNum`, `tutorPhone`, `tutorEmail`, `tutorAddress`, `hourlyRate`, `tutorStatus`, `accountID` | Tutor application, applicant account, verified account, teaching profile, admin tutor pages. Hourly rate is only editable in verified-state screens. Public profiles omit IC, account ID and private address. |
| Admin | `adminID`, `adminFName`, `adminLName`, `adminEmail`, `accountID` | `admin/admin-profile.html`, admin identity in the sidebar, certificate reviewer references. |
| Certificates | `certificatesID`, `certificateName`, `certificateDescription`, `certificateYear`, `certificateStatus`, `tutorID`, `adminID` | Registration certificate fields, replacement form, applicant review, verified certificate view and admin review. Pending applications show the reviewer as unassigned. |
| Booking | `bookingID`, `bookingTimestamp`, `bookingStatus`, `appointmentDate`, `startTime`, `endTime`, `classType`, `studID`, `tutorID` | Booking details for all roles show the booking timestamp, participant references, start/end times, date and class type. Student/tutor/admin edit and cancellation screens are provided. |
| Payment | `payID`, `payAmount`, `payDate`, `payStatus`, `payReceipt`, `bookingID` | Student upload/status, tutor receipt/confirmation, admin verification. The payment ID and booking reference remain visible throughout. |
| Feedback | `feedbackID`, `rating`, `comments`, `feedbackDate`, `bookingID` | Feedback list and detail show FB-001 and its completed booking. The add form selects a completed booking without existing feedback. |

### Relationships retained

- One Account has one role profile; there is no public Admin registration option.
- Registration starts with one certificate submission. A pending application may replace its evidence. Higher qualifications require a new submission, while earlier approved evidence is retained; the updated ERD should therefore allow one tutor to have multiple certificate submissions.
- A booking connects one student and one tutor.
- A booking has zero or one payment. A replacement receipt remains on the same payment.
- A booking has zero or one feedback record. The sample completed booking TMQ-1008 already has feedback; the new-review form offers TMQ-0992 instead.
- Admin oversees students, tutors and bookings, and reviews certificates.

## Required extensions for the requested improvements

These concepts are **not all present in the supplied ERD**. They are interface proposals to include when revising the ERD/SRS, not database changes made by this task.

| Entity or concept | Proposed fields | Reason |
| --- | --- | --- |
| Tutor listing | `profileVisibility` (Draft/Private/Public), `displayName`, `qualification`, `shortBio`, `teachingMode`, `teachingState`, `lessonFocus`, optionally `publishedAt` | Separate approval from publishing and store the teaching profile requested in the new brief. `hourlyRate` already exists. |
| Tutor availability | `availabilityID`, `tutorID`, `availabilityDate`, `startTime`, `endTime`, `classType`, `availabilityStatus` | Required by FR11 but no Availability entity appears in the supplied screenshots. |
| Payment confirmation | `tutorPaymentConfirmation`, `tutorConfirmedAt`, `tutorPaymentRemark` / issue reason | Record acknowledgement separately from `payStatus`. Only the booked tutor should be able to acknowledge receipt. |
| Payment review | `paymentAdminRemark`, reviewer `adminID`, `reviewedAt`, `receiptUploadedAt`, optional receipt version | Provide correction reasons and distinguish transfer date (`payDate`) from receipt upload time. Prevent stale acknowledgement after receipt replacement. |
| Certificate evidence/review | Certificate file reference, `uploadedAt`, `reviewedAt`, `certificateAdminRemark` | The original certificate entity lacks a file attribute and review remarks despite the upload/review requirement. |
| Account | `accountStatus` | Active/inactive management is distinct from tutor qualification status. Password storage must be hashed in the future backend. |
| Booking details | `bookingNotes`, `cancellationReason`, optional physical location | Support learning notes and explain booking changes/cancellations. |
| Fee history | Booked hourly rate and total fee snapshot | Preserve the price agreed at booking when a tutor later changes `hourlyRate`. |
| Tutor payment destination | Verified recipient name, payment method/identifier | Direct DuitNow instructions need a trustworthy recipient record. Only placeholders exist now. |
| FAQ | `faqID`, question/keyword, answer, status | FR15 and the FAQ maintenance pages require a record that is absent from the shown ERD. |

Do not overload `tutorStatus` with Public/Private/Draft, or `payStatus` with tutor acknowledgement. The report's payment composition now includes **Verified / Pending / Underpaid / Rejected / Reupload Required**, based on the admin decision. Revenue totals include verified payments only. The sample composition totals 60: 45 verified, 6 pending, and 3 each underpaid, rejected and reupload required.

## Latest interface refinements

- Student/tutor rolebars are replaced by native HTML profile dropdowns, including the previous workspace links, Dashboard, My Profile, Change Password and Logout. Admin retains its sidebar and receives the same dropdown pattern. Logout navigates to the login preview; it performs no session operation.
- Personal forms collect a required profile-picture file, gender, date of birth, phone, state and address. Student and tutor registration include the new picture/gender/DOB fields. Tutor teaching forms include teaching area, mode, languages, rate, biography and sample lesson tags with an inert Add Lesson button. Optional tutor socials are limited to Facebook, Instagram, LinkedIn, X/Twitter and TikTok.
- Approved qualifications are read-only. `tutor/tutor-certificate-upload.html` represents a higher-qualification submission. `tutor/tutor-certificate-replace.html` retains the pending-application correction screen. New qualifications do not overwrite the existing approval while review is pending.
- Password forms are previews for users changing their own passwords. Admin user-edit screens offer password-reset assistance; an administrator is not asked to know another user's current password.
- Availability warnings are placeholders. Do not hard-code today's date in HTML: later code should use Malaysia's current calendar date for the input minimum and enforce it independently on the server, alongside end-after-start and overlap checks.
- PDF, Excel and print buttons are interface-only. No export file or print action is generated yet.
- Payment reconciliation shows expected, paid and outstanding amounts. RM4 paid toward RM40 leaves RM36 outstanding. An evidence correction does not itself transfer funds. Missing payment stays unverified; invalid evidence can be rejected. A backend may need multiple immutable receipt/transfer entries attached to one booking-payment aggregate to track a top-up without losing the original evidence.
- Cancellation before the booking date records Cancelled by Student or Cancelled by Tutor. On that date in Malaysia time it records Late Cancellation plus the cancelling party. Payment disputes go to admin review; no automatic fee or refund is implemented.
- A physical-to-online request remains pending until accepted by the tutor. Rejection preserves the original arrangement, with rescheduling/cancellation discussed through chat. `student/student-chat.html` and `tutor/tutor-chat.html` contain a shared sample physical booking TMQ-1025. It is explicitly separate from existing online booking TMQ-1024.
- `admin/admin-settings.html` previews editable-field controls. Approved qualifications, certificates and verification status cannot be unlocked by these checkboxes. Settings do not actually change permissions or other forms in this static version.

For the next ERD revision, add profile photo/gender/DOB, teaching area/languages/lesson tags, optional social URLs, certificate-submission history, cancellation party/timestamp, mode-change request state, booking conversation/message records and editable-field configuration. Actual password changes and permission enforcement remain backend work.

## Scope and sample consistency

- The target users are adults aged 18+ residing in Malaysia. Child-focused catalogue copy has been replaced.
- No promised verification turnaround, automatic post-approval publication, cancellation fee, JAKIM affiliation or implemented database overlap protection is asserted.
- No built-in video call, AI API, payment gateway, mobile app or distance-based pricing.
- Farhan (TU-001) is a verified Public tutor. Hana (TU-002) is the application example. Only Farhan appears in the sample public directory.
- TMQ-1024 is an existing 20 October booking. The public profile and new-booking form show the next slot on 21 October; the new-booking preview link explicitly opens an existing example.
- The four tutors in the comparison report represent historical bookings; a tutor does not need to be currently Public to appear in historical reports.
- Forms and search controls are visual prototypes. No live record filtering, slot reservation, upload, email, review or authentication occurs.

## Validation

Static checks passed for all 77 HTML pages: nesting, duplicate IDs, input labels, headings, relative links, local assets and anchors, and absence of scripts/form-processing actions. Latest Chrome frame checks passed for the 71 registration, tutor-detail and workspace pages at 1280px and 375px, including page overflow and open profile-menu boundaries. Existing Google Fonts and Font Awesome remain external style dependencies.

The original landing-page social and policy links still use placeholder `#` destinations; real social profiles and policy text were not supplied. All application flow links resolve to local pages.

## Extra pages: original tutor step flow

The original Apply -> Admin review -> Set up profile -> Publish flow remains available in these extra pages:

- `tutor/tutor-profile-setup.html` ? initial teaching profile setup.
- `tutor/tutor-profile-ready.html` ? completed profile and publishing choice.
- `tutor/tutor-profile-visibility.html` ? visibility controls.
- `tutor/tutor-profile-draft.html` ? draft profile state.
- `tutor/tutor-profile-private.html` ? private profile state.

For PHP, the current profile view/edit pages remain the main workflow; these extras illustrate the earlier flow.
