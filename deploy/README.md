# نقل المشروع إلى استضافة خارجية (VPS + Node.js)

قاعدة البيانات تبقى كما هي (نفس مشروع Supabase الحالي) — تنقل الواجهة والسيرفر فقط.

## 1) البناء

على جهازك أو داخل CI (لا داخل بيئة Lovable):

```bash
bun install            # أو npm install
bun run build:node     # مخرجات Nitro node-server داخل .output/
```

أو استخدم الحزمة الجاهزة `nabd-node-build.zip` مباشرة (لا تحتاج بناء).

## 2) الرفع إلى السيرفر

```bash
scp nabd-node-build.zip root@SERVER_IP:/var/www/
ssh root@SERVER_IP
mkdir -p /var/www/nabd && cd /var/www/nabd
unzip -o /var/www/nabd-node-build.zip -d /var/www/nabd   # ينشئ .output/
```

يتطلّب السيرفر: Node.js 20 أو أحدث فقط (لا حاجة إلى `node_modules`، كل شيء مضمّن).

## 3) متغيّرات البيئة

انسخ `.env.production.example` إلى `/var/www/nabd/.env.production` واملأه:

| المتغيّر | مطلوب | الاستخدام |
| --- | --- | --- |
| `VITE_SUPABASE_URL` / `VITE_SUPABASE_PUBLISHABLE_KEY` / `VITE_SUPABASE_PROJECT_ID` | وقت البناء | اتصال المتصفح بقاعدة البيانات |
| `SUPABASE_URL` / `SUPABASE_PUBLISHABLE_KEY` | وقت التشغيل | قراءات السيرفر |
| `SUPABASE_SERVICE_ROLE_KEY` | وقت التشغيل | عمليات المدير (سرّي — لا يوضع في `VITE_*`) |
| `ADMIN_USERNAME` / `ADMIN_PASSWORD` | وقت التشغيل | دخول `/dashboard` |
| `PORT` / `HOST` | اختياري | افتراضي 3000 و0.0.0.0 |

مهم: متغيّرات `VITE_*` تُحقن وقت البناء، فأي تعديل عليها يتطلّب إعادة بناء ورفع جديد.

## 4) التشغيل

### systemd (موصى به)

```bash
cp /var/www/nabd/nabd-watch.service /etc/systemd/system/
systemctl daemon-reload
systemctl enable --now nabd-watch
systemctl status nabd-watch
journalctl -u nabd-watch -f
```

### PM2 (بديل)

```bash
npm i -g pm2
cd /var/www/nabd
pm2 start ecosystem.config.cjs --env production
pm2 save && pm2 startup
```

## 5) Nginx + HTTPS

```bash
cp /var/www/nabd/nginx.conf /etc/nginx/sites-available/nabd
ln -sf /etc/nginx/sites-available/nabd /etc/nginx/sites-enabled/nabd
# عدّل server_name إلى نطاقك
nginx -t && systemctl reload nginx
certbot --nginx -d example.com -d www.example.com
```

## 6) التحقّق بعد النشر

```bash
curl -I https://example.com/select-watch     # يجب 200
BASE_URL=https://example.com ADMIN_USERNAME=... ADMIN_PASSWORD=... \
  python3 scripts/smoke_admin_login.py
```

## 7) التحديثات اللاحقة

```bash
bun run build:node
scp -r .output root@SERVER_IP:/var/www/nabd/
ssh root@SERVER_IP "systemctl restart nabd-watch"
```

## ملاحظات

- Google OAuth / روابط إعادة التوجيه: أضف نطاقك الجديد في إعدادات المصادقة (Site URL + Redirect URLs) بقاعدة البيانات.
- المنصات الأخرى (Vercel / Netlify / Cloudflare): أعد البناء بـ `NITRO_PRESET=vercel|netlify|cloudflare-module`.
