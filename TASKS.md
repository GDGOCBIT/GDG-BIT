# TASKS

Branch: `feat/redesign-admin-events` (local only, not pushed).
Status: `[ ]` todo · `[x]` done

Design source: *GDG On Campus Brand Guide* — Google Sans + Google Sans Code, core/halftone/pastel
swatches, off-white `#f0f0f0` / black `#1e1e1e`, thick ink outlines, globe / dots / arrow / `//` /
`{ On Campus }` doodles, pastel "Join our community" bands.

## Backend
- [x] Harden auth middleware (expired/bad JWT → 401 instead of hanging), hide password/OTP/token fields, safe forgot-password OTP check
- [x] Admin role (`role` field or `ADMIN_EMAILS` env) + `isAdmin` middleware
- [x] Admin CRUD: certificates (+ search, CSV bulk import), events, team, projects; `/admin/stats`
- [x] `PUT /profile` (name + avatar)
- [x] Auto-sync from **gdg.community.dev** (events + organizers/leads) and **GitHub org** (projects), cached, merged with admin-added entries
- [x] Session secret from env, CORS restricted, `.env.example` updated
- [x] Node ≥ 25 compatibility shim (`api/utils/nodeCompat.js`)

## Frontend
- [x] New design system (`client/src/base.css`) from the brand guide; legacy `App.css` removed
- [x] Light / dark theme switch (persisted, follows system on first visit, no flash)
- [x] Navbar (lockup, full-screen mobile menu, account menu with admin link), footer
- [x] Home: hero with real event posters, stats, next/latest event spotlight, events, what-we-do, team preview, join band, socials
- [x] Events (tabs + search), Archive (by year), Team, Projects, Profile, 404
- [x] Auth redesigned (social + email, OTP with paste support, forgot password)
- [x] Admin dashboard restyled; admin now has Overview / Certificates / Projects (events + team come from GDG automatically)
- [x] **Certificate designer**: upload blank template → drag name / QR / ID / extra CSV-column text into place (font, size, colour, align, shrink-to-fit) → upload recipients CSV → ZIP of PNG or PDF certificates + `issued.csv`; every certificate gets its own QR to its verify page
- [x] **Admin users**: Admins tab to grant/revoke admin by email (owners in `ADMIN_EMAILS` are protected; people can be invited before they sign up)
- [x] **Hero** rebuilt: rotating colour headline, pointer-reactive poster stack, spinning badge, live countdown to the next event, tech marquee
- [x] **Gallery**: public page with lightbox + home film strip; admin tab uploads photos (compressed in-browser, stored in MongoDB); event posters fill in automatically
- [x] **Background**: WebGL letter glitch in the 4 GDG colours; letters are pushed away by the cursor
- [x] Certificate verify page restyled (all 4 templates verified against real certificates)
- [x] Mobile pass (390px, no horizontal overflow), heavy pages code-split (main JS 1.7 MB → 330 KB)

## Verified
- [x] 29/29 end-to-end browser checks against a throwaway in-memory DB (sign-up with OTP, admin CRUD for
      every section, certificates, profile, sign out/in, forgot password, theme, API security)
- [x] Screenshots of every page at 1366px and 390px, light + dark

## Deployed
- [x] Live at https://gdsc-bit.vercel.app (Vercel project `gdsc-bit`, team `gdg-bit`)
- [x] Production env: `FRONTEND_URL` / `BACKEND_URL` / `PUBLIC_URL` = `https://gdsc-bit.vercel.app`, `ADMIN_EMAILS` set
- [ ] Register the OAuth callback URLs below with Google / LinkedIn / X
- [ ] Rotate the MongoDB password and Gmail app password (they were shared in chat), then update them in Vercel

OAuth callbacks to allow:
- `https://gdsc-bit.vercel.app/api/auth/google/callback`
- `https://gdsc-bit.vercel.app/api/auth/linkedin/callback`
- `https://gdsc-bit.vercel.app/api/auth/twitter/callback`

## Not done / ideas
- Image uploads in admin (Cloudinary) were not exercised by the automated test, to avoid writing to the real Cloudinary account — try one manually
- Google / LinkedIn / X sign-in need the OAuth apps to allow `http://localhost:5000/api/auth/*/callback` for local testing
- `python/` (old CSV import script + committed virtualenv) is now replaced by the admin CSV import and can be deleted
