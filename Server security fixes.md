# Server Security Fixes

All 7 security patches have been applied and tested. Changes were made to `backend/server.py`, `backend/kernel_manager.py`, and `backend/requirements.txt`.

## 1. Security Headers (server.py)

Added `@app.after_request` handler that attaches four headers to every response:

- `Content-Security-Policy: default-src 'self'` - Only allows loading resources from our own domain
- `X-Content-Type-Options: nosniff` - Prevents browsers from guessing file types
- `X-Frame-Options: DENY` - Prevents embedding in iframes (clickjacking protection)
- `Referrer-Policy: no-referrer` - Doesn't leak URLs to external sites

## 2. Origin Checking (server.py)

All state-changing API endpoints (POST to `/api/start`, `/api/execute`, `/api/restart`, `/api/shutdown`) verify the `Origin` header against an allowlist:

- `https://richcaloggero.space`
- `http://localhost:5000`
- `http://127.0.0.1:5000`

Requests with no Origin header are allowed (curl, server-to-server). Requests with an unrecognized Origin get 403 Forbidden. This prevents cross-site request forgery (CSRF).

## 3. Rate Limiting (server.py, requirements.txt)

Added `flask-limiter` (>= 3.5.0) to requirements. All API endpoints are limited to 30 requests per minute per IP address. Returns 429 Too Many Requests when exceeded. Static file serving is not rate limited.

## 4. Payload Size Limit (server.py)

The `/api/execute` endpoint rejects request bodies larger than 1MB with 413 Payload Too Large. This prevents abuse via massive code submissions.

## 5. Static File Extension Allowlist (server.py)

The static file route only serves files with recognized extensions: `.html`, `.css`, `.js`, `.png`, `.jpg`, `.jpeg`, `.gif`, `.svg`, `.ico`, `.json`, `.woff`, `.woff2`, `.ttf`, `.map`. All other extensions return 403 Forbidden, preventing access to config files, `.env`, `.git`, etc.

## 6. Localhost Binding (server.py)

Flask now binds to `127.0.0.1` instead of `0.0.0.0`. The server only accepts connections from the local machine. External access goes through nginx (port 443) which proxies to Flask. This prevents bypassing nginx's SSL and basic auth by connecting to port 5000 directly.

## 7. Kernel Cleanup on Failed Start (kernel_manager.py)

If the kernel fails during startup (e.g., `start_kernel()` succeeds but `wait_for_ready()` times out), the error handler now:

1. Attempts to shut down any partially-started kernel
2. Resets `self.km` and `self.client` to `None`
3. Returns the error message

This prevents getting stuck in a state where the kernel can't be started because stale objects remain from a failed attempt.
