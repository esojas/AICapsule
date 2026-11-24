# AI Capsule

A private AI prompt library. Signed-in users can create, read, update and delete their own prompt records.

- **Deployed URL:** https://aicapsule-production.up.railway.app
- **Cloud platform:** Railway (free trial)
- **Repository:** https://github.com/esojas/AICapsule

## Tech stack
React (Vite) frontend, Node.js + Express backend, SQLite (better-sqlite3), GitHub OAuth, JWT in a Secure HttpOnly cookie.

## Installation and run
```bash
npm install
npm --prefix client install
cp .env.example .env     # then fill in the values
npm run dev              # Vite on :5173, Express on :3001
```
Production-style run: `npm run build` then `npm start` (Express serves `client/dist`).
On Railway: build command `npm run build`, start command `npm start`.

## Routes
| Route | Access |
|---|---|
| `/`, `/login` | Public pages |
| `/dashboard` | Protected page (redirects to `/login` if not signed in) |
| `GET /api/health` | Public, returns `{ "status": "ok" }` |
| `GET/POST /api/capsules`, `PUT/DELETE /api/capsules/:id` | Protected by JWT middleware |
| `/api/auth/github`, `/api/auth/github/callback`, `/api/me`, `/api/auth/logout` | OAuth and session helpers |

**Frontend to backend:** React calls Express with `fetch` (`client/src/api.js`) using `credentials: 'include'`. In production, Express serves the React build from the same URL, so there is no CORS.

## OAuth and JWT
- **Provider:** GitHub OAuth.
- **Flow:** `/api/auth/github` redirects to GitHub with a random `state`. After authorising, GitHub redirects to the callback. Express checks `state`, exchanges the code for a GitHub token, reads the user's GitHub id, then discards the GitHub token.
- **Issue:** Express signs its own JWT (HS256, 7 days) with `sub` = GitHub user id, stored in a cookie named `token` (HttpOnly, Secure in production, SameSite=Lax).
- **Verify:** `server/middleware/auth.js` verifies the cookie with `jsonwebtoken` on every `/api/capsules` route and `/api/me`. Missing, invalid or expired tokens return 401.

## Environment variables (names only)
`NODE_ENV`, `JWT_SECRET`, `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`, `BASE_URL`, `PORT` (set by Railway), `DATABASE_PATH` (optional).

## Database and storage
- `server/db.js` runs `CREATE TABLE IF NOT EXISTS capsules (...)` on startup.
- Each record stores `user_id` (the GitHub user id taken from the verified JWT, never from the request body).
- Update and delete use `WHERE id = ? AND user_id = ?`, so users can only change their own records.
- **Storage is ephemeral:** SQLite is a file inside the app folder, so data is lost on redeploy or restart.

## cURL checks (against the deployed URL)
```
curl -i https://aicapsule-production.up.railway.app/api/capsules
{"error":"Unauthorized"}

curl -i -H "Cookie: token=fake-token-123" https://aicapsule-production.up.railway.app/api/capsules
{"error":"Unauthorized"}
```
Both returned 401 Unauthorized.

## AI-assisted development
- **Tools used:** Claude (Anthropic) for project structure, Express routes, OAuth/JWT code, React components and deployment help.
- **Problem found and corrected:** my Railway variables were added as Shared Variables, not on the service, so the app crashed with "JWT_SECRET is not set"; I added them to the service. Or: the Vite dev proxy was missing, so /api requests returned the Vite page; I added the proxy. Furthermore, I coulnd't use Azure and Render to deploy my app since it kept rejecting my card so I had to find another alternative which was Railway.
- **How OAuth/JWT/protection was verified:** GitHub login on the deployed site, `token` cookie checked in DevTools (HttpOnly, Secure), `/api/me` returns my identity when signed in, both cURL tests return 401.
- **How CRUD and ownership were verified:** I sent a POST containing a fake user, and then confirm that the record is save within my Github ID. Furthermore, I tried to delete a non existing ID and it gave me 404.
- **Decision I can explain:** I stored the application JWT in a secure, HttpOnly cookie named 'token' instead of localStorage. This makes it so that if an attacker inject a script they wouldn't be able to steal the login token. Because, with HttpOnly the browser attaches the cookie automatically on every request, so React code never get to touch the JWT.

## Limitation
SQLite storage is ephemeral on Railway, so all records are lost whenever the service redeploys. A persistent volume or hosted PostgreSQL would fix this.