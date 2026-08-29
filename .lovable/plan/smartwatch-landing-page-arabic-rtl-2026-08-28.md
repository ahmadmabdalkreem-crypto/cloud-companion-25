# Smartwatch Landing Page (Arabic / RTL)

Rebuild the uploaded landing page as a standalone Arabic RTL site — same layout and feel, but with a fictional generic brand instead of any real bank identity. No logos, names, or trademarks from the original.

## Fictional brand

- Brand name: "ساعة إليت" (Elite Watch) — placeholder, easy to rename later.
- Simple wordmark in the header (text + small abstract mark), no bank logo.
- Palette inspired by the reference but recolored: deep emerald green, warm gold accent, cream background, white cards.

## Page structure (single page, RTL)

1. Header — wordmark centered on white bar.
2. Hero — green gradient background with soft light rays, small pill badge ("إصدار محدود"), large Arabic headline, two-line subheadline, gold tagline.
3. Feature cards — three white rounded cards with icon chips: exclusive design, secure payment, free gift.
4. Color picker — "ألوان تليق بذوقك" title, three watch images (green, rose, black) with Arabic labels underneath, selectable state.
5. CTA — full-width green rounded button "اطلب ساعتك الآن" with arrow, fine print about terms below.
6. Order form section (below CTA) — name, phone, city, color, submit. Stored locally for now; can wire to Cloud later if you want real order capture.

## Design

- `dir="rtl"` and `lang="ar"` on the root; Arabic web font (Tajawal or Cairo) via link tag in `__root.tsx` head.
- Design tokens in `src/styles.css`: emerald primary, gold accent, cream background, soft shadows, gradient token for hero.
- All colors as semantic tokens — no hardcoded hex in components.
- Generated hero background and three watch product images (green strap, rose mesh, black strap) via image generation, stored as CDN assets.

## Technical notes

- Replace `src/routes/index.tsx` placeholder with the landing page.
- Per-route `head()` with Arabic title/description and og tags.
- Form uses local state + toast confirmation; no backend enabled in this pass.
- Fully responsive; hero and cards stack on mobile.

## Out of scope

- No real bank branding, logos, or trademarked names.
- No payments, no backend integration in this pass (can add Lovable Cloud later for real order storage).
