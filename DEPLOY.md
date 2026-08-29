# نشر الموقع على خوادم الإنتاج (Node.js + Nitro)

## 1) البناء محلياً

```bash
bun install    # أو npm install
bun run build  # أو npm run build
```

- المخرجات تُنتَج داخل `.output/` (Nitro preset افتراضي: `node-server`).
- لتغيير الهدف من CI:
  ```bash
  NITRO_PRESET=vercel bun run build
  NITRO_PRESET=netlify bun run build
  NITRO_PRESET=cloudflare-module bun run build
  ```

## 2) التشغيل على خادم Node.js

```bash
node .output/server/index.mjs
```

- المنفذ الافتراضي: `3000` (يمكن تغييره بـ `PORT=8080 node .output/server/index.mjs`).
- الملفات الثابتة تُقدَّم من `.output/public/`.

## 3) متغيّرات البيئة المطلوبة (Production)

عرِّفها في لوحة الاستضافة قبل التشغيل:

| المتغيّر | الوصف |
|---|---|
| `VITE_SUPABASE_URL` | رابط مشروع Supabase (مطلوب وقت البناء) |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | مفتاح anon/publishable (مطلوب وقت البناء) |
| `VITE_SUPABASE_PROJECT_ID` | معرّف مشروع Supabase (مطلوب وقت البناء) |
| `ADMIN_USERNAME` | اسم مستخدم لوحة التحكم `/dashboard` |
| `ADMIN_PASSWORD` | كلمة مرور لوحة التحكم |
| `PORT` | (اختياري) منفذ الاستماع، افتراضي 3000 |
| `NITRO_PRESET` | (اختياري) هدف Nitro عند البناء |

> ملاحظة: متغيّرات `VITE_*` تُحقن وقت البناء، فأعد البناء بعد أي تعديل.

## 4) الحزمة الجاهزة

- `site-build-node.zip` — مخرجات `.output/` جاهزة للتشغيل مباشرة عبر `node .output/server/index.mjs`.
- ارفعها على أي VPS يشغّل Node ≥ 20، أو على Vercel/Netlify/Cloudflare بعد إعادة البناء بالـ preset المناسب.

## 5) مثال `.env.production`

أنشئ الملف بجانب المشروع على الخادم (لا ترفعه إلى Git):

```env
# —— وقت البناء (Frontend / VITE_*) ——
VITE_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_xxxxxxxxxxxxxxxxxxxx
VITE_SUPABASE_PROJECT_ID=xxxxxxxxxxxx

# —— وقت التشغيل (Server) ——
SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
SUPABASE_PUBLISHABLE_KEY=sb_publishable_xxxxxxxxxxxxxxxxxxxx
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...   # سرّي — لا تضعه في أي متغيّر VITE_
ADMIN_USERNAME=admin
ADMIN_PASSWORD=change-me-strong

# —— اختياري ——
PORT=3000
NITRO_PRESET=node-server
```

> تذكير أمني: `SUPABASE_SERVICE_ROLE_KEY` يتجاوز صلاحيات RLS — يُستخدم فقط داخل السيرفر ولا يُعرض في الواجهة أبداً.

## 6) تشغيل الخدمة (PM2 أو systemd)

### PM2

```bash
pm2 start .output/server/index.mjs --name nabd-watch --update-env
pm2 save
pm2 startup
```

### systemd (وحدة كاملة جاهزة)

أنشئ `/etc/systemd/system/nabd-watch.service`:

```ini
[Unit]
Description=Nabd Smartwatch (TanStack Start / Nitro)
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/nabd
EnvironmentFile=/var/www/nabd/.env.production
ExecStart=/usr/bin/node .output/server/index.mjs
Restart=always
RestartSec=5
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
```

ثم:

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now nabd-watch
sudo systemctl status nabd-watch
sudo journalctl -u nabd-watch -f
```

## 7) Nginx كوكيل عكسي (اختياري)

```nginx
server {
  listen 80;
  server_name example.com;

  location / {
    proxy_pass         http://127.0.0.1:3000;
    proxy_http_version 1.1;
    proxy_set_header   Upgrade $http_upgrade;
    proxy_set_header   Connection "upgrade";
    proxy_set_header   Host $host;
    proxy_set_header   X-Real-IP $remote_addr;
    proxy_set_header   X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header   X-Forwarded-Proto $scheme;
  }
}
```

فعّل HTTPS عبر: `sudo certbot --nginx -d example.com`.

