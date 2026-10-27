# Frontend audit and implementation report

Audit date: 27 October 2026. Locations below refer to the final working-tree files for this change, not Git HEAD. Applied findings point to replacement code; proposed findings point to the current rule or markup to replace.

## Scope and verification

All **99 HTML files and all 3 CSS files** were scanned, including the homepage's embedded stylesheet and 14 inline style attributes. JavaScript was inspected where it creates DOM elements, supplies classes, or changes booking state. The complete file inventory is in `frontend-audit-data.json`. Refresh with `python scripts/audit_frontend.py`; regenerate this report with `python scripts/build_audit_report.py`.

Checks covered tag nesting/closure, duplicate IDs, local assets/links (including cross-page fragments), labels and ARIA references, image alt attributes, names of visible links/buttons, viewport metadata, CSS brace balance, repeated selectors within the same at-rule context, class usage, and undefined CSS variables. Manual source review covered layout sizing, breakpoints, overflow, inheritance, contrast and generated UI.

No unclosed non-optional tags, unmatched closing tags, nested forms, duplicate IDs, missing local assets/fragments, missing alt attributes, unlabelled visible form controls, broken label/ARIA targets, missing viewport metadata or undefined CSS variables were detected. All pages have a main landmark. There are no CSS float declarations, so no float-clearing defect was found. These are source-check results, not complete HTML conformance or WCAG certification.

Browser rendering, computed styles, keyboard traversal, screen-reader output and actual geolocation permission prompts were **not tested**: no browser automation runner is installed in this workspace. Responsive risks below distinguish directly provable CSS behavior from situations requiring a viewport check. Static inspection cannot prove the absence of all visual issues.

## Implemented behavior

- Slot cards show separate **Online** and **In person** badges with decorative icons, plus duration.
- Form grids use one spacing system instead of stacking margins and gaps.
- Tutors choose a start hour and **1–24 hours**, in whole-hour increments. End times are derived, including next-day rollover. Duration is stored with the slot.
- Validation rejects unsupported/tampered durations, inconsistent end times, overlaps (including across midnight), past dates and edits to booked slots. Adjacent lessons are allowed. Existing one-hour records remain readable.
- Booking selection updates duration and the estimated fee at the sample RM 40 hourly rate. A two-hour slot previews RM 80. Switching weeks clears selection and estimate.
- This remains a local prototype: selection navigates to the existing static sample booking, not a new server reservation. Backend duration, pricing, authorization and overlap checks remain required.

## Findings and optimized fixes

**Applied** means the replacement is in the working tree. **Proposed** means the audit supplies a concrete fix that has not been applied. **Latent** means an issue in code not currently loaded by any HTML page.


### F01. Raw class-mode text and excessive slot-card spacing

**Status:** Applied.

**Locations:** `assets/js/lesson-selection.js:40`, `assets/css/style.css:2343`.

The card rendered the raw value `Both` using `.field-help`, whose paragraph margins added unwanted vertical space. The replacement exposes each mode explicitly. Icons are decorative; text remains the accessible name. The internal `Both` value is retained for compatibility.

```css
.slot-modes {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: .35rem;
}
.slot-mode {
  display: inline-flex;
  align-items: center;
  gap: .35rem;
  padding: .25rem .55rem;
  border: 1px solid #c8ded5;
  border-radius: var(--radius-full);
  font-size: .75rem;
  font-weight: 600;
  color: #235c45;
  background: #f5faf7;
}
.slot-duration {
  font-size: .75rem;
  font-weight: 600;
  color: var(--text-muted);
}
```


Replace the raw mode span in each generated card with this structure (render only the modes supported by the slot):

```html
<span class="slot-modes">
  <span class="slot-mode"><i class="fas fa-video" aria-hidden="true"></i>Online</span>
  <span class="slot-mode"><i class="fas fa-map-marker-alt" aria-hidden="true"></i>In person</span>
</span>
```


### F02. Form-group margins compound grid gaps

**Status:** Applied.

**Locations:** `assets/css/style.css:1821`, `assets/css/style.css:1822`, `tutor/tutor-availability-addNew.html:51`, `tutor/tutor-availability-edit.html:51`.

The availability override added a 1.5rem row gap on top of each form group's 1.5rem bottom margin. The grid now owns row spacing, and help text no longer adds another bottom margin. Existing single-column mobile rules remain in place.

```css
.portal-fields {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: .9rem 1rem;
  margin-bottom: 1rem;
}
.portal-fields > .form-group {
  margin-bottom: 0;
  min-width: 0;
}
.portal-fields .field-help {
  margin-bottom: 0;
}
```


### F03. Fixed duration and fee copy misdescribes longer lessons

**Status:** Applied.

**Locations:** `student/student-booking-addNew.html:82`, `student/student-booking-addNew.html:86`, `assets/js/lesson-selection.js:16`, `tutor-detail.html:116`.

The static 1-hour / RM 40 summary would misdescribe a longer selection. Both values now update from the selected slot. The public profile describes variable durations and hourly pricing.

```html
<dt>Duration</dt>
<dd data-selected-duration aria-live="polite">Choose a lesson</dd>
<dt>Total Lesson Fee</dt>
<dd data-selected-fee aria-live="polite">Calculated from your selected duration</dd>
```


The associated summary update uses the validated selected slot and the form's sample hourly rate. Call it after selection changes and when switching weeks clears selection:

```js
function updateSummary() {
  if (!form) return;
  const slot = slots.find((entry) => entry.id === selection && available(entry));
  document.querySelector('[data-selected-duration]').textContent =
    slot ? api.durationLabel(slot) : 'Choose a lesson';
  document.querySelector('[data-selected-fee]').textContent = slot
    ? `RM ${(Number(form.dataset.hourlyRate) * api.duration(slot) / 60).toFixed(2)}`
    : 'Calculated from your selected duration';
}
```


### F04. Chat grid styling leaked into payment and session layouts

**Status:** Applied.

**Locations:** `assets/css/style.css:2353`, `student/student-payment-upload.html:67`, `student/student-booking-session.html:63`, `admin/manage-payments-view.html:22`, `admin/manage-payments-confirmed.html:22`.

The appended chat rule targeted every `.booking-simple .booking-task-layout`, overriding vertical flow on unrelated pages. In payment upload it put the already two-column DuitNow panel inside another narrow column. Scope the enhanced grid to a layout containing a chat card; other pages retain their original flow.

```css
.booking-simple .booking-task-layout:has(> .booking-chat-card) {
  display: grid;
  grid-template-columns: minmax(0, 1.4fr) minmax(280px, 1fr);
  gap: 1.5rem;
  align-items: start;
}
@media (max-width: 960px) {
  .booking-simple .booking-task-layout:has(> .booking-chat-card) {
    grid-template-columns: minmax(0, 1fr);
  }
}
```


### F05. Empty-week message filled only half of the grid

**Status:** Applied.

**Locations:** `assets/css/style.css:2337`, `assets/js/lesson-selection.js:51`.

A width of 100% fills only one grid cell. Spanning every column fills the card on desktop as well as mobile.

```css
.lesson-empty {
  grid-column: 1 / -1;
  padding: 1.5rem;
  border: 1px dashed var(--border);
  border-radius: 12px;
  width: 100%;
}
```


### F06. Duplicate base rules and contradictory chat display declarations

**Status:** Applied.

**Locations:** `assets/css/style.css:1838`, `assets/css/style.css:1853`, `assets/css/style.css:2229`, `assets/css/style.css:1925`, `assets/css/style.css:2347`.

Five repeated base-selector groups were consolidated. The sixth original group was the layout spill corrected by F04. The chat container no longer switches flex → grid → flex through scattered rules. Media-query overrides remain intentional. The final scan finds zero exact repeated selectors within the same at-rule context.

```css
.profile-menu-avatar {
  width: 38px;
  height: 38px;
  display: grid;
  place-items: center;
  background: #e9f5ef;
  color: var(--primary-dark);
  border: 1px solid #c4ded3;
  border-radius: 50%;
  overflow: hidden;
  flex-shrink: 0;
}

.profile-menu-panel > a {
  padding: .65rem .75rem;
  font-size: .85rem;
  border-radius: var(--radius-sm);
  color: var(--text-main);
  display: flex;
  align-items: center;
  gap: .7rem;
}

.admin-topbar {
  position: relative;
  z-index: 1001;
  min-height: 76px;
  padding: 1rem 2rem;
  display: flex;
  align-items: center;
  gap: 1.5rem;
  background: white;
  border-bottom: 1px solid var(--border);
  font-size: .75rem;
  color: var(--text-muted);
}

.booking-messages {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  background: var(--bg-main);
  border-radius: var(--radius-md);
  padding: 1.25rem;
  margin: 1.5rem 0;
}

.booking-chat-card .booking-messages > * {
  align-self: flex-start;
  flex-shrink: 0;
  max-width: 85%;
  width: fit-content;
  margin: 0;
  padding: 1rem 1.15rem;
  border: 1px solid #dce8e1;
  border-radius: 16px 16px 16px 4px;
  background: #fff;
  box-shadow: 0 2px 4px #163d2810;
}
```


### F07. Outgoing messages relied on a specificity workaround

**Status:** Applied.

**Locations:** `assets/css/style.css:2347`, `assets/css/style.css:2354`.

The old sequence aligned outgoing messages right, reset all messages left later, then restored outgoing alignment with another more-specific rule. The base declares incoming alignment once; one scoped outgoing rule now sets alignment, color and corners.

```css
.student-workspace .booking-chat-card .booking-messages > .portal-message:not(.booking-message-tutor),
.student-workspace .booking-chat-card .booking-messages > .chat-bubble:not(.chat-reply),
.tutor-workspace .booking-chat-card .booking-messages > .booking-message-tutor,
.tutor-workspace .booking-chat-card .booking-messages > .chat-reply,
.booking-chat-card .booking-messages > .chat-outgoing {
  align-self: flex-end;
  background: #e2f2e9;
  border-radius: 16px 16px 4px 16px;
}
```


### F08. Insufficient contrast on small controls and selected-slot text

**Status:** Proposed — accessibility.

**Locations:** `assets/css/style.css:335`, `assets/css/style.css:347`, `assets/css/style.css:359`, `assets/css/style.css:1759`, `assets/css/style.css:1304`, `assets/css/style.css:706`, `assets/css/style.css:203`, `assets/css/style.css:231`, `assets/css/style.css:373`, `assets/css/style.css:2073`, `assets/css/style.css:728`, `assets/css/style.css:1019`, `assets/css/style.css:1097`, `login.html:63`.

White on teal #0d9488 is **3.74:1**; white on gold #d97706 is **3.19:1**. Ordinary 14–16px button/badge text needs 4.5:1. Teal text on #f8fafc is 3.58:1. Use the existing darker variants for small text and controls: white-on-dark-teal is 5.47:1; white-on-dark-gold is 5.02:1. Do not globally darken the secondary token, since it also appears on the dark footer. Replace the login link's inline color with the class below.

```css
.btn-primary { background-color: var(--primary-dark); color: #fff; }
.btn-primary:hover { background-color: #115e59; }
.btn-secondary { background-color: var(--secondary-dark); color: #fff; }
.btn-secondary:hover { background-color: #92400e; }
.btn-outline { border-color: var(--primary-dark); color: var(--primary-dark); }
.btn-outline:hover { background-color: var(--primary-dark); color: #fff; }
.slot-btn.selected .slot-status-badge,
.lesson-slot-option:has(input:checked) .slot-status-badge {
  background-color: var(--primary-dark);
  color: #fff;
}
.checkbox-label a, .auth-help-link { color: var(--primary-dark); }
.auth-help-link { font-weight: 600; }
.section-subtitle, .nav-link:hover, .nav-link.active,
.btn-text:hover, .cta-actions .btn-outline-white:hover {
  color: var(--primary-dark);
}
.logo-text span { color: var(--secondary-dark); }
.journey li.current > span { background: var(--primary-dark); color: #fff; }
.stats-bar, .cta-banner {
  background: linear-gradient(135deg, var(--primary-dark), #115e59);
}
```


For the forgot-password link, the replacement HTML is:

```html
<a href="help.html" class="checkbox-label auth-help-link">Forgot Password?</a>
```


### F09. Signed-in headers hide primary navigation below 1024px

**Status:** Proposed — responsive/navigation.

**Locations:** `assets/css/style.css:177`, `student/student-dashboard.html:14`, `tutor/tutor-dashboard-verified.html:14`.

The primary list is display:none below 1024px. 67 signed-in pages have a profile menu but no public mobile menu. The account menu does not reproduce Home/Browse/Why Us/Help. Preserve those links in a wrapping second row. Public pages already have a mobile menu and should not receive duplicate navigation. All affected HTML locations are listed in Appendix A.

```css
@media (max-width: 1023px) {
  .nav-container:has(> .profile-menu) {
    height: auto;
    min-height: 5.5rem;
    flex-wrap: wrap;
    gap: .5rem 1rem;
    padding-top: .75rem;
    padding-bottom: .75rem;
  }
  .nav-container:has(> .profile-menu) > .nav-links {
    display: flex;
    order: 3;
    flex: 0 0 100%;
    flex-wrap: wrap;
    justify-content: space-between;
    gap: .25rem 1rem;
  }
  .nav-container:has(> .profile-menu) .nav-link {
    display: inline-flex;
    align-items: center;
    min-height: 44px;
  }
}
```


### F10. Dropdowns are not bounded by remaining viewport height

**Status:** Proposed — short-viewport risk.

**Locations:** `assets/css/style.css:2008`, `assets/css/style.css:1851`, `assets/css/style.css:1862`, `assets/css/site-contact.css:2`, `index.html:49`.

The public menu has no max-height or vertical scrolling. Seven items below the contact bar and navbar can extend beyond a landscape viewport. Profile menus are capped at 75/80% of the viewport without subtracting their top offset. Bound both using the measured header bottom. This is a source-derived risk, not a reproduced browser result. Apply the CSS and companion measurement snippet together.

```css
.portal-mobile ul,
.profile-menu-panel,
.student-menu-panel {
  max-height: max(0px, calc(100dvh - var(--header-bottom, 14rem) - 1rem));
  overflow-y: auto;
  overscroll-behavior: contain;
}
```


Companion JS: add after the wrapping block containing `assets/js/site-contact.js:21`, inside the IIFE:

```js
const header = document.querySelector('.site-header, .admin-topbar');
if (header) {
  const measure = () => document.documentElement.style.setProperty(
    '--header-bottom', `${Math.max(0, header.getBoundingClientRect().bottom)}px`
  );
  new ResizeObserver(measure).observe(header);
  window.addEventListener('resize', measure, { passive: true });
  window.addEventListener('scroll', measure, { passive: true });
  measure();
}
```


### F11. Placeholder social links look like working navigation

**Status:** Proposed — HTML/interaction.

**Locations:** `index.html:271`, `index.html:272`, `index.html:273`, `assets/css/style.css:1530`.

Three footer anchors point to #, so activating them jumps to the top rather than opening a social profile. No real URLs are configured. Use labelled noninteractive icons until real destinations are available, consistent with the contact bar. Also narrow `.social-link:hover` to `.social-link[href]:hover` so display-only icons do not imply an action.

```html
<div class="footer-socials" aria-label="Social media">
  <span class="social-link flex-center" role="img" aria-label="Facebook">
    <i class="fab fa-facebook-f" aria-hidden="true"></i>
  </span>
  <span class="social-link flex-center" role="img" aria-label="YouTube">
    <i class="fab fa-youtube" aria-hidden="true"></i>
  </span>
  <span class="social-link flex-center" role="img" aria-label="Instagram">
    <i class="fab fa-instagram" aria-hidden="true"></i>
  </span>
</div>
```


### F12. Legacy toast width cannot fit a 320px viewport

**Status:** Proposed — latent responsive defect.

**Locations:** `assets/css/style.css:1594`, `assets/css/style.css:1604`, `assets/js/main.js:324`.

The 300px minimum width plus 32px right offset extends 12px past the left edge at 320px. No current HTML loads main.js, so this is a latent retained-component defect, not a failure reproduced on an active page. If retaining toasts, replace the fixed minimum with a bounded container and shrinkable text.

```css
.toast-container {
  position: fixed;
  right: 1rem;
  bottom: 1rem;
  width: min(25rem, calc(100vw - 2rem));
  z-index: 1050;
  display: flex;
  flex-direction: column;
  gap: .75rem;
}
.toast { min-width: 0; width: 100%; max-width: 100%; }
.toast-content { min-width: 0; }
.toast-message { overflow-wrap: anywhere; }
```


### F13. Global horizontal clipping masks content overflow

**Status:** Proposed — layout resilience.

**Locations:** `assets/css/style.css:76`, `assets/css/style.css:1574`, `assets/css/style.css:1461`.

Body-wide horizontal clipping can silently cut off content instead of exposing sizing problems. Long unbroken contact text and default flex/grid min-content sizing are a source-level reflow risk. Remove body clipping, retain scrollable table wrappers, and allow footer text to shrink/wrap. The hero and CTA already clip their own decoration. Confirm at 320px and with text zoom after applying; this has not been reproduced in a browser.

```css
body { overflow-x: visible; }
.footer-top > *, .contact-item > p { min-width: 0; }
.contact-item > p { overflow-wrap: anywhere; }
.contact-item > i { flex-shrink: 0; }
/* Keep .portal-table-wrap { overflow-x: auto; } for wide tables. */
```


### F14. Retired role-bar CSS remains in the shared bundle

**Status:** Proposed — unused CSS.

**Locations:** `assets/css/style.css:1784`, `assets/css/style.css:1785`, `assets/css/style.css:1786`, `assets/css/style.css:1787`, `assets/css/style.css:1788`, `assets/css/style.css:1789`, `assets/css/style.css:2036`, `assets/css/style.css:2197`, `assets/css/style.css:2199`, `assets/css/style.css:2200`, `assets/css/style.css:2201`.

No HTML or JavaScript source references the portal-rolebar or portal-role classes. Current navigation uses profile menus. These standalone rules can be removed without deleting active members of mixed-selector rules elsewhere. The optimized patch removes only this confirmed unused family. The broader candidate list in Appendix B is not automatically safe to delete.

```diff
- .portal-rolebar { background: var(--bg-card); border-bottom: 1px solid var(--border); }
- .portal-rolebar > .container { display: flex; align-items: center; flex-wrap: wrap; gap: .5rem 2rem; padding-top: .75rem; padding-bottom: .75rem; }
- .portal-role { color: var(--primary-dark); font-weight: 700; font-size: .85rem; }
- .portal-rolebar nav { display: flex; flex-wrap: wrap; gap: .25rem; }
- .portal-rolebar nav a { padding: .5rem .75rem; border-radius: var(--radius-sm); font-size: .85rem; color: var(--text-muted); }
- .portal-rolebar nav a:hover, .portal-rolebar nav a[aria-current] { background: var(--primary-light); color: var(--primary-dark); }
- .portal-rolebar nav a { padding: .5rem; }
- .student-workspace .portal-rolebar { background: #f0f9f6; }
- .tutor-workspace .portal-rolebar { background: #fffbef; border-bottom-color: #eadfbe; }
- .tutor-workspace .portal-rolebar .portal-role { color: #92400e; }
- .tutor-workspace .portal-rolebar nav a[aria-current] { background: #fef3c7; color: #92400e; }
```


## Results and limitations

The implementation has 10 passing Node tests covering legacy records; all 576 start-hour/duration combinations; invalid input and end-time mismatches; persistence; duplicate, partial, enclosing and overnight overlaps; adjacency; booked-slot protection; storage errors; and separation of arrangement completion from class completion. JavaScript syntax checks and `git diff --check` pass.

The final source audit reports zero same-context duplicate selectors, three unresolved placeholder links (F11), and 114 unused-selector candidates. Embedded CSS and inline styles are inventoried. Percentage widths for report bars are intentional data, not hardcoded viewport widths. Dashboard-specific styling contains responsive breakpoints and no confirmed source-level defect was found there. Small fixed dimensions for icons/avatars were not incorrectly flagged as layout failures.

The structural and naming checks do not establish computed contrast, focus order or assistive-technology compatibility. Browser follow-up: 320/375/768/1024px widths; a 360px-high landscape viewport; 200% text zoom; keyboard menu traversal; reduced motion; and geolocation success/denial/timeout. Check F09 and F10 together, and the non-chat payment layout corrected by F04.

## Appendix A: every affected signed-in navigation location (F09)

The shared CSS fix in F09 covers these occurrences; no 67-page HTML rewrite is necessary.


- `student/student-booking-addNew.html:14`
- `student/student-booking-cancel.html:14`
- `student/student-booking-completed.html:14`
- `student/student-booking-coordinate.html:14`
- `student/student-booking-edit.html:14`
- `student/student-booking-session.html:14`
- `student/student-booking-view.html:14`
- `student/student-bookings.html:14`
- `student/student-chat.html:14`
- `student/student-contact.html:14`
- `student/student-dashboard.html:14`
- `student/student-faq.html:14`
- `student/student-feedback-addNew.html:14`
- `student/student-feedbacks.html:14`
- `student/student-help.html:14`
- `student/student-invoices.html:14`
- `student/student-notifications.html:14`
- `student/student-payment-rejected.html:14`
- `student/student-payment-review.html:14`
- `student/student-payment-upload.html:14`
- `student/student-payment-verified.html:14`
- `student/student-payment-view.html:14`
- `student/student-profile-edit.html:14`
- `student/student-profile-view.html:14`
- `student/student-support-request.html:14`
- `tutor/tutor-account-edit.html:14`
- `tutor/tutor-account-verified.html:14`
- `tutor/tutor-application-approved.html:14`
- `tutor/tutor-application-rejected.html:14`
- `tutor/tutor-availability-addNew.html:14`
- `tutor/tutor-availability-edit.html:14`
- `tutor/tutor-availability-view.html:14`
- `tutor/tutor-availability.html:14`
- `tutor/tutor-booking-cancel.html:14`
- `tutor/tutor-booking-completed.html:14`
- `tutor/tutor-booking-coordinate.html:14`
- `tutor/tutor-booking-edit.html:14`
- `tutor/tutor-booking-rejected.html:14`
- `tutor/tutor-booking-session.html:14`
- `tutor/tutor-booking-view.html:14`
- `tutor/tutor-bookings.html:14`
- `tutor/tutor-certificate-replace.html:14`
- `tutor/tutor-certificate-upload.html:14`
- `tutor/tutor-certificate-verified.html:14`
- `tutor/tutor-certificate-view.html:14`
- `tutor/tutor-chat.html:14`
- `tutor/tutor-contact.html:14`
- `tutor/tutor-dashboard-verified.html:14`
- `tutor/tutor-dashboard.html:14`
- `tutor/tutor-faq.html:14`
- `tutor/tutor-feedbacks.html:14`
- `tutor/tutor-help.html:14`
- `tutor/tutor-notifications.html:14`
- `tutor/tutor-payment-confirm.html:14`
- `tutor/tutor-payment-issue.html:14`
- `tutor/tutor-payment-qr.html:14`
- `tutor/tutor-payment-received.html:14`
- `tutor/tutor-payment-view.html:14`
- `tutor/tutor-payments.html:14`
- `tutor/tutor-profile-draft.html:14`
- `tutor/tutor-profile-edit.html:14`
- `tutor/tutor-profile-private.html:14`
- `tutor/tutor-profile-ready.html:14`
- `tutor/tutor-profile-setup.html:14`
- `tutor/tutor-profile-view.html:14`
- `tutor/tutor-profile-visibility.html:14`
- `tutor/tutor-support-request.html:14`


## Appendix B: unused-selector candidates requiring review

These are **candidates, not 114 proven defects**. Interpolated classes such as `toast-${type}` and comma-separated rules containing active selectors make blind deletion unsafe. F14 is the verified removable family. Retain active members when splitting mixed rules. The unloaded main.js also explains legacy styling. Exact locations follow.

| Location | Selector |
| --- | --- |


| `assets/css/style.css:126` | `.grid-2` |
| `assets/css/style.css:131` | `.grid-4` |
| `assets/css/style.css:305` | `.mobile-nav-links` |
| `assets/css/style.css:312` | `.mobile-nav-link` |
| `assets/css/style.css:318` | `.mobile-nav-link:hover, .mobile-nav-link.active` |
| `assets/css/style.css:429` | `.hero-badge` |
| `assets/css/style.css:443` | `.hero-badge i` |
| `assets/css/style.css:499` | `.hero-img-wrapper` |
| `assets/css/style.css:509` | `.hero-main-img` |
| `assets/css/style.css:517` | `.floating-badge` |
| `assets/css/style.css:531` | `.floating-badge.fb-1` |
| `assets/css/style.css:537` | `.floating-badge.fb-2` |
| `assets/css/style.css:543` | `.floating-icon` |
| `assets/css/style.css:555` | `.floating-badge.fb-2 .floating-icon` |
| `assets/css/style.css:560` | `.floating-info h4` |
| `assets/css/style.css:566` | `.floating-info p` |
| `assets/css/style.css:667` | `.search-submit-btn` |
| `assets/css/style.css:680` | `.search-submit-btn:hover` |
| `assets/css/style.css:694` | `.section-bg-primary-light` |
| `assets/css/style.css:837` | `.features-grid` |
| `assets/css/style.css:843` | `.features-grid` |
| `assets/css/style.css:847` | `.features-grid` |
| `assets/css/style.css:850` | `.feature-card` |
| `assets/css/style.css:859` | `.feature-card:hover` |
| `assets/css/style.css:874` | `.feature-card.gold-themed .feature-icon-wrapper` |
| `assets/css/style.css:879` | `.feature-card-title` |
| `assets/css/style.css:885` | `.feature-card-desc` |
| `assets/css/style.css:909` | `.tutor-card-img-wrapper` |
| `assets/css/style.css:916` | `.tutor-card-img` |
| `assets/css/style.css:922` | `.tutor-badge-certified` |
| `assets/css/style.css:938` | `.tutor-badge-certified i` |
| `assets/css/style.css:942` | `.tutor-card-pricing` |
| `assets/css/style.css:955` | `.tutor-card-pricing span` |
| `assets/css/style.css:959` | `.tutor-card-body` |
| `assets/css/style.css:981` | `.tutor-card-meta` |
| `assets/css/style.css:992` | `.tutor-meta-item` |
| `assets/css/style.css:998` | `.tutor-meta-item i` |
| `assets/css/style.css:1002` | `.tutor-card-bio` |
| `assets/css/style.css:1014` | `.tutor-card-footer` |
| `assets/css/style.css:1173` | `.segmented-control` |
| `assets/css/style.css:1208` | `.form-row` |
| `assets/css/style.css:1214` | `.form-row` |
| `assets/css/style.css:1314` | `.dynamic-tutor-section` |
| `assets/css/style.css:1324` | `.dynamic-tutor-section.show` |
| `assets/css/style.css:1334` | `.tutor-section-title` |
| `assets/css/style.css:1345` | `.file-upload-container` |
| `assets/css/style.css:1349` | `.file-upload-dropzone` |
| `assets/css/style.css:1364` | `.file-upload-dropzone:hover, .file-upload-dropzone.dragover` |
| `assets/css/style.css:1369` | `.file-upload-icon` |
| `assets/css/style.css:1374` | `.file-upload-text` |
| `assets/css/style.css:1380` | `.file-upload-text span` |
| `assets/css/style.css:1385` | `.file-upload-subtext` |
| `assets/css/style.css:1390` | `.hidden-file-input` |
| `assets/css/style.css:1401` | `.upload-preview` |
| `assets/css/style.css:1412` | `.upload-preview.active` |
| `assets/css/style.css:1416` | `.preview-info` |
| `assets/css/style.css:1422` | `.preview-icon` |
| `assets/css/style.css:1427` | `.preview-name` |
| `assets/css/style.css:1436` | `.preview-size` |
| `assets/css/style.css:1441` | `.preview-remove-btn` |
| `assets/css/style.css:1449` | `.preview-remove-btn:hover` |
| `assets/css/style.css:1621` | `.toast.toast-success` |
| `assets/css/style.css:1622` | `.toast.toast-danger` |
| `assets/css/style.css:1623` | `.toast.toast-warning` |
| `assets/css/style.css:1635` | `.toast-success .toast-icon` |
| `assets/css/style.css:1636` | `.toast-danger .toast-icon` |
| `assets/css/style.css:1637` | `.toast-warning .toast-icon` |
| `assets/css/style.css:1662` | `.slots-container` |
| `assets/css/style.css:1784` | `.portal-rolebar` |
| `assets/css/style.css:1785` | `.portal-rolebar > .container` |
| `assets/css/style.css:1786` | `.portal-role` |
| `assets/css/style.css:1787` | `.portal-rolebar nav` |
| `assets/css/style.css:1788` | `.portal-rolebar nav a` |
| `assets/css/style.css:1789` | `.portal-rolebar nav a:hover, .portal-rolebar nav a[aria-current]` |
| `assets/css/style.css:1790` | `.portal-demo-note` |
| `assets/css/style.css:1828` | `.field-warning` |
| `assets/css/style.css:1829` | `.field-warning span` |
| `assets/css/style.css:1879` | `.student-next-lesson h2` |
| `assets/css/style.css:1880` | `.student-next-lesson p` |
| `assets/css/style.css:1881` | `.student-shortcuts` |
| `assets/css/style.css:1882` | `.student-shortcuts a, .student-choice` |
| `assets/css/style.css:1883` | `.student-shortcuts a:hover, .student-choice:hover` |
| `assets/css/style.css:1884` | `.student-shortcuts strong, .student-shortcuts span` |
| `assets/css/style.css:1885` | `.student-shortcuts span` |
| `assets/css/style.css:1917` | `.student-shortcuts, .student-help-choices` |
| `assets/css/style.css:1922` | `.status-guide` |
| `assets/css/style.css:1923` | `.status-guide > div` |
| `assets/css/style.css:1924` | `.status-guide p` |
| `assets/css/style.css:1984` | `.portal-dot` |
| `assets/css/style.css:1985` | `.portal-dot.verified` |
| `assets/css/style.css:1986` | `.portal-dot.pending` |
| `assets/css/style.css:1987` | `.portal-dot.rejected` |
| `assets/css/style.css:2036` | `.portal-rolebar nav a` |
| `assets/css/style.css:2126` | `.booking-preview-links` |
| `assets/css/style.css:2127` | `.booking-preview-links a` |
| `assets/css/style.css:2128` | `.booking-preview-links a:hover` |
| `assets/css/style.css:2137` | `.booking-preview-links` |
| `assets/css/style.css:2140` | `.booking-preview-note` |
| `assets/css/style.css:2171` | `.locked-tools` |
| `assets/css/style.css:2172` | `.locked-tools .form-control` |
| `assets/css/style.css:2187` | `.activity-list` |
| `assets/css/style.css:2188` | `.activity-list li` |
| `assets/css/style.css:2189` | `.activity-list li::before` |
| `assets/css/style.css:2190` | `.activity-list strong, .activity-list span` |
| `assets/css/style.css:2191` | `.activity-list span` |
| `assets/css/style.css:2194` | `.lesson-date` |
| `assets/css/style.css:2195` | `.lesson-date strong` |
| `assets/css/style.css:2196` | `.lesson-date span` |
| `assets/css/style.css:2197` | `.student-workspace .portal-rolebar` |
| `assets/css/style.css:2199` | `.tutor-workspace .portal-rolebar` |
| `assets/css/style.css:2200` | `.tutor-workspace .portal-rolebar .portal-role` |
| `assets/css/style.css:2201` | `.tutor-workspace .portal-rolebar nav a[aria-current]` |
| `assets/css/style.css:2231` | `.admin-user` |
| `assets/css/style.css:2232` | `.admin-user span` |
