# Security & Code Quality Audit — 2026-02-27

Full deep audit of the entire codebase (Python backend, JavaScript frontend, CI/CD, tests).
Conducted with static analysis of every source file.

---

## Summary

| Severity | Count |
|---|---|
| CRITICAL | 4 |
| HIGH | 11 |
| MEDIUM | 14 |
| LOW | 10 |
| INFO / Closed | 6 |
| **Total** | **45** |

### Progress vs. previous audit (2026-02-26)

| Previous finding | Status |
|---|---|
| Path traversal on restore backup — `db_maintenance.py` | **FIXED** |
| `asyncio_mode` missing in `pytest.ini` | **FIXED** |
| Dev/test deps in prod `requirements.txt` | **FIXED** |
| SSRF via unvalidated `owner`/`repo` — `releases.py` | Mitigated; residual gap (H-01) |
| SQL injection PRAGMA — `db_recovery.py` | Partially guarded; f-string persists (C-01) |
| Token plaintext in rotate response | Partially mitigated (C-02) |
| `window.open(undefined)` — `GenerationSection.js` | Empty check added; scheme not validated (C-03) |
| Unbounded `while(true)` retry loops | Bounded to 10 attempts; no backoff (H-03) |
| Workflow JSON loaded without validation | Shape check added; content not validated (H-04) |
| GitHub Actions not SHA-pinned | Third-party actions pinned; `actions/*` still tag-pinned (H-08) |
| `filtersController.js` listener leak | `lifecycleSignal` added; disposal gap remains (H-10) |

---

## CRITICAL

---

### C-01 — SQL injection via f-string in `PRAGMA table_info`

**Files:** `mjr_am_backend/adapters/db/schema.py:204,288` · `mjr_am_backend/adapters/db/db_recovery.py:135`

**Description:**
`PRAGMA table_info` is executed using f-strings with single-quote wrapping around the table
name — `f"PRAGMA table_info('{table_name}')"`. SQLite does not support bind parameters in PRAGMA
statements, but single-quote wrapping is insufficient protection: a value like `assets');DROP TABLE
assets;--` breaks out of the string. The guard `_is_safe_identifier` is the sole protection, applied
only at call-sites, not enforced inside the functions that execute the PRAGMA.

**Impact:** If any future call path reaches these sites without going through the guard (a refactor,
a new caller, a copy-paste), arbitrary SQL can be injected into the database.

**Suggested fix:**

1. Switch to double-quote identifier escaping, which is the SQL standard for identifiers:
   ```python
   # Before
   f"PRAGMA table_info('{table_name}')"

   # After — double-quote identifier, escape embedded double-quotes
   safe = table_name.replace('"', '""')
   f'PRAGMA table_info("{safe}")'
   ```

2. Add the validation gate at the start of each function that executes the PRAGMA, not only
   at call-sites:
   ```python
   def _get_table_columns(cursor, table_name: str) -> list[str]:
       if not _is_safe_identifier(table_name):
           raise ValueError(f"Unsafe table name: {table_name!r}")
       safe = table_name.replace('"', '""')
       cursor.execute(f'PRAGMA table_info("{safe}")')
       ...
   ```

3. Since all tables are statically known, consider a hard allowlist:
   ```python
   _KNOWN_TABLES = frozenset({"assets", "collections", "tags", ...})

   def _get_table_columns(cursor, table_name: str) -> list[str]:
       if table_name not in _KNOWN_TABLES:
           raise ValueError(f"Unknown table: {table_name!r}")
       ...
   ```

---

### C-02 — API token returned plaintext in JSON response body

**Files:** `mjr_am_backend/routes/handlers/health.py:583,622` · `js/api/client.js:123-136`

**Description:**
The `rotate-token` and `bootstrap-token` endpoints return the raw token in the response body
(`{"token": "...", "api_token": "..."}`). The transport-security check allows plain HTTP when the
client is on loopback, so the token can be transmitted unencrypted. The JS client then persists it
to `localStorage` in plaintext, where any same-origin JavaScript (XSS, extensions) can read it.
Once exfiltrated, the token authorizes all write, delete, and rename operations.

**Suggested fix:**

1. Return the token only once (at creation/rotation). On subsequent reads, return only a masked
   hint (e.g., `"••••••••" + last4`), never the full value:
   ```python
   # Only include raw token in the rotation/creation response, never in GET /status
   if is_new_token:
       return {"token": new_token, ...}
   else:
       return {"token_hint": f"...{stored_token[-4:]}", ...}
   ```

2. Consider using an `httpOnly` session cookie for the token instead of returning it in JSON.
   The browser will send it automatically and JavaScript cannot access it:
   ```python
   response.set_cookie("mjr_write_token", token, httponly=True, samesite="Strict",
                       secure=not is_loopback)
   ```

3. If `localStorage` must be used, document the risk explicitly and enforce a Content Security
   Policy (CSP) header to reduce XSS attack surface:
   ```python
   response.headers["Content-Security-Policy"] = (
       "default-src 'self'; script-src 'self'; object-src 'none';"
   )
   ```

4. Log a warning when the loopback HTTP exception is used:
   ```python
   if is_loopback and not is_https:
       logger.warning("Token transmitted over plain HTTP on loopback — acceptable only for local dev")
   ```

---

### C-03 — `window.open(src)` with server-provided URL — scheme not validated

**File:** `js/components/sidebar/sections/GenerationSection.js:537-539`

**Description:**
`srcCandidates[0]` is passed directly to `window.open(src, "_blank")`. The empty-string check
added in a previous fix prevents the `undefined` crash but does not validate the URL scheme.
A `javascript:` URI or `data:text/html,...` URI returned by the backend (e.g., via a compromised
database or SQL injection) would execute arbitrary JavaScript in a new tab.

**Suggested fix:**

Add a scheme allowlist before calling `window.open`. Relative paths (served by the same origin)
are safe; only `http:` and `https:` absolute URLs should be allowed:

```javascript
// Before
if (src) {
  window.open(src, "_blank");
}

// After
function _isSafeUrl(url) {
  if (!url) return false;
  // Allow relative paths (same origin)
  if (url.startsWith('/')) return true;
  // Allow only http/https absolute URLs
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

if (_isSafeUrl(src)) {
  window.open(src, "_blank", "noopener,noreferrer");
}
```

Note: always add `noopener,noreferrer` to `window.open` for `_blank` targets to prevent the opened
page from accessing the opener via `window.opener`.

---

### C-04 — Authentication bypass race on `bootstrap-token`

**File:** `mjr_am_backend/routes/handlers/health.py:586-594`

**Description:**
The authorization logic is:
```python
auth = _require_write_access(request)
if not auth.ok:
    user_auth = _require_authenticated_user(request)
    if not (user_auth.ok and _is_loopback_request(request)):
        return _json_response(auth)
```
When no token is configured yet, `_require_write_access` fails. The fallback allows any Comfy
user on loopback. When Comfy auth is disabled, `_require_authenticated_user` returns `Ok("")`.
This means any process on the local machine can call `POST /bootstrap-token` and mint a write
token with no authentication at all.

**Suggested fix:**

1. Require explicit opt-in for bootstrap via an environment variable that is removed after
   first use:
   ```python
   # In health.py bootstrap handler
   if os.environ.get("MAJOOR_ALLOW_BOOTSTRAP") != "1":
       return _json_response(Result.Err("BOOTSTRAP_DISABLED",
           "Set MAJOOR_ALLOW_BOOTSTRAP=1 to enable initial token creation"))
   # After issuing the token, instruct the user to unset the variable
   ```

2. Alternatively, require that the bootstrap endpoint can only be called once (one-time nonce):
   ```python
   _BOOTSTRAP_DONE = False  # module-level flag

   async def bootstrap_token(request):
       global _BOOTSTRAP_DONE
       if _BOOTSTRAP_DONE:
           return _json_response(Result.Err("ALREADY_BOOTSTRAPPED", "Token already exists"))
       ...
       _BOOTSTRAP_DONE = True
   ```

3. Add explicit documentation in `SECURITY_ENV_VARS.md` explaining the loopback + auth-disabled
   combination and its implications.

---

## HIGH

---

### H-01 — Residual SSRF in `releases.py` — `.` allowed in owner/repo regex

**File:** `mjr_am_backend/routes/handlers/releases.py:80-86`

**Description:**
`_SAFE_GITHUB_SEGMENT_RE = re.compile(r"^[a-zA-Z0-9_.-]{1,100}$")` allows `.`, which means `..`
is a valid segment. While GitHub's routing would likely ignore this, the pattern creates an
inconsistency and could allow path traversal in future URL constructions that reuse this validator.

**Suggested fix:**

```python
# Before
_SAFE_GITHUB_SEGMENT_RE = re.compile(r"^[a-zA-Z0-9_.-]{1,100}$")

# After — GitHub owner/repo names cannot start/end with dots or contain consecutive dots
_SAFE_GITHUB_SEGMENT_RE = re.compile(r"^[a-zA-Z0-9][a-zA-Z0-9_-]{0,99}$")
# Also add an explicit check
if ".." in owner or ".." in repo:
    return _json_response(Result.Err("INVALID_INPUT", "Invalid owner or repo name"))
```

---

### H-02 — Cleanup daemon thread has no stop signal and swallows all exceptions

**File:** `mjr_am_backend/routes/handlers/batch_zip.py:104-111`

**Description:**
`_run_cleanup_loop()` runs `while True: time.sleep(interval); _cleanup_batch_zips()` in a daemon
thread. There is no way to stop it cleanly on shutdown. Any exception in `_cleanup_batch_zips` is
silently swallowed with `except Exception: continue`, meaning repeated failures (disk full,
permission error) produce no log output and no backoff.

**Suggested fix:**

```python
_CLEANUP_STOP = threading.Event()

def _run_cleanup_loop(interval: float = 300.0) -> None:
    consecutive_errors = 0
    while not _CLEANUP_STOP.wait(timeout=min(interval * (2 ** consecutive_errors), 3600)):
        try:
            _cleanup_batch_zips()
            consecutive_errors = 0
        except Exception as exc:
            consecutive_errors += 1
            logger.warning("Batch ZIP cleanup error (attempt %d): %s", consecutive_errors, exc)

def start_cleanup_thread() -> None:
    t = threading.Thread(target=_run_cleanup_loop, daemon=True, name="batch-zip-cleanup")
    t.start()
    return t

def stop_cleanup_thread() -> None:
    _CLEANUP_STOP.set()
```

---

### H-03 — Retry loop fires up to 10 API calls with no delay

**Files:** `js/components/RatingEditor.js:53` · `js/components/TagsEditor.js:247`

**Description:**
`while (attempts < 10)` with `attempts += 1` and no `await delay(...)` between iterations.
When the abort/retry cycle triggers, up to 10 API calls are issued back-to-back in the same
microtask queue flush, amplifying rate-limit consumption and backend load.

**Suggested fix:**

Add exponential backoff between retry attempts:

```javascript
// Add a helper (e.g., in js/utils/debounce.js or inline)
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Inside flushSaves() / the retry loop
let attempts = 0;
while (attempts < 10) {
  if (attempts > 0) {
    await delay(Math.min(100 * 2 ** (attempts - 1), 2000)); // 100ms, 200ms, 400ms … max 2s
  }
  attempts += 1;
  // ... existing retry logic
}
```

---

### H-04 — Workflow JSON loaded into ComfyUI without content validation

**File:** `js/features/dnd/DragDrop.js:40-186`

**Description:**
`isValidWorkflowShape(workflow)` checks only that `workflow.nodes` and `workflow.links` are arrays
and that the total serialized size is within bounds. It does not validate the content of individual
nodes (types, widget values, properties). A compromised database or SQL injection could return a
crafted workflow that triggers unintended ComfyUI node execution when dropped.

**Suggested fix:**

Add a deeper structural validation pass before calling `app.loadGraphData`:

```javascript
const ALLOWED_NODE_TYPES_PREFIX = [
  "KSampler", "CLIPTextEncode", "VAEDecode", "LoraLoader",
  "CheckpointLoaderSimple", "SaveImage", "PreviewImage",
  // ... extend with known-good node type prefixes
];

function _isSafeWorkflowNode(node) {
  if (!node || typeof node !== 'object') return false;
  if (typeof node.id !== 'number') return false;
  // Reject nodes with no recognized type prefix (optional strictness)
  // if (node.type && !ALLOWED_NODE_TYPES_PREFIX.some(p => node.type.startsWith(p))) return false;
  // Reject nodes with suspicious string values in widgets_values
  if (Array.isArray(node.widgets_values)) {
    for (const v of node.widgets_values) {
      if (typeof v === 'string' && v.length > 8192) return false; // reject huge strings
    }
  }
  return true;
}

function isValidWorkflowShape(workflow) {
  // ... existing checks ...
  if (!workflow.nodes.every(_isSafeWorkflowNode)) return false;
  return true;
}
```

Additionally, call `window.open` with the workflow URL using `noopener,noreferrer` to isolate the
context if workflow loading is ever done via URL navigation.

---

### H-05 — `innerHTML` pattern established in shared utilities

**Files:** `js/components/Viewer_impl.js:539` · `js/components/sidebar/utils/dom.js:91,101,103`

**Description:**
Several helpers assign to `innerHTML` using hardcoded string literals, which is safe today.
However, this establishes a pattern that will likely be followed by future contributors with
user-controlled data, and there is no ESLint rule preventing it.

**Suggested fix:**

Add an ESLint rule (or comment directive) to the project:

```json
// In package.json or .eslintrc
{
  "rules": {
    "no-unsanitized/property": "error"  // requires eslint-plugin-no-unsanitized
  }
}
```

Or add a project-wide comment convention above every legitimate `innerHTML` use:

```javascript
// safe: static literal, no user data
container.innerHTML = '<svg viewBox="0 0 16 16">...</svg>';
```

And add a `grep`-based CI check that flags any `innerHTML` assignment containing template
literals with variable interpolation.

---

### H-06 — API token stored in `localStorage` in plaintext

**File:** `js/api/client.js:123-136`

**Description:**
The write-access token is persisted to `localStorage` under the settings key. `localStorage` is
accessible to all JavaScript in the same origin, including any XSS payload or malicious browser
extension. An attacker who achieves XSS once can extract the token and make authenticated write
requests indefinitely.

**Suggested fix:**

1. If the token must live in the browser, prefer `sessionStorage` over `localStorage` (cleared
   when the tab closes, reducing the window of exposure):
   ```javascript
   // Use sessionStorage instead of localStorage for the token
   sessionStorage.setItem(TOKEN_KEY, token);
   ```

2. Better: move the token to an `httpOnly` cookie managed by the server (see C-02 fix).

3. Enforce a Content Security Policy on the ComfyUI extension response to limit XSS impact.

4. Add token rotation on detection of suspicious activity (multiple failed requests from
   different IPs with the same token).

---

### H-08 — `actions/checkout` and `actions/setup-python` pinned by tag, not SHA

**Files:** `.github/workflows/python-tests.yml` · `.github/workflows/compat-smoke.yml` ·
`.github/workflows/nightly.yml` · `.github/workflows/release-on-tag.yml`

**Description:**
`actions/checkout@v4` and `actions/setup-python@v5` use mutable version tags. A tag can be
moved at any time by GitHub or the action maintainer, silently executing different code in CI.

**Suggested fix:**

Pin both actions to their full commit SHA. Example (verify the actual SHA from the GitHub
Actions marketplace before using):

```yaml
# actions/checkout v4 (as of early 2026)
- uses: actions/checkout@11bd71901bbe5b1630ceea73d27597364c9af683  # v4.2.2

# actions/setup-python v5 (as of early 2026)
- uses: actions/setup-python@0b93645e9fea7318ecaed2b359559ac225c90a2b  # v5.3.0
```

Add a Dependabot configuration to keep these automatically up to date:

```yaml
# .github/dependabot.yml
version: 2
updates:
  - package-ecosystem: "github-actions"
    directory: "/"
    schedule:
      interval: "weekly"
```

---

### H-09 — Workflows missing explicit deny-all permissions baseline

**File:** `.github/workflows/nightly.yml:15`

**Description:**
`permissions: contents: write` is declared for the release step but there is no top-level
`permissions: {}` deny-all baseline. Any step that does not need write access still has it
implicitly. A supply-chain compromise of any action used in the same workflow could push code
or create releases.

**Suggested fix:**

Add a top-level `permissions: {}` deny-all to every workflow, then grant only what each job
actually needs:

```yaml
# Top-level deny-all
permissions: {}

jobs:
  release:
    permissions:
      contents: write   # only this job needs write
    steps:
      ...

  tests:
    permissions:
      contents: read    # tests only need to read the repo
    steps:
      ...
```

---

### H-10 — `filtersController.js` — listener leak when `lifecycleSignal` is provided

**File:** `js/features/panel/controllers/filtersController.js:29-50`

**Description:**
When `lifecycleSignal` is provided to `addManagedListener`, the listener is registered on the
signal for cleanup but the `disposers` array is not populated. The `dispose()` function returned
by `bindFilters` only runs functions in `disposers`, so it is a no-op when signals are in use.
If the panel is remounted while the signal is still active, duplicate listeners accumulate on
live DOM elements, causing multiple grid reloads per user interaction.

**Suggested fix:**

Two complementary fixes:

1. Ensure `dispose()` is called in the panel teardown path, even when signals handle most
   cleanup (defensive belt-and-suspenders):
   ```javascript
   // In AssetsManagerPanel.js or wherever the panel lifecycle is managed
   const disposeFilters = bindFilters(els, opts, signal);
   signal.addEventListener('abort', disposeFilters, { once: true });
   ```

2. Make `addManagedListener` also push to `disposers` when a signal is provided, so that
   explicit `dispose()` calls always work:
   ```javascript
   function addManagedListener(target, event, handler, opts) {
     const signal = opts?.signal;
     target.addEventListener(event, handler, opts);
     const remove = () => target.removeEventListener(event, handler, opts);
     disposers.push(remove);  // always push — belt and suspenders
     if (signal) {
       signal.addEventListener('abort', remove, { once: true });
     }
   }
   ```

---

### H-11 — `PRAGMA cache_size` / `PRAGMA busy_timeout` use f-string interpolation pattern

**File:** `mjr_am_backend/adapters/db/sqlite_facade.py:765,767`

**Description:**
```python
f"PRAGMA cache_size={SQLITE_CACHE_SIZE_KIB}"
f"PRAGMA busy_timeout = {SQLITE_BUSY_TIMEOUT_MS}"
```
These are safe today because both constants are derived from `int()` conversions of environment
variables at module load. However, the pattern is dangerous: any future developer who copies
this PRAGMA template and substitutes a non-integer value introduces an injection.

**Suggested fix:**

Add inline comments and assert the type before interpolation:

```python
assert isinstance(SQLITE_CACHE_SIZE_KIB, int), "must be int — never interpolate user input into PRAGMA"
cursor.execute(f"PRAGMA cache_size={SQLITE_CACHE_SIZE_KIB}")  # int constant only

assert isinstance(SQLITE_BUSY_TIMEOUT_MS, int), "must be int — never interpolate user input into PRAGMA"
cursor.execute(f"PRAGMA busy_timeout={SQLITE_BUSY_TIMEOUT_MS}")  # int constant only
```

---

## MEDIUM

---

### M-02 — `os.startfile` on Windows invokes shell handlers

**File:** `mjr_am_backend/routes/handlers/assets_impl.py:665`

```python
os.startfile(str(resolved.parent))
```

`os.startfile` uses the Windows shell association for the given path. A directory with a crafted
`desktop.ini` file could trigger an unexpected shell handler. Prefer an explicit command:

```python
# Instead of os.startfile(str(resolved.parent))
import subprocess
subprocess.Popen(["explorer.exe", str(resolved.parent)], shell=False)
```

---

### M-03 — Exception swallowing in batch ZIP cleanup thread

**File:** `mjr_am_backend/routes/handlers/batch_zip.py:107-111`

```python
# Before
except Exception:
    continue

# After
except Exception as exc:
    logger.warning("Batch ZIP cleanup failed: %s", exc, exc_info=True)
```

---

### M-04 — TOCTOU race between `final.exists()` and `tmp.replace(final)` during upload

**File:** `mjr_am_backend/routes/handlers/scan_helpers.py:232-239`

Between `while final.exists()` and `tmp_obj.replace(final)`, another concurrent upload can
claim the same filename. Fix with an atomic claim:

```python
# Atomically claim the destination filename before moving the temp file
try:
    final.open('x').close()   # O_EXCL: fails if another process just created it
except FileExistsError:
    n += 1
    continue
# Now exclusively own `final`; move temp file
tmp_obj.replace(final)
```

---

### M-05 — Custom roots registered with `resolve(strict=False)`

**File:** `mjr_am_backend/custom_roots.py:85`

A custom root that doesn't exist yet passes validation silently. Use `strict=True` to require
the directory to exist at registration time:

```python
# Before
resolved = p.resolve(strict=False)

# After
try:
    resolved = p.resolve(strict=True)
except (FileNotFoundError, OSError) as exc:
    return Result.Err("INVALID_PATH", f"Custom root path does not exist: {exc}")
```

---

### M-06 — Unbounded ZIP filename collision loop

**File:** `mjr_am_backend/routes/handlers/batch_zip.py:409-415`

When many files share the same stem and all truncated names are identical (stem fills the
255-char limit), the loop never terminates. Add a safety exit:

```python
import uuid

n = 1
while True:
    attempt = f"{stem} ({n}){suffix}"
    attempt = attempt[:_ZIP_NAME_MAX_LEN]
    if attempt not in used_names:
        candidate = attempt
        break
    n += 1
    if n > len(items) + 200:  # impossible collision — use UUID fallback
        candidate = f"{uuid.uuid4().hex[:12]}{suffix}"
        break
```

---

### M-08 — Rate limiter fails open on exception

**File:** `mjr_am_backend/routes/core/security.py:803-804`

```python
# Before
except Exception:
    return True, None

# After
except Exception as exc:
    logger.error("Rate limit check raised unexpectedly, failing open: %s", exc, exc_info=True)
    return True, None
```

Consider whether the bootstrap-token endpoint should instead fail **closed** (deny the
request) when rate-limit state cannot be read.

---

### M-09 — `_get_client_identifier` uses `XFF[0]` — spoofable behind a proxy

**File:** `mjr_am_backend/routes/core/security.py:691-710`

`X-Forwarded-For` position 0 is client-controlled. The correct function
`_client_ip_from_forwarded_chain` (used in `_check_write_access`) trims trusted proxies from
the right to find the last untrusted hop.

```python
# In _get_client_identifier, replace:
forwarded_for.split(",")[0].strip()

# With:
_resolve_client_ip(request)  # chain-trimming version
```

---

### M-10 — No SAST or dependency vulnerability scanning in CI

**Files:** `.github/workflows/python-tests.yml` · `.github/workflows/compat-smoke.yml`

Add the following steps to the quality job in `python-tests.yml`:

```yaml
- name: Audit Python dependencies
  run: pip audit --strict

- name: SAST scan (bandit)
  run: bandit -r mjr_am_backend -ll -ii -x mjr_am_backend/tests

- name: Audit JS dependencies
  run: npm audit --audit-level=high
```

Add `pip-audit` and `bandit` to `[project.optional-dependencies] dev` in `pyproject.toml`.

---

### M-13 — Rate-limit cleanup O(N×M) under global lock

**File:** `mjr_am_backend/routes/core/security.py:751-760`

`_cleanup_rate_limit_state_locked` iterates all clients × all endpoints inside `_rate_limit_lock`.
With 1 000 clients × 32 endpoints this is 32 000 list comprehensions per 100 requests.

**Suggested fix:** Move cleanup to a background thread that runs every 60 seconds, holding the
lock only for the final bulk-delete of expired keys:

```python
def _cleanup_rate_limit_background() -> None:
    """Run in a daemon thread; prune expired rate-limit entries periodically."""
    while True:
        time.sleep(60)
        now = time.monotonic()
        with _rate_limit_lock:
            to_delete = [
                (client, ep)
                for client, eps in _rate_limit_state.items()
                for ep, window in eps.items()
                if window.expired(now)
            ]
            for client, ep in to_delete:
                del _rate_limit_state[client][ep]
                if not _rate_limit_state[client]:
                    del _rate_limit_state[client]
```

---

### M-14 — Content-Disposition header does not strip low ASCII control characters

**File:** `mjr_am_backend/routes/handlers/batch_zip.py:184-185`

```python
# Before — strips only `"`, `;`, CR, LF
safe_name = str(name).replace('"', '').replace(';', '').replace('\r', '').replace('\n', '')[:255]

# After — keep only printable ASCII (0x20–0x7e)
import re
safe_name = re.sub(r'[^\x20-\x7e]', '_', str(name))[:255]
```

---

### MF-01 — Negative workflow fetch results cached for 60 seconds

**File:** `js/features/dnd/DragDrop.js:146-149`

A transient network error on first drag-over caches a negative result for a full minute.
Do not cache failures (or use a very short TTL):

```javascript
// Before
_workflowCache.set(cacheKey, { workflow: null, ts: Date.now() });

// After — only cache successful results; let failures fall through for immediate retry
if (workflow !== null) {
  _workflowCache.set(cacheKey, { workflow, ts: Date.now() });
}
```

---

### MT-01 — No integration tests for real CSRF and auth paths

**File:** `tests/features/test_health_routes.py:123,273,360`

All write-endpoint tests monkeypatch `_csrf_error` and `_require_write_access` to pass
unconditionally. A regression in either guard would not be caught.

**Suggested fix:** Add at least one integration test per write endpoint using
`aiohttp.test_utils.TestClient` with real middleware, verifying that:
- A request missing the anti-CSRF header returns `CSRF_ERROR`
- A request without a valid token returns `AUTH_REQUIRED`

---

### MT-02 / MT-03 — No tests for `releases.py` or `batch_zip.py`

Create `tests/features/test_releases_routes.py` covering:
- `owner`/`repo` values containing `..`, `@`, spaces → rejected with 400
- Valid owner/repo → mock HTTP call returns expected shape

Create `tests/features/test_batch_zip_routes.py` covering:
- Items exceeding `MAX_BATCH_ZIP_ITEMS` → rejected
- Path traversal in `filename`/`subfolder` → rejected
- Concurrent creation of the same batch → no overwrite

---

## LOW

---

### L-02 — Nightly release ZIP includes internal files

**File:** `.github/workflows/nightly.yml:28`

The nightly ZIP includes `coverage_backend.json`, `audit_findings.md`, and `.vscode/` settings.
Add exclusions:

```yaml
# In the zip creation step
zip -r dist/... . \
  -x ".claude/*" \
  -x "coverage_*.json" \
  -x "audit_findings.md" \
  -x ".vscode/*" \
  -x "*.pyc" \
  -x "__pycache__/*"
```

---

### L-04 — Upload size limit checked after writing first chunk

**File:** `mjr_am_backend/routes/handlers/scan_helpers.py:219-229`

Check `Content-Length` before starting the write loop to reject oversized uploads eagerly:

```python
content_length = request.content_length
if content_length is not None and content_length > _MAX_UPLOAD_SIZE:
    return Result.Err("FILE_TOO_LARGE", f"Upload exceeds {_MAX_UPLOAD_SIZE} bytes")
# Then proceed with chunk loop as a second guard
```

---

### L-07 — Auth check order: `_require_write_access` after `_require_services`

**File:** `mjr_am_backend/routes/handlers/assets_impl.py:554-567`

Move the write-access check before the services check so that unauthenticated clients cannot
probe service availability:

```python
# Recommended order for all write handlers
csrf = _csrf_error(request)
if csrf: return csrf
auth = _require_write_access(request)
if not auth.ok: return _json_response(auth)
svc = _require_services(request)
if not svc.ok: return _json_response(svc)
op = _require_operation_enabled(request, ...)
if not op.ok: return _json_response(op)
```

---

### L-08 — `npm audit` never run

Add `npm audit --audit-level=moderate` to the JS test workflow and to local development
tooling (`run_tests.bat` or a new `scripts/audit.sh`).

---

### LF-01 — Dead code: `agendaHandler` variable

**File:** `js/features/panel/controllers/filtersController.js:28`

```javascript
// Remove this unused declaration
let agendaHandler = null;
```

---

## INFO — Closed / Verified Good

| ID | Finding | Status |
|---|---|---|
| I-01 | `asyncio_mode = auto` present in `pytest.ini` | Closed / Good |
| I-02 | `requirements.txt` is free of dev/test tools | Closed / Good |
| I-03 | `pyproject.toml` uses `[project.optional-dependencies] dev` correctly | Closed / Good |
| I-04 | `pytest.ini` uses `norecursedirs` to exclude temp dirs | Closed / Good |
| I-05 | All PRAGMA sites in `schema.py` guarded by `_is_safe_identifier` | Closed / Partial (see C-01) |
| I-06 | `_check_write_access` uses `hmac.compare_digest` for timing-attack resistance | Closed / Good |

---

## Remediation Priority Order

| Priority | ID | Effort | Impact |
|---|---|---|---|
| 1 | C-03 | Low (2 lines) | Prevents stored XSS via crafted metadata |
| 2 | C-01 | Low (add assert + double-quote) | Hardens SQL injection defence |
| 3 | H-01 | Low (1 line regex change) | Closes SSRF residual gap |
| 4 | M-14 | Low (1 line regex) | Fixes header injection |
| 5 | LF-01 | Trivial | Remove dead code |
| 6 | H-02 | Medium | Fixes silent cleanup failure + shutdown hang |
| 7 | M-06 | Low | Prevents theoretical infinite loop in ZIP builder |
| 8 | M-08 | Low (add log line) | Surfaces rate-limit failures |
| 9 | M-09 | Medium | Prevents rate-limit bypass via XFF spoofing |
| 10 | H-03 | Low | Reduces burst API call load |
| 11 | C-04 | Medium | Tightens bootstrap-token auth |
| 12 | C-02 / H-06 | High (architectural) | Removes token from response body / localStorage |
| 13 | H-04 | Medium | Deep workflow validation |
| 14 | MT-01/02/03 | Medium | Integration test coverage for security paths |
| 15 | M-10 | Low (CI config) | Adds dependency vuln scanning |
| 16 | H-08 / H-09 | Low (CI config) | SHA pins + permission scoping |
