import { Ct as e, St as t, _t as n, gt as r, ht as i, k as a, m as o, nt as s, o as c, tt as l, vt as u, xt as d } from "./events-7GBcKIuJ.js";
// ui/app/settingsStore.ts
var f = "mjrSettings", p = "mjrMinimapSettings", m = /* @__PURE__ */ new Set([
	"POST",
	"PUT",
	"DELETE",
	"PATCH"
]), h = 2e4, g = 3e5, _ = 3, v = 400, y = 1e4, b = "/mjr/am/settings/security/bootstrap-token", x = "/mjr/am/", S = /* @__PURE__ */ new Map();
function C(e) {
	return new Promise((t) => setTimeout(t, e));
}
function w(e) {
	return m.has(String(e || "").trim().toUpperCase());
}
function ee(e) {
	try {
		let t = String(e || "").trim();
		if (!t) return "";
		if (t.startsWith("http://") || t.startsWith("https://")) {
			let e = typeof globalThis < "u" && globalThis?.location?.origin ? String(globalThis.location.origin) : "http://localhost";
			return new URL(t, e).pathname || "";
		}
		return t.split("?")[0] || "";
	} catch {
		return "";
	}
}
function T(e) {
	return ee(e).startsWith(x);
}
function E(e) {
	return ee(e) === b;
}
function te(e) {
	try {
		if (!e) return !1;
		let t = String(e.name || "");
		if (t === "AbortError") return !1;
		let n = String(e.message || "").toLowerCase();
		return t === "TypeError" ? n.includes("failed to fetch") || n.includes("networkerror") || n.includes("load failed") || n.includes("fetch") || n.includes("network") : n.includes("fetch") || n.includes("network") || n.includes("failed");
	} catch {
		return !1;
	}
}
function ne(e) {
	try {
		let t = String(e?.headers?.get?.("x-request-id") || "").trim(), n = String(e?.headers?.get?.("retry-after") || "").trim(), r = null;
		if (n) {
			let e = Number(n);
			if (Number.isFinite(e) && e >= 0) r = e;
			else {
				let e = Date.parse(n);
				Number.isFinite(e) && (r = Math.max(0, (e - Date.now()) / 1e3));
			}
		}
		return {
			requestId: t,
			retryAfterSeconds: r
		};
	} catch {
		return {
			requestId: "",
			retryAfterSeconds: null
		};
	}
}
function D(e, t) {
	if (!e || typeof e != "object") return e;
	let { requestId: n, retryAfterSeconds: r } = ne(t);
	return n && !("request_id" in e) && (e.request_id = n), r !== null && !("retry_after" in e) && (e.retry_after = r), e;
}
function re(e = {}) {
	try {
		let t = Number(e?.timeoutMs);
		return Number.isFinite(t) ? Math.max(1e3, Math.min(g, Math.floor(t))) : h;
	} catch {
		return h;
	}
}
function ie(e = {}) {
	let t = e?.signal || null;
	if (typeof AbortController > "u") return {
		signal: t || void 0,
		timeoutMs: re(e),
		cleanup: () => {}
	};
	let n = re(e), r = new AbortController(), i = null, a = () => {
		try {
			i &&= (clearTimeout(i), null);
		} catch (e) {
			console.debug?.(e);
		}
		try {
			r.abort();
		} catch (e) {
			console.debug?.(e);
		}
	};
	try {
		i = setTimeout(() => {
			try {
				r.abort();
			} catch (e) {
				console.debug?.(e);
			}
		}, n);
	} catch (e) {
		console.debug?.(e);
	}
	try {
		t && (t.aborted ? a() : t.addEventListener("abort", a, { once: !0 }));
	} catch (e) {
		console.debug?.(e);
	}
	return {
		signal: r.signal,
		timeoutMs: n,
		cleanup: () => {
			try {
				i && clearTimeout(i);
			} catch (e) {
				console.debug?.(e);
			}
			try {
				t && t.removeEventListener("abort", a);
			} catch (e) {
				console.debug?.(e);
			}
		}
	};
}
function ae(e, t, n = {}) {
	let r = String(e || "GET").trim().toUpperCase(), i = String(t || "").trim();
	return !r || !i ? "" : `${r}:${i}:timeout=${re(n)}`;
}
function oe(e, t) {
	let n = String(e || "").trim();
	if (!n) return t();
	if (S.has(n)) return S.get(n);
	let r = Promise.resolve().then(() => t()).finally(() => {
		try {
			S.delete(n);
		} catch (e) {
			console.debug?.(e);
		}
	});
	return S.set(n, r), r;
}
function se(e, t, n) {
	if (w(t)) try {
		e instanceof Headers ? e.has("X-Requested-With") || e.set("X-Requested-With", "XMLHttpRequest") : e["X-Requested-With"] ||= "XMLHttpRequest";
	} catch (e) {
		console.debug?.(e);
	}
	try {
		e instanceof Headers ? e.has("X-MJR-OBS") || e.set("X-MJR-OBS", n ? "on" : "off") : "X-MJR-OBS" in e || (e["X-MJR-OBS"] = n ? "on" : "off");
	} catch (e) {
		console.debug?.(e);
	}
}
function ce(e, t) {
	if (t) try {
		e instanceof Headers ? (e.has("X-MJR-Token") || e.set("X-MJR-Token", t), e.has("Authorization") || e.set("Authorization", `Bearer ${t}`)) : ("X-MJR-Token" in e || (e["X-MJR-Token"] = t), "Authorization" in e || (e.Authorization = `Bearer ${t}`));
	} catch (e) {
		console.debug?.(e);
	}
}
async function le(e, t, n, r, { ensureWriteAuthToken: i, normalizeWriteAuthFailure: a, fetchAPI: o, options: s, retryCount: c }) {
	let l = e.headers.get("content-type") || "";
	if (!l.includes("application/json")) return !r && w(n) && T(t) && !E(t) && Number(e.status || 0) === 401 && await i({
		force: !0,
		allowCookieRefresh: !0
	}) ? await o(t, {
		...s,
		_authRetryDone: !0
	}, c) : D({
		ok: !1,
		error: `Server returned non-JSON response (${e.status})`,
		code: "INVALID_RESPONSE",
		status: e.status,
		content_type: l,
		data: null
	}, e);
	let u = await e.json().catch((e) => (console.debug?.("[MJR API] JSON parse error:", e), null));
	if (typeof u != "object" || !u || Array.isArray(u) || typeof u.ok != "boolean") return D({
		ok: !1,
		error: "Invalid response structure",
		code: "INVALID_RESPONSE",
		status: e.status,
		data: null
	}, e);
	if (u.ok === !0 && Number(e.status || 0) >= 400 && (u = {
		...u,
		ok: !1,
		error: u.error || `Server reported success with an HTTP error status (${e.status})`,
		code: "INVALID_RESPONSE"
	}), !("status" in u)) try {
		u.status = e.status;
	} catch (e) {
		console.debug?.(e);
	}
	D(u, e);
	let d = Number(u?.status || e.status || 0), f = d === 429 || d === 503 || d === 504;
	if (!u?.ok && f && n === "GET" && c < _ && !s?.signal?.aborted) {
		let e = Number(u?.retry_after);
		return await C(Number.isFinite(e) ? Math.min(y, Math.max(0, e * 1e3)) : v * (c + 1)), await o(t, s, c + 1);
	}
	return !r && w(n) && !E(t) && !u?.ok && (String(u?.code || "").toUpperCase() === "AUTH_REQUIRED" || Number(u?.status || 0) === 401) && await i({
		force: !0,
		allowCookieRefresh: !0
	}) ? await o(t, {
		...s,
		_authRetryDone: !0
	}, c) : (w(n) && T(t) && !E(t) && (u = a(u)), u);
}
function ue({ readObsEnabled: e = () => !1, readAuthToken: t = () => "", ensureWriteAuthToken: n = async () => "", normalizeWriteAuthFailure: r = (e) => e, trackApiCall: i = null } = {}) {
	async function a(o, s = {}, c = 0) {
		let l = typeof performance < "u" ? performance.now() : Date.now(), u = ie(s), d = null;
		try {
			let i = (s.method || "GET").toUpperCase(), l = !!s?._authRetryDone, f = typeof Headers < "u" ? new Headers(s.headers || {}) : { ...s.headers };
			se(f, i, !!e());
			let p = t();
			if (!p && w(i) && T(o) && !E(o)) {
				try {
					await n();
				} catch (e) {
					console.debug?.(e);
				}
				p = t();
			}
			ce(f, p);
			let m = {
				...s,
				headers: f,
				signal: u.signal
			};
			try {
				delete m._authRetryDone, delete m.timeoutMs;
			} catch (e) {
				console.debug?.(e);
			}
			return d = await le(await fetch(o, m), o, i, l, {
				ensureWriteAuthToken: n,
				normalizeWriteAuthFailure: r,
				fetchAPI: a,
				options: s,
				retryCount: c
			}), d;
		} catch (e) {
			try {
				if (String(e?.name || "") === "AbortError") return s?.signal && s.signal.aborted ? {
					ok: !1,
					error: "Aborted",
					code: "ABORTED",
					data: null
				} : {
					ok: !1,
					error: `Request timed out after ${u.timeoutMs}ms`,
					code: "TIMEOUT",
					data: null,
					timeout_ms: u.timeoutMs
				};
			} catch (e) {
				console.debug?.(e);
			}
			let t = String(s?.method || "GET").toUpperCase();
			if ((t === "GET" || t === "HEAD") && c < _ && te(e)) {
				try {
					await C(v * (c + 1));
				} catch (e) {
					console.debug?.(e);
				}
				return await a(o, s, c + 1);
			}
			return {
				ok: !1,
				error: e?.message || String(e || "Network error"),
				code: "NETWORK_ERROR",
				data: null,
				retries: c
			};
		} finally {
			try {
				let e = (typeof performance < "u" ? performance.now() : Date.now()) - l;
				typeof i == "function" ? i(e, !d?.ok) : typeof window < "u" && window.MajoorMetrics && window.MajoorMetrics.trackApiCall(e, !d?.ok);
			} catch (e) {
				console.debug?.(e);
			}
			try {
				u.cleanup?.();
			} catch (e) {
				console.debug?.(e);
			}
		}
	}
	async function o(e, t = {}) {
		return oe(t?.dedupe === !1 || t?.signal ? "" : String(t?.dedupeKey || "").trim() || ae("GET", e, t), () => a(e, {
			...t,
			method: "GET"
		}));
	}
	async function s(e, t, n = {}) {
		return a(e, {
			...n,
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				...n.headers
			},
			body: JSON.stringify(t)
		});
	}
	return {
		fetchAPI: a,
		get: o,
		post: s
	};
}
// ui/utils/ttlCache.ts
function O({ ttlMs: e = 0, maxSize: t = 100, now: n = () => Date.now() } = {}) {
	let r = /* @__PURE__ */ new Map();
	function i() {
		try {
			let e = Number(n());
			return Number.isFinite(e) ? e : Date.now();
		} catch {
			return Date.now();
		}
	}
	function a() {
		try {
			let t = Number(typeof e == "function" ? e() : e);
			return Number.isFinite(t) ? Math.max(0, Math.floor(t)) : 0;
		} catch {
			return 0;
		}
	}
	function o() {
		try {
			let e = Number(t);
			return Number.isFinite(e) ? Math.max(1, Math.floor(e)) : 1;
		} catch {
			return 1;
		}
	}
	function s(e, t, n) {
		return !e || n > 0 && t - Number(e.at || 0) > n;
	}
	function c(e = i(), t = a()) {
		if (t > 0) for (let [n, i] of r.entries()) s(i, e, t) && r.delete(n);
	}
	function l() {
		let e = o();
		for (; r.size > e;) {
			let e = r.keys().next().value;
			if (e === void 0) break;
			r.delete(e);
		}
	}
	function u(e, t) {
		r.delete(e), r.set(e, t);
	}
	return {
		get(e) {
			let t = i(), n = a();
			c(t, n);
			let o = r.get(e);
			if (o) {
				if (s(o, t, n)) r.delete(e);
				else return o.value;
			}
		},
		has(e) {
			return this.get(e) !== void 0;
		},
		set(e, t, n = {}) {
			let o = Number(n?.at), s = {
				value: t,
				at: Number.isFinite(o) ? o : i()
			};
			return r.has(e) ? u(e, s) : r.set(e, s), c(i(), a()), l(), t;
		},
		delete(e) {
			return r.delete(e);
		},
		clear() {
			r.clear();
		},
		prune() {
			return c(i(), a()), l(), r.size;
		},
		keys() {
			return this.prune(), Array.from(r.keys());
		},
		entries() {
			return this.prune(), Array.from(r.entries()).map(([e, t]) => [e, t.value]);
		},
		get size() {
			return this.prune(), r.size;
		}
	};
}
// ui/features/panel/messages/toastHistory.ts
var de = "mjr_toast_history_v1", fe = "mjr_toast_history_last_read_v1", pe = 60, me = "mjr:toast-history-changed", k = null;
function A(e) {
	return String(e || "").trim();
}
function he(e) {
	let t = A(e).toLowerCase();
	return t === "warn" ? "warning" : t === "danger" ? "error" : t || "info";
}
function ge(e) {
	let t = Number(e);
	return Number.isFinite(t) ? t : null;
}
function _e(e) {
	if (!e || typeof e != "object") return null;
	let t = Number(e.percent), n = Number.isFinite(t) ? Math.max(0, Math.min(100, Math.round(t))) : null, r = Number(e.current), i = Number(e.total), a = Number.isFinite(r) ? Math.max(0, Math.floor(r)) : null, o = Number.isFinite(i) ? Math.max(0, Math.floor(i)) : null, s = Number(e.indexed), c = Number(e.skipped), l = Number(e.errors), u = Number.isFinite(s) ? Math.max(0, Math.floor(s)) : null, d = Number.isFinite(c) ? Math.max(0, Math.floor(c)) : null, f = Number.isFinite(l) ? Math.max(0, Math.floor(l)) : null, p = A(e.label);
	return n === null && a === null && o === null && u === null && d === null && f === null && !p ? null : {
		percent: n,
		current: a,
		total: o,
		indexed: u,
		skipped: d,
		errors: f,
		label: p
	};
}
function ve(e, t, n) {
	return e && t ? `${e}: ${t}` : t || e || n || "";
}
function j(e, t = "info", n = null) {
	if (!e || typeof e != "object") return null;
	let r = A(e.title || e.summary), i = A(e.detail), a = A(e.message || ve(r, i, A(e.fallbackMessage)));
	if (!a) return null;
	let o = ge(e.durationMs ?? e.duration ?? n), s = Number(e.createdAt), c = Number.isFinite(s) && s > 0 ? s : Date.now(), l = typeof e.persistent == "boolean" ? e.persistent : !(Number.isFinite(o) && (o ?? 0) > 0);
	return {
		id: A(e.id) || d(`th-${c}-`, 4),
		message: a,
		title: r,
		detail: i,
		type: he(e.type || t),
		createdAt: c,
		durationMs: o,
		persistent: l,
		source: A(e.source),
		trackId: A(e.trackId),
		status: A(e.status),
		operation: A(e.operation),
		progress: _e(e.progress),
		forceStore: !!e.forceStore,
		actionLabel: A(e.actionLabel),
		actionUrl: A(e.actionUrl)
	};
}
function M() {
	if (k === null) try {
		let e = localStorage.getItem(de), t = e ? JSON.parse(e) : [];
		k = Array.isArray(t) ? t.map((e) => {
			if (e && typeof e == "object") return j(e);
			let t = A(e);
			return t ? j({ message: t }) : null;
		}).filter(Boolean) : [];
	} catch {
		k = [];
	}
}
function ye() {
	try {
		localStorage.setItem(de, JSON.stringify(k));
	} catch {}
}
function N() {
	try {
		window.dispatchEvent(new CustomEvent(me));
	} catch {}
}
function be() {
	try {
		return Number(localStorage.getItem(fe)) || 0;
	} catch {
		return 0;
	}
}
function xe(e) {
	try {
		localStorage.setItem(fe, String(Number(e) || 0));
	} catch {}
}
function Se(e, t, n) {
	M();
	let r = j(e && typeof e == "object" ? e : {
		message: A(e),
		type: t,
		durationMs: n
	}, t, n);
	if (!r || !r.forceStore && !r.trackId && r.type === "info" && Number.isFinite(r.durationMs) && r.durationMs != null && r.durationMs > 0 && r.durationMs < 2500) return;
	let i = String(r.trackId || "").trim();
	if (i) {
		let e = k.findIndex((e) => String(e?.trackId || "").trim() === i);
		if (e >= 0) {
			let t = k[e] || {};
			k.splice(e, 1), r.id = String(t.id || r.id || "").trim() || r.id;
		}
	}
	k.unshift(r), k.length > pe && (k = k.slice(0, pe)), ye(), N();
}
function Ce() {
	return M(), k.map((e) => ({ ...e }));
}
function we() {
	M();
	let e = be();
	return k.filter((t) => t.createdAt > e).length;
}
function Te() {
	xe(Date.now()), N();
}
function Ee() {
	M(), k = [], ye(), xe(Date.now()), N();
}
// ui/app/toast.ts
function De(e) {
	let t = String(e || "info").trim().toLowerCase();
	return t === "warn" ? "warning" : t === "danger" ? "error" : t === "success" || t === "warning" || t === "error" ? t : "info";
}
function P(e) {
	if (typeof e == "string") return e;
	if (e && typeof e == "object") {
		let t = String(e.summary || "").trim(), n = String(e.detail || e.message || "").trim();
		if (t && n) return `${t}: ${n}`;
		if (n) return n;
		if (t) return t;
	}
	try {
		return String(e?.message || e || "").trim() || "Unknown message";
	} catch {
		return "Unknown message";
	}
}
function Oe(e, t, n, r) {
	let i = r?.history && typeof r.history == "object" ? r.history : null, a = {
		persistent: !(Number.isFinite(Number(n)) && Number(n) > 0),
		source: String(i?.source || r?.source || "").trim(),
		trackId: String(i?.trackId || "").trim(),
		status: String(i?.status || "").trim(),
		operation: String(i?.operation || "").trim(),
		progress: i?.progress && typeof i.progress == "object" ? { ...i.progress } : null,
		forceStore: !!i?.forceStore,
		actionLabel: String(i?.actionLabel || "").trim(),
		actionUrl: String(i?.actionUrl || "").trim()
	};
	return e && typeof e == "object" ? (a.title = String(i?.title || e.summary || "").trim(), a.detail = String(i?.detail || e.detail || e.message || "").trim(), a.message = P(e), a) : (a.title = String(i?.title || "").trim(), a.detail = String(i?.detail || "").trim(), a.message = P(e), a);
}
function ke(e, t = "info", n, r) {
	try {
		let i = Oe(e, t, n, r);
		i.forceStore = !0, Se(i, t, n ?? void 0);
	} catch {}
}
function Ae(e) {
	switch (e) {
		case "success": return 2e3;
		case "info": return 3e3;
		case "warning": return 4e3;
		case "error": return 5e3;
		default: return 5e3;
	}
}
function je(e) {
	if (typeof e != "string") return e;
	let t = e.trim(), n = {
		"Failed to update rating": o("toast.ratingUpdateFailed", "Failed to update rating"),
		"Error updating rating": o("toast.ratingUpdateError", "Error updating rating"),
		"Rating cleared": o("toast.ratingCleared", "Rating cleared"),
		"Failed to update tags": o("toast.tagsUpdateFailed", "Failed to update tags"),
		"Tags updated": o("toast.tagsUpdated", "Tags updated"),
		"Failed to toggle watcher": o("toast.watcherToggleFailed", "Failed to toggle watcher"),
		"No valid assets selected.": o("toast.noValidAssetsSelected", "No valid assets selected."),
		"Name collision in current view": o("toast.nameCollisionInView", "Name collision in current view"),
		"Failed to create collection.": o("toast.failedCreateCollectionDot", "Failed to create collection."),
		"Failed to add assets to collection.": o("toast.failedAddAssetsToCollection", "Failed to add assets to collection."),
		"Failed to remove from collection.": o("toast.removeFromCollectionFailed", "Failed to remove from collection."),
		"Collection created": o("toast.collectionCreated", "Collection created"),
		"Added to collection": o("toast.addedToCollection", "Added to collection"),
		"Removed from collection": o("toast.removedFromCollection", "Removed from collection"),
		"File renamed successfully!": o("toast.fileRenamedSuccess", "File renamed successfully!"),
		"Failed to rename file": o("toast.fileRenameFailed", "Failed to rename file"),
		"Failed to rename file.": o("toast.fileRenameFailed", "Failed to rename file."),
		"File deleted successfully!": o("toast.fileDeletedSuccess", "File deleted successfully!"),
		"Failed to delete file.": o("toast.fileDeleteFailed", "Failed to delete file."),
		"Failed to delete file. ": o("toast.fileDeleteFailed", "Failed to delete file."),
		"File deleted": o("toast.deleted", "File deleted"),
		"File renamed": o("toast.renamed", "File renamed"),
		"Folder created": o("toast.folderCreated", "Folder created"),
		"Folder renamed": o("toast.folderRenamed", "Folder renamed"),
		"Folder moved": o("toast.folderMoved", "Folder moved"),
		"Folder deleted": o("toast.folderDeleted", "Folder deleted"),
		"Failed to create folder": o("toast.createFolderFailed", "Failed to create folder"),
		"Failed to rename folder": o("toast.renameFolderFailed", "Failed to rename folder"),
		"Failed to move folder": o("toast.moveFolderFailed", "Failed to move folder"),
		"Failed to delete folder": o("toast.deleteFolderFailed", "Failed to delete folder"),
		"Failed to pin folder": o("toast.pinFolderFailed", "Failed to pin folder"),
		"Failed to unpin folder": o("toast.unpinFolderFailed", "Failed to unpin folder"),
		"Folder pinned as browser root": o("toast.folderPinnedAsBrowserRoot", "Folder pinned as browser root"),
		"Folder added": o("toast.folderAdded", "Folder added"),
		"Folder removed": o("toast.folderRemoved", "Folder removed"),
		"Folder linked successfully": o("toast.folderLinked", "Folder linked successfully"),
		"An error occurred while adding the custom folder": o("toast.errorAddingFolder", "An error occurred while adding the custom folder"),
		"An error occurred while removing the custom folder": o("toast.errorRemovingFolder", "An error occurred while removing the custom folder"),
		"Failed to add custom folder": o("toast.failedAddFolder", "Failed to add custom folder"),
		"Failed to remove custom folder": o("toast.failedRemoveFolder", "Failed to remove custom folder"),
		"Native folder browser unavailable. Please enter path manually.": o("toast.nativeBrowserUnavailable", "Native folder browser unavailable. Please enter path manually."),
		"Opened in folder": o("toast.openedInFolder", "Opened in folder"),
		"Failed to open folder": o("toast.openFolderFailed", "Failed to open folder"),
		"Failed to open folder.": o("toast.openFolderFailed", "Failed to open folder."),
		"File path copied to clipboard": o("toast.pathCopied", "File path copied to clipboard"),
		"Failed to copy path": o("toast.pathCopyFailed", "Failed to copy path"),
		"Failed to copy to clipboard": o("toast.copyClipboardFailed", "Failed to copy to clipboard"),
		"No file path available for this asset.": o("toast.noFilePath", "No file path available for this asset."),
		"Failed to refresh metadata.": o("toast.metadataRefreshFailed", "Failed to refresh metadata."),
		"Metadata refreshed": o("toast.metadataRefreshed", "Metadata refreshed"),
		"Duplicate analysis started": o("toast.dupAnalysisStarted", "Duplicate analysis started"),
		"Tags merged": o("toast.tagsMerged", "Tags merged"),
		"Duplicates deleted": o("toast.duplicatesDeleted", "Duplicates deleted"),
		"Rescanning file...": o("toast.rescanningFile", "Rescanning file..."),
		"Metadata enrichment complete": o("toast.enrichmentComplete", "Metadata enrichment complete"),
		"Playback speed is available for video media only": o("toast.playbackVideoOnly", "Playback speed is available for video media only"),
		"DB backup saved": o("toast.dbSaveSuccess", "DB backup saved"),
		"Failed to save DB backup": o("toast.dbSaveFailed", "Failed to save DB backup"),
		"DB restore started": o("toast.dbRestoreStarted", "DB restore started"),
		"Failed to restore DB backup": o("toast.dbRestoreFailed", "Failed to restore DB backup"),
		"Select a DB backup first": o("toast.dbRestoreSelect", "Select a DB backup first"),
		"Stopping running workers": o("toast.dbRestoreStopping", "Stopping running workers"),
		"Unlocking and resetting database": o("toast.dbRestoreResetting", "Unlocking and resetting database"),
		"Recreating database": o("toast.dbRestoreReplacing", "Recreating database"),
		"Replacing database files": o("toast.dbRestoreReplacing", "Replacing database files"),
		"Restarting scan": o("toast.dbRestoreRescan", "Restarting scan"),
		"Deleting database and rebuilding...": o("toast.dbDeleteTriggered", "Deleting database and rebuilding..."),
		"Database deleted and rebuilt. Files are being reindexed.": o("toast.dbDeleteSuccess", "Database deleted and rebuilt. Files are being reindexed."),
		"Failed to delete database": o("toast.dbDeleteFailed", "Failed to delete database"),
		"Database backup restored": o("toast.dbRestoreSuccess", "Database backup restored"),
		"Index reset started. Files will be reindexed in the background.": o("toast.resetStarted", "Index reset started. Files will be reindexed in the background."),
		"Failed to reset index": o("toast.resetFailed", "Failed to reset index"),
		"Reset triggered: Reindexing all files...": o("toast.resetTriggered", "Reset triggered: Reindexing all files..."),
		"Reset failed - database is corrupted. Use the \"Delete DB\" button to force-delete and rebuild.": o("toast.resetFailedCorrupt", "Reset failed - database is corrupted. Use the \"Delete DB\" button to force-delete and rebuild."),
		"Scan started": o("toast.scanStarted", "Scan started"),
		"Scan complete": o("toast.scanComplete", "Scan complete"),
		"Scan failed": o("toast.scanFailed", "Scan failed"),
		"Permission denied": o("toast.permissionDenied", "Permission denied"),
		"Language changed. Reload the page for full effect.": o("toast.languageChanged", "Language changed. Reload the page for full effect."),
		"Tag added": o("toast.tagAdded", "Tag added"),
		"Tag removed": o("toast.tagRemoved", "Tag removed"),
		"Rating saved": o("toast.ratingSaved", "Rating saved"),
		"Failed to create collection": o("toast.failedCreateCollection", "Failed to create collection"),
		"Failed to delete collection": o("toast.failedDeleteCollection", "Failed to delete collection")
	};
	if (n[t]) return n[t];
	let r;
	if (r = t.match(/Rating set to (\d+) star(?:s)?/i), r) return o("toast.ratingSetN", "Rating set to {n} stars", { n: Number(r[1]) });
	if (r = t.match(/Downloading (.+?)\.\.\./i), r) return o("toast.downloadingFile", "Downloading {filename}...", { filename: r[1] });
	if (r = t.match(/Playback ([0-9]+(?:\.[0-9]+)?)x/i), r) return o("toast.playbackRate", "Playback {rate}x", { rate: Number(r[1]).toFixed(2) });
	if (r = t.match(/Metadata refreshed(?:\s*(.*))?/i), r) return o("toast.metadataRefreshed", "Metadata refreshed{suffix}", { suffix: r[1] ? " (" + r[1] + ")" : "" });
	if (r = t.match(/Error renaming(?: file)?:\s*(.+)/i), r) return o("toast.errorRenaming", "Error renaming file: {error}", { error: r[1] });
	if (r = t.match(/Error deleting(?: files?| file)?:\s*(.+)/i), r) return o("toast.errorDeleting", "Error deleting file: {error}", { error: r[1] });
	if (r = t.match(/Tag merge failed:\s*(.+)/i), r) return o("toast.tagMergeFailed", "Tag merge failed: {error}", { error: r[1] });
	if (r = t.match(/Delete failed:\s*(.+)/i), r) return o("toast.deleteFailed", "Delete failed: {error}", { error: r[1] });
	if (r = t.match(/Analysis not started:\s*(.+)/i), r) return o("toast.analysisNotStarted", "Analysis not started: {error}", { error: r[1] });
	if (r = t.match(/(\d+)\s+files deleted successfully!/i), r) return o("toast.filesDeletedSuccessN", "{n} files deleted successfully!", { n: Number(r[1]) });
	if (r = t.match(/(\d+)\s+files deleted,\s+(\d+)\s+failed\./i), r) return o("toast.filesDeletedPartial", "{success} files deleted, {failed} failed.", {
		success: Number(r[1]),
		failed: Number(r[2])
	});
	if (r = t.match(/(\d+)\s+files?\s+deleted/i), r) return o("toast.filesDeletedShort", "{n} files deleted", { n: Number(r[1]) });
	if (r = t.match(/(\d+)\s+deleted,\s+(\d+)\s+failed/i), r) return o("toast.filesDeletedShortPartial", "{success} deleted, {failed} failed", {
		success: Number(r[1]),
		failed: Number(r[2])
	});
	if (r = t.match(/^(.+?)\s+copied to clipboard!$/i), r) return o("toast.copiedToClipboardNamed", "{name} copied to clipboard!", { name: r[1] });
	if (r = t.match(/Folder created:\s*(.+)/i), r) return o("toast.folderCreated", "Folder created: {name}", { name: r[1] });
	if (r = t.match(/Failed to create folder:\s*(.+)/i), r) return o("toast.createFolderFailedDetail", "Failed to create folder: {error}", { error: r[1] });
	if (r = t.match(/Failed to rename folder:\s*(.+)/i), r) return o("toast.renameFolderFailedDetail", "Failed to rename folder: {error}", { error: r[1] });
	if (r = t.match(/Failed to move folder:\s*(.+)/i), r) return o("toast.moveFolderFailedDetail", "Failed to move folder: {error}", { error: r[1] });
	if (r = t.match(/Failed to delete folder:\s*(.+)/i), r) return o("toast.deleteFolderFailedDetail", "Failed to delete folder: {error}", { error: r[1] });
	if (r = t.match(/Error removing from collection:\s*(.+)/i), r) return o("toast.removeFromCollectionError", "Error removing from collection: {error}", { error: r[1] });
	if (r = t.match(/^Failed to (.+)$/i), r) {
		let e = r[1].toLowerCase(), t = {
			"add folder": o("toast.failedAddFolder", "Failed to add custom folder"),
			"remove folder": o("toast.failedRemoveFolder", "Failed to remove custom folder"),
			"create collection": o("toast.failedCreateCollection", "Failed to create collection"),
			"delete collection": o("toast.failedDeleteCollection", "Failed to delete collection")
		};
		for (let [n, r] of Object.entries(t)) if (e.includes(n)) return r;
	}
	return t;
}
function F(e, t = "info", n, r) {
	if (t = De(t), e = je(e), n ??= Ae(t), !r?.noHistory) try {
		Se(Oe(e, t, n, r), t, n ?? void 0);
	} catch {}
	let i = !(Number.isFinite(Number(n)) && Number(n) > 0);
	try {
		let r = a();
		if (r && typeof r.add == "function") {
			let a = t;
			a === "warning" && (a = "warn");
			let s = o("manager.title"), c = e;
			if (typeof e == "object" && e?.summary) s = e.summary, c = e.detail || "";
			else if (typeof e != "string") try {
				c = e.message || String(e);
			} catch (e) {
				console.debug?.(e);
			}
			let l = {
				severity: a,
				summary: s,
				detail: c
			};
			i || (l.life = n), r.add(l);
			return;
		}
	} catch (e) {
		console.debug("Majoor: extensionManager.toast failed", e);
	}
	let s = globalThis?.app || (typeof window < "u" ? window?.app : null);
	if (s?.ui?.toast) try {
		return s.ui.toast(e, t);
	} catch (e) {
		console.debug("Native app.ui.toast failed", e);
	}
	console.warn("[Majoor Toast] Native toast API unavailable", {
		type: t,
		message: P(e),
		duration: i ? 0 : n
	});
}
// ui/api/clientAuth.ts
var Me = 2e3, Ne = 15e3, Pe = 8e3, I = "token", L = null, R = null, Fe = null, Ie = "", z = O({
	ttlMs: Me,
	maxSize: 1
});
function Le() {
	return String(Ie || "").trim();
}
function B(e) {
	return Ie = String(e || "").trim(), !0;
}
function Re() {
	try {
		let e = localStorage?.getItem?.(f), t = e ? JSON.parse(e) : {}, n = t && typeof t == "object" ? t : {}, r = n?.data && typeof n.data == "object" ? n.data : n;
		r?.security && typeof r.security == "object" && String(r.security.apiToken || "").trim() && (r.security.apiToken = "", localStorage?.setItem?.(f, JSON.stringify(n)));
	} catch (e) {
		console.debug?.(e);
	}
}
function ze() {
	try {
		z.delete(I);
	} catch (e) {
		console.debug?.(e);
	}
	B(""), Re();
}
function V() {
	let e = z.get(I);
	if (e !== void 0) return e;
	let t = Date.now(), n = Le();
	if (n) return z.set(I, n, { at: t }), n;
	try {
		let e = localStorage?.getItem?.(f), n = e ? JSON.parse(e) : null, r = n?.data && typeof n.data == "object" ? n.data : n, i = String(r?.security?.apiToken || "").trim();
		if (i) {
			B(i);
			try {
				let e = n && typeof n == "object" ? n : {}, t = e?.data && typeof e.data == "object" ? e.data : e;
				t?.security && typeof t.security == "object" && (t.security.apiToken = "", localStorage?.setItem?.(f, JSON.stringify(e)), window?.dispatchEvent?.(new CustomEvent("mjr-settings-changed", { detail: { key: "security.apiToken" } })));
			} catch (e) {
				console.debug?.(e);
			}
		}
		return z.set(I, i, { at: t }), i;
	} catch {
		return z.set(I, "", { at: t }), "";
	}
}
function H(e) {
	let t = String(e || "").trim();
	if (!t) return !1;
	try {
		z.set(I, t), R = null, B(t), Re();
		try {
			window?.dispatchEvent?.(new CustomEvent("mjr-settings-changed", { detail: { key: "security.apiToken" } }));
		} catch (e) {
			console.debug?.(e);
		}
		return !0;
	} catch {
		return !1;
	}
}
var Be = /^[A-Za-z0-9._\-~+/]+=*$/;
function Ve(e) {
	let t = String(e || "").trim();
	return t ? Be.test(t) ? H(t) : (console.debug?.("[MJR auth] Rejected malformed security token (invalid characters)"), !1) : !1;
}
function He() {
	return !!V();
}
function U(e = {}) {
	R = {
		code: String(e?.code || "").trim().toUpperCase(),
		error: String(e?.error || "").trim(),
		status: Number(e?.status || 0) || 0,
		at: Date.now()
	};
}
function Ue() {
	let e = R;
	if (!e) return null;
	let t = Date.now() - (Number(e.at || 0) || 0);
	return t < 0 || t > Ne ? (R = null, null) : e;
}
function We(e) {
	let t = Ue(), n = String(e?.code || "").trim().toUpperCase(), r = String(e?.error || "").trim(), i = String(t?.code || "").trim().toUpperCase(), a = String(t?.error || "").trim().toLowerCase(), s = r.toLowerCase();
	return n === "FORBIDDEN" && (s.includes("api token over insecure transport") || s.includes("allow http token transport")) ? o("toast.writeAuthInsecureTransport", "Write access is blocked because the Majoor API token is being sent over plain HTTP from a remote machine. Use HTTPS, or enable Settings -> Security -> Allow HTTP Token Transport for a trusted LAN.") : i === "FORBIDDEN" && (a.includes("already configured") || a.includes("rotate-token")) ? o("toast.writeAuthConfiguredTokenRequired", "Write access requires the Majoor API token already configured on the server. Open Settings -> Security -> API Token and enter the matching token.") : i === "AUTH_REQUIRED" && (a.includes("sign in to comfyui") || a.includes("authenticated comfyui user")) ? o("toast.writeAuthSignInRequired", "Write access is blocked. Sign in to ComfyUI first, then retry so Majoor can bootstrap the remote session token automatically.") : i === "BOOTSTRAP_DISABLED" || i === "AUTH_REQUIRED" && a.includes("bootstrap") || n === "AUTH_REQUIRED" && s.includes("api token") ? o("toast.writeAuthBootstrapHelp", "Write access is blocked. Sign in to ComfyUI and retry so Majoor can bootstrap the remote session automatically, or set a Majoor API token in Settings -> Security.") : "";
}
function Ge(e) {
	let t = String(e || "").trim();
	if (!t) return;
	let n = Date.now(), r = Fe;
	if (!(r && r.message === t && n - (Number(r.at || 0) || 0) < Pe)) {
		Fe = {
			message: t,
			at: n
		};
		try {
			F({
				summary: o("toast.writeAuthTitle", "Majoor remote write access"),
				detail: t
			}, "warning", 6500, { noHistory: !0 });
		} catch (e) {
			console.debug?.(e);
		}
	}
}
function Ke(e) {
	let t = String(e?.code || "").trim().toUpperCase(), n = String(e?.error || "").trim().toLowerCase(), r = t === "FORBIDDEN" && n.includes("write operation blocked");
	if (t !== "AUTH_REQUIRED" && !r) return e;
	let i = We(e);
	return i ? (Ge(i), {
		...e,
		error: i
	}) : e;
}
async function qe() {
	try {
		let e = await fetch("/mjr/am/settings/security/bootstrap-token", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				"X-Requested-With": "XMLHttpRequest"
			},
			body: "{}"
		});
		if (!(e.headers.get("content-type") || "").includes("application/json")) return U({
			code: "INVALID_RESPONSE",
			error: `Bootstrap token request returned non-JSON response (${e.status})`,
			status: e.status
		}), {
			ok: !1,
			token: !1
		};
		let t = await e.json().catch((e) => (console.debug?.("[MJR auth] JSON parse error:", e), null));
		if (!t || typeof t != "object") return U({
			code: "INVALID_RESPONSE",
			error: "Bootstrap token response was invalid.",
			status: e.status
		}), {
			ok: !1,
			token: !1
		};
		if (!t.ok) return U({
			code: t?.code,
			error: t?.error,
			status: e.status
		}), {
			ok: !1,
			token: !1
		};
		let n = String(t?.data?.token || "").trim();
		return n ? {
			ok: H(n),
			token: !0
		} : (R = null, {
			ok: !0,
			token: !1
		});
	} catch (e) {
		return U({
			code: "NETWORK_ERROR",
			error: e?.message || "Bootstrap token request failed.",
			status: 0
		}), {
			ok: !1,
			token: !1
		};
	}
}
async function Je({ force: e = !1, allowCookieRefresh: t = !1 } = {}) {
	let n = V();
	if (n && !e) return n;
	let r = {
		ok: !1,
		token: !1
	};
	L ||= (async () => {
		try {
			return await qe();
		} finally {
			L = null;
		}
	})();
	try {
		r = await L || r;
	} catch (e) {
		console.debug?.(e);
	}
	if (e && r?.ok && !r?.token && n) ze();
	else if (e && !r?.ok) {
		let e = Ue(), t = String(e?.code || "").trim().toUpperCase();
		t && ["NETWORK_ERROR", "INVALID_RESPONSE"].includes(t) || ze();
	}
	let i = V();
	return !i && t && r?.ok ? !0 : i;
}
function Ye() {
	z.clear();
}
// ui/api/clientOps.ts
async function Xe(e) {
	return !e || typeof e != "string" ? {
		ok: !1,
		error: "Missing mode",
		code: "INVALID_INPUT"
	} : Y("/mjr/am/settings/probe-backend", { mode: e });
}
async function Ze() {
	return J(l.SETTINGS_METADATA_FALLBACK);
}
async function Qe({ image: e, media: t } = {}) {
	return Y(l.SETTINGS_METADATA_FALLBACK, {
		image: e,
		media: t
	});
}
async function $e() {
	return J(l.SETTINGS_VECTOR_SEARCH);
}
async function et(e = !0) {
	if (e && typeof e == "object") {
		let t = {};
		return "enabled" in e && (t.enabled = !!e.enabled), "caption_on_index" in e && (t.caption_on_index = !!e.caption_on_index), "captionOnIndex" in e && (t.caption_on_index = !!e.captionOnIndex), "index_on_scan" in e && (t.index_on_scan = !!e.index_on_scan), "indexOnScan" in e && (t.index_on_scan = !!e.indexOnScan), "unload_after_use" in e && (t.unload_after_use = !!e.unload_after_use), "unloadAfterUse" in e && (t.unload_after_use = !!e.unloadAfterUse), "concurrency" in e && (t.concurrency = Number(e.concurrency) || 1), "vectorConcurrency" in e && (t.concurrency = Number(e.vectorConcurrency) || 1), Y(l.SETTINGS_VECTOR_SEARCH, t);
	}
	return Y(l.SETTINGS_VECTOR_SEARCH, { enabled: !!e });
}
async function tt() {
	return Y(l.SETTINGS_VECTOR_SEARCH_UNLOAD, {});
}
async function nt() {
	return J(l.SETTINGS_EXECUTION_GROUPING);
}
async function rt(e = !0) {
	return Y(l.SETTINGS_EXECUTION_GROUPING, { enabled: !!e });
}
async function it(e = !0) {
	return Y(l.SETTINGS_BROWSER_SHOW_FOLDERS, { enabled: !!e });
}
async function at() {
	return J(l.SETTINGS_HUGGINGFACE);
}
async function ot(e = "") {
	return Y(l.SETTINGS_HUGGINGFACE, { token: String(e ?? "").trim() });
}
async function st() {
	return J(l.SETTINGS_AI_LOGGING);
}
async function ct(e = !1) {
	return Y(l.SETTINGS_AI_LOGGING, { enabled: !!e });
}
async function lt() {
	return J(l.SETTINGS_ROUTE_LOGGING);
}
async function ut(e = !1) {
	return Y(l.SETTINGS_ROUTE_LOGGING, { enabled: !!e });
}
async function dt() {
	return J(l.SETTINGS_STARTUP_LOGGING);
}
async function ft(e = !1) {
	return Y(l.SETTINGS_STARTUP_LOGGING, { enabled: !!e });
}
async function pt() {
	return J(l.SETTINGS_LTXAV_RGB_FALLBACK);
}
async function mt(e = !1) {
	return Y(l.SETTINGS_LTXAV_RGB_FALLBACK, { enabled: !!e });
}
async function ht() {
	return J(l.SETTINGS_JXL);
}
async function gt(e = !1) {
	return Y(l.SETTINGS_JXL, { enabled: !!e });
}
async function _t() {
	return J(l.SETTINGS_OUTPUT_DIRECTORY);
}
async function vt() {
	return J(l.SETTINGS_INPUT_DIRECTORY);
}
async function yt(e, t = {}) {
	let n = String(e ?? "").trim();
	return Y(l.SETTINGS_INPUT_DIRECTORY, { input_directory: n }, t);
}
async function bt(e, t = {}) {
	let n = String(e ?? "").trim();
	return Y(l.SETTINGS_OUTPUT_DIRECTORY, { output_directory: n }, t);
}
async function xt() {
	return J(l.SETTINGS_INDEX_DIRECTORY);
}
async function St(e, t = {}) {
	let n = String(e ?? "").trim();
	return Y(l.SETTINGS_INDEX_DIRECTORY, { index_directory: n }, t);
}
async function Ct(e = {}) {
	return J(l.SETTINGS_WORKFLOW_ROOTS, e);
}
async function wt(e, t = {}) {
	let n = Array.isArray(e) ? e.map((e) => String(e ?? "").trim()).filter(Boolean) : String(e ?? "").trim();
	return Y(l.SETTINGS_WORKFLOW_ROOTS, { workflow_roots: n }, t);
}
async function Tt() {
	return J("/mjr/am/settings/security");
}
async function Et(e) {
	return Y("/mjr/am/settings/security", e && typeof e == "object" ? e : {});
}
async function Dt() {
	let e = await Y("/mjr/am/settings/security/bootstrap-token", {});
	if (e?.ok) try {
		let t = String(e?.data?.token || "").trim();
		t && H(t);
	} catch (e) {
		console.debug?.(e);
	}
	return e;
}
async function Ot(e) {
	if (e && typeof e == "object") {
		let n = String(e.filepath || e.path || e?.file_info?.filepath || "").trim();
		return n ? Y("/mjr/am/open-in-folder", { filepath: n }) : Y("/mjr/am/open-in-folder", { asset_id: t(e.id) });
	}
	return Y("/mjr/am/open-in-folder", { asset_id: t(e) });
}
async function kt(e) {
	let t = "";
	return t = e && typeof e == "object" ? String(e.filepath || e.path || e?.file_info?.filepath || "").trim() : String(e || "").trim(), t ? Y(l.COLLECT_FILES, { filepath: t }) : {
		ok: !1,
		data: null,
		error: "Missing file path",
		code: "INVALID_INPUT"
	};
}
async function At({ op: e = "", path: t = "", name: n = "", destination: r = "", recursive: i = !0 } = {}, a = {}) {
	let o = {
		op: String(e || "").trim().toLowerCase(),
		path: String(t || "").trim()
	};
	return n != null && String(n).trim() && (o.name = String(n).trim()), r != null && String(r).trim() && (o.destination = String(r).trim()), o.op === "delete" && (o.recursive = !!i), Y(l.BROWSER_FOLDER_OP, o, a);
}
async function jt(e = {}) {
	let t = (e, t) => e == null ? t : !!e, n = String(e.scope || "output").trim().toLowerCase() || "output", r = e.customRootId ?? e.custom_root_id ?? e.rootId ?? e.root_id ?? e.customRoot ?? null, i = {
		scope: n,
		reindex: t(e.reindex, !0),
		hard_reset_db: t(e.hardResetDb ?? e.hard_reset_db ?? e.deleteDbFiles ?? e.delete_db_files ?? e.deleteDb ?? e.delete_db ?? void 0, n === "all"),
		clear_scan_journal: t(e.clearScanJournal ?? e.clear_scan_journal, !0),
		clear_metadata_cache: t(e.clearMetadataCache ?? e.clear_metadata_cache, !0),
		clear_asset_metadata: t(e.clearAssetMetadata ?? e.clear_asset_metadata, !0),
		clear_assets: t(e.clearAssets ?? e.clear_assets, !0),
		preserve_vectors: t(e.preserveVectors ?? e.preserve_vectors ?? e.keepVectors ?? e.keep_vectors, !1),
		rebuild_fts: t(e.rebuildFts ?? e.rebuild_fts, !0),
		incremental: t(e.incremental, !1),
		fast: t(e.fast, !0),
		background_metadata: t(e.backgroundMetadata ?? e.background_metadata, !0),
		maintenance_force: t(e.maintenanceForce ?? e.maintenance_force, !1)
	};
	return r && (i.custom_root_id = String(r)), Y(l.INDEX_RESET, i);
}
async function Mt({ scope: e = "output", customRootId: t = "" } = {}) {
	let n = String(e || "output").trim().toLowerCase() || "output", r = String(t || "").trim(), i = { scope: n };
	return r && (i.custom_root_id = r), Y(l.WATCHER_SCOPE, i);
}
async function Nt(e = {}) {
	return J(l.WATCHER_STATUS, e);
}
async function Pt(e = !0) {
	return Y(l.WATCHER_TOGGLE, { enabled: !!e });
}
async function Ft() {
	return J(l.WATCHER_SETTINGS);
}
async function It(e = {}) {
	return Y(l.WATCHER_SETTINGS, e);
}
async function Lt(e = {}) {
	return J(l.TOOLS_STATUS, e);
}
async function Rt(e = {}) {
	return J(l.STATUS, e);
}
async function zt() {
	return Y("/mjr/am/db/force-delete", {});
}
async function Bt(e = {}) {
	return J(l.DB_BACKUPS, e);
}
async function Vt() {
	return Y(l.DB_BACKUP_SAVE, {});
}
async function Ht({ name: e = "", useLatest: t = !1 } = {}) {
	let n = {};
	return e && (n.name = String(e)), t && (n.use_latest = !0), Y(l.DB_BACKUP_RESTORE, n);
}
async function Ut() {
	return J(l.TRASH);
}
async function Wt() {
	return Y(l.TRASH_EMPTY, {});
}
async function Gt(e = 250) {
	return Y("/mjr/am/duplicates/analyze", { limit: Math.max(10, Math.min(5e3, Number(e) || 250)) });
}
async function Kt({ scope: e = "output", customRootId: t = "", maxGroups: n = 6, maxPairs: r = 10 } = {}, i = {}) {
	let a = `/mjr/am/duplicates/alerts?scope=${encodeURIComponent(String(e || "output"))}`;
	return t && (a += `&custom_root_id=${encodeURIComponent(String(t))}`), a += `&max_groups=${encodeURIComponent(String(Math.max(1, Number(n) || 6)))}`, a += `&max_pairs=${encodeURIComponent(String(Math.max(1, Number(r) || 10)))}`, J(a, i);
}
async function qt(e, t = []) {
	return Y("/mjr/am/duplicates/merge-tags", {
		keep_asset_id: Number(e) || 0,
		merge_asset_ids: Array.isArray(t) ? t.map((e) => Number(e) || 0).filter((e) => e > 0) : []
	});
}
async function Jt(e) {
	let n, r;
	if (e && typeof e == "object") {
		n = t(e.id);
		let i = String(e.filepath || e.path || e?.file_info?.filepath || "").trim();
		r = n ? { asset_id: n } : { filepath: i };
	} else n = t(e), r = { asset_id: n };
	let i = await Y("/mjr/am/asset/delete", r);
	return i?.ok && n && Xt([n]), i;
}
async function Yt(e) {
	let n = Array.isArray(e) ? e.map((e) => t(e)).filter(Boolean) : [], r = await Y("/mjr/am/assets/delete", { ids: n });
	return r?.ok && Xt(n), r;
}
function Xt(e) {
	try {
		let t = (Array.isArray(e) ? e : [e]).map((e) => String(e || "").trim()).filter(Boolean);
		if (!t.length) return;
		window.dispatchEvent(new CustomEvent("mjr:assets-deleted", { detail: { ids: t } }));
	} catch (e) {
		console.debug?.(e);
	}
}
async function Zt(e, n) {
	let r;
	if (e && typeof e == "object") {
		r = t(e.id);
		let i = String(e.filepath || e.path || e?.file_info?.filepath || "").trim(), a = r ? await Y("/mjr/am/asset/rename", {
			asset_id: r,
			new_name: n
		}) : await Y("/mjr/am/asset/rename", {
			filepath: i,
			new_name: n
		});
		if (a?.ok && r) try {
			let e = await Rn(r);
			e?.ok && e?.data && (a.data = {
				...a.data || {},
				asset: e.data
			});
		} catch (e) {
			console.debug?.(e);
		}
		return a;
	}
	r = t(e);
	let i = await Y("/mjr/am/asset/rename", {
		asset_id: r,
		new_name: n
	});
	if (i?.ok && r) try {
		let e = await Rn(r);
		e?.ok && e?.data && (i.data = {
			...i.data || {},
			asset: e.data
		});
	} catch (e) {
		console.debug?.(e);
	}
	return i;
}
async function Qt() {
	let e = typeof AbortController < "u" ? new AbortController() : null, t = null;
	try {
		return e && (t = setTimeout(() => e.abort(), 1e4)), await J("/mjr/am/collections", e ? { signal: e.signal } : {});
	} finally {
		t && clearTimeout(t);
	}
}
async function $t(e) {
	return Y("/mjr/am/collections", { name: String(e || "").trim() });
}
async function en(e) {
	let t = String(e || "").trim();
	return Y(`/mjr/am/collections/${encodeURIComponent(t)}/delete`, {});
}
async function tn(e, t) {
	let n = String(e || "").trim(), r = Array.isArray(t) ? t : [];
	return Y(`/mjr/am/collections/${encodeURIComponent(n)}/add`, { assets: r });
}
async function nn(e, t) {
	let n = String(e || "").trim(), r = Array.isArray(t) ? t : [];
	return Y(`/mjr/am/collections/${encodeURIComponent(n)}/remove`, { filepaths: r });
}
async function rn(e) {
	let t = String(e || "").trim();
	return J(`/mjr/am/collections/${encodeURIComponent(t)}/assets`);
}
async function an(e, t = 20) {
	let n = String(e || "").trim();
	if (!n) return {
		ok: !1,
		error: "Empty query"
	};
	let r = t && typeof t == "object" ? t : { topK: Number(t) }, i = Math.max(1, Math.min(200, Number(r?.topK ?? 20) || 20)), a = String(r?.scope || "").trim(), o = String(r?.customRootId || "").trim(), c = `${l.VECTOR_SEARCH}?q=${encodeURIComponent(n)}&top_k=${i}`;
	return a && (c += `&scope=${encodeURIComponent(a)}`), o && (c += `&custom_root_id=${encodeURIComponent(o)}`), c = s(c, {
		subfolder: r?.subfolder ?? null,
		kind: r?.kind ?? null,
		hasWorkflow: r?.hasWorkflow ?? null,
		minRating: r?.minRating ?? null,
		minSizeMB: r?.minSizeMB ?? null,
		maxSizeMB: r?.maxSizeMB ?? null,
		minWidth: r?.minWidth ?? null,
		minHeight: r?.minHeight ?? null,
		maxWidth: r?.maxWidth ?? null,
		maxHeight: r?.maxHeight ?? null,
		workflowType: r?.workflowType ?? null,
		workflowId: r?.workflowId ?? null,
		dateRange: r?.dateRange ?? null,
		dateExact: r?.dateExact ?? null
	}), J(c, { timeoutMs: 12e4 });
}
async function on(e, t = 20) {
	let n = String(e || "").trim();
	if (!n) return {
		ok: !1,
		error: "Missing asset ID"
	};
	let r = t && typeof t == "object" ? t : { topK: Number(t) }, i = Math.max(1, Math.min(200, Number(r?.topK ?? 20) || 20)), a = String(r?.scope || "").trim(), o = String(r?.customRootId || "").trim(), s = `${l.VECTOR_SIMILAR}/${encodeURIComponent(n)}?top_k=${i}`;
	return a && (s += `&scope=${encodeURIComponent(a)}`), o && (s += `&custom_root_id=${encodeURIComponent(o)}`), J(s, { dedupeKey: `vec:${n}:${i}:${a}:${o}` });
}
async function sn(e) {
	let t = String(e || "").trim();
	return t ? J(`${l.VECTOR_ALIGNMENT}/${encodeURIComponent(t)}`) : {
		ok: !1,
		error: "Missing asset ID"
	};
}
async function cn(e) {
	let t = String(e || "").trim();
	return t ? Y(`${l.VECTOR_INDEX}/${encodeURIComponent(t)}`, {}) : {
		ok: !1,
		error: "Missing asset ID"
	};
}
async function ln() {
	return J(l.VECTOR_STATS);
}
async function un(e = 64, t = {}) {
	let n = Math.max(1, Math.min(200, e)), r = typeof t?.onProgress == "function" ? t.onProgress : null, i = String(t?.scope || "").trim().toLowerCase(), a = String(t?.customRootId ?? t?.custom_root_id ?? "").trim(), o = `${l.VECTOR_BACKFILL}?batch_size=${n}&async=1`;
	i && (o += `&scope=${encodeURIComponent(i)}`), a && (o += `&custom_root_id=${encodeURIComponent(a)}`);
	let s = await Y(o, {}, { timeoutMs: 3e4 });
	if (!s?.ok) return s;
	let c = s?.data || {}, u = String(c?.status || "").toLowerCase(), d = String(c?.backfill_id || "").trim();
	try {
		r?.(c);
	} catch (e) {
		console.debug?.(e);
	}
	if (!d || ![
		"queued",
		"running",
		"pending"
	].includes(u)) return s;
	let f = Number(t?.pollIntervalMs), p = Number(t?.pollTimeoutMs), m = Number.isFinite(f) ? Math.max(500, Math.min(1e4, Math.floor(f))) : vn, h = Number.isFinite(p) ? Math.max(1e4, Math.min(bn, Math.floor(p))) : yn, g = Date.now(), _ = null;
	for (; Date.now() - g < h;) {
		await C(m);
		let e = await J(`${l.VECTOR_BACKFILL_STATUS}?backfill_id=${encodeURIComponent(d)}`, { timeoutMs: 3e4 });
		if (!e?.ok) {
			_ = e;
			continue;
		}
		let t = e?.data || {}, n = String(t?.status || "").toLowerCase();
		_ = e;
		try {
			r?.(t);
		} catch (e) {
			console.debug?.(e);
		}
		if (n === "succeeded") return {
			ok: !0,
			data: t?.result || {},
			code: null,
			status: 200
		};
		if (n === "failed") return {
			ok: !1,
			error: String(t?.error || "Vector backfill failed"),
			code: String(t?.code || "DB_ERROR"),
			data: t,
			status: 500
		};
	}
	let v = await J(`${l.VECTOR_BACKFILL_STATUS}?backfill_id=${encodeURIComponent(d)}`, { timeoutMs: 3e4 }), y = v?.data || _?.data || {}, b = String(y?.status || "").toLowerCase();
	if (v?.ok && [
		"queued",
		"running",
		"pending"
	].includes(b)) {
		try {
			r?.(y);
		} catch (e) {
			console.debug?.(e);
		}
		return {
			ok: !0,
			code: "PENDING",
			status: 202,
			data: {
				...y,
				pending: !0,
				timed_out: !0,
				poll_timeout_ms: h,
				backfill_id: String(y?.backfill_id || d),
				status: b || "running"
			},
			meta: { pending: !0 }
		};
	}
	return v?.ok && b === "failed" ? {
		ok: !1,
		error: String(y?.error || "Vector backfill failed"),
		code: String(y?.code || "DB_ERROR"),
		data: y,
		status: 500
	} : {
		ok: !1,
		error: `Vector backfill polling timed out after ${h}ms`,
		code: "TIMEOUT",
		data: y || null,
		status: 408
	};
}
async function dn(e) {
	let t = String(e || "").trim();
	return t ? Y(`${l.VECTOR_CAPTION}/${encodeURIComponent(t)}`, {}) : {
		ok: !1,
		error: "Missing asset ID"
	};
}
async function fn(e, { topK: t = 50, scope: n = "output", customRootId: r = "", subfolder: i = null, kind: a = null, hasWorkflow: o = null, minRating: c = null, minSizeMB: u = null, maxSizeMB: d = null, minWidth: f = null, minHeight: p = null, maxWidth: m = null, maxHeight: h = null, workflowType: g = null, workflowId: _ = null, dateRange: v = null, dateExact: y = null } = {}) {
	let b = String(e || "").trim();
	if (!b) return {
		ok: !1,
		error: "Empty query"
	};
	let x = `${l.HYBRID_SEARCH}?q=${encodeURIComponent(b)}&top_k=${Math.max(1, Math.min(200, t))}&scope=${encodeURIComponent(n)}`;
	return r && (x += `&custom_root_id=${encodeURIComponent(r)}`), x = s(x, {
		subfolder: i,
		kind: a,
		hasWorkflow: o,
		minRating: c,
		minSizeMB: u,
		maxSizeMB: d,
		minWidth: f,
		minHeight: p,
		maxWidth: m,
		maxHeight: h,
		workflowType: g,
		workflowId: _,
		dateRange: v,
		dateExact: y
	}), J(x, { timeoutMs: 12e4 });
}
async function pn(e = 8) {
	return Y(l.VECTOR_SUGGEST_COLLECTIONS, { k: Math.max(2, Math.min(20, e)) });
}
// ui/api/client.ts
var mn = 3e4, hn = "__MJR_API_CLIENT__", gn = 2e3, _n = 200, vn = 1e3, yn = 18e5, bn = 432e5, W = "settings", xn = "available-tags", G = O({
	ttlMs: gn,
	maxSize: 1
}), K = O({
	ttlMs: gn,
	maxSize: 1
}), q = O({
	ttlMs: () => Tn(),
	maxSize: 1
}), Sn = /* @__PURE__ */ new Set([
	"1",
	"true",
	"yes",
	"on"
]), Cn = /* @__PURE__ */ new Set([
	"0",
	"false",
	"no",
	"off"
]);
function wn(e, t = !1) {
	if (typeof e == "boolean") return e;
	if (typeof e == "number") return e !== 0;
	if (typeof e == "string") {
		let t = e.trim().toLowerCase();
		if (Sn.has(t)) return !0;
		if (Cn.has(t)) return !1;
	}
	return !!t;
}
function Tn() {
	try {
		let e = localStorage?.getItem?.("mjrSettings") || "{}", t = JSON.parse(e), n = t?.cache?.tagsTTLms ?? t?.cache?.tagsTTL ?? t?.cache?.tags_ttl_ms ?? null, r = Number(n);
		return Number.isFinite(r) ? Math.max(1e3, Math.min(6e5, Math.floor(r))) : mn;
	} catch {
		return mn;
	}
}
function En() {
	G.clear();
}
function Dn() {
	K.clear();
}
function On() {
	q.clear();
}
function kn(e) {
	return String(e ?? "").trim().toLowerCase() || "";
}
function An(e) {
	let t = [], n = /* @__PURE__ */ new Set();
	for (let r of Array.isArray(e) ? e : []) {
		let e = String(r ?? "").trim();
		if (!e) continue;
		let i = kn(e);
		i && !n.has(i) && (n.add(i), t.push(e));
	}
	return t;
}
try {
	let e = typeof window < "u" ? window : null;
	e && !e[hn] && (e[hn] = { initialized: !0 }, e.addEventListener?.("storage", (e) => {
		try {
			e?.key === "mjrSettings" && (En(), Dn(), On(), Ye());
		} catch (e) {
			console.debug?.(e);
		}
	}), e.addEventListener?.("mjr-settings-changed", () => {
		En(), Dn(), On(), Ye();
	}));
} catch (e) {
	console.debug?.(e);
}
var jn = () => {
	let e = G.get(W);
	if (e !== void 0) return e;
	let t = Date.now();
	try {
		let e = localStorage?.getItem?.(f);
		if (!e) return G.set(W, !1, { at: t }), !1;
		let n = !!JSON.parse(e)?.observability?.enabled;
		return G.set(W, n, { at: t }), n;
	} catch {
		return G.set(W, !1, { at: t }), !1;
	}
}, Mn = () => {
	let e = K.get(W);
	if (e !== void 0) return e;
	let t = Date.now();
	try {
		let e = localStorage?.getItem?.(f);
		if (!e) return K.set(W, !0, { at: t }), !0;
		let n = JSON.parse(e)?.ratingTagsSync?.enabled, r = n == null || wn(n, !0);
		return K.set(W, r, { at: t }), r;
	} catch {
		return K.set(W, !0, { at: t }), !0;
	}
}, Nn = ue({
	readObsEnabled: jn,
	readAuthToken: V,
	ensureWriteAuthToken: Je,
	normalizeWriteAuthFailure: Ke
}), Pn = Nn.fetchAPI;
async function J(e, t = {}) {
	return Nn.get(e, t);
}
async function Y(e, t, n = {}) {
	return Nn.post(e, t, n);
}
async function Fn(n, r, i = {}) {
	let a = Mn(), o = n && typeof n == "object" ? n : null, s = o ? o.id : n, c = t(s), l = { rating: Math.max(0, Math.min(5, Number(r) || 0)) };
	return c ? l.asset_id = c : o && (l.filepath = o.filepath || o.path || o?.file_info?.filepath || "", l.type = o.type || "output", l.root_id = e(o)), Pn("/mjr/am/asset/rating", {
		...i,
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			...a ? { "X-MJR-RTSYNC": "on" } : {}
		},
		body: JSON.stringify(l)
	});
}
async function In(n, r, i = {}) {
	let a = Mn(), o = n && typeof n == "object" ? n : null, s = o ? o.id : n, c = t(s), u = String(o?.kind || o?.type || "").trim().toLowerCase() === "workflow", d = String(o?.filepath || o?.path || o?.file_info?.filepath || "").trim(), f = { tags: Array.isArray(r) ? r : [] };
	u && d ? f.filepath = d : c ? f.asset_id = c : o && (f.filepath = o.filepath || o.path || o?.file_info?.filepath || "", f.type = o.type || "output", f.root_id = e(o));
	let p = await Pn(u && d ? l.WORKFLOWS_TAGS : "/mjr/am/asset/tags", {
		...i,
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			...a ? { "X-MJR-RTSYNC": "on" } : {}
		},
		body: JSON.stringify(f)
	});
	return p?.ok && On(), p;
}
async function Ln() {
	let e = q.get(xn);
	if (Array.isArray(e)) return {
		ok: !0,
		data: e,
		error: null,
		code: "OK",
		meta: { cached: !0 }
	};
	let t = await J("/mjr/am/tags");
	if (t?.ok && Array.isArray(t.data)) {
		let e = An(t.data);
		return q.set(xn, e), {
			...t,
			data: e
		};
	}
	return t;
}
async function Rn(e, n = {}) {
	let r = encodeURIComponent(t(e));
	return J(`/mjr/am/asset/${r}`, {
		...n,
		dedupeKey: n?.dedupeKey || `meta:${r}`
	});
}
async function zn(e, n = {}) {
	let r = t(e);
	if (!r) return {
		ok: !1,
		data: null,
		error: "Missing assetId",
		code: "INVALID_INPUT"
	};
	let i = `/mjr/am/viewer/info?asset_id=${encodeURIComponent(r)}`;
	n.refresh && (i += "&refresh=1");
	let { refresh: a, ...o } = n;
	return J(i, o);
}
async function Bn(e, t = {}) {
	let n = Array.isArray(e) ? e : [], r = [];
	for (let e of n) {
		let t = Number(e);
		if (Number.isFinite(t) && (r.push(Math.trunc(t)), r.length >= _n)) break;
	}
	return r.length ? Y("/mjr/am/assets/batch", { asset_ids: r }, t) : {
		ok: !0,
		data: [],
		error: null,
		code: "OK"
	};
}
async function Vn(e, t = {}) {
	let n = i(e);
	return n ? J(n, t) : {
		ok: !1,
		data: null,
		error: "Missing workflow filepath",
		code: "INVALID_INPUT"
	};
}
async function Hn(e, t = {}) {
	let r = n(e);
	return r ? J(r, t) : {
		ok: !1,
		data: null,
		error: "Missing workflow filepath",
		code: "INVALID_INPUT"
	};
}
async function Un(e, t = {}) {
	let n = u(e);
	return n ? J(n, t) : {
		ok: !1,
		data: null,
		error: "Missing workflow filepath",
		code: "INVALID_INPUT"
	};
}
async function Wn(e, t = "", n = {}) {
	let i = r(e, t);
	return i ? J(i, n) : {
		ok: !1,
		data: null,
		error: "Missing workflow filepath",
		code: "INVALID_INPUT"
	};
}
async function Gn({ workflow: e = null, name: t = "", category: n = "", overwrite: r = !1, filepath: i = "", task: a = "", model_family: o = "", provider: s = "", runs_on: c = "", notes: u = "" } = {}, d = {}) {
	return Y(l.WORKFLOWS_SAVE, {
		workflow: e,
		name: t,
		category: n,
		overwrite: r,
		filepath: i,
		task: a,
		model_family: o,
		provider: s,
		runs_on: c,
		notes: u
	}, d);
}
async function Kn({ filepath: e = "", name: t = "" } = {}, n = {}) {
	return Y(l.WORKFLOWS_DUPLICATE, {
		filepath: e,
		name: t
	}, n);
}
async function qn({ filepath: e = "", name: t = "", category: n = "" } = {}, r = {}) {
	return Y(l.WORKFLOWS_MOVE, {
		filepath: e,
		name: t,
		category: n
	}, r);
}
async function Jn({ filepath: e = "" } = {}, t = {}) {
	return Y(l.WORKFLOWS_DELETE, { filepath: e }, t);
}
async function Yn({ filepath: e = "" } = {}, t = {}) {
	return Y(l.WORKFLOWS_MARK_LOADED, { filepath: e }, t);
}
async function Xn({ filepath: e = "", favorite: t = !1 } = {}, n = {}) {
	return Y(l.WORKFLOWS_FAVORITE, {
		filepath: e,
		favorite: !!t
	}, n);
}
async function Zn({ filepath: e = "", task: t = "", model_family: n = "", provider: r = "", runs_on: i = "", notes: a = "" } = {}, o = {}) {
	return Y(l.WORKFLOWS_INFO, {
		filepath: e,
		task: t,
		model_family: n,
		provider: r,
		runs_on: i,
		notes: a
	}, o);
}
async function Qn({ filepath: e = "", limit: t = 12 } = {}, n = {}) {
	let r = Math.max(1, Math.min(50, Number(t) || 12));
	return J(`${l.WORKFLOWS_THUMBNAIL_CANDIDATES}?filepath=${encodeURIComponent(String(e || "").trim())}&limit=${encodeURIComponent(String(r))}`, n);
}
async function $n(e = {}) {
	return J(l.WORKFLOWS_MODEL_FAMILIES, e);
}
async function er({ q: e = "*", limit: t = 100, offset: n = 0, sort: r = "mtime" } = {}, i = {}) {
	let a = Math.max(1, Math.min(500, Number(t) || 100)), o = Math.max(0, Number(n) || 0);
	return J(`${l.LIST}?scope=workflow&q=${encodeURIComponent(String(e || "*"))}&limit=${encodeURIComponent(String(a))}&offset=${encodeURIComponent(String(o))}&sort=${encodeURIComponent(String(r || "mtime"))}`, i);
}
async function tr({ filepath: e = "", source_filepath: t = "" } = {}, n = {}) {
	return Y(l.WORKFLOWS_THUMBNAIL_SET, {
		filepath: e,
		source_filepath: t
	}, n);
}
async function nr({ type: e = "output", filename: t = "", subfolder: n = "", root_id: r = "", rootId: i = "", filepath: a = "" } = {}, o = {}) {
	let s = String(e || "output").trim().toLowerCase() || "output", c = String(t || "").trim(), l = String(n || "").trim(), u = String(r || i || "").trim(), d = String(a || "").trim();
	if (!c) return {
		ok: !1,
		data: null,
		error: "Missing filename",
		code: "INVALID_INPUT"
	};
	let f = `/mjr/am/metadata?type=${encodeURIComponent(s)}&filename=${encodeURIComponent(c)}`;
	return d && (f += `&filepath=${encodeURIComponent(d)}`), l && (f += `&subfolder=${encodeURIComponent(l)}`), u && (f += `&root_id=${encodeURIComponent(u)}`), J(f, o);
}
async function rr({ filepath: e = "", root_id: t = "", subfolder: n = "" } = {}, r = {}) {
	try {
		if (globalThis.__mjrFolderInfoSupported === !1) return {
			ok: !1,
			data: null,
			error: "Folder info endpoint unavailable",
			code: "UNAVAILABLE"
		};
		if (globalThis.__mjrFolderInfoSupported == null) {
			let e = await J("/mjr/am/routes");
			if (e?.ok && Array.isArray(e.data)) {
				let t = e.data.some((e) => String(e?.path || "").trim() === "/mjr/am/folder-info");
				if (globalThis.__mjrFolderInfoSupported = !!t, !t) return {
					ok: !1,
					data: null,
					error: "Folder info endpoint unavailable",
					code: "UNAVAILABLE"
				};
			} else globalThis.__mjrFolderInfoSupported = null;
		}
	} catch (e) {
		console.debug?.(e);
	}
	let i = String(e || "").trim(), a = String(t || "").trim(), o = String(n || "").trim(), s = l.FOLDER_INFO, c = [];
	i ? (c.push(`filepath=${encodeURIComponent(i)}`), c.push("browser_mode=1")) : (a && c.push(`root_id=${encodeURIComponent(a)}`), o && c.push(`subfolder=${encodeURIComponent(o)}`)), c.length && (s += `?${c.join("&")}`);
	let u = await J(s, r);
	try {
		!u?.ok && Number(u?.status || 0) === 404 && (globalThis.__mjrFolderInfoSupported = !1);
	} catch (e) {
		console.debug?.(e);
	}
	return u;
}
// ui/utils/logging.ts
function ir(e, ...t) {
	try {
		c.DEBUG_VERBOSE_ERRORS && console.debug(e, ...t);
	} catch {}
}
function ar(e, t = "Majoor", { showToast: n = !1, toastType: r = "error" } = {}) {
	let i = e?.message || String(e || "Unknown error");
	try {
		c.DEBUG_VERBOSE_ERRORS ? console.error(`[Majoor][${t}]`, i, e) : console.debug(`[Majoor][${t}]`, i);
	} catch (e) {
		console.debug?.(e);
	}
	if (n && c.DEBUG_VERBOSE_ERRORS) try {
		F(`${t}: ${i}`, r, 4e3);
	} catch (e) {
		console.debug?.(e);
	}
}
// ui/features/panel/controllers/hotkeysState.ts
var X = {
	suspended: !1,
	scope: null,
	ratingHotkeysActive: !1
};
function or() {
	return X;
}
function sr(e) {
	X.scope = e == null ? null : String(e);
}
function cr() {
	return !!X.suspended;
}
function lr(e) {
	X.ratingHotkeysActive = !!e;
}
// ui/features/viewer/viewerRuntimeHosts.ts
var Z = null, Q = null, ur = ".mjr-viewer-overlay", dr = ".mjr-mfv";
function fr(e) {
	return !!e && typeof e.appendChild == "function";
}
function pr() {
	return typeof document > "u" ? null : document?.body || null;
}
function mr() {
	return typeof document > "u" ? null : document?.body || document?.documentElement || null;
}
function hr(e) {
	return fr(e) ? e === pr() || typeof e?.isConnected != "boolean" || e.isConnected : !1;
}
function gr(e) {
	return fr(e) ? e : null;
}
function $(e) {
	return hr(e) ? e : pr();
}
function _r(e) {
	let t = mr();
	return hr(t) ? t : $(e);
}
function vr(e, t, n = $) {
	let r = [], i = /* @__PURE__ */ new Set();
	for (let a of [
		n(t),
		pr(),
		t
	]) {
		if (!a || i.has(a)) continue;
		i.add(a);
		let t = [];
		try {
			t = Array.from(a.querySelectorAll?.(e) || []);
		} catch (e) {
			console.debug?.(e);
		}
		for (let e of t) e && !r.includes(e) && r.push(e);
	}
	return r;
}
function yr(e, t, n = $) {
	let r = n(t);
	if (!r) return;
	let i = vr(e, t, n);
	for (let e of i) if (e && e.parentNode !== r) try {
		r.appendChild(e);
	} catch (e) {
		console.debug?.(e);
	}
}
function br(e) {
	return Z = gr(e), yr(ur, Z), () => xr(e);
}
function xr(e) {
	e && Z !== e || (Z = null);
}
function Sr(e) {
	return Q = gr(e), yr(dr, Q, _r), () => Cr(e);
}
function Cr(e) {
	e && Q !== e || (Q = null);
}
function wr(e) {
	let t = $(Z);
	try {
		t?.appendChild?.(e);
	} catch (e) {
		console.debug?.(e);
	}
	return t;
}
function Tr(e) {
	let t = _r(Q);
	try {
		t?.appendChild?.(e);
	} catch (e) {
		console.debug?.(e);
	}
	return t;
}
function Er() {
	return vr(ur, Z);
}
export { vt as $, He as $t, Gn as A, gt as At, kt as B, wt as Bt, $n as C, Vt as Ct, Yn as D, ot as Dt, er as E, rt as Et, In as F, ut as Ft, Wt as G, un as Gt, Jt as H, Pt as Ht, Hn as I, Et as It, rn as J, sn as Jt, zt as K, on as Kt, tn as L, ft as Lt, Zn as M, Qe as Mt, tr as N, bt as Nt, qn as O, St as Ot, Fn as P, Xe as Pt, xt as Q, pn as Qt, Dt as R, et as Rt, Vn as S, Ht as St, Un as T, it as Tt, Yt as U, tt as Ut, $t as V, Gt as Vt, en as W, It as Wt, nt as X, an as Xt, Kt as Y, cn as Yt, at as Z, ln as Zt, Bn as _, qt as _t, br as a, we as an, Rt as at, rr as b, Zt as bt, sr as c, O as cn, Lt as ct, ar as d, Ft as dt, Ve as en, ht as et, Jn as f, Nt as ft, Rn as g, Bt as gt, J as h, Qt as ht, Sr as i, Ee as in, lt as it, Xn as j, mt as jt, Y as k, yt as kt, lr as l, p as ln, Ut as lt, Kn as m, fn as mt, wr as n, ke as nn, Ze as nt, or as o, Ce as on, Tt as ot, Wn as p, Ct as pt, st as q, dn as qt, Er as r, me as rn, _t as rt, cr as s, Te as sn, dt as st, Tr as t, F as tn, pt as tt, ir as u, f as un, $e as ut, Ln as v, Ot as vt, Qn as w, ct as wt, zn as x, jt as xt, nr as y, nn as yt, At as z, Mt as zt };
