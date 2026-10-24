# Product

<!-- impeccable:product-schema 1 -->

> Written without an interview: the owner asked for no questions. Facts marked *(inferred)* come from the codebase and the conversation, not from a confirmed answer.

## Platform

web

## Users

- **Prospective clients** *(inferred)*: people and businesses in and around Itapeva - SP looking for a photographer for a birthday, a dance company, a restaurant or brand shoot, a sports team or an event. They arrive mostly from Instagram, on a phone, and decide whether GoFocus is the studio they trust with a day that will not happen twice.
- **Past clients and event guests** *(inferred)*: come back to find the gallery of an event they were at.
- **The owner (admin)**: publishes albums and event galleries through the admin panel at `/admin`.

## Product Purpose

GoFocus is a professional photography studio's site. The home page shows the studio's real work (albums of past jobs and open event galleries) so a visitor quickly sees the quality and range, opens the albums that match what they need, and gets in touch through Instagram.

## Positioning

*(inferred)* A local studio whose proof is its own archive: dozens of finished albums across birthdays, dance, sport, food, jewellery and portraits, each with tens of delivered photos. The site's job is to let that body of work speak, not to describe it.

## Operating Context

- Albums ("projects") and event galleries come from Supabase; photos are hosted on ImageKit (most) and Cloudinary (older ones). Every album has a cover and 10 to 85 photos; categories include Aniversários, Dança, Ensaios, Esportes, Joias, Restaurantes.
- Albums open at `/projeto/:id`; event galleries at `/eventos/:id`; event list at `/eventos`.
- Contact happens on Instagram (`instagram.com/gofocus.br`). There is no booking form, no price list and no client login anymore; photo sales were removed.
- The owner previews on a Mac in **Safari**; smooth scrolling there is a hard requirement. Effects that Safari recomputes every frame (backdrop blur over moving content, animated CSS filters, heavy 3D scenes, full-screen blend modes) made earlier versions stutter.

## Capabilities and Constraints

- Stack: React 18 + Vite + TypeScript + Tailwind; GSAP (with ScrollTrigger, Flip, SplitText) and Lenis are installed.
- Content is dynamic: album count, names and photos change as the owner publishes.
- Undecided: whether the studio wants pricing, packages or a booking form on the site (none exist today; do not invent them).

## Brand Commitments

- Name: GoFocus. Logo: the silhouette of a man in a hat (`src/assets/logo.png`), shown white on dark.
- Gold `#E2A820` has been the brand accent throughout the existing site.
- Existing lines in use: "Fotografia que transcende", "Além das lentes, uma visão.", "Vamos criar um legado.", "Fotografia de alto padrão para mentes globais."
- The owner likes iOS-style glass and the immersion of ciaoenergy.com; the owner rejected, in turn, a 3D photo tunnel, a 3D lens with a viewfinder, and a dark infinite photo wall with a glass panel.

## Evidence on Hand

- Real albums and photos in Supabase (around 9 public albums, 300+ photos) and at least one event gallery.
- Stats currently shown on the site ("12+ eventos", "500+ fotos", "98% de satisfação") are the owner's own figures; not independently verified.
- No testimonials, client logos, press or prices exist; do not fabricate them.

## Product Principles

1. The photos are the product; interface and copy stay out of their way.
2. A visitor should reach a real album in one action from the first screen.
3. Smooth in Safari on a Mac and on a phone, or it does not ship.
4. Only real work and the owner's own claims; nothing invented.
