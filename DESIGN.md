---
name: GoFocus
description: The home of a photography studio, built as a party photo booth that prints strips of real albums.
colors:
  booth-gray: "#A7AAAF"
  booth-gray-hover: "#BFC2C6"
  booth-ink: "#141414"
  booth-interior: "#0B0B0B"
  booth-panel: "#161616"
  token-idle: "#1C1C1C"
  photo-paper: "#FBFAF7"
  pill-light: "#E9EAEC"
  admin-canvas: "#141516"
  admin-panel: "#1C1D1F"
  admin-sidebar: "#0F1011"
  admin-border: "#2E2F32"
  admin-text: "#ECEDEF"
  admin-text-muted: "#A3A6AB"
  admin-success: "#3BBE7A"
  admin-warning: "#E0A33B"
  admin-danger: "#EE4B43"
  admin-info: "#5B9BE6"
  ink-on-gray: "#23252A"
  ink-on-gray-soft: "#33363B"
  paper-caption: "#55524C"
  text-on-dark: "#D8D4CB"
  text-on-dark-soft: "#C9C4BA"
  footnote-on-dark: "#8F8A80"
  record-light: "#FF4D3D"
typography:
  display:
    fontFamily: "Big Shoulders Display, Archivo, sans-serif"
    fontSize: "clamp(3rem, 9vw, 6rem)"
    fontWeight: 900
    lineHeight: 0.86
    letterSpacing: "-0.01em"
  title:
    fontFamily: "Big Shoulders Display, Archivo, sans-serif"
    fontSize: "1.7rem"
    fontWeight: 800
    lineHeight: 1
  body:
    fontFamily: "Archivo, system-ui, sans-serif"
    fontSize: "17px"
    fontWeight: 400
    lineHeight: 1.6
  label:
    fontFamily: "Archivo, system-ui, sans-serif"
    fontSize: "15px"
    fontWeight: 600
    lineHeight: 1.3
  micro:
    fontFamily: "Archivo, system-ui, sans-serif"
    fontSize: "13px"
    fontWeight: 400
    lineHeight: 1.2
  admin-title:
    fontFamily: "Archivo, system-ui, sans-serif"
    fontSize: "24px"
    fontWeight: 600
    lineHeight: 1.25
  admin-heading:
    fontFamily: "Archivo, system-ui, sans-serif"
    fontSize: "20px"
    fontWeight: 600
  admin-panel-title:
    fontFamily: "Archivo, system-ui, sans-serif"
    fontSize: "17px"
    fontWeight: 600
  admin-body:
    fontFamily: "Archivo, system-ui, sans-serif"
    fontSize: "15px"
    fontWeight: 400
    lineHeight: 1.5
  admin-small:
    fontFamily: "Archivo, system-ui, sans-serif"
    fontSize: "14px"
  admin-meta:
    fontFamily: "Archivo, system-ui, sans-serif"
    fontSize: "13px"
  admin-micro:
    fontFamily: "Archivo, system-ui, sans-serif"
    fontSize: "12px"
  caption:
    fontFamily: "Archivo, system-ui, sans-serif"
    fontSize: "11px"
    fontWeight: 400
    lineHeight: 1
rounded:
  paper: "3px"
  stats-plate: "20px"
  machine: "28px"
  admin-control: "8px"
  admin-surface: "10px"
  admin-panel: "12px"
  pill: "9999px"
spacing:
  gutter-mobile: "20px"
  gutter-desktop: "40px"
  section-mobile: "96px"
  section-desktop: "128px"
components:
  button-booth-dark:
    backgroundColor: "{colors.booth-ink}"
    textColor: "{colors.pill-light}"
    typography: "{typography.label}"
    rounded: "{rounded.pill}"
    padding: "12px 20px"
  button-booth-dark-hover:
    backgroundColor: "#000000"
    textColor: "{colors.pill-light}"
  button-grey:
    backgroundColor: "{colors.booth-gray}"
    textColor: "{colors.booth-ink}"
    rounded: "{rounded.pill}"
    padding: "8px 16px"
  chip-token-idle:
    backgroundColor: "{colors.token-idle}"
    textColor: "{colors.text-on-dark}"
    typography: "{typography.label}"
    rounded: "{rounded.pill}"
    padding: "8px 16px"
  chip-token-active:
    backgroundColor: "{colors.booth-gray}"
    textColor: "{colors.booth-ink}"
    rounded: "{rounded.pill}"
  photo-strip:
    backgroundColor: "{colors.photo-paper}"
    textColor: "{colors.booth-ink}"
    rounded: "{rounded.paper}"
  booth-machine:
    backgroundColor: "{colors.booth-interior}"
    rounded: "{rounded.machine}"
    padding: "24px"
---

# Design System: GoFocus

## Overview

**Creative North Star: "The Party Booth"**

GoFocus is a studio that photographs birthdays, recitals, matches, restaurants and portraits, so the site is the one object every party guest knows: the photo booth. Its brushed-aluminium grey cabinet owns the big surfaces, its black interior holds the work, and its output, a strip of four frames on bright photo paper, is how every album is shown. Pressing the round chrome button counts down, fires a flash and prints a strip from the next album; the archive proves itself one strip at a time.

The system alternates whole fields of grey and black down the page, never a neutral ground with accents. Colour belongs to the photographs; the interface owns exactly one hue. Signage is set big, condensed and dense, edge to edge; reading text is a plain, sturdy grotesque.

Rejected along the way (by the owner): a 3D photo tunnel, a 3D lens with a viewfinder, and a dark infinite photo wall behind a glass panel. Glass with live backdrop blur is out on this surface because it stutters in Safari over moving content.

**Key Characteristics:**
- Committed colour: grey fields carry 30-60% of the page; black fields carry the rest.
- Every album is a printed strip: four 5:4 frames, album name printed at the foot.
- One authored motion: the strip feeding out of the slot in printer steps.
- Everything that moves is a transform or an opacity, so Safari stays smooth.

## Colors

One enamel grey, true black, and photo paper; the photographs supply all other colour.

### Primary
- **Booth Gray** (#A7AAAF): the booth cabinet. Owns the first viewport, the events section and the closing call as whole fields; on black it colours headlines, stats and the active token. Hover lifts to **Booth Gray Hover** (#BFC2C6).

### Neutral
- **Booth Ink** (#141414): all text and dark controls on grey.
- **Booth Interior** (#0B0B0B): the black fields (strip wall, studio statement, footer) and the machine body.
- **Booth Panel** (#161616) and **Token Idle** (#1C1C1C): raised plates and idle category tokens on black.
- **Photo Paper** (#FBFAF7): strips and event prints only.
- **Pill Light** (#E9EAEC): text on the black pill buttons (Instagram, all events).
- **Ink on Gray** (#23252A) and **Ink on Gray Soft** (#33363B): body and secondary text on grey, tinted from the grey rather than grey.
- **Text on Dark** (#D8D4CB), **Text on Dark Soft** (#C9C4BA), **Footnote on Dark** (#8F8A80): reading text on black.
- **Paper Caption** (#55524C): the small printed line under an album name on a strip.
- **Record Light** (#FF4D3D): the camera's tally lamp and LED countdown while counting; never anywhere else.

### Named Rules
**The One Hue Rule.** Grey is the only interface colour. Nothing else on the page is colourful except the photographs.

**The Whole Field Rule.** Grey and black are applied to entire sections, alternating; never as thin accents on a neutral page.

## Typography

**Display Font:** Big Shoulders Display (with Archivo, sans-serif)
**Body Font:** Archivo (with system-ui)

**Character:** condensed marquee signage you read from across a party hall, over a workmanlike grotesque that just explains.

### Hierarchy
- **Display** (900, clamp(3rem, 9vw, 6rem), line-height 0.86, uppercase): section headlines and the hero sign. Never larger than 6rem.
- **Title** (800, 1.7rem-1.9rem, line-height 1, uppercase): album names on strips and prints, studio values, the booth button's label.
- **Body** (400, 17-18px, line-height 1.6): explanations, max about 46ch.
- **Label** (500-600, 14-16px): navigation, tokens, buttons.
- **Caption** (400, 11px, width 87%): the printed line on a strip.

### Named Rules
**The Signage Rule.** Display type is set large, condensed and uppercase, packed tight; it is the sign on the booth, never a timid heading.

## Layout

Content sits in a 1280px column with 20px gutters on phones and 40px from small screens up; sections breathe with 96px (phone) to 128px (desktop) of vertical padding. The first viewport is a two-column booth front on desktop (sign and controls on the left at 1.1fr, machine on the right at 0.9fr); on phones the sign comes first and the machine follows, and pressing the button scrolls the machine into view. The strip wall is a grid of 2 / 3 / 5 columns; event prints scroll sideways natively with snap.

## Elevation & Depth

Depth is physical: paper casts soft offset shadows onto the surface it sits on, and the machine sits forward of the grey on one deep shadow. No hard zero-blur shadows, no glow.

### Shadow Vocabulary
- **Paper on surface** (`box-shadow: 0 18px 40px -18px rgba(0,0,0,0.55), 0 2px 6px rgba(0,0,0,0.18)`): strips and prints.
- **Machine** (`box-shadow: 0 30px 60px -30px rgba(0,0,0,0.7)`): the booth machine block.
- **Push button** (`box-shadow: 0 10px 24px -8px rgba(0,0,0,0.55)` on the chrome rim; `inset 0 -4px 8px rgba(255,255,255,0.08), 0 4px 6px rgba(0,0,0,0.55)` on the cap): the one round control.

## Shapes

Paper has nearly square corners (3px) and hangs slightly crooked (between -2.6° and 2°), straightening on hover. Machines and plates are softly rounded (20-28px). Controls are full pills or circles.

## Components

### Photo Strip (signature)
Four 5:4 frames stacked on Photo Paper with 7% padding, album name in Title type and a Caption line printed at the foot. It is the unit for every album, at any size.

### Booth Camera (signature)
The camera head, drawn in CSS: graphite housing with a soft brushed sheen and four corner screws; a frosted flash softbox that blazes white when the shot fires; a machined chrome bezel (conic gradient), black focus ring, stepped barrel and coated front glass with aperture blades and coloured coating reflections; a tally lamp that turns red ("Gravando") while counting; a red LED readout for 3-2-1; a pressed maker's plate; and a chrome-lipped print slot the strip feeds out of. Status text uses Micro (13px). During the countdown the lens "hunts" focus (scale 0.94 to 1) and the lamp blinks; only transform and opacity move.

### Print Roll (album page)
An album is one long roll of Photo Paper feeding out of a full-width chrome slot under the grey header, in printer steps on load. Frames sit in a 2-column (phone) or 3-column grid at 4:5, tight 10-16px gaps; each opens the full-screen viewer. Dates in the album are printed as tear lines: a dashed perforation (`border-top: 2px dashed #B9B5AD`) either side of the date in Title type. The foot of the roll repeats the album name and carries the like, back and Instagram actions.

### Photo Viewer
Full-screen true black (no backdrop blur), album name and a tabular `07 / 41` counter top left, round dark icon buttons (share, download, close) top right, arrows on the sides from small screens up, swipe and pinch zoom on touch, keyboard arrows and Esc. The roll's cached copy shows at once and the large copy replaces it when loaded.

### Booth Button
An 84px chrome ring holding a 62px black cap that sinks 2px when pressed, with its label in Title type beside it. Disabled while a strip is printing.

### Category Tokens
Pills on black: idle Token Idle with soft text, active Booth Gray with Booth Ink.

### Navigation
Inline on the grey header: logo silhouette in black with the wordmark in display type, text links with a grey-tinted hover, and a black pill for Instagram.

## Do's and Don'ts

### Do:
- **Do** show every album as a Photo Strip with its real photos and photo count.
- **Do** keep Booth Gray the only interface colour, used as whole fields or on black.
- **Do** animate only transform and opacity; print strips with a stepped ease (`steps(16)`).
- **Do** honour reduced motion: no countdown or flash, the strip simply appears.

### Don't:
- **Don't** put live backdrop blur over moving content, animate CSS filters, or add heavy 3D scenes on this surface; they stutter in Safari.
- **Don't** add a second accent colour, gradients on text, or labels above headings.
- **Don't** invent prices, testimonials or client logos; only real albums and the owner's own figures.

## Admin panel (Operate)

The signed-in admin (`/admin/*`) is the studio's workbench, not a showcase: a neutral graphite workspace, the way photo editors judge pictures, with the booth's chrome as the primary action. Theme lives in `src/components/admin/admin.css` (applied to `<body class="admin-ui">` so portalled dialogs, menus and toasts inherit it) and drives every stock shadcn/ui component; building blocks live in `src/components/admin/ui.tsx`.

- **Frame:** `AdminShell` wraps every admin route: a 232px sidebar (#0F1011) with Projetos, Eventos, Orçamentos, Instagram, then Ver site, Página de links, Sair; on phones a top bar with a menu sheet.
- **Page:** `AdminPage` is the root of every screen: 24px title, one-line description, actions on the right (one primary), optional back link, max width 1152px.
- **Surfaces:** canvas #141516, panels #1C1D1F with a #2E2F32 hairline and 12px radius (`Panel`), controls 8-10px radius.
- **Type:** Archivo only, fixed scale 12 / 13 / 14 / 15 / 17 / 20 / 24px, sentence case, tabular numbers. No uppercase tracked labels, nothing under 12px. The GoFocus wordmark in Big Shoulders is the only display type.
- **Colour:** primary actions chrome #E9EAEC with #141414 text; status only through `StatusBadge` (success #3BBE7A, warning #E0A33B, danger #EE4B43, info #5B9BE6); no decorative colour or gradients.
- **Behaviour:** one primary action per area; empty states say what to do next (`EmptyState`); loading uses skeletons or `LoadingBlock`; transitions 150-250ms; no decorative entrance animation, no backdrop blur; icon-only buttons carry aria-labels and are at least 40px.

