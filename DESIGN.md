# InvetFlow Client — Design System (Minimal / Onboarding-First)

This document is the **source of truth** for visual direction across `invetflow-client`. It is aligned with a **simple, minimalistic** split-screen onboarding pattern (form column + marketing column): generous whitespace, a single strong primary action, light borders, and neutral surfaces—not decorative chrome.

**Reference:** Use the split-screen onboarding screenshot you shared (form left, marketing right: testimonial, product preview, three feature rows) as the visual benchmark for **spacing, column balance, and block order**. For design reviews and Figma handoff, keep a copy committed as `docs/reference-onboarding.png` in this package (add the file when you are ready; it is not required for the spec below).

> **Status:** The **default** theme is **light** (cool gray page `#f9fafb`, white surfaces, brand **blue** `#2563eb` for primary actions and links). **Positive / active / “live” states** also use the **blue** Tailwind scale (not green) so every screen matches. Dark mode remains available from the header toggle. Onboarding **tokens** (`--onb-*` in `src/styles.css`) are aligned with the same system. The **guided recruiter flow** lives at `/onboarding` (steps: `?step=email` → `password` → `profile` → `verify`). **Google sign-in** is still a **disabled** control with copy; **email verification** is a **stub** until outbound mail is wired. Sign-in and quick sign-up remain at `/auth` with a link to guided onboarding.

---

## Product context

- The **first** onboarding experience we are designing for is **recruiters, HR, and organizations** (accounts that create jobs and manage hiring).
- **Candidate** vs **organization** entry points will be **separated in routing and copy** in a follow-up; until then, avoid baking candidate-specific assumptions into the marketing column for org onboarding.

---

## Principles

1. **Restraint** — One visual idea per screen. Avoid gradients, multiple accent colors, and heavy glass unless the page is clearly marketing/hero.
2. **Clarity** — Headline + one supporting line + form. No competing focal points.
3. **Tactile but light** — Thin `1px` neutral borders, `rounded-lg` / `rounded-xl` consistently (`--radius` in `src/styles.css` is the baseline; adjust once globally if we standardize on 8–12px for onboarding).
4. **One primary action** — Full-width primary button on the form; secondary actions are outline or ghost.
5. **Readable hierarchy** — Title (`font-semibold` / `text-2xl` range), subtitle (`text-muted-foreground`, slightly smaller), body and labels at `text-sm` with comfortable vertical rhythm (`gap-4`–`gap-6` in forms).

---

## Stack (how this maps to code)

| Layer | Location / notes |
|--------|------------------|
| Tokens & theme | `src/styles.css` — `:root` / `.dark`, `@theme inline` |
| Components | `src/components/ui/*` (shadcn *New York* style, `components.json`) |
| Utilities | `clsx` + `tailwind-merge` via `#/lib/utils` |
| Icons | `lucide-react` (simple stroke icons for feature rows) |
| App shell | `src/routes/__root.tsx` (Header / Footer; onboarding may opt out or use a minimal header—decision when building the page) |

The product today uses a **teal / sea** custom palette (`--lagoon`, `--sea-ink`, etc.) and **Manrope** (`--font-sans`). The minimal onboarding reference uses a **saturated blue** for the main button. For InvetFlow we should keep **one** clear brand accent: either keep **lagoon / lagoon-deep** as the primary CTA for brand continuity, or introduce a single `--onboarding-primary` (or adjust shadcn `--primary`) in one place—**do not** mix multiple bright accents on the same form.

---

## Color & surfaces

| Role | Intent | Implementation guidance |
|------|--------|-------------------------|
| Form column background | Crisp, calm | `bg-background` or pure white; avoid global body gradient **on this layout** (use a route-scoped wrapper with solid background). |
| Marketing column | Subtle contrast | Very light cool grey (e.g. `bg-muted/40` or a dedicated token like `--panel-muted` once added). |
| Primary CTA | Single brand accent | `Button` `default` → maps to `bg-primary` / shadcn tokens; override at theme level, not per-button, for onboarding. |
| Borders | Barely there | `border-border` or `border-input`; avoid heavy shadow on inputs; use `shadow-xs` only if needed for elevation. |
| Muted text | Secondary copy | `text-muted-foreground` for subtitles, help text, legal line. |
| Destructive | Errors only | Keep error banners compact; do not use red for non-errors. |

Dark mode: preserve the same hierarchy (solid form column vs slightly lifted panel). Test onboarding **both** themes before shipping.

---

## Typography

- **UI & forms:** `font-sans` (Manrope) — already global.
- **Display / marketing headline (optional):** If we need a more editorial title on the marketing side only, `display-title` (Fraunces) in `src/styles.css` is available—**do not** mix Fraunces inside dense forms; keep forms sans-serif.
- **Scale (onboarding form column):** Title ≈ `text-2xl`–`text-3xl` `font-semibold` or `font-bold`, subtitle `text-sm`–`text-base` `text-muted-foreground`.

---

## Layout: split onboarding shell

Target structure (desktop):

- **Left:** Logo → title → subtitle → form → primary CTA → optional **“Or”** divider → secondary OAuth button (disabled or “Coming soon” until wired) → footer line (e.g. “Already have an account?”) → legal (Terms / Privacy as links).
- **Right:** Optional blocks in vertical order: social proof (quote / rating) → product preview (image or placeholder card) → **three** feature rows (icon + title + one line).

Behavior:

- **Grid:** `grid min-h-svh grid-cols-1 lg:grid-cols-2` (or `flex` with `flex-1` columns). Stack to a single column on small screens; marketing block **below** the form or collapsed—decide in implementation, but mobile must not require horizontal scroll.
- **Width:** Constrain the form column content with `max-w-md` or `max-w-lg` and horizontal padding; center within the left column.
- **Spacing:** Large consistent padding (`p-8`–`p-12` range) on the form side so the layout breathes (matches the reference).

---

## Components (patterns)

- **Text fields:** Label above, `Input` full width, placeholder example email; focus ring via existing `Input` + `ring` tokens.
- **Primary button:** Full width, `size="lg"` if available, high contrast label.
- **Divider:** Horizontal rule with centered “Or” — use `Separator` + flex overlay text, muted.
- **Secondary / OAuth button:** `variant="outline"`, full width, icon + label (Google asset when implemented); same height as primary for visual balance.
- **Links:** In-body links for “Sign in”, Terms, Privacy — use `text-primary` or semantic link color; underline on hover optional but consistent.
- **Feature rows (right):** Icon in a small muted square or circle, title `font-medium`, description `text-sm text-muted-foreground`.

Reuse **`Card`** only if it does not fight the flat split look; the reference is mostly **borderless** columns—prefer plain `div` + spacing for the onboarding layout.

---

## What we are **not** doing yet

- **Google (or any) OAuth** — No backend/button behavior until spec’d; add **layout placeholder** only if it helps QA spacing.
- **Pixel-perfect copy** from the reference — Replace with InvetFlow-specific value prop and product screenshot when available.
- **Dual-purpose auth UI** that tries to be both org and candidate—plan **separate** routes or clearly separated steps when product splits entry points.

---

## Suggested implementation sequence

1. **Tokens** — Add or adjust semantic colors for “form background”, “marketing panel”, and ensure `--primary` matches the chosen single CTA color for onboarding.
2. **Layout primitive** — Optional `OnboardingShell` (or similar) in `src/components/` with left/right slots and responsive behavior.
3. **HR / org onboarding page** — Replace or refine `src/routes/auth.tsx` (or new route) to use the shell; keep existing password/API behavior; tighten copy for organizations.
4. **OAuth** — Add Google button + server flow; match button height, border, and icon rules above.
5. **Candidate** — New entry route when product splits; reuse the same shell for consistency.

---

## Files to touch when executing

- `src/styles.css` — theme tokens, any onboarding-scoped utility classes.
- `src/components/ui/*` — only if we need a variant (e.g. `Input` or `Button` sizes) shared app-wide.
- `src/routes/auth.tsx` (and/or a new route) — page composition.
- `src/routes/__root.tsx` — consider a layout variant that **hides** marketing Header/Footer on standalone onboarding, if the reference is full-viewport and distraction-free.

---

## Review checklist (before merge)

- [ ] One primary CTA per screen; secondary actions clearly subordinate.
- [ ] Form column reads as “clean white” (or explicit `background` token), not the global marketing gradient, unless intentionally unified.
- [ ] Touch targets and focus states are visible (`focus-visible:ring` on `Button` / `Input`).
- [ ] Light and dark both readable; marketing column does not rely on low-contrast grey text alone.
- [ ] Mobile: single column, logical block order, no overflow-x.

This document should evolve with the codebase; when tokens or route structure change, update the **Stack** and **Files** sections in the same PR.

---

## Implementation map (code)

| Concern | Location |
|--------|----------|
| Onboarding CSS variables (`--onb-primary`, `--onb-page`, `--onb-panel`, `--onb-border`, `--onb-*`) | `src/styles.css` (`:root` / `.dark`, `@theme inline` color tokens) |
| Split layout + marketing column | `src/components/onboarding/MarketingColumn.tsx`, `src/routes/onboarding.tsx` |
| Company size / job title chips | `src/components/onboarding/ChipSelect.tsx`, `src/components/onboarding/labels.ts` |
| Password rules (aligned with server) | `src/lib/password-policy.ts` ↔ `invetflow-server` `auth::password` |
| Full-viewport onboarding (no marketing header/footer) | `AppShell` in `src/routes/__root.tsx` |
| API: recruiter profile after sign-up | `PATCH /api/auth/onboarding` — `updateRecruiterOnboarding` in `src/integrations/api/client.ts` |
| API: resend verification (stub) | `POST /api/auth/resend-verification` — `resendVerificationEmail` in `client.ts` |
| User DTO (company fields) | `User` in `src/integrations/api/types.ts`; server: `User` / `UserResponse` in `invetflow-server` |
