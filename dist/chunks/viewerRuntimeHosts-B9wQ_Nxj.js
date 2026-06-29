import { bt as e, ht as t, k as n, m as r, nt as i, o as a, tt as o, vt as s, yt as c } from "./events-BpkKbGZs.js";
//#region ui/app/settingsStore.ts
var l = "mjrSettings", u = "mjrMinimapSettings", d = new Set([
	"POST",
	"PUT",
	"DELETE",
	"PATCH"
]), f = 2e4, p = 3e5, m = 3, h = 400, g = "/mjr/am/settings/security/bootstrap-token", _ = "/mjr/am/", v = /* @__PURE__ */ new Map();
function y(e) {
	return new Promise((t) => setTimeout(t, e));
}
function b(e) {
	return d.has(String(e || "").trim().toUpperCase());
}
function x(e) {
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
function S(e) {
	return x(e).startsWith(_);
}
function C(e) {
	return x(e) === g;
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
function w(e = {}) {
	try {
		let t = Number(e?.timeoutMs);
		return Number.isFinite(t) ? Math.max(1e3, Math.min(p, Math.floor(t))) : f;
	} catch {
		return f;
	}
}
function te(e = {}) {
	let t = e?.signal || null;
	if (typeof AbortController > "u") return {
		signal: t || void 0,
		timeoutMs: w(e),
		cleanup: () => {}
	};
	let n = w(e), r = new AbortController(), i = null, a = () => {
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
	return !r || !i ? "" : `${r}:${i}:timeout=${w(n)}`;
}
function re(e, t) {
	let n = String(e || "").trim();
	if (!n) return t();
	if (v.has(n)) return v.get(n);
	let r = Promise.resolve().then(() => t()).finally(() => {
		try {
			v.delete(n);
		} catch (e) {
			console.debug?.(e);
		}
	});
	return v.set(n, r), r;
}
function ie(e, t, n) {
	if (b(t)) try {
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
	if (!l.includes("application/json")) return !r && b(n) && S(t) && !C(t) && Number(e.status || 0) === 401 && await i({
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
	return !r && b(n) && !C(t) && !u?.ok && (String(u?.code || "").toUpperCase() === "AUTH_REQUIRED" || Number(u?.status || 0) === 401) && await i({
		force: !0,
		allowCookieRefresh: !0
	}) ? await o(t, {
		...s,
		_authRetryDone: !0
	}, c) : (b(n) && S(t) && !C(t) && (u = a(u)), u);
}
function se({ readObsEnabled: e = () => !1, readAuthToken: t = () => "", ensureWriteAuthToken: n = async () => "", normalizeWriteAuthFailure: r = (e) => e, trackApiCall: i = null } = {}) {
	async function a(o, s = {}, c = 0) {
		let l = typeof performance < "u" ? performance.now() : Date.now(), u = te(s), d = null;
		try {
			let i = (s.method || "GET").toUpperCase(), l = !!s?._authRetryDone, f = typeof Headers < "u" ? new Headers(s.headers || {}) : { ...s.headers };
			ie(f, i, !!e());
			let p = t();
			if (!p && b(i) && S(o) && !C(o)) {
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
			if (c < m && ee(e)) {
				try {
					await y(h * (c + 1));
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
function T({ ttlMs: e = 0, maxSize: t = 100, now: n = () => Date.now() } = {}) {
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
var ce = "mjr_toast_history_v1", le = "mjr_toast_history_last_read_v1", ue = 60, de = "mjr:toast-history-changed", E = null;
function D(e) {
	return String(e || "").trim();
}
function fe(e) {
	let t = D(e).toLowerCase();
	return t === "warn" ? "warning" : t === "danger" ? "error" : t || "info";
}
function pe(e) {
	let t = Number(e);
	return Number.isFinite(t) ? t : null;
}
function me(e) {
	if (!e || typeof e != "object") return null;
	let t = Number(e.percent), n = Number.isFinite(t) ? Math.max(0, Math.min(100, Math.round(t))) : null, r = Number(e.current), i = Number(e.total), a = Number.isFinite(r) ? Math.max(0, Math.floor(r)) : null, o = Number.isFinite(i) ? Math.max(0, Math.floor(i)) : null, s = Number(e.indexed), c = Number(e.skipped), l = Number(e.errors), u = Number.isFinite(s) ? Math.max(0, Math.floor(s)) : null, d = Number.isFinite(c) ? Math.max(0, Math.floor(c)) : null, f = Number.isFinite(l) ? Math.max(0, Math.floor(l)) : null, p = D(e.label);
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
function O(e, t = "info", n = null) {
	if (!e || typeof e != "object") return null;
	let r = D(e.title || e.summary), i = D(e.detail), a = D(e.message || he(r, i, D(e.fallbackMessage)));
	if (!a) return null;
	let o = pe(e.durationMs ?? e.duration ?? n), c = Number(e.createdAt), l = Number.isFinite(c) && c > 0 ? c : Date.now(), u = typeof e.persistent == "boolean" ? e.persistent : !(Number.isFinite(o) && (o ?? 0) > 0);
	return {
		id: D(e.id) || s(`th-${l}-`, 4),
		message: a,
		title: r,
		detail: i,
		type: fe(e.type || t),
		createdAt: l,
		durationMs: o,
		persistent: u,
		source: D(e.source),
		trackId: D(e.trackId),
		status: D(e.status),
		operation: D(e.operation),
		progress: me(e.progress),
		forceStore: !!e.forceStore,
		actionLabel: D(e.actionLabel),
		actionUrl: D(e.actionUrl)
	};
}
function k() {
	if (E === null) try {
		let e = localStorage.getItem(ce), t = e ? JSON.parse(e) : [];
		E = Array.isArray(t) ? t.map((e) => {
			if (e && typeof e == "object") return O(e);
			let t = D(e);
			return t ? O({ message: t }) : null;
		}).filter(Boolean) : [];
	} catch {
		E = [];
	}
}
function ge() {
	try {
		localStorage.setItem(ce, JSON.stringify(E));
	} catch {}
}
function A() {
	try {
		window.dispatchEvent(new CustomEvent(de));
	} catch {}
}
function _e() {
	try {
		return Number(localStorage.getItem(le)) || 0;
	} catch {
		return 0;
	}
}
function ve(e) {
	try {
		localStorage.setItem(le, String(Number(e) || 0));
	} catch {}
}
function ye(e, t, n) {
	k();
	let r = O(e && typeof e == "object" ? e : {
		message: D(e),
		type: t,
		durationMs: n
	}, t, n);
	if (!r || !r.forceStore && !r.trackId && r.type === "info" && Number.isFinite(r.durationMs) && r.durationMs != null && r.durationMs > 0 && r.durationMs < 2500) return;
	let i = String(r.trackId || "").trim();
	if (i) {
		let e = E.findIndex((e) => String(e?.trackId || "").trim() === i);
		if (e >= 0) {
			let t = E[e] || {};
			E.splice(e, 1), r.id = String(t.id || r.id || "").trim() || r.id;
		}
	}
	E.unshift(r), E.length > ue && (E = E.slice(0, ue)), ge(), A();
}
function be() {
	return k(), E.map((e) => ({ ...e }));
}
function xe() {
	k();
	let e = _e();
	return E.filter((t) => t.createdAt > e).length;
}
function Se() {
	ve(Date.now()), A();
}
function Ce() {
	k(), E = [], ge(), ve(Date.now()), A();
}
//#endregion
//#region ui/app/toast.ts
function we(e) {
	let t = String(e || "info").trim().toLowerCase();
	return t === "warn" ? "warning" : t === "danger" ? "error" : t === "success" || t === "warning" || t === "error" ? t : "info";
}
function j(e) {
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
function Te(e, t, n, r) {
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
	return e && typeof e == "object" ? (a.title = String(i?.title || e.summary || "").trim(), a.detail = String(i?.detail || e.detail || e.message || "").trim(), a.message = j(e), a) : (a.title = String(i?.title || "").trim(), a.detail = String(i?.detail || "").trim(), a.message = j(e), a);
}
function Ee(e, t = "info", n, r) {
	try {
		let i = Te(e, t, n, r);
		i.forceStore = !0, ye(i, t, n ?? void 0);
	} catch {}
}
function De(e) {
	switch (e) {
		case "success": return 2e3;
		case "info": return 3e3;
		case "warning": return 4e3;
		case "error": return 5e3;
		default: return 5e3;
	}
}
function Oe(e) {
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
function M(e, t = "info", i, a) {
	if (t = we(t), e = Oe(e), i ??= De(t), !a?.noHistory) try {
		ye(Te(e, t, i, a), t, i ?? void 0);
	} catch {}
	let o = !(Number.isFinite(Number(i)) && Number(i) > 0);
	try {
		let a = n();
		if (a && typeof a.add == "function") {
			let n = t;
			n === "warning" && (n = "warn");
			let s = r("manager.title"), c = e;
			if (typeof e == "object" && e?.summary) s = e.summary, c = e.detail || "";
			else if (typeof e != "string") try {
				c = e.message || String(e);
			} catch (e) {
				console.debug?.(e);
			}
			let l = {
				severity: n,
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
		return s.ui.toast(e, t);
	} catch (e) {
		console.debug("Native app.ui.toast failed", e);
	}
	console.warn("[Majoor Toast] Native toast API unavailable", {
		type: t,
		message: j(e),
		duration: o ? 0 : i
	});
}
//#endregion
//#region ui/api/clientAuth.ts
var ke = 2e3, Ae = 15e3, je = 8e3, N = "token", P = null, F = null, Me = null, Ne = "", I = T({
	ttlMs: ke,
	maxSize: 1
});
function Pe() {
	return String(Ne || "").trim();
}
function L(e) {
	return Ne = String(e || "").trim(), !0;
}
function Fe() {
	try {
		let e = localStorage?.getItem?.(l), t = e ? JSON.parse(e) : {}, n = t && typeof t == "object" ? t : {}, r = n?.data && typeof n.data == "object" ? n.data : n;
		r?.security && typeof r.security == "object" && String(r.security.apiToken || "").trim() && (r.security.apiToken = "", localStorage?.setItem?.(l, JSON.stringify(n)));
	} catch (e) {
		console.debug?.(e);
	}
}
function Ie() {
	try {
		I.delete(N);
	} catch (e) {
		console.debug?.(e);
	}
	L(""), Fe();
}
function R() {
	let e = I.get(N);
	if (e !== void 0) return e;
	let t = Date.now(), n = Pe();
	if (n) return I.set(N, n, { at: t }), n;
	try {
		let e = localStorage?.getItem?.(l), n = e ? JSON.parse(e) : null, r = n?.data && typeof n.data == "object" ? n.data : n, i = String(r?.security?.apiToken || "").trim();
		if (i) {
			L(i);
			try {
				let e = n && typeof n == "object" ? n : {}, t = e?.data && typeof e.data == "object" ? e.data : e;
				t?.security && typeof t.security == "object" && (t.security.apiToken = "", localStorage?.setItem?.(l, JSON.stringify(e)), window?.dispatchEvent?.(new CustomEvent("mjr-settings-changed", { detail: { key: "security.apiToken" } })));
			} catch (e) {
				console.debug?.(e);
			}
		}
		return I.set(N, i, { at: t }), i;
	} catch {
		return I.set(N, "", { at: t }), "";
	}
}
function z(e) {
	let t = String(e || "").trim();
	if (!t) return !1;
	try {
		I.set(N, t), F = null, L(t), Fe();
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
var Le = /^[A-Za-z0-9._\-~+/]+=*$/;
function Re(e) {
	let t = String(e || "").trim();
	return t ? Le.test(t) ? z(t) : (console.debug?.("[MJR auth] Rejected malformed security token (invalid characters)"), !1) : !1;
}
function ze() {
	return !!R();
}
function B(e = {}) {
	F = {
		code: String(e?.code || "").trim().toUpperCase(),
		error: String(e?.error || "").trim(),
		status: Number(e?.status || 0) || 0,
		at: Date.now()
	};
}
function Be() {
	let e = F;
	if (!e) return null;
	let t = Date.now() - (Number(e.at || 0) || 0);
	return t < 0 || t > Ae ? (F = null, null) : e;
}
function Ve(e) {
	let t = Be(), n = String(e?.code || "").trim().toUpperCase(), i = String(e?.error || "").trim(), a = String(t?.code || "").trim().toUpperCase(), o = String(t?.error || "").trim().toLowerCase(), s = i.toLowerCase();
	return n === "FORBIDDEN" && (s.includes("api token over insecure transport") || s.includes("allow http token transport")) ? r("toast.writeAuthInsecureTransport", "Write access is blocked because the Majoor API token is being sent over plain HTTP from a remote machine. Use HTTPS, or enable Settings -> Security -> Allow HTTP Token Transport for a trusted LAN.") : a === "FORBIDDEN" && (o.includes("already configured") || o.includes("rotate-token")) ? r("toast.writeAuthConfiguredTokenRequired", "Write access requires the Majoor API token already configured on the server. Open Settings -> Security -> API Token and enter the matching token.") : a === "AUTH_REQUIRED" && (o.includes("sign in to comfyui") || o.includes("authenticated comfyui user")) ? r("toast.writeAuthSignInRequired", "Write access is blocked. Sign in to ComfyUI first, then retry so Majoor can bootstrap the remote session token automatically.") : a === "BOOTSTRAP_DISABLED" || a === "AUTH_REQUIRED" && o.includes("bootstrap") || n === "AUTH_REQUIRED" && s.includes("api token") ? r("toast.writeAuthBootstrapHelp", "Write access is blocked. Sign in to ComfyUI and retry so Majoor can bootstrap the remote session automatically, or set a Majoor API token in Settings -> Security.") : "";
}
function He(e) {
	let t = String(e || "").trim();
	if (!t) return;
	let n = Date.now(), i = Me;
	if (!(i && i.message === t && n - (Number(i.at || 0) || 0) < je)) {
		Me = {
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
function Ue(e) {
	let t = String(e?.code || "").trim().toUpperCase(), n = String(e?.error || "").trim().toLowerCase(), r = t === "FORBIDDEN" && n.includes("write operation blocked");
	if (t !== "AUTH_REQUIRED" && !r) return e;
	let i = Ve(e);
	return i ? (He(i), {
		...e,
		error: i
	}) : e;
}
async function We() {
	try {
		let e = await fetch("/mjr/am/settings/security/bootstrap-token", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				"X-Requested-With": "XMLHttpRequest"
			},
			body: "{}"
		});
		if (!(e.headers.get("content-type") || "").includes("application/json")) return B({
			code: "INVALID_RESPONSE",
			error: `Bootstrap token request returned non-JSON response (${e.status})`,
			status: e.status
		}), {
			ok: !1,
			token: !1
		};
		let t = await e.json().catch((e) => (console.debug?.("[MJR auth] JSON parse error:", e), null));
		if (!t || typeof t != "object") return B({
			code: "INVALID_RESPONSE",
			error: "Bootstrap token response was invalid.",
			status: e.status
		}), {
			ok: !1,
			token: !1
		};
		if (!t.ok) return B({
			code: t?.code,
			error: t?.error,
			status: e.status
		}), {
			ok: !1,
			token: !1
		};
		let n = String(t?.data?.token || "").trim();
		return n ? {
			ok: z(n),
			token: !0
		} : (F = null, {
			ok: !0,
			token: !1
		});
	} catch (e) {
		return B({
			code: "NETWORK_ERROR",
			error: e?.message || "Bootstrap token request failed.",
			status: 0
		}), {
			ok: !1,
			token: !1
		};
	}
}
async function Ge({ force: e = !1, allowCookieRefresh: t = !1 } = {}) {
	let n = R();
	if (n && !e) return n;
	let r = {
		ok: !1,
		token: !1
	};
	P ||= (async () => {
		try {
			return await We();
		} finally {
			P = null;
		}
	})();
	try {
		r = await P || r;
	} catch (e) {
		console.debug?.(e);
	}
	if (e && r?.ok && !r?.token && n) Ie();
	else if (e && !r?.ok) {
		let e = Be(), t = String(e?.code || "").trim().toUpperCase();
		(!t || !["NETWORK_ERROR", "INVALID_RESPONSE"].includes(t)) && Ie();
	}
	let i = R();
	return !i && t && r?.ok ? !0 : i;
}
function Ke() {
	I.clear();
}
//#endregion
//#region ui/api/clientOps.ts
async function qe(e) {
	return !e || typeof e != "string" ? {
		ok: !1,
		error: "Missing mode",
		code: "INVALID_INPUT"
	} : J("/mjr/am/settings/probe-backend", { mode: e });
}
async function Je() {
	return q(o.SETTINGS_METADATA_FALLBACK);
}
async function Ye({ image: e, media: t } = {}) {
	return J(o.SETTINGS_METADATA_FALLBACK, {
		image: e,
		media: t
	});
}
async function Xe() {
	return q(o.SETTINGS_VECTOR_SEARCH);
}
async function Ze(e = !0) {
	if (e && typeof e == "object") {
		let t = {};
		return "enabled" in e && (t.enabled = !!e.enabled), "caption_on_index" in e && (t.caption_on_index = !!e.caption_on_index), "captionOnIndex" in e && (t.caption_on_index = !!e.captionOnIndex), "index_on_scan" in e && (t.index_on_scan = !!e.index_on_scan), "indexOnScan" in e && (t.index_on_scan = !!e.indexOnScan), "unload_after_use" in e && (t.unload_after_use = !!e.unload_after_use), "unloadAfterUse" in e && (t.unload_after_use = !!e.unloadAfterUse), "concurrency" in e && (t.concurrency = Number(e.concurrency) || 1), "vectorConcurrency" in e && (t.concurrency = Number(e.vectorConcurrency) || 1), J(o.SETTINGS_VECTOR_SEARCH, t);
	}
	return J(o.SETTINGS_VECTOR_SEARCH, { enabled: !!e });
}
async function Qe() {
	return J(o.SETTINGS_VECTOR_SEARCH_UNLOAD, {});
}
async function $e() {
	return q(o.SETTINGS_EXECUTION_GROUPING);
}
async function et(e = !0) {
	return J(o.SETTINGS_EXECUTION_GROUPING, { enabled: !!e });
}
async function tt() {
	return q(o.SETTINGS_HUGGINGFACE);
}
async function nt(e = "") {
	return J(o.SETTINGS_HUGGINGFACE, { token: String(e ?? "").trim() });
}
async function rt() {
	return q(o.SETTINGS_AI_LOGGING);
}
async function it(e = !1) {
	return J(o.SETTINGS_AI_LOGGING, { enabled: !!e });
}
async function at() {
	return q(o.SETTINGS_ROUTE_LOGGING);
}
async function ot(e = !1) {
	return J(o.SETTINGS_ROUTE_LOGGING, { enabled: !!e });
}
async function st() {
	return q(o.SETTINGS_STARTUP_LOGGING);
}
async function ct(e = !1) {
	return J(o.SETTINGS_STARTUP_LOGGING, { enabled: !!e });
}
async function lt() {
	return q(o.SETTINGS_LTXAV_RGB_FALLBACK);
}
async function ut(e = !1) {
	return J(o.SETTINGS_LTXAV_RGB_FALLBACK, { enabled: !!e });
}
async function dt() {
	return q(o.SETTINGS_OUTPUT_DIRECTORY);
}
async function ft(e, t = {}) {
	let n = String(e ?? "").trim();
	return J(o.SETTINGS_OUTPUT_DIRECTORY, { output_directory: n }, t);
}
async function pt() {
	return q(o.SETTINGS_INDEX_DIRECTORY);
}
async function mt(e, t = {}) {
	let n = String(e ?? "").trim();
	return J(o.SETTINGS_INDEX_DIRECTORY, { index_directory: n }, t);
}
async function ht(e = {}) {
	return q(o.SETTINGS_WORKFLOW_ROOTS, e);
}
async function gt(e, t = {}) {
	let n = Array.isArray(e) ? e.map((e) => String(e ?? "").trim()).filter(Boolean) : String(e ?? "").trim();
	return J(o.SETTINGS_WORKFLOW_ROOTS, { workflow_roots: n }, t);
}
async function _t() {
	return q("/mjr/am/settings/security");
}
async function vt(e) {
	return J("/mjr/am/settings/security", e && typeof e == "object" ? e : {});
}
async function yt() {
	let e = await J("/mjr/am/settings/security/bootstrap-token", {});
	if (e?.ok) try {
		let t = String(e?.data?.token || "").trim();
		t && z(t);
	} catch (e) {
		console.debug?.(e);
	}
	return e;
}
async function bt(e) {
	if (e && typeof e == "object") {
		let t = String(e.filepath || e.path || e?.file_info?.filepath || "").trim();
		return e.id == null ? J("/mjr/am/open-in-folder", { filepath: t }) : J("/mjr/am/open-in-folder", { asset_id: c(e.id) });
	}
	return J("/mjr/am/open-in-folder", { asset_id: c(e) });
}
async function xt({ op: e = "", path: t = "", name: n = "", destination: r = "", recursive: i = !0 } = {}, a = {}) {
	let s = {
		op: String(e || "").trim().toLowerCase(),
		path: String(t || "").trim()
	};
	return n != null && String(n).trim() && (s.name = String(n).trim()), r != null && String(r).trim() && (s.destination = String(r).trim()), s.op === "delete" && (s.recursive = !!i), J(o.BROWSER_FOLDER_OP, s, a);
}
async function St(e = {}) {
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
	return r && (i.custom_root_id = String(r)), J(o.INDEX_RESET, i);
}
async function Ct({ scope: e = "output", customRootId: t = "" } = {}) {
	let n = String(e || "output").trim().toLowerCase() || "output", r = String(t || "").trim(), i = { scope: n };
	return r && (i.custom_root_id = r), J(o.WATCHER_SCOPE, i);
}
async function wt(e = {}) {
	return q(o.WATCHER_STATUS, e);
}
async function Tt(e = !0) {
	return J(o.WATCHER_TOGGLE, { enabled: !!e });
}
async function Et() {
	return q(o.WATCHER_SETTINGS);
}
async function Dt(e = {}) {
	return J(o.WATCHER_SETTINGS, e);
}
async function Ot(e = {}) {
	return q(o.TOOLS_STATUS, e);
}
async function kt(e = {}) {
	return q(o.STATUS, e);
}
async function At() {
	return J("/mjr/am/db/force-delete", {});
}
async function jt(e = {}) {
	return q(o.DB_BACKUPS, e);
}
async function Mt() {
	return J(o.DB_BACKUP_SAVE, {});
}
async function Nt({ name: e = "", useLatest: t = !1 } = {}) {
	let n = {};
	return e && (n.name = String(e)), t && (n.use_latest = !0), J(o.DB_BACKUP_RESTORE, n);
}
async function Pt(e = 250) {
	return J("/mjr/am/duplicates/analyze", { limit: Math.max(10, Math.min(5e3, Number(e) || 250)) });
}
async function Ft({ scope: e = "output", customRootId: t = "", maxGroups: n = 6, maxPairs: r = 10 } = {}, i = {}) {
	let a = `/mjr/am/duplicates/alerts?scope=${encodeURIComponent(String(e || "output"))}`;
	return t && (a += `&custom_root_id=${encodeURIComponent(String(t))}`), a += `&max_groups=${encodeURIComponent(String(Math.max(1, Number(n) || 6)))}`, a += `&max_pairs=${encodeURIComponent(String(Math.max(1, Number(r) || 10)))}`, q(a, i);
}
async function It(e, t = []) {
	return J("/mjr/am/duplicates/merge-tags", {
		keep_asset_id: Number(e) || 0,
		merge_asset_ids: Array.isArray(t) ? t.map((e) => Number(e) || 0).filter((e) => e > 0) : []
	});
}
async function Lt(e) {
	let t, n;
	if (e && typeof e == "object") {
		t = c(e.id);
		let r = String(e.filepath || e.path || e?.file_info?.filepath || "").trim();
		n = t ? { asset_id: t } : { filepath: r };
	} else t = c(e), n = { asset_id: t };
	let r = await J("/mjr/am/asset/delete", n);
	return r?.ok && t && zt([t]), r;
}
async function Rt(e) {
	let t = Array.isArray(e) ? e.map((e) => c(e)).filter(Boolean) : [], n = await J("/mjr/am/assets/delete", { ids: t });
	return n?.ok && zt(t), n;
}
function zt(e) {
	try {
		let t = (Array.isArray(e) ? e : [e]).map((e) => String(e || "").trim()).filter(Boolean);
		if (!t.length) return;
		window.dispatchEvent(new CustomEvent("mjr:assets-deleted", { detail: { ids: t } }));
	} catch (e) {
		console.debug?.(e);
	}
}
async function Bt(e, t) {
	let n;
	if (e && typeof e == "object") {
		n = c(e.id);
		let r = String(e.filepath || e.path || e?.file_info?.filepath || "").trim(), i = n ? await J("/mjr/am/asset/rename", {
			asset_id: n,
			new_name: t
		}) : await J("/mjr/am/asset/rename", {
			filepath: r,
			new_name: t
		});
		if (i?.ok && n) try {
			let e = await Y(n);
			e?.ok && e?.data && (i.data = {
				...i.data || {},
				asset: e.data
			});
		} catch (e) {
			console.debug?.(e);
		}
		return i;
	}
	n = c(e);
	let r = await J("/mjr/am/asset/rename", {
		asset_id: n,
		new_name: t
	});
	if (r?.ok && n) try {
		let e = await Y(n);
		e?.ok && e?.data && (r.data = {
			...r.data || {},
			asset: e.data
		});
	} catch (e) {
		console.debug?.(e);
	}
	return r;
}
async function Vt() {
	let e = typeof AbortController < "u" ? new AbortController() : null, t = null;
	try {
		return e && (t = setTimeout(() => e.abort(), 1e4)), await q("/mjr/am/collections", e ? { signal: e.signal } : {});
	} finally {
		t && clearTimeout(t);
	}
}
async function Ht(e) {
	return J("/mjr/am/collections", { name: String(e || "").trim() });
}
async function Ut(e) {
	let t = String(e || "").trim();
	return J(`/mjr/am/collections/${encodeURIComponent(t)}/delete`, {});
}
async function Wt(e, t) {
	let n = String(e || "").trim(), r = Array.isArray(t) ? t : [];
	return J(`/mjr/am/collections/${encodeURIComponent(n)}/add`, { assets: r });
}
async function Gt(e, t) {
	let n = String(e || "").trim(), r = Array.isArray(t) ? t : [];
	return J(`/mjr/am/collections/${encodeURIComponent(n)}/remove`, { filepaths: r });
}
async function Kt(e) {
	let t = String(e || "").trim();
	return q(`/mjr/am/collections/${encodeURIComponent(t)}/assets`);
}
async function qt(e, t = 20) {
	let n = String(e || "").trim();
	if (!n) return {
		ok: !1,
		error: "Empty query"
	};
	let r = t && typeof t == "object" ? t : { topK: Number(t) }, a = Math.max(1, Math.min(200, Number(r?.topK ?? 20) || 20)), s = String(r?.scope || "").trim(), c = String(r?.customRootId || "").trim(), l = `${o.VECTOR_SEARCH}?q=${encodeURIComponent(n)}&top_k=${a}`;
	return s && (l += `&scope=${encodeURIComponent(s)}`), c && (l += `&custom_root_id=${encodeURIComponent(c)}`), l = i(l, {
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
	}), q(l, { timeoutMs: 12e4 });
}
async function Jt(e, t = 20) {
	let n = String(e || "").trim();
	if (!n) return {
		ok: !1,
		error: "Missing asset ID"
	};
	let r = t && typeof t == "object" ? t : { topK: Number(t) }, i = Math.max(1, Math.min(200, Number(r?.topK ?? 20) || 20)), a = String(r?.scope || "").trim(), s = String(r?.customRootId || "").trim(), c = `${o.VECTOR_SIMILAR}/${encodeURIComponent(n)}?top_k=${i}`;
	return a && (c += `&scope=${encodeURIComponent(a)}`), s && (c += `&custom_root_id=${encodeURIComponent(s)}`), q(c, { dedupeKey: `vec:${n}:${i}:${a}:${s}` });
}
async function Yt(e) {
	let t = String(e || "").trim();
	return t ? q(`${o.VECTOR_ALIGNMENT}/${encodeURIComponent(t)}`) : {
		ok: !1,
		error: "Missing asset ID"
	};
}
async function Xt(e) {
	let t = String(e || "").trim();
	return t ? J(`${o.VECTOR_INDEX}/${encodeURIComponent(t)}`, {}) : {
		ok: !1,
		error: "Missing asset ID"
	};
}
async function Zt() {
	return q(o.VECTOR_STATS);
}
async function Qt(e = 64, t = {}) {
	let n = Math.max(1, Math.min(200, e)), r = typeof t?.onProgress == "function" ? t.onProgress : null, i = String(t?.scope || "").trim().toLowerCase(), a = String(t?.customRootId ?? t?.custom_root_id ?? "").trim(), s = `${o.VECTOR_BACKFILL}?batch_size=${n}&async=1`;
	i && (s += `&scope=${encodeURIComponent(i)}`), a && (s += `&custom_root_id=${encodeURIComponent(a)}`);
	let c = await J(s, {}, { timeoutMs: 3e4 });
	if (!c?.ok) return c;
	let l = c?.data || {}, u = String(l?.status || "").toLowerCase(), d = String(l?.backfill_id || "").trim();
	try {
		r?.(l);
	} catch (e) {
		console.debug?.(e);
	}
	if (!d || ![
		"queued",
		"running",
		"pending"
	].includes(u)) return c;
	let f = Number(t?.pollIntervalMs), p = Number(t?.pollTimeoutMs), m = Number.isFinite(f) ? Math.max(500, Math.min(1e4, Math.floor(f))) : sn, h = Number.isFinite(p) ? Math.max(1e4, Math.min(ln, Math.floor(p))) : cn, g = Date.now(), _ = null;
	for (; Date.now() - g < h;) {
		await y(m);
		let e = await q(`${o.VECTOR_BACKFILL_STATUS}?backfill_id=${encodeURIComponent(d)}`, { timeoutMs: 3e4 });
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
	let v = await q(`${o.VECTOR_BACKFILL_STATUS}?backfill_id=${encodeURIComponent(d)}`, { timeoutMs: 3e4 }), b = v?.data || _?.data || {}, x = String(b?.status || "").toLowerCase();
	if (v?.ok && [
		"queued",
		"running",
		"pending"
	].includes(x)) {
		try {
			r?.(b);
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
	return v?.ok && x === "failed" ? {
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
async function $t(e) {
	let t = String(e || "").trim();
	return t ? J(`${o.VECTOR_CAPTION}/${encodeURIComponent(t)}`, {}) : {
		ok: !1,
		error: "Missing asset ID"
	};
}
async function en(e, { topK: t = 50, scope: n = "output", customRootId: r = "", subfolder: a = null, kind: s = null, hasWorkflow: c = null, minRating: l = null, minSizeMB: u = null, maxSizeMB: d = null, minWidth: f = null, minHeight: p = null, maxWidth: m = null, maxHeight: h = null, workflowType: g = null, workflowId: _ = null, dateRange: v = null, dateExact: y = null } = {}) {
	let b = String(e || "").trim();
	if (!b) return {
		ok: !1,
		error: "Empty query"
	};
	let x = `${o.HYBRID_SEARCH}?q=${encodeURIComponent(b)}&top_k=${Math.max(1, Math.min(200, t))}&scope=${encodeURIComponent(n)}`;
	return r && (x += `&custom_root_id=${encodeURIComponent(r)}`), x = i(x, {
		subfolder: a,
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
	}), q(x, { timeoutMs: 12e4 });
}
async function tn(e = 8) {
	return J(o.VECTOR_SUGGEST_COLLECTIONS, { k: Math.max(2, Math.min(20, e)) });
}
//#endregion
//#region ui/api/client.ts
var nn = 3e4, rn = "__MJR_API_CLIENT__", an = 2e3, on = 200, sn = 1e3, cn = 30 * 6e4, ln = 720 * 6e4, V = "settings", un = "available-tags", H = T({
	ttlMs: an,
	maxSize: 1
}), U = T({
	ttlMs: an,
	maxSize: 1
}), W = T({
	ttlMs: () => mn(),
	maxSize: 1
}), dn = new Set([
	"1",
	"true",
	"yes",
	"on"
]), fn = new Set([
	"0",
	"false",
	"no",
	"off"
]);
function pn(e, t = !1) {
	if (typeof e == "boolean") return e;
	if (typeof e == "number") return e !== 0;
	if (typeof e == "string") {
		let t = e.trim().toLowerCase();
		if (dn.has(t)) return !0;
		if (fn.has(t)) return !1;
	}
	return !!t;
}
function mn() {
	try {
		let e = localStorage?.getItem?.("mjrSettings") || "{}", t = JSON.parse(e), n = t?.cache?.tagsTTLms ?? t?.cache?.tagsTTL ?? t?.cache?.tags_ttl_ms ?? null, r = Number(n);
		return Number.isFinite(r) ? Math.max(1e3, Math.min(10 * 6e4, Math.floor(r))) : nn;
	} catch {
		return nn;
	}
}
function hn() {
	H.clear();
}
function gn() {
	U.clear();
}
function G() {
	W.clear();
}
function _n(e) {
	return String(e ?? "").trim().toLowerCase() || "";
}
function vn(e) {
	let t = [], n = /* @__PURE__ */ new Set();
	for (let r of Array.isArray(e) ? e : []) {
		let e = String(r ?? "").trim();
		if (!e) continue;
		let i = _n(e);
		!i || n.has(i) || (n.add(i), t.push(e));
	}
	return t;
}
try {
	let e = typeof window < "u" ? window : null;
	e && !e[rn] && (e[rn] = { initialized: !0 }, e.addEventListener?.("storage", (e) => {
		try {
			e?.key === "mjrSettings" && (hn(), gn(), G(), Ke());
		} catch (e) {
			console.debug?.(e);
		}
	}), e.addEventListener?.("mjr-settings-changed", () => {
		hn(), gn(), G(), Ke();
	}));
} catch (e) {
	console.debug?.(e);
}
var yn = () => {
	let e = H.get(V);
	if (e !== void 0) return e;
	let t = Date.now();
	try {
		let e = localStorage?.getItem?.(l);
		if (!e) return H.set(V, !1, { at: t }), !1;
		let n = !!JSON.parse(e)?.observability?.enabled;
		return H.set(V, n, { at: t }), n;
	} catch {
		return H.set(V, !1, { at: t }), !1;
	}
}, bn = () => {
	let e = U.get(V);
	if (e !== void 0) return e;
	let t = Date.now();
	try {
		let e = localStorage?.getItem?.(l);
		if (!e) return U.set(V, !0, { at: t }), !0;
		let n = JSON.parse(e)?.ratingTagsSync?.enabled, r = n == null ? !0 : pn(n, !0);
		return U.set(V, r, { at: t }), r;
	} catch {
		return U.set(V, !0, { at: t }), !0;
	}
}, K = se({
	readObsEnabled: yn,
	readAuthToken: R,
	ensureWriteAuthToken: Ge,
	normalizeWriteAuthFailure: Ue
}), xn = K.fetchAPI;
async function q(e, t = {}) {
	return K.get(e, t);
}
async function J(e, t, n = {}) {
	return K.post(e, t, n);
}
async function Sn(t, n, r = {}) {
	let i = bn(), a = t && typeof t == "object" ? t : null, o = c(a ? a.id : t), s = { rating: Math.max(0, Math.min(5, Number(n) || 0)) };
	return o ? s.asset_id = o : a && (s.filepath = a.filepath || a.path || a?.file_info?.filepath || "", s.type = a.type || "output", s.root_id = e(a)), xn("/mjr/am/asset/rating", {
		...r,
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			...i ? { "X-MJR-RTSYNC": "on" } : {}
		},
		body: JSON.stringify(s)
	});
}
async function Cn(t, n, r = {}) {
	let i = bn(), a = t && typeof t == "object" ? t : null, s = c(a ? a.id : t), l = String(a?.kind || a?.type || "").trim().toLowerCase() === "workflow", u = String(a?.filepath || a?.path || a?.file_info?.filepath || "").trim(), d = { tags: Array.isArray(n) ? n : [] };
	l && u ? d.filepath = u : s ? d.asset_id = s : a && (d.filepath = a.filepath || a.path || a?.file_info?.filepath || "", d.type = a.type || "output", d.root_id = e(a));
	let f = await xn(l && u ? o.WORKFLOWS_TAGS : "/mjr/am/asset/tags", {
		...r,
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			...i ? { "X-MJR-RTSYNC": "on" } : {}
		},
		body: JSON.stringify(d)
	});
	return f?.ok && G(), f;
}
async function wn() {
	let e = W.get(un);
	if (Array.isArray(e)) return {
		ok: !0,
		data: e,
		error: null,
		code: "OK",
		meta: { cached: !0 }
	};
	let t = await q("/mjr/am/tags");
	if (t?.ok && Array.isArray(t.data)) {
		let e = vn(t.data);
		return W.set(un, e), {
			...t,
			data: e
		};
	}
	return t;
}
async function Y(e, t = {}) {
	let n = encodeURIComponent(c(e));
	return q(`/mjr/am/asset/${n}`, {
		...t,
		dedupeKey: t?.dedupeKey || `meta:${n}`
	});
}
async function Tn(e, t = {}) {
	let n = c(e);
	if (!n) return {
		ok: !1,
		data: null,
		error: "Missing assetId",
		code: "INVALID_INPUT"
	};
	let r = `/mjr/am/viewer/info?asset_id=${encodeURIComponent(n)}`;
	t.refresh && (r += "&refresh=1");
	let { refresh: i, ...a } = t;
	return q(r, a);
}
async function En(e, t = {}) {
	let n = Array.isArray(e) ? e : [], r = [];
	for (let e of n) {
		let t = Number(e);
		if (Number.isFinite(t) && (r.push(Math.trunc(t)), r.length >= on)) break;
	}
	return r.length ? J("/mjr/am/assets/batch", { asset_ids: r }, t) : {
		ok: !0,
		data: [],
		error: null,
		code: "OK"
	};
}
async function Dn(e, n = {}) {
	let r = t(e);
	return r ? q(r, n) : {
		ok: !1,
		data: null,
		error: "Missing workflow filepath",
		code: "INVALID_INPUT"
	};
}
async function On({ workflow: e = null, name: t = "", category: n = "", overwrite: r = !1, filepath: i = "", task: a = "", model_family: s = "", provider: c = "", runs_on: l = "", notes: u = "" } = {}, d = {}) {
	return J(o.WORKFLOWS_SAVE, {
		workflow: e,
		name: t,
		category: n,
		overwrite: r,
		filepath: i,
		task: a,
		model_family: s,
		provider: c,
		runs_on: l,
		notes: u
	}, d);
}
async function kn({ filepath: e = "", name: t = "" } = {}, n = {}) {
	return J(o.WORKFLOWS_DUPLICATE, {
		filepath: e,
		name: t
	}, n);
}
async function An({ filepath: e = "", name: t = "", category: n = "" } = {}, r = {}) {
	return J(o.WORKFLOWS_MOVE, {
		filepath: e,
		name: t,
		category: n
	}, r);
}
async function jn({ filepath: e = "" } = {}, t = {}) {
	return J(o.WORKFLOWS_DELETE, { filepath: e }, t);
}
async function Mn({ filepath: e = "" } = {}, t = {}) {
	return J(o.WORKFLOWS_MARK_LOADED, { filepath: e }, t);
}
async function Nn({ filepath: e = "", favorite: t = !1 } = {}, n = {}) {
	return J(o.WORKFLOWS_FAVORITE, {
		filepath: e,
		favorite: !!t
	}, n);
}
async function Pn({ filepath: e = "", task: t = "", model_family: n = "", provider: r = "", runs_on: i = "", notes: a = "" } = {}, s = {}) {
	return J(o.WORKFLOWS_INFO, {
		filepath: e,
		task: t,
		model_family: n,
		provider: r,
		runs_on: i,
		notes: a
	}, s);
}
async function Fn({ filepath: e = "", limit: t = 12 } = {}, n = {}) {
	let r = Math.max(1, Math.min(50, Number(t) || 12));
	return q(`${o.WORKFLOWS_THUMBNAIL_CANDIDATES}?filepath=${encodeURIComponent(String(e || "").trim())}&limit=${encodeURIComponent(String(r))}`, n);
}
async function In(e = {}) {
	return q(o.WORKFLOWS_MODEL_FAMILIES, e);
}
async function Ln({ q: e = "*", limit: t = 100, offset: n = 0, sort: r = "mtime" } = {}, i = {}) {
	let a = Math.max(1, Math.min(500, Number(t) || 100)), s = Math.max(0, Number(n) || 0);
	return q(`${o.LIST}?scope=workflow&q=${encodeURIComponent(String(e || "*"))}&limit=${encodeURIComponent(String(a))}&offset=${encodeURIComponent(String(s))}&sort=${encodeURIComponent(String(r || "mtime"))}`, i);
}
async function Rn({ filepath: e = "", source_filepath: t = "" } = {}, n = {}) {
	return J(o.WORKFLOWS_THUMBNAIL_SET, {
		filepath: e,
		source_filepath: t
	}, n);
}
async function zn({ type: e = "output", filename: t = "", subfolder: n = "", root_id: r = "", rootId: i = "", filepath: a = "" } = {}, o = {}) {
	let s = String(e || "output").trim().toLowerCase() || "output", c = String(t || "").trim(), l = String(n || "").trim(), u = String(r || i || "").trim(), d = String(a || "").trim();
	if (!c) return {
		ok: !1,
		data: null,
		error: "Missing filename",
		code: "INVALID_INPUT"
	};
	let f = `/mjr/am/metadata?type=${encodeURIComponent(s)}&filename=${encodeURIComponent(c)}`;
	return d && (f += `&filepath=${encodeURIComponent(d)}`), l && (f += `&subfolder=${encodeURIComponent(l)}`), u && (f += `&root_id=${encodeURIComponent(u)}`), q(f, o);
}
async function Bn({ filepath: e = "", root_id: t = "", subfolder: n = "" } = {}, r = {}) {
	try {
		if (globalThis.__mjrFolderInfoSupported === !1) return {
			ok: !1,
			data: null,
			error: "Folder info endpoint unavailable",
			code: "UNAVAILABLE"
		};
		if (globalThis.__mjrFolderInfoSupported == null) {
			let e = await q("/mjr/am/routes");
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
	let i = String(e || "").trim(), a = String(t || "").trim(), s = String(n || "").trim(), c = o.FOLDER_INFO, l = [];
	i ? (l.push(`filepath=${encodeURIComponent(i)}`), l.push("browser_mode=1")) : (a && l.push(`root_id=${encodeURIComponent(a)}`), s && l.push(`subfolder=${encodeURIComponent(s)}`)), l.length && (c += `?${l.join("&")}`);
	let u = await q(c, r);
	try {
		!u?.ok && Number(u?.status || 0) === 404 && (globalThis.__mjrFolderInfoSupported = !1);
	} catch (e) {
		console.debug?.(e);
	}
	return u;
}
//#endregion
//#region ui/utils/logging.ts
function Vn(e, ...t) {
	try {
		a.DEBUG_VERBOSE_ERRORS && console.debug(e, ...t);
	} catch {}
}
function Hn(e, t = "Majoor", { showToast: n = !1, toastType: r = "error" } = {}) {
	let i = e?.message || String(e || "Unknown error");
	try {
		a.DEBUG_VERBOSE_ERRORS ? console.error(`[Majoor][${t}]`, i, e) : console.debug(`[Majoor][${t}]`, i);
	} catch (e) {
		console.debug?.(e);
	}
	if (n && a.DEBUG_VERBOSE_ERRORS) try {
		M(`${t}: ${i}`, r, 4e3);
	} catch (e) {
		console.debug?.(e);
	}
}
//#endregion
//#region ui/features/panel/controllers/hotkeysState.ts
var X = {
	suspended: !1,
	scope: null,
	ratingHotkeysActive: !1
};
function Un() {
	return X;
}
function Wn(e) {
	X.scope = e == null ? null : String(e);
}
function Gn() {
	return !!X.suspended;
}
function Kn(e) {
	X.ratingHotkeysActive = !!e;
}
//#endregion
//#region ui/features/viewer/viewerRuntimeHosts.ts
var Z = null, Q = null, qn = ".mjr-viewer-overlay", Jn = ".mjr-mfv";
function Yn(e) {
	return !!e && typeof e.appendChild == "function";
}
function Xn() {
	return typeof document > "u" ? null : document?.body || null;
}
function Zn() {
	return typeof document > "u" ? null : document?.body || document?.documentElement || null;
}
function Qn(e) {
	return Yn(e) ? e === Xn() ? !0 : typeof e?.isConnected == "boolean" ? e.isConnected : !0 : !1;
}
function $n(e) {
	return Yn(e) ? e : null;
}
function $(e) {
	return Qn(e) ? e : Xn();
}
function er(e) {
	let t = Zn();
	return Qn(t) ? t : $(e);
}
function tr(e, t, n = $) {
	let r = [], i = /* @__PURE__ */ new Set();
	for (let a of [
		n(t),
		Xn(),
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
		for (let e of t) !e || r.includes(e) || r.push(e);
	}
	return r;
}
function nr(e, t, n = $) {
	let r = n(t);
	if (!r) return;
	let i = tr(e, t, n);
	for (let e of i) if (e && e.parentNode !== r) try {
		r.appendChild(e);
	} catch (e) {
		console.debug?.(e);
	}
}
function rr(e) {
	return Z = $n(e), nr(qn, Z), () => ir(e);
}
function ir(e) {
	(!e || Z === e) && (Z = null);
}
function ar(e) {
	return Q = $n(e), nr(Jn, Q, er), () => or(e);
}
function or(e) {
	(!e || Q === e) && (Q = null);
}
function sr(e) {
	let t = $(Z);
	try {
		t?.appendChild?.(e);
	} catch (e) {
		console.debug?.(e);
	}
	return t;
}
function cr(e) {
	let t = er(Q);
	try {
		t?.appendChild?.(e);
	} catch (e) {
		console.debug?.(e);
	}
	return t;
}
function lr() {
	return tr(qn, Z);
}
//#endregion
export { _t as $, l as $t, Pn as A, Pt as At, Ut as B, Zt as Bt, Fn as C, qe as Ct, J as D, Ze as Dt, An as E, ct as Et, yt as F, Jt as Ft, $e as G, Ee as Gt, rt as H, ze as Ht, xt as I, $t as It, lt as J, xe as Jt, tt as K, de as Kt, Ht as L, Yt as Lt, Sn as M, Qe as Mt, Cn as N, Dt as Nt, On as O, Ct as Ot, Wt as P, Qt as Pt, kt as Q, u as Qt, Lt as R, Xt as Rt, In as S, ft as St, Mn as T, vt as Tt, Kt as U, Re as Ut, At as V, tn as Vt, Ft as W, M as Wt, dt as X, Se as Xt, Je as Y, be as Yt, at as Z, T as Zt, wn as _, et as _t, rr as a, ht as at, Tn as b, ut as bt, Wn as c, jt as ct, Hn as d, Gt as dt, st as et, jn as f, Bt as ft, En as g, it as gt, Y as h, Mt as ht, ar as i, wt as it, Rn as j, Tt as jt, Nn as k, gt as kt, Kn as l, It as lt, q as m, Nt as mt, sr as n, Xe as nt, Un as o, en as ot, kn as p, St as pt, pt as q, Ce as qt, lr as r, Et as rt, Gn as s, Vt as st, cr as t, Ot as tt, Vn as u, bt as ut, zn as v, nt as vt, Ln as w, ot as wt, Dn as x, Ye as xt, Bn as y, mt as yt, Rt as z, qt as zt };
