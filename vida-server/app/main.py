"""
vida-auth: Firebase-token-gated static file service for the C30 AWD Swap
Tracker's VIDA workshop library.

Every /vida/* request must carry `Authorization: Bearer <Firebase ID token>`.
The token is verified against Google's public certs (RS256, iss/aud/exp
checked); the token's email must be in ALLOWED_EMAILS. Verified tokens are
cached by value until their own `exp`, so Google's cert endpoint is only
hit when a user presents a new token (at most once per hour per user).

The tracker's service worker attaches the header transparently; browsers
never see credentials in URLs or cookies.
"""

import os
import time
from pathlib import Path

import requests
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from google.auth.transport import requests as google_requests
from google.oauth2 import id_token as google_id_token

PROJECT_ID = os.environ.get("FIREBASE_PROJECT_ID", "c30-swap-tracker")
ALLOWED_EMAILS = {
    e.strip().lower()
    for e in os.environ.get("ALLOWED_EMAILS", "").split(";")
    if e.strip()
}
ALLOWED_ORIGINS = [
    o.strip()
    for o in os.environ.get("ALLOWED_ORIGINS", "").split(",")
    if o.strip()
]
CONTENT_ROOT = Path(os.environ.get("CONTENT_ROOT", "/content")).resolve()

app = FastAPI(docs_url=None, redoc_url=None, openapi_url=None)

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_methods=["GET", "OPTIONS"],
    allow_headers=["Authorization"],
    max_age=86400,
)

_google_request = google_requests.Request()
_token_cache: dict[str, tuple[str, float]] = {}  # token -> (email, exp)


def _verify(token: str) -> str | None:
    """Return the token's email if valid and allowed, else None."""
    hit = _token_cache.get(token)
    if hit and hit[1] > time.time() + 30:
        return hit[0]
    try:
        claims = google_id_token.verify_firebase_token(
            token, _google_request, audience=PROJECT_ID
        )
    except Exception:
        return None
    email = str(claims.get("email", "")).lower()
    exp = float(claims.get("exp", 0))
    if email not in ALLOWED_EMAILS or exp <= time.time():
        return None
    if len(_token_cache) > 64:  # bound the cache; entries are per-user-hour
        _token_cache.clear()
    _token_cache[token] = (email, exp)
    return email


@app.get("/healthz")
def healthz():
    return {"ok": True}


@app.get("/vida/{path:path}")
def vida(path: str, request: Request):
    auth = request.headers.get("Authorization", "")
    token = auth[7:] if auth.startswith("Bearer ") else ""
    if not token or not _verify(token):
        return JSONResponse({"detail": "unauthorized"}, status_code=401)

    target = (CONTENT_ROOT / "vida" / path).resolve()
    if not str(target).startswith(str(CONTENT_ROOT)) or not target.is_file():
        return JSONResponse({"detail": "not found"}, status_code=404)
    return FileResponse(
        target,
        headers={"Cache-Control": "private, max-age=86400"},
    )
