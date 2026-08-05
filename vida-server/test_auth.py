import os
import urllib.request
import urllib.error

BASE = "http://localhost:8000"
TOKEN = os.environ.get("TEST_TOKEN", "")


def get(path, token=None):
    req = urllib.request.Request(BASE + path)
    if token:
        req.add_header("Authorization", "Bearer " + token)
    try:
        with urllib.request.urlopen(req) as r:
            body = r.read()
            return r.status, r.headers.get("Content-Type", "-"), f"{len(body)}B"
    except urllib.error.HTTPError as e:
        return e.code, "-", "-"


print("healthz        :", get("/healthz"))
print("index no-auth  :", get("/vida/index.json"))
print("index bogus    :", get("/vida/index.json", "bogus.token.here"))
print("index real     :", get("/vida/index.json", TOKEN))
print("doc real       :", get("/vida/docs/engine-with-mountings-and-equipment/tail-pipe-0900c8af823db4bd.html", TOKEN))
print("image real     :", get("/vida/images/0900c8af81a72357_80_60.gif", TOKEN))
print("diagram real   :", get("/vida/diagrams/GR-78025.svg", TOKEN))
print("traversal      :", get("/vida/..%2F..%2F..%2Fetc%2Fpasswd", TOKEN))
