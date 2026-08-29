# Add a Watch Collection Page

The second screenshot shows a second page of the same site: a catalog of six watch models. Build it as its own route, matching the layout, with the fictional brand instead of any real bank identity.

## New page: /collection

```text
[ header wordmark ]
[ green hero band: badge · big title · subtitle · gold progress bar ]
[ 3 x 2 grid of product cards ]
[ footer note strip ]
```

1. **Hero band** — green gradient with the blurred watch backdrop, small pill badge ("إصدار خاص"), large Arabic title "مجموعة الساعات", one-line subtitle, and a thin progress/accent bar underneath.
2. **Product grid** — six cards, three per row on desktop, two on tablet, one on mobile. Each card has:
   - corner ribbon badge: حصري / جديد / الأكثر طلباً
   - watch photo on a soft gradient tile
   - category dot label: رجالي / نسائي
   - model name and a short tagline
   - green "اطلب ←" button
3. **Footer strip** — rounded white bar with a fine-print line about warranty and premium packaging.

## Models (fictional names)

Men: إليت جرين, إليت سلفر, إليت بلاك — Women: إليت بينك, إليت وايت, إليت روز.

## Images

Three watch photos already exist (green, rose, black). Generate three more in the same studio style: silver mesh, soft pink strap, white ceramic link. All on clean white, generic contactless icon on screen, no brand marks.

## Navigation

Add a light nav in the shared header: الرئيسية / المجموعة, so the landing page and the collection page link to each other. The main CTA on the landing page ("اطلب ساعتك الآن") scrolls to the order form as it does now; a secondary link points to the collection.

## Technical notes

- New route `src/routes/collection.tsx`, RTL, reusing the existing tokens (emerald, gold, cream) — no new colors hardcoded.
- Card data as a typed array in the route file; badge and category rendered from that data.
- "اطلب" on a card navigates to the landing page order form with the model preselected (query param).
- Own `head()` with Arabic title, description, og tags, canonical.
- Header/footer extracted into small shared components so both pages stay in sync.
