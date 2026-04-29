# STIerFinds Manager

The official STI Lost & Found portal — rewritten as a modern web app.

- **Frontend** — React + Vite + Tailwind. Deploys to **Vercel** (or Netlify, Cloudflare Pages, etc.).
- **Backend** — **Lovable Cloud** (managed Postgres + Auth + Storage + Realtime). Already hosted, no separate server to deploy. Your frontend talks to it directly over HTTPS from any domain.

## Deploy the frontend to Vercel

1. Push this repo to GitHub.
2. On https://vercel.com → **Add New Project** → import the repo.
3. Framework preset: **Vite** (auto-detected).
4. **Environment Variables** — copy these from this project's `.env`:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_PUBLISHABLE_KEY`
   - `VITE_SUPABASE_PROJECT_ID`
5. Click **Deploy**. Done — your app is live at `your-project.vercel.app`.

`vercel.json` is already configured so deep links / page refreshes work for the SPA router.

## How the old PHP maps to the new app

| Old PHP file | Replaced by |
|---|---|
| `Login.html` (welcome page) | `/` (Welcome) |
| `normalLogin.html` + `login.php` | `/login` |
| `Signup.html` + `signup.php` | `/signup` |
| `AdminLogin.html` + `admin_login.php` | `/admin/login` |
| `dashboard.php` | `/dashboard` |
| `admin_dashboard.php` | `/admin` |
| `chatbox.html` + socket.io | `/messages` (uses Lovable Cloud realtime) |
| `uploads/` folder | `item-images` storage bucket |
| MySQL `registration` + `admins` tables | `auth.users` + `profiles` + `user_roles` |
| MySQL `items`, `messages`, `notifications` | Same names in Postgres, with strong access rules (RLS) |

## Creating an admin

1. Sign up normally at `/signup`.
2. From the project's database UI, insert a row into `user_roles` with your user id and `role = 'admin'`.
3. Sign in via `/admin/login`.

## Local development

```bash
npm install
npm run dev
```

The `.env` is auto-managed — do not edit by hand.
