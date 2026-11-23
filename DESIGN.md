# AI Planning Companion design system

This file is the source of truth for how the product looks and feels. Read it before any frontend change, and update it in the same commit whenever a UI rule changes. If code and this file disagree, fix the code or change the rule here first.

## How this file evolves

This is a living rule file. It follows "Keeping rule files current" in [CLAUDE.md](CLAUDE.md): once a human confirms a design decision, the agent updates this file in the same commit without being asked. In addition, every change here gets a line in the changelog at the end of this file (date, what changed, why).

The tokens below live in one place, `src/app/globals.css` (CSS variables exposed to Tailwind through `@theme inline`, with Tailwind's default colors, sizes, radii, shadows and breakpoints cleared). Components use those tokens and never define their own colors, sizes, spacing or radii. Values this file gives without a name are named there: control padding `--px-xs` to `--px-lg`, `--sidebar-width`, `--page-max`, `--chat-max`, the `--raised` and `--inset` shadows, and the `wide` breakpoint at 760 px.

## 1. Direction

Calm, light and roomy. The assistant should feel like a quiet desk, not a dashboard.

- **Base: airy flat.** White surfaces, hairline dividers, generous whitespace.
- **Controls: soft UI.** Only things you can press get a gentle raised shadow; only text inputs get an inset shadow.
- **Floating layers: frosted glass.** Only the Mac shortcut window and notifications use blur. Nothing that sits in the page flow is glass.
- One light theme by design.

Layout is chat first: a 248 px sidebar (Chat, Today, Week, Goals & tasks, Preferences, history) and a main area that swaps between the conversation and those pages.

**Brand mark.** A route: a start dot and an end dot joined by a curved path, meaning a goal turned into steps. It is the app logo and the avatar in front of every assistant reply, drawn as a 2 px stroke in `currentColor` (accent on `--accent-soft` for the avatar, `--on-accent` on `--accent` for the logo). Never use a checkmark as the assistant's mark, because a check means "done" elsewhere in the product.

## 2. Color tokens

Every color in the UI comes from a token. No literal hex values in components.

| Token | Value | Use |
| --- | --- | --- |
| `--desk` | #EDF1EF | Area outside the app frame |
| `--surface` | #FFFFFF | App, cards, page background |
| `--surface-2` | #F7F9F8 | Sidebar, history banner, dev panel |
| `--surface-3` | #EEF2F0 | Hover fill, inputs, neutral pills, fixed commitments |
| `--ink` | #1C2321 | Primary text |
| `--ink-2` | #4F5A56 | Text on neutral fills |
| `--muted` | #6F7A76 | Meta text, captions, inactive tabs |
| `--line` | #E6EBE8 | Hairlines and dividers |
| `--line-strong` | #D3DCD8 | Dashed borders, outlines on neutral fills |
| `--accent` | #1F7A63 | Primary action, current item, now line |
| `--accent-ink` | #145443 | Text on `--accent-soft` |
| `--accent-soft` | #E4F1EC | Selected nav, task blocks, success pills |
| `--accent-line` | #CFE5DC | Outline of proposal cards and task blocks |
| `--on-accent` | #FFFFFF | Text on `--accent` |
| `--amber` / `--amber-soft` | #8A5A10 / #FBF1DF | Needs attention, estimates, blocked |
| `--blue` / `--blue-soft` | #3A64A8 / #E8EEF8 | Suggestions, in progress |
| `--rose` / `--rose-soft` | #A2423D / #F8E6E4 | Errors, canceled |
| `--shadow-lo` / `--shadow-hi` | #C9D3CF / #FFFFFF | Soft UI shadows only |

Meaning is fixed across the product, so a color always says the same thing:

| Meaning | Color |
| --- | --- |
| Fact the user gave | neutral (`--surface-3`, `--ink-2`) |
| Estimate | amber |
| Suggestion | blue |
| Saved, done, accepted | accent |
| Error, canceled | rose |

Text contrast: body and meta text meet WCAG AA (4.5:1) on their background. Accent and semantic text colors are dark enough to pass on their own soft fill.

## 3. Typography

Font stack: `"Instrument Sans", -apple-system, "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif`. The CJK fallbacks keep Chinese text in a matching system face.

| Token | Size | Line height | Use |
| --- | --- | --- | --- |
| `--fs-xs` | 11 px | 1 | Tags, pills, uppercase section labels |
| `--fs-sm` | 12 px | 1.45 | Meta, captions, timestamps |
| `--fs-control` | 13 px | 1 | Buttons, chips, tabs, sidebar items |
| `--fs-base` | 14 px | 1.5 | Body text, list titles, nav |
| `--fs-chat` | 15 px | 1.6 | Chat messages |
| `--fs-lg` | 17 px | 1.3 | Section titles, goal names |
| `--fs-xl` | 22 px | 1.2 | Proposed time on a card |
| `--fs-2xl` | 28 px | 1.15 | Page titles |

- Weights: 400 body, 500 headings, 600 emphasis and controls. No other weights.
- Uppercase is only for short Latin section labels, with `0.06em` letter spacing. Never uppercase or letter-space Chinese text.
- All digits that line up (times, counts) use `font-variant-numeric: tabular-nums`.
- Headings use `text-wrap: balance`. Chat text stays near 65 characters wide (max 720 px column).

## 4. Spacing

A 4 px grid. Only these values are used for padding, margin and gap:

`--s1` 4 · `--s2` 8 · `--s3` 12 · `--s4` 16 · `--s5` 20 · `--s6` 24 · `--s8` 32 · `--s10` 40

Siblings are spaced with `gap` on a flex or grid parent, not with margins on children.

## 5. Radius

| Token | Value | Use |
| --- | --- | --- |
| `--r-sm` | 6 px | Keycaps, answer numbers, small week blocks |
| `--r-md` | 10 px | Rectangular buttons, nav items, inputs, list panels |
| `--r-lg` | 14 px | Cards, answer options, chips (their labels can wrap), chat bubbles |
| `--r-xl` | 20 px | App frame, composer, glass window |
| `--r-pill` | 999 px | Pills, tags, round buttons |

Nested corners shrink: an element inside a container uses a radius at least one step smaller than its container.

## 6. Controls and balanced padding

Text inside a control must look vertically centered. Two rules guarantee it:

1. **Fixed controls set a height, not vertical padding.** They use `display: inline-flex; align-items: center; justify-content: center; line-height: 1;` with a height token and horizontal padding only. The text is centered by the box, so it cannot drift up or down.
2. **Wrapping controls set a minimum height and equal vertical padding.** Anything whose label can wrap (answer options, chips with long text) uses `min-height` plus `padding-block` that is the same on top and bottom, and `line-height: 1.35`.

| Size | Height | Horizontal padding | Font | Use |
| --- | --- | --- | --- | --- |
| `--h-2xs` | 18 px | 4 to 8 px | `--fs-xs` | Keycaps, count badges in the sidebar |
| `--h-xs` | 22 px | 8 px | `--fs-xs` | Pills, tags (status, Needs a deadline, Saved) |
| `--h-sm` | 30 px | 12 px | `--fs-control` | Mini buttons, chips, day tabs, selects, top bar buttons |
| `--h-md` | 36 px | 14 px | `--fs-control` | Primary buttons, nav items, send button, answer options (min) |
| `--h-lg` | 48 px | 16 px | `--fs-base` | Composer |

- A pill or button inside a flex row never stretches: rows that mix text and controls use `align-items: center`, and controls also set `align-self: center`.
- Icons inside controls are 16 px; the gap between an icon and its label is `--s2`.
- Every interactive element has a visible `:focus-visible` ring (2 px accent, 2 px offset).
- Pressed state: raised shadow becomes a small inset shadow and the control moves down 1 px.

## 7. Containers

| Container | Padding | Gap | Border and fill |
| --- | --- | --- | --- |
| App frame | 0 | 0 | 1 px `--line`, `--r-xl`, `--surface` |
| Sidebar | `--s4` `--s3` | `--s4` between sections | `--surface-2`, right hairline |
| Page view | `--s6` top, `--s8` sides | `--s6` between sections | none, max width 860 px |
| Chat thread | `--s8` top, `--s6` sides | `--s4` between messages | none, max width 720 px |
| Card (proposal, steps) | `--s4` | `--s3` | 1 px `--line` (proposal `--accent-line`), `--r-lg` |
| List row (Today, prefs) | `--s3` top and bottom | `--s4` between columns | hairline on top only |
| Panel item (unscheduled tray, history banner) | `--s3` `--s4` | `--s3` | 1 px dashed `--line-strong` or solid `--line`, `--r-md` |
| User bubble | `--s2` + 2 px top and bottom, `--s4` sides | none | `--surface-3`, `--r-lg` |
| Glass window | `--s4` | `--s3` | white 62 % + 24 px blur, `--r-xl` |
| Notification | `--s3` `--s4` | `--s1` | white 74 % + 22 px blur, `--r-lg` |
| Toast | `--s2` + 2 px, `--s4` | `--s3` | `--ink` fill, `--r-md` |

Use card styling (border, fill, radius, shadow) only to set one object apart. Lists are rows separated by hairlines, not stacks of cards.

## 8. Adaptive layout

- **Content sets height.** Containers use `min-height` or no height. Only fixed controls (section 6) and the app frame have a fixed height.
- **Wrap, do not clip.** Titles and labels wrap to more lines instead of being cut with an ellipsis, including in the sidebar and in week blocks.
- **Week grid stretches time.** When a block's title needs more room than its time slot, that stretch of time grows in every day column so the whole title fits and days stay aligned. Hour labels and grid lines move with it.
- **Overlaps sit side by side.** Two blocks that share time split the column width; they never cover each other.
- **Narrow screens.** Below 760 px the sidebar becomes a top bar, page padding drops to `--s4`, and rows stack. A side gutter of at least 16 px is kept at every width.

## 9. Elevation and motion

| Level | Treatment | Used by |
| --- | --- | --- |
| Flat | Hairline only | Pages, lists, rows |
| Raised | `2px 2px 6px --shadow-lo, -2px -2px 6px --shadow-hi` | Pressable controls |
| Inset | `inset 2px 2px 5px --shadow-lo, inset -2px -2px 5px --shadow-hi` | Text inputs, composer, selects |
| Floating | Glass plus `0 20px 50px rgba(30,60,50,.22)` | Shortcut window, notifications |

Motion is 100 to 220 ms, ease-out, and is turned off under `prefers-reduced-motion`.

## 10. Conversation patterns

- **Replies read as paragraphs.** An assistant reply is one block of flowing text. Labels (Fact, Estimate, Suggestion, Saved), bold words and inline links stay inside the sentence. Never break a sentence across lines for emphasis; the highlight already carries it.
- **Questions come with answers.** When the assistant asks the user something, the likely answers appear as a numbered list directly under the question, ending with "Type my own answer", which focuses the composer. Number keys pick an answer when the composer is not focused. Free text always works.
- **Suggestions that are not answers** (example inputs, follow-ups after a non-question) sit as chips above the composer, not under a message.
- **Cards for decisions.** Proposals that change the plan appear as a card with explicit actions (Accept, Another time, Edit). Nothing is scheduled until the user accepts.
- **One chat per day.** Each day starts a new conversation. Earlier days are listed under Chats in the sidebar and open read-only; open questions carry over into the new day.

## 11. Checklist for new UI

- Colors, sizes, spacing and radii come from tokens only.
- Every control uses a size from section 6, and its text is centered by height, not padding.
- Rows that mix text and controls use `align-items: center`.
- Labels wrap instead of being clipped.
- Facts, estimates and suggestions use their fixed colors.
- Tested at 400 px width and with Chinese text.

## Changelog

| Date | Change | Why |
| --- | --- | --- |
| 2026-11-22 | Chose the visual direction: airy flat base, soft UI controls, frosted glass for floating layers only | Team picked this blend from six light style options |
| 2026-11-22 | Chat-first layout with a sidebar for Today, Week, Goals & tasks and Preferences | The conversation is the main way to use the product |
| 2026-11-22 | One chat per day with read-only history | Keeps each conversation short without compacting old context |
| 2026-11-22 | Assistant replies flow as paragraphs | Splitting one sentence across lines was tiring to read |
| 2026-11-22 | Questions show numbered answer options plus "Type my own answer" | Picking an answer is less effort than writing one |
| 2026-11-22 | Week grid stretches time rows so every title fits, and overlapping blocks sit side by side | Short blocks with long titles were clipped and looked overlapped |
| 2026-11-22 | Controls are centered by fixed height; spacing, type, radius and color come from tokens | Pills such as "Needs a deadline" looked unbalanced next to buttons |
| 2026-11-22 | Assistant mark changed from a checkmark to a route (two dots joined by a curved path) | A checkmark reads as "done" and was misleading as the assistant avatar |
| 2026-11-23 | Tokens moved into `globals.css`; unnamed values (control padding, layout widths, shadows, the 760 px breakpoint) got token names | The app shell needed them, and one name per value keeps components from using literals |
