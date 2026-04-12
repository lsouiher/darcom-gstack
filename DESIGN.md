# DESIGN.md

Source of truth for DaryWin design tokens and rules. Extracted during the
`/plan-design-review` of feature `002-host-signup` on 2026-04-12. Revise in place
as the system matures. When in conflict with any framework default (MUI, HTML, etc.),
this document wins.

## Typography

- **Display / brand / hero**: Inter Tight (primary), fallback: `system-ui, -apple-system`. Weight 700.
- **Body**: Inter, fallback: `system-ui, -apple-system`. Weight 400/500.
- **Numerals in step indicators and audit counts**: `font-variant-numeric: tabular-nums`.
- **Never ship default system stacks** for hero, brand surfaces, or marketing copy. System stacks are allowed only inside the admin portal's dense data tables.

## Color tokens (CSS variables)

Define these as CSS custom properties on `:root`:

```css
:root {
  --color-ink:         #121212;
  --color-ink-muted:   #5a5a5a;
  --color-surface:     #ffffff;
  --color-surface-2:   #f7f5f0;   /* warm neutral, NOT cool gray */
  --color-border:      #e7e3d9;
  --color-accent:      #2e5339;   /* deep green — trust, money, growth */
  --color-accent-fg:   #ffffff;
  --color-danger:      #b23a3a;
  --color-danger-fg:   #ffffff;
  --color-success:     #2e5339;
  --color-warning:     #a16207;
}
```

**Never** use purple/indigo/violet as primary or accent. Never use `hsl()` gradients as section backgrounds. MUI theme must override the default primary palette to map to `--color-accent`.

## Spacing scale

Canonical scale (in px): `4 · 8 · 12 · 16 · 24 · 32 · 48 · 64 · 96`. Ad-hoc spacing is a smell.

## Radius

- **Inputs**: 4px
- **Buttons**: 4px
- **Cards**: 8px
- **Chips / status badges**: 999px (pill)
- Nothing bigger. No "bubbly" radius anywhere.

## Elevation

One elevation level, used only for dialogs, dropdowns, and overflow menus:

```css
box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
```

- No shadows on cards or buttons at rest.
- No shadows on the landing page. Use borders + spacing for separation.

## Motion

- **Micro-interactions** (OTP tick, checklist flip, button press): 180ms ease-out
- **Entry reveals** (section scroll-in, dialog open): 240ms ease-out
- **Never longer than 300ms** for interactive feedback
- Named moments in this feature:
  - OTP verify success → 250ms check-mark tick
  - Checklist item flipping ✓ → 250ms tick + subtle row highlight that fades in 400ms
  - Wizard step transition → 180ms fade/slide

## Iconography

- Thin vector set (Phosphor or Heroicons outline). Stroke 1.5px.
- **Never** icon-in-colored-circle as a decoration pattern.
- No emoji in product UI (OK in transactional email).

## Components — MUI alignment

- Override MUI palette → map `primary` to `--color-accent`.
- Override `Button` radius to 4px, remove default elevation.
- Keep `Stepper`, `TextField`, `Table`, `Dialog` base behaviors; restyle color + radius.
- Use MUI `Alert` for inline errors; custom banner for page-level.

## Layout rules

- **Landing**: composition-first, full-bleed hero, 4 sections max, cardless hero, left-aligned body, CTA centered only in hero.
- **Wizard**: single-column, left-aligned, max-width 480px on desktop, full-width on mobile with 16px gutter.
- **Admin**: dense tables with row dividers; sidebar nav; no decorative cards.

## Forbidden patterns (AI-slop blacklist)

1. Purple/indigo gradients as backgrounds
2. 3-column icon-in-circle feature grid
3. Centered everything (all text center-aligned)
4. Uniform large border-radius on everything
5. Decorative SVG blobs or wavy dividers
6. Emoji as design element
7. Colored left-border on cards
8. Generic hero copy ("Welcome to...", "Your all-in-one...")
9. Cookie-cutter section rhythm (hero → 3 features → testimonial → CTA, every section same height)
10. Default system font stacks on brand surfaces

## Accessibility baseline

- Contrast: WCAG AA minimum (4.5:1 body, 3:1 large text).
- Touch targets: 44×44px minimum.
- Keyboard nav: visible focus ring (`outline: 2px solid var(--color-accent); outline-offset: 2px`).
- ARIA landmarks on all pages (`header`, `main`, `nav`, `footer`).
- All form inputs have `<label>`; error messages reference the input via `aria-describedby`.
- Wizard progress announced via `aria-live="polite"` region on step change.

## Responsive rules

- Mobile-first. Breakpoints: 640 / 960 / 1200.
- **Mobile is not "desktop stacked"** — each viewport gets intentional layout.
- Landing "How it works" on mobile = vertical story. On desktop = horizontal numbered journey with connecting line.
- Wizard on mobile = full-viewport card, sticky CTA at bottom. On desktop = centered max-width 480px, CTA inline.

## i18n notes

- All strings go through `lang/en.ts` and `lang/fr.ts`. Never hardcode.
- Reserve 30% extra width on buttons for FR translation expansion.
- RTL support not required for launch geography but don't hardcode `margin-left`; prefer logical properties (`margin-inline-start`).
