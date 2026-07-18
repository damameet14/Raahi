# Raahi UI Design System

**Status:** Locked
**Version:** 1.0
**Applies to:** Raahi landing pages and future Raahi web interfaces
**Source of truth:** `css/tokens.css`, supported by this document

This file defines the visual language that the team must use when creating or extending Raahi interfaces. The goal is a consistent, clean, soft, and trustworthy experience across every screen.

## 1. Design direction

Raahi should feel:

- Clean and spacious, with a white-first canvas.
- Friendly and trustworthy, using fresh green as the only strong accent.
- Soft, through pale surfaces, rounded containers, light borders, and restrained shadows.
- Editorial, through oversized headings, strong typography, and deliberate negative space.
- Minimal, with one clear action or message per visual area.

Avoid dark page backgrounds, heavy gradients, saturated secondary colors, excessive shadows, glass effects, decorative clutter, and overly dense layouts.

## 2. Locked foundation

The following foundations are locked. Do not change them for an individual page or component.

### Color palette

| Token | Value | Use |
| --- | --- | --- |
| `--color-background` | `#FFFFFF` | Main page background and high-emphasis white surfaces |
| `--color-surface` | `#F6F8F6` | Soft sections, cards, navigation pill, and quiet containers |
| `--color-primary` | `#17251B` | Primary text, headings, and high-emphasis icons |
| `--color-secondary` | `#647069` | Supporting text, metadata, and inactive information |
| `--color-border` | `#E1E7E2` | Dividers, outlines, frames, and subtle shadows |
| `--color-accent` | `#32B45C` | Primary actions, selected states, links, focus, and brand accents |
| `--color-on-accent` | `#FFFFFF` | Text and icons placed on the accent color |

Color rules:

- White must remain the dominant color.
- Use green intentionally, not decoratively. It should identify the brand, a primary action, or an active state.
- Use `--color-primary` instead of pure black.
- Use `--color-secondary` for supporting copy, never for primary actions.
- Borders should stay light and one pixel wide.
- Do not introduce a new brand color without team approval and an update to this document and `css/tokens.css`.
- Do not hardcode these hex values inside components; use the tokens.

### Typography

| Role | Family | Typical weight | Guidance |
| --- | --- | --- | --- |
| Display and headings | Inter | 700–900 | Tight tracking, compact line height, strong hierarchy |
| Body and controls | Inter | 400–600 | Clear, neutral, and easy to scan |
| Micro labels and metadata | JetBrains Mono | 400–600 | Uppercase where appropriate, generous letter spacing |

Load these font weights only:

- Inter: `400`, `500`, `600`, `700`, `800`, `900`
- JetBrains Mono: `400`, `500`, `600`

Type guidance:

- Hero wordmark: `clamp(100px, 17.7vw, 255px)`, weight `900`, tightly tracked.
- Primary page heading: `clamp(30px, 4vw, 52px)`.
- Major section heading: `clamp(42px, 7vw, 88px)`, weight `700`.
- Button and navigation text: `14px`, weight `600`.
- Micro label: `9px`, JetBrains Mono, uppercase, approximately `0.1em` letter spacing.
- Body copy should normally remain between `15px` and `18px`.
- Keep paragraphs comfortably readable; avoid long, full-width text lines.

Do not use additional font families, handwritten fonts, or serif fonts in product UI.

### Spacing scale

Use the eight-pixel spacing system. Choose only from these tokens:

| Token | Value |
| --- | --- |
| `--space-1` | `8px` |
| `--space-2` | `16px` |
| `--space-3` | `24px` |
| `--space-4` | `32px` |
| `--space-5` | `40px` |
| `--space-6` | `48px` |
| `--space-8` | `64px` |
| `--space-10` | `80px` |
| `--space-12` | `96px` |

Rules:

- Default desktop section padding is `96px` vertically.
- Default mobile section padding is `64px` vertically.
- The desktop page frame has `32px` exterior breathing room.
- The mobile page frame has `16px` exterior breathing room.
- Prefer more whitespace over adding decorative elements.

### Shape, borders, and elevation

| Token or pattern | Value | Use |
| --- | --- | --- |
| `--radius-small` | `8px` | Compact UI elements |
| `--radius-medium` | `12px` | Inputs and small containers |
| `--radius-large` | `24px` | Cards, application previews, and major panels |
| Pill radius | `999px` | Navigation groups, buttons, chips, and badges |
| Frame border | `1px solid #E1E7E2` | Page frame and structural dividers |
| Application shadow | `0 18px 48px #E1E7E2` | Large product preview only |

Shadows must remain soft and rare. Prefer a pale border before adding elevation.

## 3. Layout system

- Maximum content width: `1440px`.
- Keep the page centered inside a subtle left and right frame.
- Use clear horizontal alignment between headings, body content, cards, and footer content.
- Build layouts from CSS Grid or Flexbox; avoid arbitrary absolute positioning except for intentional editorial overlaps.
- Preserve generous empty space around major headings.

Responsive breakpoints:

| Breakpoint | Purpose |
| --- | --- |
| `1100px` | Simplify wide desktop compositions and multi-column areas |
| `767px` | Switch to mobile navigation, stacked grids, and reduced type/spacing |
| `420px` | Protect compact phones from overflow and cramped controls |

Components must work fluidly between breakpoints; do not design only for the exact breakpoint widths.

## 4. Component specifications

### Header

- Sticky, white, and visually light.
- Minimum desktop height: `96px`.
- Place the Raahi mark on the left and the navigation inside a soft-surface pill on the right.
- Brand mark: a `34px` green circle with a clear white symbol or letter.
- Use a green pill for the single highest-priority header action.
- Keep the navigation compact and calm; avoid full-width dark bars.
- On smaller screens, simplify or collapse navigation without changing the visual language.

### Buttons

- Minimum height: `48px`.
- Horizontal pill shape with `999px` radius.
- Text: `14px`, weight `600`.
- Primary button: green background and white text.
- Secondary button: white or soft-surface background, primary text, and a light border.
- Hover: subtle opacity or background adjustment.
- Active: `transform: scale(0.98)`.
- Keyboard focus: `2px` green outline with `4px` offset.
- Do not use multiple competing primary buttons in one section.

### Hero

- Minimum desktop height: approximately `740px`.
- Use a framed editorial composition with one oversized brand expression.
- The oversized `RAAHI` wordmark uses weight `900`; the `HI` accent may use green.
- Pair the display type with a short, plain-language headline and concise supporting copy.
- Keep actions limited and clearly prioritized.
- Avoid ride-search forms or operational product controls in the landing-page hero.

### Statistics

- Use a four-column desktop grid that collapses cleanly on smaller screens.
- Use two columns below `1100px` and one column below `767px`.
- Desktop item height: approximately `180px`; mobile item height: approximately `150px`.
- Separate items with light borders, not card shadows.
- Make the green number dominant and place its uppercase JetBrains Mono label beneath it.
- Use a three-pixel green line at the top of each numeric panel.
- Reserve the final soft-surface panel for a short brand or impact message.
- On entry, stagger the panels and count each statistic from zero to its final value.

### Feature cards

- Soft-surface background, one-pixel border, and `24px` radius.
- Desktop minimum height: approximately `390px`.
- Use one short title, concise description, and a simple visual or icon.
- Hover may lift the card by no more than `3px` and change the border to green.
- Cards in the same row should share a consistent height and internal spacing.

### “How it works” process

- Use stacked editorial rows separated by thin horizontal lines.
- Each desktop row should be at least `168px` high.
- Desktop grid: `160px minmax(240px, 1fr) minmax(240px, 0.8fr)`.
- Use large muted step numbers (`01`, `02`, `03`) at `clamp(78px, 9vw, 116px)` and weight `800`.
- The step title may overlap the number column by approximately `54px` to retain the editorial reference style.
- On hover, use a soft-surface background, move the number up to `6px` horizontally, and turn it green.
- On mobile, use a `94px 1fr` grid and reduce the number to approximately `62px`.
- Keep the sequence minimal: number, title, and one concise explanation.

### Product or application preview

- Place the preview inside a white panel with a `24px` radius.
- Use the approved soft shadow only on this large focal element.
- Internal controls should use white, soft-surface, green, and the approved neutral colors only.
- Match the same spacing scale and radii as the landing page.

### Call-to-action section

- Use the soft-surface background to distinguish the section without making it heavy.
- Use one strong heading, one short explanation, and one primary action.
- Maintain generous vertical space.

### Why Raahi impact section

- Use an editorial word-wall composition inspired by a creative-services index.
- Stack oversized uppercase benefit statements in the center using Inter `800`.
- Use `0.88` line height with a responsive `2–6px` row gap on desktop; use `0.92` line height with a `4px` row gap on mobile.
- Scale unusually long statements, such as “SMALLER FOOTPRINT,” to `0.78em` on desktop and `0.62em` on mobile so they remain inside the frame.
- Reserve a dedicated clear area beneath the word wall for the closing summary; the two elements must never intersect.
- Keep every statement in `--color-border` by default; no statement remains permanently emphasized.
- Apply the same interaction rule to every statement: move slightly right, change to `--color-primary`, and reveal a small green dot on hover or keyboard focus.
- Show a matching visual preview over the left side of the word wall only while its statement is active.
- Give each statement its own distinct Raahi illustration.
- Use only Raahi interface colors inside the preview: white, soft surface, deep green, fresh green, and the standard border.
- Keep small contextual labels in uppercase JetBrains Mono.
- On mobile, left-align the word wall, hide the side label, and reveal previews through keyboard focus or tap focus.

### Footer

- Use the soft-surface background.
- Combine a large editorial Raahi wordmark with compact navigation and legal information.
- Use light dividers and micro typography for metadata.
- The footer should feel like a calm visual conclusion, not a second navigation header.

## 5. Motion and interaction

Motion should clarify hierarchy and make the page feel polished. It must never delay access to information.

Approved motion:

- Hero reveal: fade from `opacity: 0` and move from `translateY(16px)` to the resting position.
- Hero timings: metadata `420ms`; wordmark `460ms` with `80ms` delay; content `460ms` with `180ms` delay; corner label `420ms` with `280ms` delay.
- General reveal: `350ms ease-out`, using opacity and a `16px` vertical movement.
- Process rows: `420ms ease-out`, entering from `translateX(-24px)` with a small stagger.
- Process divider: animate from `scaleX(0)` to `scaleX(1)`.
- Statistics panels: `460ms ease-out`, entering from `translateY(22px)` with a short stagger.
- Statistics count-up: `900ms` with an ease-out curve; show final values immediately in reduced-motion mode.
- Statistics accent line: reveal from `scaleX(0)` over `620ms`.
- Impact word wall: stagger each line upward over `500ms`.
- Impact preview: fade and enter from `translateX(-24px)` with a subtle `-1.5deg` rotation when its matching statement becomes active.
- Hover transitions: approximately `200ms`.
- Button active state: quick scale to `0.98`.

Motion rules:

- Animate only `opacity` and `transform` where possible.
- Use stagger sparingly and keep the sequence fast.
- Do not add looping motion, parallax, bouncing, or attention-seeking effects.
- Never hide essential content permanently when JavaScript is unavailable.
- Respect `prefers-reduced-motion: reduce` by making animations effectively instant and leaving all content visible.

## 6. Accessibility

Every new interface must:

- Keep primary text dark enough against white and soft surfaces.
- Use white text only on the approved green accent or another verified accessible background.
- Provide a visible `2px` accent focus outline with a `4px` offset for links and controls.
- Preserve keyboard navigation order.
- Use semantic headings in logical order.
- Provide meaningful alternative text for informative images and empty alternative text for decorative images.
- Keep touch targets at least `44px` high; Raahi buttons should remain at least `48px`.
- Never communicate state through color alone.
- Support reduced motion.

## 7. Content and brand voice

- Brand name: **Raahi**.
- Voice: direct, warm, dependable, and concise.
- Prefer plain language over corporate or technical terms.
- Keep headings short and confident.
- Use sentence case for normal interface copy.
- Landing pages should explain trust, community, convenience, and shared commuting.
- Do not place “Find a ride,” “Offer a ride,” or “Approve ride” product actions on the public landing page. Those actions belong inside the authenticated product experience.

## 8. Implementation contract

Use the shared tokens instead of creating local alternatives:

```css
.example-card {
  padding: var(--space-4);
  color: var(--color-primary);
  background: var(--color-surface);
  border: var(--frame-border);
  border-radius: var(--radius-large);
}

.example-primary-button {
  min-height: 48px;
  padding-inline: var(--space-3);
  color: var(--color-on-accent);
  background: var(--color-accent);
  border: 0;
  border-radius: 999px;
  font: 600 14px/1 var(--font-primary);
}
```

Implementation rules:

- Import `css/tokens.css` before component styles.
- Reuse an existing component pattern before creating a new one.
- Use descriptive, feature-based class names.
- Keep responsive behavior with the component that owns it.
- Do not duplicate token values in a component file.
- If a genuinely new reusable token is required, update both `css/tokens.css` and this document in the same change.

## 9. Locked versus extendable

Locked without design-team approval:

- Brand colors and their roles.
- Font families.
- Eight-pixel spacing scale.
- Core radii and pill treatment.
- White-first visual direction.
- Button hierarchy and focus style.
- Responsive breakpoints.
- Motion character and reduced-motion behavior.

Safe to extend within the system:

- New card arrangements using existing tokens.
- New page sections using the established frame and spacing.
- New icons that match the simple, clean visual weight.
- Additional component states using the existing palette.
- New editorial layouts that preserve readability and responsive behavior.

Any approved foundation change must update this file, `css/tokens.css`, and affected components together.

## 10. Team review checklist

Before merging a new Raahi UI, confirm:

- [ ] White is the dominant background.
- [ ] Only approved colors and tokens are used.
- [ ] Inter and JetBrains Mono are the only fonts.
- [ ] Spacing follows the eight-pixel scale.
- [ ] Components use approved borders, radii, and restrained shadows.
- [ ] There is one clear primary action per section.
- [ ] Desktop, tablet, and mobile layouts were checked.
- [ ] Keyboard focus is visible and navigation order is logical.
- [ ] Motion is subtle and reduced-motion mode is supported.
- [ ] Landing-page content does not expose authenticated ride actions.
- [ ] New patterns are documented if they are intended for reuse.

## 11. Current design files

- `css/tokens.css` — exact design tokens and the implementation source of truth.
- `css/style.css` — layout and component styling.
- `css/animations.css` — approved reveals, interaction motion, and reduced-motion behavior.
- `index.html` — current reference implementation of the Raahi landing page.
