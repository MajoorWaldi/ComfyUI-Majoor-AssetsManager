import { C as e, K as t, ct as n, l as r, lt as i, q as a, st as o } from "./config-eqarUfKd.js";
//#region ui/app/settingsStore.ts
var s = "mjrSettings", c = "mjrMinimapSettings", l = new Set([
	"POST",
	"PUT",
	"DELETE",
	"PATCH"
]), u = 2e4, d = 3e5, f = 3, p = 400, m = "/mjr/am/settings/security/bootstrap-token", h = "/mjr/am/", g = /* @__PURE__ */ new Map();
function _(e) {
	return new Promise((t) => setTimeout(t, e));
}
function v(e) {
	return l.has(String(e || "").trim().toUpperCase());
}
function y(e) {
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
function b(e) {
	return y(e).startsWith(h);
}
function x(e) {
	return y(e) === m;
}
function ee(e) {
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
function S(e = {}) {
	try {
		let t = Number(e?.timeoutMs);
		return Number.isFinite(t) ? Math.max(1e3, Math.min(d, Math.floor(t))) : u;
	} catch {
		return u;
	}
}
function te(e = {}) {
	let t = e?.signal || null;
	if (typeof AbortController > "u") return {
		signal: t || void 0,
		timeoutMs: S(e),
		cleanup: () => {}
	};
	let n = S(e), r = new AbortController(), i = null, a = () => {
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
function ne(e, t, n = {}) {
	let r = String(e || "GET").trim().toUpperCase(), i = String(t || "").trim();
	return !r || !i ? "" : `${r}:${i}:timeout=${S(n)}`;
}
function re(e, t) {
	let n = String(e || "").trim();
	if (!n) return t();
	if (g.has(n)) return g.get(n);
	let r = Promise.resolve().then(() => t()).finally(() => {
		try {
			g.delete(n);
		} catch (e) {
			console.debug?.(e);
		}
	});
	return g.set(n, r), r;
}
function ie(e, t, n) {
	if (v(t)) try {
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
function ae(e, t) {
	if (t) try {
		e instanceof Headers ? (e.has("X-MJR-Token") || e.set("X-MJR-Token", t), e.has("Authorization") || e.set("Authorization", `Bearer ${t}`)) : ("X-MJR-Token" in e || (e["X-MJR-Token"] = t), "Authorization" in e || (e.Authorization = `Bearer ${t}`));
	} catch (e) {
		console.debug?.(e);
	}
}
async function oe(e, t, n, r, { ensureWriteAuthToken: i, normalizeWriteAuthFailure: a, fetchAPI: o, options: s, retryCount: c }) {
	let l = e.headers.get("content-type") || "";
	if (!l.includes("application/json")) return !r && v(n) && b(t) && !x(t) && Number(e.status || 0) === 401 && await i({
		force: !0,
		allowCookieRefresh: !0
	}) ? await o(t, {
		...s,
		_authRetryDone: !0
	}, c) : {
		ok: !1,
		error: `Server returned non-JSON response (${e.status})`,
		code: "INVALID_RESPONSE",
		status: e.status,
		content_type: l,
		data: null
	};
	let u = await e.json().catch((e) => (console.debug?.("[MJR API] JSON parse error:", e), null));
	if (typeof u != "object" || !u) return {
		ok: !1,
		error: "Invalid response structure",
		code: "INVALID_RESPONSE",
		status: e.status,
		data: null
	};
	if (!("status" in u)) try {
		u.status = e.status;
	} catch (e) {
		console.debug?.(e);
	}
	return !r && v(n) && !x(t) && !u?.ok && (String(u?.code || "").toUpperCase() === "AUTH_REQUIRED" || Number(u?.status || 0) === 401) && await i({
		force: !0,
		allowCookieRefresh: !0
	}) ? await o(t, {
		...s,
		_authRetryDone: !0
	}, c) : (v(n) && b(t) && !x(t) && (u = a(u)), u);
}
function se({ readObsEnabled: e = () => !1, readAuthToken: t = () => "", ensureWriteAuthToken: n = async () => "", normalizeWriteAuthFailure: r = (e) => e, trackApiCall: i = null } = {}) {
	async function a(o, s = {}, c = 0) {
		let l = typeof performance < "u" ? performance.now() : Date.now(), u = te(s), d = null;
		try {
			let i = (s.method || "GET").toUpperCase(), l = !!s?._authRetryDone, f = typeof Headers < "u" ? new Headers(s.headers || {}) : { ...s.headers };
			ie(f, i, !!e());
			let p = t();
			if (!p && v(i) && b(o) && !x(o)) {
				try {
					await n();
				} catch (e) {
					console.debug?.(e);
				}
				p = t();
			}
			ae(f, p);
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
			return d = await oe(await fetch(o, m), o, i, l, {
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
			if (c < f && ee(e)) {
				try {
					await _(p * (c + 1));
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
		return re(t?.dedupe === !1 ? "" : String(t?.dedupeKey || "").trim() || ne("GET", e, t), () => a(e, {
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
//#endregion
//#region ui/utils/ttlCache.ts
function C({ ttlMs: e = 0, maxSize: t = 100, now: n = () => Date.now() } = {}) {
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
		return e ? n > 0 ? t - Number(e.at || 0) > n : !1 : !0;
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
				if (s(o, t, n)) {
					r.delete(e);
					return;
				}
				return o.value;
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
//#endregion
//#region ui/features/panel/messages/toastHistory.ts
var ce = "mjr_toast_history_v1", le = "mjr_toast_history_last_read_v1", ue = 60, de = "mjr:toast-history-changed", w = null;
function T(e) {
	return String(e || "").trim();
}
function fe(e) {
	let t = T(e).toLowerCase();
	return t === "warn" ? "warning" : t === "danger" ? "error" : t || "info";
}
function pe(e) {
	let t = Number(e);
	return Number.isFinite(t) ? t : null;
}
function me(e) {
	if (!e || typeof e != "object") return null;
	let t = Number(e.percent), n = Number.isFinite(t) ? Math.max(0, Math.min(100, Math.round(t))) : null, r = Number(e.current), i = Number(e.total), a = Number.isFinite(r) ? Math.max(0, Math.floor(r)) : null, o = Number.isFinite(i) ? Math.max(0, Math.floor(i)) : null, s = Number(e.indexed), c = Number(e.skipped), l = Number(e.errors), u = Number.isFinite(s) ? Math.max(0, Math.floor(s)) : null, d = Number.isFinite(c) ? Math.max(0, Math.floor(c)) : null, f = Number.isFinite(l) ? Math.max(0, Math.floor(l)) : null, p = T(e.label);
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
function he(e, t, n) {
	return e && t ? `${e}: ${t}` : t || e || n || "";
}
function E(e, t = "info", n = null) {
	if (!e || typeof e != "object") return null;
	let r = T(e.title || e.summary), i = T(e.detail), a = T(e.message || he(r, i, T(e.fallbackMessage)));
	if (!a) return null;
	let s = pe(e.durationMs ?? e.duration ?? n), c = Number(e.createdAt), l = Number.isFinite(c) && c > 0 ? c : Date.now(), u = typeof e.persistent == "boolean" ? e.persistent : !(Number.isFinite(s) && (s ?? 0) > 0);
	return {
		id: T(e.id) || o(`th-${l}-`, 4),
		message: a,
		title: r,
		detail: i,
		type: fe(e.type || t),
		createdAt: l,
		durationMs: s,
		persistent: u,
		source: T(e.source),
		trackId: T(e.trackId),
		status: T(e.status),
		operation: T(e.operation),
		progress: me(e.progress),
		forceStore: !!e.forceStore,
		actionLabel: T(e.actionLabel),
		actionUrl: T(e.actionUrl)
	};
}
function D() {
	if (w === null) try {
		let e = localStorage.getItem(ce), t = e ? JSON.parse(e) : [];
		w = Array.isArray(t) ? t.map((e) => {
			if (e && typeof e == "object") return E(e);
			let t = T(e);
			return t ? E({ message: t }) : null;
		}).filter(Boolean) : [];
	} catch {
		w = [];
	}
}
function O() {
	try {
		localStorage.setItem(ce, JSON.stringify(w));
	} catch {}
}
function k() {
	try {
		window.dispatchEvent(new CustomEvent(de));
	} catch {}
}
function ge() {
	try {
		return Number(localStorage.getItem(le)) || 0;
	} catch {
		return 0;
	}
}
function _e(e) {
	try {
		localStorage.setItem(le, String(Number(e) || 0));
	} catch {}
}
function ve(e, t, n) {
	D();
	let r = E(e && typeof e == "object" ? e : {
		message: T(e),
		type: t,
		durationMs: n
	}, t, n);
	if (!r || !r.forceStore && !r.trackId && r.type === "info" && Number.isFinite(r.durationMs) && r.durationMs != null && r.durationMs > 0 && r.durationMs < 2500) return;
	let i = String(r.trackId || "").trim();
	if (i) {
		let e = w.findIndex((e) => String(e?.trackId || "").trim() === i);
		if (e >= 0) {
			let t = w[e] || {};
			w.splice(e, 1), r.id = String(t.id || r.id || "").trim() || r.id;
		}
	}
	w.unshift(r), w.length > ue && (w = w.slice(0, ue)), O(), k();
}
function ye() {
	return D(), w.map((e) => ({ ...e }));
}
function be() {
	D();
	let e = ge();
	return w.filter((t) => t.createdAt > e).length;
}
function xe() {
	_e(Date.now()), k();
}
function Se() {
	D(), w = [], O(), _e(Date.now()), k();
}
//#endregion
//#region ui/app/toast.ts
function Ce(e) {
	let t = String(e || "info").trim().toLowerCase();
	return t === "warn" ? "warning" : t === "danger" ? "error" : t === "success" || t === "warning" || t === "error" ? t : "info";
}
function A(e) {
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
function j(e, t, n, r) {
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
	return e && typeof e == "object" ? (a.title = String(i?.title || e.summary || "").trim(), a.detail = String(i?.detail || e.detail || e.message || "").trim(), a.message = A(e), a) : (a.title = String(i?.title || "").trim(), a.detail = String(i?.detail || "").trim(), a.message = A(e), a);
}
function we(e, t = "info", n, r) {
	try {
		let i = j(e, t, n, r);
		i.forceStore = !0, ve(i, t, n ?? void 0);
	} catch {}
}
function Te(e) {
	switch (e) {
		case "success": return 2e3;
		case "info": return 3e3;
		case "warning": return 4e3;
		case "error": return 5e3;
		default: return 5e3;
	}
}
function Ee(e) {
	if (typeof e != "string") return e;
	let t = e.trim(), n = {
		"Failed to update rating": r("toast.ratingUpdateFailed", "Failed to update rating"),
		"Error updating rating": r("toast.ratingUpdateError", "Error updating rating"),
		"Rating cleared": r("toast.ratingCleared", "Rating cleared"),
		"Failed to update tags": r("toast.tagsUpdateFailed", "Failed to update tags"),
		"Tags updated": r("toast.tagsUpdated", "Tags updated"),
		"Failed to toggle watcher": r("toast.watcherToggleFailed", "Failed to toggle watcher"),
		"No valid assets selected.": r("toast.noValidAssetsSelected", "No valid assets selected."),
		"Name collision in current view": r("toast.nameCollisionInView", "Name collision in current view"),
		"Failed to create collection.": r("toast.failedCreateCollectionDot", "Failed to create collection."),
		"Failed to add assets to collection.": r("toast.failedAddAssetsToCollection", "Failed to add assets to collection."),
		"Failed to remove from collection.": r("toast.removeFromCollectionFailed", "Failed to remove from collection."),
		"Collection created": r("toast.collectionCreated", "Collection created"),
		"Added to collection": r("toast.addedToCollection", "Added to collection"),
		"Removed from collection": r("toast.removedFromCollection", "Removed from collection"),
		"File renamed successfully!": r("toast.fileRenamedSuccess", "File renamed successfully!"),
		"Failed to rename file": r("toast.fileRenameFailed", "Failed to rename file"),
		"Failed to rename file.": r("toast.fileRenameFailed", "Failed to rename file."),
		"File deleted successfully!": r("toast.fileDeletedSuccess", "File deleted successfully!"),
		"Failed to delete file.": r("toast.fileDeleteFailed", "Failed to delete file."),
		"Failed to delete file. ": r("toast.fileDeleteFailed", "Failed to delete file."),
		"File deleted": r("toast.deleted", "File deleted"),
		"File renamed": r("toast.renamed", "File renamed"),
		"Folder created": r("toast.folderCreated", "Folder created"),
		"Folder renamed": r("toast.folderRenamed", "Folder renamed"),
		"Folder moved": r("toast.folderMoved", "Folder moved"),
		"Folder deleted": r("toast.folderDeleted", "Folder deleted"),
		"Failed to create folder": r("toast.createFolderFailed", "Failed to create folder"),
		"Failed to rename folder": r("toast.renameFolderFailed", "Failed to rename folder"),
		"Failed to move folder": r("toast.moveFolderFailed", "Failed to move folder"),
		"Failed to delete folder": r("toast.deleteFolderFailed", "Failed to delete folder"),
		"Failed to pin folder": r("toast.pinFolderFailed", "Failed to pin folder"),
		"Failed to unpin folder": r("toast.unpinFolderFailed", "Failed to unpin folder"),
		"Folder pinned as browser root": r("toast.folderPinnedAsBrowserRoot", "Folder pinned as browser root"),
		"Folder added": r("toast.folderAdded", "Folder added"),
		"Folder removed": r("toast.folderRemoved", "Folder removed"),
		"Folder linked successfully": r("toast.folderLinked", "Folder linked successfully"),
		"An error occurred while adding the custom folder": r("toast.errorAddingFolder", "An error occurred while adding the custom folder"),
		"An error occurred while removing the custom folder": r("toast.errorRemovingFolder", "An error occurred while removing the custom folder"),
		"Failed to add custom folder": r("toast.failedAddFolder", "Failed to add custom folder"),
		"Failed to remove custom folder": r("toast.failedRemoveFolder", "Failed to remove custom folder"),
		"Native folder browser unavailable. Please enter path manually.": r("toast.nativeBrowserUnavailable", "Native folder browser unavailable. Please enter path manually."),
		"Opened in folder": r("toast.openedInFolder", "Opened in folder"),
		"Failed to open folder": r("toast.openFolderFailed", "Failed to open folder"),
		"Failed to open folder.": r("toast.openFolderFailed", "Failed to open folder."),
		"File path copied to clipboard": r("toast.pathCopied", "File path copied to clipboard"),
		"Failed to copy path": r("toast.pathCopyFailed", "Failed to copy path"),
		"Failed to copy to clipboard": r("toast.copyClipboardFailed", "Failed to copy to clipboard"),
		"No file path available for this asset.": r("toast.noFilePath", "No file path available for this asset."),
		"Failed to refresh metadata.": r("toast.metadataRefreshFailed", "Failed to refresh metadata."),
		"Metadata refreshed": r("toast.metadataRefreshed", "Metadata refreshed"),
		"Duplicate analysis started": r("toast.dupAnalysisStarted", "Duplicate analysis started"),
		"Tags merged": r("toast.tagsMerged", "Tags merged"),
		"Duplicates deleted": r("toast.duplicatesDeleted", "Duplicates deleted"),
		"Rescanning file...": r("toast.rescanningFile", "Rescanning file..."),
		"Metadata enrichment complete": r("toast.enrichmentComplete", "Metadata enrichment complete"),
		"Playback speed is available for video media only": r("toast.playbackVideoOnly", "Playback speed is available for video media only"),
		"DB backup saved": r("toast.dbSaveSuccess", "DB backup saved"),
		"Failed to save DB backup": r("toast.dbSaveFailed", "Failed to save DB backup"),
		"DB restore started": r("toast.dbRestoreStarted", "DB restore started"),
		"Failed to restore DB backup": r("toast.dbRestoreFailed", "Failed to restore DB backup"),
		"Select a DB backup first": r("toast.dbRestoreSelect", "Select a DB backup first"),
		"Stopping running workers": r("toast.dbRestoreStopping", "Stopping running workers"),
		"Unlocking and resetting database": r("toast.dbRestoreResetting", "Unlocking and resetting database"),
		"Recreating database": r("toast.dbRestoreReplacing", "Recreating database"),
		"Replacing database files": r("toast.dbRestoreReplacing", "Replacing database files"),
		"Restarting scan": r("toast.dbRestoreRescan", "Restarting scan"),
		"Deleting database and rebuilding...": r("toast.dbDeleteTriggered", "Deleting database and rebuilding..."),
		"Database deleted and rebuilt. Files are being reindexed.": r("toast.dbDeleteSuccess", "Database deleted and rebuilt. Files are being reindexed."),
		"Failed to delete database": r("toast.dbDeleteFailed", "Failed to delete database"),
		"Database backup restored": r("toast.dbRestoreSuccess", "Database backup restored"),
		"Index reset started. Files will be reindexed in the background.": r("toast.resetStarted", "Index reset started. Files will be reindexed in the background."),
		"Failed to reset index": r("toast.resetFailed", "Failed to reset index"),
		"Reset triggered: Reindexing all files...": r("toast.resetTriggered", "Reset triggered: Reindexing all files..."),
		"Reset failed - database is corrupted. Use the \"Delete DB\" button to force-delete and rebuild.": r("toast.resetFailedCorrupt", "Reset failed - database is corrupted. Use the \"Delete DB\" button to force-delete and rebuild."),
		"Scan started": r("toast.scanStarted", "Scan started"),
		"Scan complete": r("toast.scanComplete", "Scan complete"),
		"Scan failed": r("toast.scanFailed", "Scan failed"),
		"Permission denied": r("toast.permissionDenied", "Permission denied"),
		"Language changed. Reload the page for full effect.": r("toast.languageChanged", "Language changed. Reload the page for full effect."),
		"Tag added": r("toast.tagAdded", "Tag added"),
		"Tag removed": r("toast.tagRemoved", "Tag removed"),
		"Rating saved": r("toast.ratingSaved", "Rating saved"),
		"Failed to create collection": r("toast.failedCreateCollection", "Failed to create collection"),
		"Failed to delete collection": r("toast.failedDeleteCollection", "Failed to delete collection")
	};
	if (n[t]) return n[t];
	let i;
	if (i = t.match(/Rating set to (\d+) star(?:s)?/i), i) return r("toast.ratingSetN", "Rating set to {n} stars", { n: Number(i[1]) });
	if (i = t.match(/Downloading (.+?)\.\.\./i), i) return r("toast.downloadingFile", "Downloading {filename}...", { filename: i[1] });
	if (i = t.match(/Playback ([0-9]+(?:\.[0-9]+)?)x/i), i) return r("toast.playbackRate", "Playback {rate}x", { rate: Number(i[1]).toFixed(2) });
	if (i = t.match(/Metadata refreshed(?:\s*(.*))?/i), i) return r("toast.metadataRefreshed", "Metadata refreshed{suffix}", { suffix: i[1] ? " (" + i[1] + ")" : "" });
	if (i = t.match(/Error renaming(?: file)?:\s*(.+)/i), i) return r("toast.errorRenaming", "Error renaming file: {error}", { error: i[1] });
	if (i = t.match(/Error deleting(?: files?| file)?:\s*(.+)/i), i) return r("toast.errorDeleting", "Error deleting file: {error}", { error: i[1] });
	if (i = t.match(/Tag merge failed:\s*(.+)/i), i) return r("toast.tagMergeFailed", "Tag merge failed: {error}", { error: i[1] });
	if (i = t.match(/Delete failed:\s*(.+)/i), i) return r("toast.deleteFailed", "Delete failed: {error}", { error: i[1] });
	if (i = t.match(/Analysis not started:\s*(.+)/i), i) return r("toast.analysisNotStarted", "Analysis not started: {error}", { error: i[1] });
	if (i = t.match(/(\d+)\s+files deleted successfully!/i), i) return r("toast.filesDeletedSuccessN", "{n} files deleted successfully!", { n: Number(i[1]) });
	if (i = t.match(/(\d+)\s+files deleted,\s+(\d+)\s+failed\./i), i) return r("toast.filesDeletedPartial", "{success} files deleted, {failed} failed.", {
		success: Number(i[1]),
		failed: Number(i[2])
	});
	if (i = t.match(/(\d+)\s+files?\s+deleted/i), i) return r("toast.filesDeletedShort", "{n} files deleted", { n: Number(i[1]) });
	if (i = t.match(/(\d+)\s+deleted,\s+(\d+)\s+failed/i), i) return r("toast.filesDeletedShortPartial", "{success} deleted, {failed} failed", {
		success: Number(i[1]),
		failed: Number(i[2])
	});
	if (i = t.match(/^(.+?)\s+copied to clipboard!$/i), i) return r("toast.copiedToClipboardNamed", "{name} copied to clipboard!", { name: i[1] });
	if (i = t.match(/Folder created:\s*(.+)/i), i) return r("toast.folderCreated", "Folder created: {name}", { name: i[1] });
	if (i = t.match(/Failed to create folder:\s*(.+)/i), i) return r("toast.createFolderFailedDetail", "Failed to create folder: {error}", { error: i[1] });
	if (i = t.match(/Failed to rename folder:\s*(.+)/i), i) return r("toast.renameFolderFailedDetail", "Failed to rename folder: {error}", { error: i[1] });
	if (i = t.match(/Failed to move folder:\s*(.+)/i), i) return r("toast.moveFolderFailedDetail", "Failed to move folder: {error}", { error: i[1] });
	if (i = t.match(/Failed to delete folder:\s*(.+)/i), i) return r("toast.deleteFolderFailedDetail", "Failed to delete folder: {error}", { error: i[1] });
	if (i = t.match(/Error removing from collection:\s*(.+)/i), i) return r("toast.removeFromCollectionError", "Error removing from collection: {error}", { error: i[1] });
	if (i = t.match(/^Failed to (.+)$/i), i) {
		let e = i[1].toLowerCase(), t = {
			"add folder": r("toast.failedAddFolder", "Failed to add custom folder"),
			"remove folder": r("toast.failedRemoveFolder", "Failed to remove custom folder"),
			"create collection": r("toast.failedCreateCollection", "Failed to create collection"),
			"delete collection": r("toast.failedDeleteCollection", "Failed to delete collection")
		};
		for (let [n, r] of Object.entries(t)) if (e.includes(n)) return r;
	}
	return t;
}
function M(t, n = "info", i, a) {
	if (n = Ce(n), t = Ee(t), i ??= Te(n), !a?.noHistory) try {
		ve(j(t, n, i, a), n, i ?? void 0);
	} catch {}
	let o = !(Number.isFinite(Number(i)) && Number(i) > 0);
	try {
		let a = e();
		if (a && typeof a.add == "function") {
			let e = n;
			e === "warning" && (e = "warn");
			let s = r("manager.title"), c = t;
			if (typeof t == "object" && t?.summary) s = t.summary, c = t.detail || "";
			else if (typeof t != "string") try {
				c = t.message || String(t);
			} catch (e) {
				console.debug?.(e);
			}
			let l = {
				severity: e,
				summary: s,
				detail: c
			};
			o || (l.life = i), a.add(l);
			return;
		}
	} catch (e) {
		console.debug("Majoor: extensionManager.toast failed", e);
	}
	let s = globalThis?.app || (typeof window < "u" ? window?.app : null);
	if (s?.ui?.toast) try {
		return s.ui.toast(t, n);
	} catch (e) {
		console.debug("Native app.ui.toast failed", e);
	}
	console.warn("[Majoor Toast] Native toast API unavailable", {
		type: n,
		message: A(t),
		duration: o ? 0 : i
	});
}
//#endregion
//#region ui/api/clientAuth.ts
var De = 2e3, Oe = 15e3, ke = 8e3, N = "__mjr_write_token", P = "token", F = null, I = null, Ae = null, L = C({
	ttlMs: De,
	maxSize: 1
});
function je() {
	try {
		return String(sessionStorage?.getItem?.(N) || "").trim();
	} catch {
		return "";
	}
}
function R(e) {
	let t = String(e || "").trim();
	try {
		return t ? sessionStorage?.setItem?.(N, t) : sessionStorage?.removeItem?.(N), !0;
	} catch {
		return !1;
	}
}
function z() {
	try {
		let e = localStorage?.getItem?.(s), t = e ? JSON.parse(e) : {}, n = t && typeof t == "object" ? t : {}, r = n?.data && typeof n.data == "object" ? n.data : n;
		r?.security && typeof r.security == "object" && String(r.security.apiToken || "").trim() && (r.security.apiToken = "", localStorage?.setItem?.(s, JSON.stringify(n)));
	} catch (e) {
		console.debug?.(e);
	}
}
function B() {
	try {
		L.delete(P);
	} catch (e) {
		console.debug?.(e);
	}
	R(""), z();
}
function V() {
	let e = L.get(P);
	if (e !== void 0) return e;
	let t = Date.now(), n = je();
	if (n) return L.set(P, n, { at: t }), n;
	try {
		let e = localStorage?.getItem?.(s), n = e ? JSON.parse(e) : null, r = n?.data && typeof n.data == "object" ? n.data : n, i = String(r?.security?.apiToken || "").trim();
		if (i) {
			R(i);
			try {
				let e = n && typeof n == "object" ? n : {}, t = e?.data && typeof e.data == "object" ? e.data : e;
				t?.security && typeof t.security == "object" && (t.security.apiToken = "", localStorage?.setItem?.(s, JSON.stringify(e)), window?.dispatchEvent?.(new CustomEvent("mjr-settings-changed", { detail: { key: "security.apiToken" } })));
			} catch (e) {
				console.debug?.(e);
			}
		}
		return L.set(P, i, { at: t }), i;
	} catch {
		return L.set(P, "", { at: t }), "";
	}
}
function H(e) {
	let t = String(e || "").trim();
	if (!t) return !1;
	try {
		L.set(P, t), I = null, R(t), z();
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
var Me = /^[A-Za-z0-9._\-~+/]+=*$/;
function Ne(e) {
	let t = String(e || "").trim();
	return t ? Me.test(t) ? H(t) : (console.debug?.("[MJR auth] Rejected malformed security token (invalid characters)"), !1) : !1;
}
function U(e = {}) {
	I = {
		code: String(e?.code || "").trim().toUpperCase(),
		error: String(e?.error || "").trim(),
		status: Number(e?.status || 0) || 0,
		at: Date.now()
	};
}
function W() {
	let e = I;
	if (!e) return null;
	let t = Date.now() - (Number(e.at || 0) || 0);
	return t < 0 || t > Oe ? (I = null, null) : e;
}
function Pe(e) {
	let t = W(), n = String(e?.code || "").trim().toUpperCase(), i = String(e?.error || "").trim(), a = String(t?.code || "").trim().toUpperCase(), o = String(t?.error || "").trim().toLowerCase(), s = i.toLowerCase();
	return a === "FORBIDDEN" && (o.includes("already configured") || o.includes("rotate-token")) ? r("toast.writeAuthConfiguredTokenRequired", "Write access requires the Majoor API token already configured on the server. Open Settings -> Security -> API Token and enter the matching token.") : a === "AUTH_REQUIRED" && (o.includes("sign in to comfyui") || o.includes("authenticated comfyui user")) ? r("toast.writeAuthSignInRequired", "Write access is blocked. Sign in to ComfyUI first, then retry so Majoor can bootstrap the remote session token automatically.") : a === "BOOTSTRAP_DISABLED" || a === "AUTH_REQUIRED" && o.includes("bootstrap") || n === "AUTH_REQUIRED" && s.includes("api token") ? r("toast.writeAuthBootstrapHelp", "Write access is blocked. Sign in to ComfyUI and retry so Majoor can bootstrap the remote session automatically, or set a Majoor API token in Settings -> Security.") : "";
}
function Fe(e) {
	let t = String(e || "").trim();
	if (!t) return;
	let n = Date.now(), i = Ae;
	if (!(i && i.message === t && n - (Number(i.at || 0) || 0) < ke)) {
		Ae = {
			message: t,
			at: n
		};
		try {
			M({
				summary: r("toast.writeAuthTitle", "Majoor remote write access"),
				detail: t
			}, "warning", 6500, { noHistory: !0 });
		} catch (e) {
			console.debug?.(e);
		}
	}
}
function Ie(e) {
	let t = String(e?.code || "").trim().toUpperCase(), n = String(e?.error || "").trim().toLowerCase(), r = t === "FORBIDDEN" && n.includes("write operation blocked");
	if (t !== "AUTH_REQUIRED" && !r) return e;
	let i = Pe(e);
	return i ? (Fe(i), {
		...e,
		error: i
	}) : e;
}
async function Le() {
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
		} : (I = null, {
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
async function Re({ force: e = !1, allowCookieRefresh: t = !1 } = {}) {
	let n = V();
	if (n && !e) return n;
	let r = {
		ok: !1,
		token: !1
	};
	F ||= (async () => {
		try {
			return await Le();
		} finally {
			F = null;
		}
	})();
	try {
		r = await F || r;
	} catch (e) {
		console.debug?.(e);
	}
	if (e && r?.ok && !r?.token && n) B();
	else if (e && !r?.ok) {
		let e = W(), t = String(e?.code || "").trim().toUpperCase();
		(!t || !["NETWORK_ERROR", "INVALID_RESPONSE"].includes(t)) && B();
	}
	let i = V();
	return !i && t && r?.ok ? !0 : i;
}
function ze() {
	L.clear();
}
//#endregion
//#region ui/api/clientOps.ts
async function Be(e) {
	return !e || typeof e != "string" ? {
		ok: !1,
		error: "Missing mode",
		code: "INVALID_INPUT"
	} : Q("/mjr/am/settings/probe-backend", { mode: e });
}
async function Ve() {
	return Z(t.SETTINGS_METADATA_FALLBACK);
}
async function He({ image: e, media: n } = {}) {
	return Q(t.SETTINGS_METADATA_FALLBACK, {
		image: e,
		media: n
	});
}
async function Ue() {
	return Z(t.SETTINGS_VECTOR_SEARCH);
}
async function We(e = !0) {
	if (e && typeof e == "object") {
		let n = {};
		return "enabled" in e && (n.enabled = !!e.enabled), "caption_on_index" in e && (n.caption_on_index = !!e.caption_on_index), "captionOnIndex" in e && (n.caption_on_index = !!e.captionOnIndex), Q(t.SETTINGS_VECTOR_SEARCH, n);
	}
	return Q(t.SETTINGS_VECTOR_SEARCH, { enabled: !!e });
}
async function Ge() {
	return Z(t.SETTINGS_EXECUTION_GROUPING);
}
async function Ke(e = !0) {
	return Q(t.SETTINGS_EXECUTION_GROUPING, { enabled: !!e });
}
async function qe() {
	return Z(t.SETTINGS_HUGGINGFACE);
}
async function Je(e = "") {
	return Q(t.SETTINGS_HUGGINGFACE, { token: String(e ?? "").trim() });
}
async function Ye() {
	return Z(t.SETTINGS_AI_LOGGING);
}
async function Xe(e = !1) {
	return Q(t.SETTINGS_AI_LOGGING, { enabled: !!e });
}
async function Ze() {
	return Z(t.SETTINGS_ROUTE_LOGGING);
}
async function Qe(e = !1) {
	return Q(t.SETTINGS_ROUTE_LOGGING, { enabled: !!e });
}
async function $e() {
	return Z(t.SETTINGS_STARTUP_LOGGING);
}
async function et(e = !1) {
	return Q(t.SETTINGS_STARTUP_LOGGING, { enabled: !!e });
}
async function tt() {
	return Z(t.SETTINGS_LTXAV_RGB_FALLBACK);
}
async function nt(e = !1) {
	return Q(t.SETTINGS_LTXAV_RGB_FALLBACK, { enabled: !!e });
}
async function rt() {
	return Z(t.SETTINGS_OUTPUT_DIRECTORY);
}
async function it(e, n = {}) {
	let r = String(e ?? "").trim();
	return Q(t.SETTINGS_OUTPUT_DIRECTORY, { output_directory: r }, n);
}
async function at() {
	return Z(t.SETTINGS_INDEX_DIRECTORY);
}
async function ot(e, n = {}) {
	let r = String(e ?? "").trim();
	return Q(t.SETTINGS_INDEX_DIRECTORY, { index_directory: r }, n);
}
async function st() {
	return Z("/mjr/am/settings/security");
}
async function ct(e) {
	return Q("/mjr/am/settings/security", e && typeof e == "object" ? e : {});
}
async function lt() {
	let e = await Q("/mjr/am/settings/security/bootstrap-token", {});
	if (e?.ok) try {
		let t = String(e?.data?.token || "").trim();
		t && H(t);
	} catch (e) {
		console.debug?.(e);
	}
	return e;
}
async function ut(e) {
	if (e && typeof e == "object") {
		let t = String(e.filepath || e.path || e?.file_info?.filepath || "").trim();
		return e.id == null ? Q("/mjr/am/open-in-folder", { filepath: t }) : Q("/mjr/am/open-in-folder", { asset_id: n(e.id) });
	}
	return Q("/mjr/am/open-in-folder", { asset_id: n(e) });
}
async function dt({ op: e = "", path: n = "", name: r = "", destination: i = "", recursive: a = !0 } = {}, o = {}) {
	let s = {
		op: String(e || "").trim().toLowerCase(),
		path: String(n || "").trim()
	};
	return r != null && String(r).trim() && (s.name = String(r).trim()), i != null && String(i).trim() && (s.destination = String(i).trim()), s.op === "delete" && (s.recursive = !!a), Q(t.BROWSER_FOLDER_OP, s, o);
}
async function ft(e = {}) {
	let n = (e, t) => e == null ? t : !!e, r = String(e.scope || "output").trim().toLowerCase() || "output", i = e.customRootId ?? e.custom_root_id ?? e.rootId ?? e.root_id ?? e.customRoot ?? null, a = {
		scope: r,
		reindex: n(e.reindex, !0),
		hard_reset_db: n(e.hardResetDb ?? e.hard_reset_db ?? e.deleteDbFiles ?? e.delete_db_files ?? e.deleteDb ?? e.delete_db ?? void 0, r === "all"),
		clear_scan_journal: n(e.clearScanJournal ?? e.clear_scan_journal, !0),
		clear_metadata_cache: n(e.clearMetadataCache ?? e.clear_metadata_cache, !0),
		clear_asset_metadata: n(e.clearAssetMetadata ?? e.clear_asset_metadata, !0),
		clear_assets: n(e.clearAssets ?? e.clear_assets, !0),
		preserve_vectors: n(e.preserveVectors ?? e.preserve_vectors ?? e.keepVectors ?? e.keep_vectors, !1),
		rebuild_fts: n(e.rebuildFts ?? e.rebuild_fts, !0),
		incremental: n(e.incremental, !1),
		fast: n(e.fast, !0),
		background_metadata: n(e.backgroundMetadata ?? e.background_metadata, !0),
		maintenance_force: n(e.maintenanceForce ?? e.maintenance_force, !1)
	};
	return i && (a.custom_root_id = String(i)), Q(t.INDEX_RESET, a);
}
async function pt({ scope: e = "output", customRootId: n = "" } = {}) {
	let r = String(e || "output").trim().toLowerCase() || "output", i = String(n || "").trim(), a = { scope: r };
	return i && (a.custom_root_id = i), Q(t.WATCHER_SCOPE, a);
}
async function mt(e = {}) {
	return Z(t.WATCHER_STATUS, e);
}
async function ht(e = !0) {
	return Q(t.WATCHER_TOGGLE, { enabled: !!e });
}
async function gt() {
	return Z(t.WATCHER_SETTINGS);
}
async function _t(e = {}) {
	return Q(t.WATCHER_SETTINGS, e);
}
async function vt(e = {}) {
	return Z(t.TOOLS_STATUS, e);
}
async function yt(e = {}) {
	return Z(t.STATUS, e);
}
async function bt() {
	return Q("/mjr/am/db/force-delete", {});
}
async function xt(e = {}) {
	return Z(t.DB_BACKUPS, e);
}
async function St() {
	return Q(t.DB_BACKUP_SAVE, {});
}
async function Ct({ name: e = "", useLatest: n = !1 } = {}) {
	let r = {};
	return e && (r.name = String(e)), n && (r.use_latest = !0), Q(t.DB_BACKUP_RESTORE, r);
}
async function wt(e = 250) {
	return Q("/mjr/am/duplicates/analyze", { limit: Math.max(10, Math.min(5e3, Number(e) || 250)) });
}
async function Tt({ scope: e = "output", customRootId: t = "", maxGroups: n = 6, maxPairs: r = 10 } = {}, i = {}) {
	let a = `/mjr/am/duplicates/alerts?scope=${encodeURIComponent(String(e || "output"))}`;
	return t && (a += `&custom_root_id=${encodeURIComponent(String(t))}`), a += `&max_groups=${encodeURIComponent(String(Math.max(1, Number(n) || 6)))}`, a += `&max_pairs=${encodeURIComponent(String(Math.max(1, Number(r) || 10)))}`, Z(a, i);
}
async function Et(e, t = []) {
	return Q("/mjr/am/duplicates/merge-tags", {
		keep_asset_id: Number(e) || 0,
		merge_asset_ids: Array.isArray(t) ? t.map((e) => Number(e) || 0).filter((e) => e > 0) : []
	});
}
async function Dt(e) {
	let t, r;
	if (e && typeof e == "object") {
		t = n(e.id);
		let i = String(e.filepath || e.path || e?.file_info?.filepath || "").trim();
		r = t ? { asset_id: t } : { filepath: i };
	} else t = n(e), r = { asset_id: t };
	let i = await Q("/mjr/am/asset/delete", r);
	return i?.ok && t && kt([t]), i;
}
async function Ot(e) {
	let t = Array.isArray(e) ? e.map((e) => n(e)).filter(Boolean) : [], r = await Q("/mjr/am/assets/delete", { ids: t });
	return r?.ok && kt(t), r;
}
function kt(e) {
	try {
		let t = (Array.isArray(e) ? e : [e]).map((e) => String(e || "").trim()).filter(Boolean);
		if (!t.length) return;
		window.dispatchEvent(new CustomEvent("mjr:assets-deleted", { detail: { ids: t } }));
	} catch (e) {
		console.debug?.(e);
	}
}
async function At(e, t) {
	let r;
	if (e && typeof e == "object") {
		r = n(e.id);
		let i = String(e.filepath || e.path || e?.file_info?.filepath || "").trim(), a = r ? await Q("/mjr/am/asset/rename", {
			asset_id: r,
			new_name: t
		}) : await Q("/mjr/am/asset/rename", {
			filepath: i,
			new_name: t
		});
		if (a?.ok && r) try {
			let e = await $(r);
			e?.ok && e?.data && (a.data = {
				...a.data || {},
				asset: e.data
			});
		} catch (e) {
			console.debug?.(e);
		}
		return a;
	}
	r = n(e);
	let i = await Q("/mjr/am/asset/rename", {
		asset_id: r,
		new_name: t
	});
	if (i?.ok && r) try {
		let e = await $(r);
		e?.ok && e?.data && (i.data = {
			...i.data || {},
			asset: e.data
		});
	} catch (e) {
		console.debug?.(e);
	}
	return i;
}
async function jt() {
	let e = typeof AbortController < "u" ? new AbortController() : null, t = null;
	try {
		return e && (t = setTimeout(() => e.abort(), 1e4)), await Z("/mjr/am/collections", e ? { signal: e.signal } : {});
	} finally {
		t && clearTimeout(t);
	}
}
async function Mt(e) {
	return Q("/mjr/am/collections", { name: String(e || "").trim() });
}
async function Nt(e) {
	let t = String(e || "").trim();
	return Q(`/mjr/am/collections/${encodeURIComponent(t)}/delete`, {});
}
async function Pt(e, t) {
	let n = String(e || "").trim(), r = Array.isArray(t) ? t : [];
	return Q(`/mjr/am/collections/${encodeURIComponent(n)}/add`, { assets: r });
}
async function Ft(e, t) {
	let n = String(e || "").trim(), r = Array.isArray(t) ? t : [];
	return Q(`/mjr/am/collections/${encodeURIComponent(n)}/remove`, { filepaths: r });
}
async function It(e) {
	let t = String(e || "").trim();
	return Z(`/mjr/am/collections/${encodeURIComponent(t)}/assets`);
}
async function Lt(e, n = 20) {
	let r = String(e || "").trim();
	if (!r) return {
		ok: !1,
		error: "Empty query"
	};
	let i = n && typeof n == "object" ? n : { topK: Number(n) }, o = Math.max(1, Math.min(200, Number(i?.topK ?? 20) || 20)), s = String(i?.scope || "").trim(), c = String(i?.customRootId || "").trim(), l = `${t.VECTOR_SEARCH}?q=${encodeURIComponent(r)}&top_k=${o}`;
	return s && (l += `&scope=${encodeURIComponent(s)}`), c && (l += `&custom_root_id=${encodeURIComponent(c)}`), l = a(l, {
		subfolder: i?.subfolder ?? null,
		kind: i?.kind ?? null,
		hasWorkflow: i?.hasWorkflow ?? null,
		minRating: i?.minRating ?? null,
		minSizeMB: i?.minSizeMB ?? null,
		maxSizeMB: i?.maxSizeMB ?? null,
		minWidth: i?.minWidth ?? null,
		minHeight: i?.minHeight ?? null,
		maxWidth: i?.maxWidth ?? null,
		maxHeight: i?.maxHeight ?? null,
		workflowType: i?.workflowType ?? null,
		workflowId: i?.workflowId ?? null,
		dateRange: i?.dateRange ?? null,
		dateExact: i?.dateExact ?? null
	}), Z(l, { timeoutMs: 12e4 });
}
async function Rt(e, n = 20) {
	let r = String(e || "").trim();
	if (!r) return {
		ok: !1,
		error: "Missing asset ID"
	};
	let i = n && typeof n == "object" ? n : { topK: Number(n) }, a = Math.max(1, Math.min(200, Number(i?.topK ?? 20) || 20)), o = String(i?.scope || "").trim(), s = String(i?.customRootId || "").trim(), c = `${t.VECTOR_SIMILAR}/${encodeURIComponent(r)}?top_k=${a}`;
	return o && (c += `&scope=${encodeURIComponent(o)}`), s && (c += `&custom_root_id=${encodeURIComponent(s)}`), Z(c, { dedupeKey: `vec:${r}:${a}:${o}:${s}` });
}
async function zt(e) {
	let n = String(e || "").trim();
	return n ? Z(`${t.VECTOR_ALIGNMENT}/${encodeURIComponent(n)}`) : {
		ok: !1,
		error: "Missing asset ID"
	};
}
async function Bt(e) {
	let n = String(e || "").trim();
	return n ? Q(`${t.VECTOR_INDEX}/${encodeURIComponent(n)}`, {}) : {
		ok: !1,
		error: "Missing asset ID"
	};
}
async function Vt() {
	return Z(t.VECTOR_STATS);
}
async function Ht(e = 64, n = {}) {
	let r = Math.max(1, Math.min(200, e)), i = typeof n?.onProgress == "function" ? n.onProgress : null, a = String(n?.scope || "").trim().toLowerCase(), o = String(n?.customRootId ?? n?.custom_root_id ?? "").trim(), s = `${t.VECTOR_BACKFILL}?batch_size=${r}&async=1`;
	a && (s += `&scope=${encodeURIComponent(a)}`), o && (s += `&custom_root_id=${encodeURIComponent(o)}`);
	let c = await Q(s, {}, { timeoutMs: 3e4 });
	if (!c?.ok) return c;
	let l = c?.data || {}, u = String(l?.status || "").toLowerCase(), d = String(l?.backfill_id || "").trim();
	try {
		i?.(l);
	} catch (e) {
		console.debug?.(e);
	}
	if (!d || ![
		"queued",
		"running",
		"pending"
	].includes(u)) return c;
	let f = Number(n?.pollIntervalMs), p = Number(n?.pollTimeoutMs), m = Number.isFinite(f) ? Math.max(500, Math.min(1e4, Math.floor(f))) : Xt, h = Number.isFinite(p) ? Math.max(1e4, Math.min(Qt, Math.floor(p))) : Zt, g = Date.now(), v = null;
	for (; Date.now() - g < h;) {
		await _(m);
		let e = await Z(`${t.VECTOR_BACKFILL_STATUS}?backfill_id=${encodeURIComponent(d)}`, { timeoutMs: 3e4 });
		if (!e?.ok) {
			v = e;
			continue;
		}
		let n = e?.data || {}, r = String(n?.status || "").toLowerCase();
		v = e;
		try {
			i?.(n);
		} catch (e) {
			console.debug?.(e);
		}
		if (r === "succeeded") return {
			ok: !0,
			data: n?.result || {},
			code: null,
			status: 200
		};
		if (r === "failed") return {
			ok: !1,
			error: String(n?.error || "Vector backfill failed"),
			code: String(n?.code || "DB_ERROR"),
			data: n,
			status: 500
		};
	}
	let y = await Z(`${t.VECTOR_BACKFILL_STATUS}?backfill_id=${encodeURIComponent(d)}`, { timeoutMs: 3e4 }), b = y?.data || v?.data || {}, x = String(b?.status || "").toLowerCase();
	if (y?.ok && [
		"queued",
		"running",
		"pending"
	].includes(x)) {
		try {
			i?.(b);
		} catch (e) {
			console.debug?.(e);
		}
		return {
			ok: !0,
			code: "PENDING",
			status: 202,
			data: {
				...b,
				pending: !0,
				timed_out: !0,
				poll_timeout_ms: h,
				backfill_id: String(b?.backfill_id || d),
				status: x || "running"
			},
			meta: { pending: !0 }
		};
	}
	return y?.ok && x === "failed" ? {
		ok: !1,
		error: String(b?.error || "Vector backfill failed"),
		code: String(b?.code || "DB_ERROR"),
		data: b,
		status: 500
	} : {
		ok: !1,
		error: `Vector backfill polling timed out after ${h}ms`,
		code: "TIMEOUT",
		data: b || null,
		status: 408
	};
}
async function Ut(e) {
	let n = String(e || "").trim();
	return n ? Q(`${t.VECTOR_CAPTION}/${encodeURIComponent(n)}`, {}) : {
		ok: !1,
		error: "Missing asset ID"
	};
}
async function Wt(e, { topK: n = 50, scope: r = "output", customRootId: i = "", subfolder: o = null, kind: s = null, hasWorkflow: c = null, minRating: l = null, minSizeMB: u = null, maxSizeMB: d = null, minWidth: f = null, minHeight: p = null, maxWidth: m = null, maxHeight: h = null, workflowType: g = null, workflowId: _ = null, dateRange: v = null, dateExact: y = null } = {}) {
	let b = String(e || "").trim();
	if (!b) return {
		ok: !1,
		error: "Empty query"
	};
	let x = `${t.HYBRID_SEARCH}?q=${encodeURIComponent(b)}&top_k=${Math.max(1, Math.min(200, n))}&scope=${encodeURIComponent(r)}`;
	return i && (x += `&custom_root_id=${encodeURIComponent(i)}`), x = a(x, {
		subfolder: o,
		kind: s,
		hasWorkflow: c,
		minRating: l,
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
	}), Z(x, { timeoutMs: 12e4 });
}
async function Gt(e = 8) {
	return Q(t.VECTOR_SUGGEST_COLLECTIONS, { k: Math.max(2, Math.min(20, e)) });
}
//#endregion
//#region ui/api/client.ts
var Kt = 3e4, qt = "__MJR_API_CLIENT__", Jt = 2e3, Yt = 200, Xt = 1e3, Zt = 30 * 6e4, Qt = 720 * 6e4, G = "settings", $t = "available-tags", K = C({
	ttlMs: Jt,
	maxSize: 1
}), q = C({
	ttlMs: Jt,
	maxSize: 1
}), J = C({
	ttlMs: () => rn(),
	maxSize: 1
}), en = new Set([
	"1",
	"true",
	"yes",
	"on"
]), tn = new Set([
	"0",
	"false",
	"no",
	"off"
]);
function nn(e, t = !1) {
	if (typeof e == "boolean") return e;
	if (typeof e == "number") return e !== 0;
	if (typeof e == "string") {
		let t = e.trim().toLowerCase();
		if (en.has(t)) return !0;
		if (tn.has(t)) return !1;
	}
	return !!t;
}
function rn() {
	try {
		let e = localStorage?.getItem?.("mjrSettings") || "{}", t = JSON.parse(e), n = t?.cache?.tagsTTLms ?? t?.cache?.tagsTTL ?? t?.cache?.tags_ttl_ms ?? null, r = Number(n);
		return Number.isFinite(r) ? Math.max(1e3, Math.min(10 * 6e4, Math.floor(r))) : Kt;
	} catch {
		return Kt;
	}
}
function an() {
	K.clear();
}
function on() {
	q.clear();
}
function Y() {
	J.clear();
}
function sn(e) {
	return String(e ?? "").trim().toLowerCase() || "";
}
function cn(e) {
	let t = [], n = /* @__PURE__ */ new Set();
	for (let r of Array.isArray(e) ? e : []) {
		let e = String(r ?? "").trim();
		if (!e) continue;
		let i = sn(e);
		!i || n.has(i) || (n.add(i), t.push(e));
	}
	return t;
}
try {
	let e = typeof window < "u" ? window : null;
	e && !e[qt] && (e[qt] = { initialized: !0 }, e.addEventListener?.("storage", (e) => {
		try {
			e?.key === "mjrSettings" && (an(), on(), Y(), ze());
		} catch (e) {
			console.debug?.(e);
		}
	}), e.addEventListener?.("mjr-settings-changed", () => {
		an(), on(), Y(), ze();
	}));
} catch (e) {
	console.debug?.(e);
}
var ln = () => {
	let e = K.get(G);
	if (e !== void 0) return e;
	let t = Date.now();
	try {
		let e = localStorage?.getItem?.(s);
		if (!e) return K.set(G, !1, { at: t }), !1;
		let n = !!JSON.parse(e)?.observability?.enabled;
		return K.set(G, n, { at: t }), n;
	} catch {
		return K.set(G, !1, { at: t }), !1;
	}
}, un = () => {
	let e = q.get(G);
	if (e !== void 0) return e;
	let t = Date.now();
	try {
		let e = localStorage?.getItem?.(s);
		if (!e) return q.set(G, !0, { at: t }), !0;
		let n = JSON.parse(e)?.ratingTagsSync?.enabled, r = n == null ? !0 : nn(n, !0);
		return q.set(G, r, { at: t }), r;
	} catch {
		return q.set(G, !0, { at: t }), !0;
	}
}, X = se({
	readObsEnabled: ln,
	readAuthToken: V,
	ensureWriteAuthToken: Re,
	normalizeWriteAuthFailure: Ie
}), dn = X.fetchAPI;
async function Z(e, t = {}) {
	return X.get(e, t);
}
async function Q(e, t, n = {}) {
	return X.post(e, t, n);
}
async function fn(e, t, r = {}) {
	let a = un(), o = e && typeof e == "object" ? e : null, s = n(o ? o.id : e), c = { rating: Math.max(0, Math.min(5, Number(t) || 0)) };
	return s ? c.asset_id = s : o && (c.filepath = o.filepath || o.path || o?.file_info?.filepath || "", c.type = o.type || "output", c.root_id = i(o)), dn("/mjr/am/asset/rating", {
		...r,
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			...a ? { "X-MJR-RTSYNC": "on" } : {}
		},
		body: JSON.stringify(c)
	});
}
async function pn(e, t, r = {}) {
	let a = un(), o = e && typeof e == "object" ? e : null, s = n(o ? o.id : e), c = { tags: Array.isArray(t) ? t : [] };
	s ? c.asset_id = s : o && (c.filepath = o.filepath || o.path || o?.file_info?.filepath || "", c.type = o.type || "output", c.root_id = i(o));
	let l = await dn("/mjr/am/asset/tags", {
		...r,
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			...a ? { "X-MJR-RTSYNC": "on" } : {}
		},
		body: JSON.stringify(c)
	});
	return l?.ok && Y(), l;
}
async function mn() {
	let e = J.get($t);
	if (Array.isArray(e)) return {
		ok: !0,
		data: e,
		error: null,
		code: "OK",
		meta: { cached: !0 }
	};
	let t = await Z("/mjr/am/tags");
	if (t?.ok && Array.isArray(t.data)) {
		let e = cn(t.data);
		return J.set($t, e), {
			...t,
			data: e
		};
	}
	return t;
}
async function $(e, t = {}) {
	let r = encodeURIComponent(n(e));
	return Z(`/mjr/am/asset/${r}`, {
		...t,
		dedupeKey: t?.dedupeKey || `meta:${r}`
	});
}
async function hn(e, t = {}) {
	let r = n(e);
	if (!r) return {
		ok: !1,
		data: null,
		error: "Missing assetId",
		code: "INVALID_INPUT"
	};
	let i = `/mjr/am/viewer/info?asset_id=${encodeURIComponent(r)}`;
	t.refresh && (i += "&refresh=1");
	let { refresh: a, ...o } = t;
	return Z(i, o);
}
async function gn(e, t = {}) {
	let n = Array.isArray(e) ? e : [], r = [];
	for (let e of n) {
		let t = Number(e);
		if (Number.isFinite(t) && (r.push(Math.trunc(t)), r.length >= Yt)) break;
	}
	return r.length ? Q("/mjr/am/assets/batch", { asset_ids: r }, t) : {
		ok: !0,
		data: [],
		error: null,
		code: "OK"
	};
}
async function _n({ type: e = "output", filename: t = "", subfolder: n = "", root_id: r = "", rootId: i = "", filepath: a = "" } = {}, o = {}) {
	let s = String(e || "output").trim().toLowerCase() || "output", c = String(t || "").trim(), l = String(n || "").trim(), u = String(r || i || "").trim(), d = String(a || "").trim();
	if (!c) return {
		ok: !1,
		data: null,
		error: "Missing filename",
		code: "INVALID_INPUT"
	};
	let f = `/mjr/am/metadata?type=${encodeURIComponent(s)}&filename=${encodeURIComponent(c)}`;
	return d && (f += `&filepath=${encodeURIComponent(d)}`), l && (f += `&subfolder=${encodeURIComponent(l)}`), u && (f += `&root_id=${encodeURIComponent(u)}`), Z(f, o);
}
async function vn({ filepath: e = "", root_id: n = "", subfolder: r = "" } = {}, i = {}) {
	try {
		if (globalThis.__mjrFolderInfoSupported === !1) return {
			ok: !1,
			data: null,
			error: "Folder info endpoint unavailable",
			code: "UNAVAILABLE"
		};
		if (globalThis.__mjrFolderInfoSupported == null) {
			let e = await Z("/mjr/am/routes");
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
	let a = String(e || "").trim(), o = String(n || "").trim(), s = String(r || "").trim(), c = t.FOLDER_INFO, l = [];
	a ? (l.push(`filepath=${encodeURIComponent(a)}`), l.push("browser_mode=1")) : (o && l.push(`root_id=${encodeURIComponent(o)}`), s && l.push(`subfolder=${encodeURIComponent(s)}`)), l.length && (c += `?${l.join("&")}`);
	let u = await Z(c, i);
	try {
		!u?.ok && Number(u?.status || 0) === 404 && (globalThis.__mjrFolderInfoSupported = !1);
	} catch (e) {
		console.debug?.(e);
	}
	return u;
}
//#endregion
export { Be as $, st as A, ut as B, qe as C, xe as Ct, rt as D, Ve as E, s as Et, mt as F, St as G, At as H, Wt as I, Je as J, Xe as K, jt as L, vt as M, Ue as N, Ze as O, gt as P, it as Q, xt as R, Ge as S, ye as St, tt as T, c as Tt, ft as U, Ft as V, Ct as W, nt as X, ot as Y, He as Z, Nt as _, M as _t, _n as a, wt as at, It as b, Se as bt, Q as c, Ht as ct, Pt as d, zt as dt, Qe as et, lt as f, Bt as ft, Ot as g, Ne as gt, Dt as h, Gt as ht, mn as i, pt as it, $e as j, yt as k, fn as l, Rt as lt, Mt as m, Vt as mt, $ as n, et as nt, vn as o, ht as ot, dt as p, Lt as pt, Ke as q, gn as r, We as rt, hn as s, _t as st, Z as t, ct as tt, pn as u, Ut as ut, bt as v, we as vt, at as w, C as wt, Tt as x, be as xt, Ye as y, de as yt, Et as z };
