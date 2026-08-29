# Add registration + login pages

Recreate the two new screens from the references as generic "ساعة إليت" pages — same layout and feel, no bank identity.

## New routes

- `/register` — "معلوماتك الشخصية" flow
  - Green hero banner with fingerprint-style motif, badge "تحقق من الهوية", title, subtitle.
  - White card (elevated, rounded) with icon avatar and form:
    - Full name (icon prefix)
    - Mobile number (icon prefix, placeholder `01XXXXXXXXX`)
    - National ID (14 digits, with helper text)
    - Primary CTA "متابعة التسجيل"
    - Footer note with lock icon: "بياناتك مشفّرة ولن تُشارك مع أي طرف خارجي"
  - Three trust cards below (خصوصية تامة / تحقق رسمي / حماية بنكية → reworded to brand-neutral: حماية متقدمة).
  - Client-side validation + sonner toast on submit; navigates to `/login`.

- `/login` — "تسجيل الدخول الآمن"
  - Green hero with shield/lock motif, badge "بوابة العملاء الرسمية", title "مرحباً بك في ساعة إليت", subtitle, gold pill "هديتك المختارة: إليت روز".
  - White card:
    - كود المستخدم (5–9 أرقام)
    - كلمة المرور (with "هل نسيت كلمة المرور؟" link)
    - Password policy note box
    - CTA "تسجيل الدخول" with fingerprint icon button beside it
  - Three trust cards (موثوق رسمياً → موثوق / أداء سريع / حماية متقدمة).
  - Footer terms line.

## Shared updates

- Add "تسجيل" and "دخول" links to `site-header.tsx`.
- Reuse existing tokens (emerald/gold) in `src/styles.css` — no new palette.
- Keep RTL, Tajawal font, existing header/footer.
- No backend: forms show sonner toasts only.

## Technical notes

- Files: `src/routes/register.tsx`, `src/routes/login.tsx`.
- Use shadcn `Input`, `Button`, `Label`, lucide icons (User, Phone, IdCard, Lock, Fingerprint, ShieldCheck, Gift, Zap).
- Each route has its own `head()` metadata (title/description/og).
- Reuse hero-bg pattern from index for consistency; overlay subtle SVG motifs via CSS.
