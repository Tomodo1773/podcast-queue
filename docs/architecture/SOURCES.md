# Diagram sources

## Repository evidence

| Claim | Evidence |
| --- | --- |
| Next.js App Router UI and API routes | `README.md`, `package.json`, `app/`, `app/api/` |
| Vercel deployment and daily recommendation trigger | `vercel.json`, `app/api/cron/recommend/route.ts` |
| Supabase Auth, PostgreSQL, RLS, and vector-backed recommendations | `lib/supabase/`, `scripts/*.sql`, `app/api/cron/recommend/route.ts` |
| LINE URL registration, webhook handling, and recommendation notifications | `app/api/line-webhook/route.ts`, `lib/line/` |
| Gemini and YouTube Data API integration | `lib/gemini/`, `lib/youtube/` |
| Google Drive and Notion export | `app/api/google-drive/`, `app/api/notion/`, `lib/google/`, `lib/notion/` |

Repository inspected at commit `2ead797` on 2026-08-13.

## Icon assets

All named brands shown in the diagram use brand-specific assets obtained from the internet. Generic user, browser, API, and scheduler concepts use original diagram primitives.

| Asset | Owner | Source | Retrieved | Usage notes |
| --- | --- | --- | --- | --- |
| Vercel icon | Vercel Inc. | https://vercel.com/geist/brands → official `vercel-assets.zip` → `vercel-icon-light.svg` | 2026-08-13 | Official SVG, embedded without modification. |
| Next.js icon | Vercel Inc. | https://vercel.com/geist/brands → official `nextjs-assets.zip` → `nextjs-icon-light-background.svg` | 2026-08-13 | Official SVG, embedded without modification. |
| Supabase logo | Supabase Inc. | https://github.com/supabase/supabase/blob/master/apps/studio/public/supabase-logo.svg | 2026-08-13 | SVG from the official Supabase repository, embedded without modification. |
| YouTube icon | Google LLC | https://brand.youtube/ → official brand icon; file served from `www.gstatic.com/marketing-cms/.../favicon-1.png=s180` | 2026-08-13 | Official YouTube brand-site icon, embedded without modification. |
| Gemini icon | Google LLC | https://gemini.google.com/ → `https://www.gstatic.com/lamda/images/gemini_sparkle_4g_512_lt_f94943af3be039176192d.png` | 2026-08-13 | Icon served by the official Gemini web app, embedded without modification. |
| LINE brand icon | LY Corporation | https://www.line.me/en/logo → `LINE_Brand_icon.zip` | 2026-08-13 | Official PNG, embedded without modification; isolation space retained. |
| Google Drive product logo | Google LLC | https://developers.google.com/workspace/drive/api/guides/branding → official `www.gstatic.com` product logo | 2026-08-13 | Official PNG, embedded without modification. |
| Notion icon | Notion Labs Inc. | https://www.notion.com/front-static/favicon.ico linked by https://www.notion.com/product | 2026-08-13 | Official-site favicon, embedded without modification. |

Vercel, the Vercel design, Next.js and related marks, designs and logos are trademarks or registered trademarks of Vercel, Inc. or its affiliates in the US and other countries.

Google Drive is a trademark of Google Inc. Use of this trademark is subject to Google Permissions.
