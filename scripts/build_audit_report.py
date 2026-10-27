"""Build the reviewed findings with current source line numbers. Run audit_frontend.py first."""
from pathlib import Path
import json
import sys
sys.dont_write_bytecode = True
from audit_frontend import ROOT, Document, css_rules

CSS = 'assets/css/style.css'
data = json.loads((ROOT / 'docs/frontend-audit-data.json').read_text(encoding='utf-8'))
rules = css_rules((ROOT / CSS).read_text(encoding='utf-8'))
parts = []

def location(file, needle):
    lines = (ROOT / file).read_text(encoding='utf-8').splitlines()
    return f'{file}:{next(i for i, line in enumerate(lines, 1) if needle in line)}'

def block(selector):
    rule = next(r for r in rules if r['selector'] == selector and not r['context'])
    return selector + ' {\n  ' + rule['body'].replace('; ', ';\n  ') + '\n}'

def add(number, title, status, refs, description, code, language='css'):
    parts.append(f'### {number}. {title}\n\n**Status:** {status}.\n\n**Locations:** ' +
                 ', '.join(f'`{ref}`' for ref in refs) + '.\n\n' + description.strip() +
                 f'\n\n```{language}\n' + code.strip() + '\n```\n')

parts.append("""# Frontend audit and implementation report

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
""")

add('F01', 'Raw class-mode text and excessive slot-card spacing', 'Applied',
    [location('assets/js/lesson-selection.js', 'const modes ='), location(CSS, '.slot-modes {')],
    """The card rendered the raw value `Both` using `.field-help`, whose paragraph margins added unwanted vertical space. The replacement exposes each mode explicitly. Icons are decorative; text remains the accessible name. The internal `Both` value is retained for compatibility.""",
    '\n'.join(block(s) for s in ['.slot-modes', '.slot-mode', '.slot-duration']))
parts.append('''Replace the raw mode span in each generated card with this structure (render only the modes supported by the slot):

```html
<span class="slot-modes">
  <span class="slot-mode"><i class="fas fa-video" aria-hidden="true"></i>Online</span>
  <span class="slot-mode"><i class="fas fa-map-marker-alt" aria-hidden="true"></i>In person</span>
</span>
```
''')

add('F02', 'Form-group margins compound grid gaps', 'Applied',
    [location(CSS, '.portal-fields {'), location(CSS, '.portal-fields > .form-group'),
     location('tutor/tutor-availability-addNew.html', 'data-availability-form'), location('tutor/tutor-availability-edit.html', 'data-availability-form')],
    """The availability override added a 1.5rem row gap on top of each form group's 1.5rem bottom margin. The grid now owns row spacing, and help text no longer adds another bottom margin. Existing single-column mobile rules remain in place.""",
    '\n'.join(block(s) for s in ['.portal-fields', '.portal-fields > .form-group', '.portal-fields .field-help']))

add('F03', 'Fixed duration and fee copy misdescribes longer lessons', 'Applied',
    [location('student/student-booking-addNew.html', 'data-selected-duration'), location('student/student-booking-addNew.html', 'data-selected-fee'),
     location('assets/js/lesson-selection.js', 'function updateSummary'), location('tutor-detail.html', 'Varies by available lesson')],
    """The static 1-hour / RM 40 summary would misdescribe a longer selection. Both values now update from the selected slot. The public profile describes variable durations and hourly pricing.""",
    '''<dt>Duration</dt>
<dd data-selected-duration aria-live="polite">Choose a lesson</dd>
<dt>Total Lesson Fee</dt>
<dd data-selected-fee aria-live="polite">Calculated from your selected duration</dd>''', 'html')
parts.append('''The associated summary update uses the validated selected slot and the form's sample hourly rate. Call it after selection changes and when switching weeks clears selection:

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
''')

add('F04', 'Chat grid styling leaked into payment and session layouts', 'Applied',
    [location(CSS, '.booking-simple .booking-task-layout:has'),
     *[location(file, 'booking-task-layout') for file in ['student/student-payment-upload.html', 'student/student-booking-session.html', 'admin/manage-payments-view.html', 'admin/manage-payments-confirmed.html']]],
    """The appended chat rule targeted every `.booking-simple .booking-task-layout`, overriding vertical flow on unrelated pages. In payment upload it put the already two-column DuitNow panel inside another narrow column. Scope the enhanced grid to a layout containing a chat card; other pages retain their original flow.""",
    block('.booking-simple .booking-task-layout:has(> .booking-chat-card)') + '''
@media (max-width: 960px) {
  .booking-simple .booking-task-layout:has(> .booking-chat-card) {
    grid-template-columns: minmax(0, 1fr);
  }
}''')

add('F05', 'Empty-week message filled only half of the grid', 'Applied',
    [location(CSS, '.lesson-empty {'), location('assets/js/lesson-selection.js', 'No lessons planned for this week')],
    'A width of 100% fills only one grid cell. Spanning every column fills the card on desktop as well as mobile.', block('.lesson-empty'))

merged = ['.profile-menu-avatar', '.profile-menu-panel > a', '.admin-topbar', '.booking-messages', '.booking-chat-card .booking-messages > *']
add('F06', 'Duplicate base rules and contradictory chat display declarations', 'Applied',
    [location(CSS, selector + ' {') for selector in merged],
    """Five repeated base-selector groups were consolidated. The sixth original group was the layout spill corrected by F04. The chat container no longer switches flex → grid → flex through scattered rules. Media-query overrides remain intentional. The final scan finds zero exact repeated selectors within the same at-rule context.""",
    '\n\n'.join(block(selector) for selector in merged))

outgoing = next(r['selector'] for r in rules if '.student-workspace .booking-chat-card .booking-messages > .portal-message' in r['selector'])
add('F07', 'Outgoing messages relied on a specificity workaround', 'Applied',
    [location(CSS, '.booking-chat-card .booking-messages > * {'), location(CSS, outgoing)],
    """The old sequence aligned outgoing messages right, reset all messages left later, then restored outgoing alignment with another more-specific rule. The base declares incoming alignment once; one scoped outgoing rule now sets alignment, color and corners.""",
    block(outgoing).replace(', ', ',\n'))

add('F08', 'Insufficient contrast on small controls and selected-slot text', 'Proposed — accessibility',
    [location(CSS, s) for s in ['.btn-primary {', '.btn-secondary {', '.btn-outline {', '.lesson-slot-option:has(input:checked) .slot-status-badge', '.checkbox-label a {', '.section-subtitle {', '.logo-text span {', '.nav-link:hover, .nav-link.active', '.btn-text:hover', '.journey li.current > span', '.stats-bar {', '.cta-banner {', '.cta-actions .btn-outline-white:hover']] + [location('login.html', 'Forgot Password?')],
    """White on teal #0d9488 is **3.74:1**; white on gold #d97706 is **3.19:1**. Ordinary 14–16px button/badge text needs 4.5:1. Teal text on #f8fafc is 3.58:1. Use the existing darker variants for small text and controls: white-on-dark-teal is 5.47:1; white-on-dark-gold is 5.02:1. Do not globally darken the secondary token, since it also appears on the dark footer. Replace the login link's inline color with the class below.""",
    '''.btn-primary { background-color: var(--primary-dark); color: #fff; }
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
}''')
parts.append('''For the forgot-password link, the replacement HTML is:

```html
<a href="help.html" class="checkbox-label auth-help-link">Forgot Password?</a>
```
''')

nav = []
for file in sorted(ROOT.rglob('*.html')):
    doc = Document(file)
    doc.feed(file.read_text(encoding='utf-8'))
    classes = set(' '.join(n['attrs'].get('class', '') for n in doc.nodes).split())
    if 'nav-links' in classes and not {'portal-mobile', 'menu-toggle'} & classes:
        line = next(n['line'] for n in doc.nodes if 'nav-links' in n['attrs'].get('class', '').split())
        nav.append(f'{file.relative_to(ROOT).as_posix()}:{line}')

add('F09', 'Signed-in headers hide primary navigation below 1024px', 'Proposed — responsive/navigation',
    [location(CSS, '.nav-links {'), location('student/student-dashboard.html', '<ul class="nav-links">'), location('tutor/tutor-dashboard-verified.html', '<ul class="nav-links">')],
    f"""The primary list is display:none below 1024px. {len(nav)} signed-in pages have a profile menu but no public mobile menu. The account menu does not reproduce Home/Browse/Why Us/Help. Preserve those links in a wrapping second row. Public pages already have a mobile menu and should not receive duplicate navigation. All affected HTML locations are listed in Appendix A.""",
    '''@media (max-width: 1023px) {
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
}''')

add('F10', 'Dropdowns are not bounded by remaining viewport height', 'Proposed — short-viewport risk',
    [location(CSS, s) for s in ['.portal-mobile ul {', '.profile-menu-panel {', '.student-menu-panel {']] + [location('assets/css/site-contact.css', '.site-header {'), location('index.html', '<details class="portal-mobile">')],
    """The public menu has no max-height or vertical scrolling. Seven items below the contact bar and navbar can extend beyond a landscape viewport. Profile menus are capped at 75/80% of the viewport without subtracting their top offset. Bound both using the measured header bottom. This is a source-derived risk, not a reproduced browser result. Apply the CSS and companion measurement snippet together.""",
    '''.portal-mobile ul,
.profile-menu-panel,
.student-menu-panel {
  max-height: max(0px, calc(100dvh - var(--header-bottom, 14rem) - 1rem));
  overflow-y: auto;
  overscroll-behavior: contain;
}''')
parts.append('Companion JS: add after the wrapping block containing `' + location('assets/js/site-contact.js', 'header.append(contact, navbar);') + '''`, inside the IIFE:

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
''')

add('F11', 'Placeholder social links look like working navigation', 'Proposed — HTML/interaction',
    [f"{item['file']}:{item['line']}" for item in data['findings'] if item['code'] == 'placeholder-link'] + [location(CSS, '.social-link:hover')],
    """Three footer anchors point to #, so activating them jumps to the top rather than opening a social profile. No real URLs are configured. Use labelled noninteractive icons until real destinations are available, consistent with the contact bar. Also narrow `.social-link:hover` to `.social-link[href]:hover` so display-only icons do not imply an action.""",
    '''<div class="footer-socials" aria-label="Social media">
  <span class="social-link flex-center" role="img" aria-label="Facebook">
    <i class="fab fa-facebook-f" aria-hidden="true"></i>
  </span>
  <span class="social-link flex-center" role="img" aria-label="YouTube">
    <i class="fab fa-youtube" aria-hidden="true"></i>
  </span>
  <span class="social-link flex-center" role="img" aria-label="Instagram">
    <i class="fab fa-instagram" aria-hidden="true"></i>
  </span>
</div>''', 'html')

add('F12', 'Legacy toast width cannot fit a 320px viewport', 'Proposed — latent responsive defect',
    [location(CSS, '.toast-container {'), location(CSS, '.toast {'), location('assets/js/main.js', 'toast.className =')],
    """The 300px minimum width plus 32px right offset extends 12px past the left edge at 320px. No current HTML loads main.js, so this is a latent retained-component defect, not a failure reproduced on an active page. If retaining toasts, replace the fixed minimum with a bounded container and shrinkable text.""",
    '''.toast-container {
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
.toast-message { overflow-wrap: anywhere; }''')

add('F13', 'Global horizontal clipping masks content overflow', 'Proposed — layout resilience',
    [location(CSS, 'overflow-x: hidden;'), location(CSS, '.contact-item {'), location(CSS, '.footer-top {')],
    """Body-wide horizontal clipping can silently cut off content instead of exposing sizing problems. Long unbroken contact text and default flex/grid min-content sizing are a source-level reflow risk. Remove body clipping, retain scrollable table wrappers, and allow footer text to shrink/wrap. The hero and CTA already clip their own decoration. Confirm at 320px and with text zoom after applying; this has not been reproduced in a browser.""",
    '''body { overflow-x: visible; }
.footer-top > *, .contact-item > p { min-width: 0; }
.contact-item > p { overflow-wrap: anywhere; }
.contact-item > i { flex-shrink: 0; }
/* Keep .portal-table-wrap { overflow-x: auto; } for wide tables. */''')

retired = [r for r in rules if 'portal-rolebar' in r['selector'] or r['selector'] == '.portal-role']
add('F14', 'Retired role-bar CSS remains in the shared bundle', 'Proposed — unused CSS',
    [f"{CSS}:{r['line']}" for r in retired],
    """No HTML or JavaScript source references the portal-rolebar or portal-role classes. Current navigation uses profile menus. These standalone rules can be removed without deleting active members of mixed-selector rules elsewhere. The optimized patch removes only this confirmed unused family. The broader candidate list in Appendix B is not automatically safe to delete.""",
    '\n'.join('- ' + r['selector'] + ' { ' + r['body'] + ' }' for r in retired), 'diff')

parts.append("""## Results and limitations

The implementation has 10 passing Node tests covering legacy records; all 576 start-hour/duration combinations; invalid input and end-time mismatches; persistence; duplicate, partial, enclosing and overnight overlaps; adjacency; booked-slot protection; storage errors; and separation of arrangement completion from class completion. JavaScript syntax checks and `git diff --check` pass.

The final source audit reports zero same-context duplicate selectors, three unresolved placeholder links (F11), and 114 unused-selector candidates. Embedded CSS and inline styles are inventoried. Percentage widths for report bars are intentional data, not hardcoded viewport widths. Dashboard-specific styling contains responsive breakpoints and no confirmed source-level defect was found there. Small fixed dimensions for icons/avatars were not incorrectly flagged as layout failures.

The structural and naming checks do not establish computed contrast, focus order or assistive-technology compatibility. Browser follow-up: 320/375/768/1024px widths; a 360px-high landscape viewport; 200% text zoom; keyboard menu traversal; reduced motion; and geolocation success/denial/timeout. Check F09 and F10 together, and the non-chat payment layout corrected by F04.

## Appendix A: every affected signed-in navigation location (F09)

The shared CSS fix in F09 covers these occurrences; no 67-page HTML rewrite is necessary.
""")
parts.append('\n'.join('- `' + ref + '`' for ref in nav))
parts.append("""
## Appendix B: unused-selector candidates requiring review

These are **candidates, not 114 proven defects**. Interpolated classes such as `toast-${type}` and comma-separated rules containing active selectors make blind deletion unsafe. F14 is the verified removable family. Retain active members when splitting mixed rules. The unloaded main.js also explains legacy styling. Exact locations follow.

| Location | Selector |
| --- | --- |
""")
parts.append('\n'.join(f"| `{item['file']}:{item['line']}` | `{item['selector']}` |" for item in data['unused_selector_candidates']))
(ROOT / 'docs/frontend-audit.md').write_text('\n\n'.join(parts) + '\n', encoding='utf-8')
print('Wrote docs/frontend-audit.md: 14 reviewed findings, source locations and replacement code.')
