---
version: 1
slug: "src-pages-clientpreview-tsx"
primary_target: "src/pages/ClientPreview.tsx"
related_targets: []
---

# Album page (src/pages/ClientPreview.tsx, /projeto/:id and /cliente/:slug)

Scope: one album opened from a strip. Mode: Experience (the visitor is inside the work: looking through every photo, opening one large, liking, sharing or downloading it). Inherits the photo-booth world in DESIGN.md.

Audience and job: clients and guests of that job, and prospects comparing work, mostly on phones; they scroll the whole album, open photos full screen, download or share to WhatsApp/Stories, and like the album.

Must keep: load by slug or id; likes (one per visitor); date dividers; full-screen viewer with arrows, swipe, pinch zoom, keyboard, download, share (native, WhatsApp, Stories); ?photo= deep link; QR code of the page; PIX support dialog with the existing key. Smooth in Safari: no live backdrop blur, no animated filters.

Run note: owner asked for no questions; the lead dealt structure was taken unattended. Dealt: print roll (lead), full-screen viewer with filmstrip, chronological chapters.

## Direction contract

THESIS: the album prints out of the booth. The page is one long roll of photo paper feeding from the booth's chrome slot, every photo a frame on it and every date a perforated tear line; it refuses the default masonry grid on black.

OWN-WORLD: the approved booth world: brushed grey #A7AAAF header field, black booth interior #0B0B0B behind the roll, photo paper #FBFAF7 frames, Big Shoulders signage, Archivo text, red #FF4D3D only for the like lamp.

STORY: the visitor sees which job this is and how many photos it holds, scrolls the whole roll, opens any frame full screen, and likes, shares or downloads.

FIRST VIEWPORT: grey header with nav (logo, back to the strips, Instagram), the album name as a big sign, a line with category, photo count and dates, and actions (like with count, share album, QR, support). Under it the chrome print slot spans the width and the paper roll feeds out of it in printer steps, its first frames visible above the fold.

FORM: print roll, dealt index 4 of 7 (lead); seed:4550f94e2d6937f1.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
