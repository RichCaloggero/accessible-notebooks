# Deployment Options

There are two ways to run Accessible Notebooks:

## Option 1: Separate Frontend + CORS (Current Setup)

**How it works:**
- Backend runs on `http://localhost:5000`
- Frontend opens as `file:///C:/Users/.../frontend/index.html`
- CORS headers allow cross-origin requests

**Pros:**
- Simple - just double-click `index.html`
- No need to navigate to localhost in browser
- Frontend files can be edited and refreshed easily

**Cons:**
- Requires CORS (security concern for production)
- Two separate servers conceptually

**Setup:**
```bash
cd backend
python server.py
```
Then open `frontend/index.html` in browser.

**Files used:**
- `backend/server.py` (has `CORS(app)`)
- `frontend/app.js` (uses `http://localhost:5000`)

---

## Option 2: Integrated Server (No CORS Needed)

**How it works:**
- Backend serves both API and frontend files
- Everything from `http://localhost:5000`
- Same origin = no CORS needed

**Pros:**
- More secure (no CORS wildcard)
- Single server to manage
- Better for potential deployment

**Cons:**
- Must navigate to localhost in browser
- Slight URL change (`http://localhost:5000` instead of file path)

**Setup:**
```bash
cd backend
python server_integrated.py
```
Then navigate to `http://localhost:5000` in browser.

**Files used:**
- `backend/server_integrated.py` (serves frontend)
- `frontend/app_integrated.js` (uses relative URLs)

To use this, you'd also need to change `index.html` to load `app_integrated.js` instead of `app.js`.

---

## Why Does Option 1 Work?

You asked a great question: "How can file:// talk to http://localhost:5000?"

**Answer:** CORS (Cross-Origin Resource Sharing)

When the browser tries to make a cross-origin request:
1. Browser sends preflight OPTIONS request
2. Server responds with:
   ```
   Access-Control-Allow-Origin: *
   ```
3. Browser sees this and allows the request

The `CORS(app)` line in `server.py` enables this.

## Security Note

**Option 1 is fine for:**
- Local development
- Personal use on your own machine

**Option 1 is NOT safe for:**
- Production deployment
- Public-facing servers
- Multi-user environments

If you ever deploy this, use Option 2 or restrict CORS to specific origins.

## Recommendation

**For now:** Stick with Option 1 (what you have)
- It works great for local use
- Simplest user experience
- No security risk on your local machine

**For future:** Consider Option 2 if you want to:
- Share with others
- Deploy to a server
- Follow stricter security practices
