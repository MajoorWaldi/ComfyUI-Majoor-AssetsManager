import { O as e, _t as t, a as n, et as r, gt as i, p as a, pt as o, tt as s, vt as c } from "./events-iWiZ-Zty.js";
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
	let r = D(e.title || e.summary), a = D(e.detail), o = D(e.message || he(r, a, D(e.fallbackMessage)));
	if (!o) return null;
	let s = pe(e.durationMs ?? e.duration ?? n), c = Number(e.createdAt), l = Number.isFinite(c) && c > 0 ? c : Date.now(), u = typeof e.persistent == "boolean" ? e.persistent : !(Number.isFinite(s) && (s ?? 0) > 0);
	return {
		id: D(e.id) || i(`th-${l}-`, 4),
		message: o,
		title: r,
		detail: a,
		type: fe(e.type || t),
		createdAt: l,
		durationMs: s,
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
		"Failed to update rating": a("toast.ratingUpdateFailed", "Failed to update rating"),
		"Error updating rating": a("toast.ratingUpdateError", "Error updating rating"),
		"Rating cleared": a("toast.ratingCleared", "Rating cleared"),
		"Failed to update tags": a("toast.tagsUpdateFailed", "Failed to update tags"),
		"Tags updated": a("toast.tagsUpdated", "Tags updated"),
		"Failed to toggle watcher": a("toast.watcherToggleFailed", "Failed to toggle watcher"),
		"No valid assets selected.": a("toast.noValidAssetsSelected", "No valid assets selected."),
		"Name collision in current view": a("toast.nameCollisionInView", "Name collision in current view"),
		"Failed to create collection.": a("toast.failedCreateCollectionDot", "Failed to create collection."),
		"Failed to add assets to collection.": a("toast.failedAddAssetsToCollection", "Failed to add assets to collection."),
		"Failed to remove from collection.": a("toast.removeFromCollectionFailed", "Failed to remove from collection."),
		"Collection created": a("toast.collectionCreated", "Collection created"),
		"Added to collection": a("toast.addedToCollection", "Added to collection"),
		"Removed from collection": a("toast.removedFromCollection", "Removed from collection"),
		"File renamed successfully!": a("toast.fileRenamedSuccess", "File renamed successfully!"),
		"Failed to rename file": a("toast.fileRenameFailed", "Failed to rename file"),
		"Failed to rename file.": a("toast.fileRenameFailed", "Failed to rename file."),
		"File deleted successfully!": a("toast.fileDeletedSuccess", "File deleted successfully!"),
		"Failed to delete file.": a("toast.fileDeleteFailed", "Failed to delete file."),
		"Failed to delete file. ": a("toast.fileDeleteFailed", "Failed to delete file."),
		"File deleted": a("toast.deleted", "File deleted"),
		"File renamed": a("toast.renamed", "File renamed"),
		"Folder created": a("toast.folderCreated", "Folder created"),
		"Folder renamed": a("toast.folderRenamed", "Folder renamed"),
		"Folder moved": a("toast.folderMoved", "Folder moved"),
		"Folder deleted": a("toast.folderDeleted", "Folder deleted"),
		"Failed to create folder": a("toast.createFolderFailed", "Failed to create folder"),
		"Failed to rename folder": a("toast.renameFolderFailed", "Failed to rename folder"),
		"Failed to move folder": a("toast.moveFolderFailed", "Failed to move folder"),
		"Failed to delete folder": a("toast.deleteFolderFailed", "Failed to delete folder"),
		"Failed to pin folder": a("toast.pinFolderFailed", "Failed to pin folder"),
		"Failed to unpin folder": a("toast.unpinFolderFailed", "Failed to unpin folder"),
		"Folder pinned as browser root": a("toast.folderPinnedAsBrowserRoot", "Folder pinned as browser root"),
		"Folder added": a("toast.folderAdded", "Folder added"),
		"Folder removed": a("toast.folderRemoved", "Folder removed"),
		"Folder linked successfully": a("toast.folderLinked", "Folder linked successfully"),
		"An error occurred while adding the custom folder": a("toast.errorAddingFolder", "An error occurred while adding the custom folder"),
		"An error occurred while removing the custom folder": a("toast.errorRemovingFolder", "An error occurred while removing the custom folder"),
		"Failed to add custom folder": a("toast.failedAddFolder", "Failed to add custom folder"),
		"Failed to remove custom folder": a("toast.failedRemoveFolder", "Failed to remove custom folder"),
		"Native folder browser unavailable. Please enter path manually.": a("toast.nativeBrowserUnavailable", "Native folder browser unavailable. Please enter path manually."),
		"Opened in folder": a("toast.openedInFolder", "Opened in folder"),
		"Failed to open folder": a("toast.openFolderFailed", "Failed to open folder"),
		"Failed to open folder.": a("toast.openFolderFailed", "Failed to open folder."),
		"File path copied to clipboard": a("toast.pathCopied", "File path copied to clipboard"),
		"Failed to copy path": a("toast.pathCopyFailed", "Failed to copy path"),
		"Failed to copy to clipboard": a("toast.copyClipboardFailed", "Failed to copy to clipboard"),
		"No file path available for this asset.": a("toast.noFilePath", "No file path available for this asset."),
		"Failed to refresh metadata.": a("toast.metadataRefreshFailed", "Failed to refresh metadata."),
		"Metadata refreshed": a("toast.metadataRefreshed", "Metadata refreshed"),
		"Duplicate analysis started": a("toast.dupAnalysisStarted", "Duplicate analysis started"),
		"Tags merged": a("toast.tagsMerged", "Tags merged"),
		"Duplicates deleted": a("toast.duplicatesDeleted", "Duplicates deleted"),
		"Rescanning file...": a("toast.rescanningFile", "Rescanning file..."),
		"Metadata enrichment complete": a("toast.enrichmentComplete", "Metadata enrichment complete"),
		"Playback speed is available for video media only": a("toast.playbackVideoOnly", "Playback speed is available for video media only"),
		"DB backup saved": a("toast.dbSaveSuccess", "DB backup saved"),
		"Failed to save DB backup": a("toast.dbSaveFailed", "Failed to save DB backup"),
		"DB restore started": a("toast.dbRestoreStarted", "DB restore started"),
		"Failed to restore DB backup": a("toast.dbRestoreFailed", "Failed to restore DB backup"),
		"Select a DB backup first": a("toast.dbRestoreSelect", "Select a DB backup first"),
		"Stopping running workers": a("toast.dbRestoreStopping", "Stopping running workers"),
		"Unlocking and resetting database": a("toast.dbRestoreResetting", "Unlocking and resetting database"),
		"Recreating database": a("toast.dbRestoreReplacing", "Recreating database"),
		"Replacing database files": a("toast.dbRestoreReplacing", "Replacing database files"),
		"Restarting scan": a("toast.dbRestoreRescan", "Restarting scan"),
		"Deleting database and rebuilding...": a("toast.dbDeleteTriggered", "Deleting database and rebuilding..."),
		"Database deleted and rebuilt. Files are being reindexed.": a("toast.dbDeleteSuccess", "Database deleted and rebuilt. Files are being reindexed."),
		"Failed to delete database": a("toast.dbDeleteFailed", "Failed to delete database"),
		"Database backup restored": a("toast.dbRestoreSuccess", "Database backup restored"),
		"Index reset started. Files will be reindexed in the background.": a("toast.resetStarted", "Index reset started. Files will be reindexed in the background."),
		"Failed to reset index": a("toast.resetFailed", "Failed to reset index"),
		"Reset triggered: Reindexing all files...": a("toast.resetTriggered", "Reset triggered: Reindexing all files..."),
		"Reset failed - database is corrupted. Use the \"Delete DB\" button to force-delete and rebuild.": a("toast.resetFailedCorrupt", "Reset failed - database is corrupted. Use the \"Delete DB\" button to force-delete and rebuild."),
		"Scan started": a("toast.scanStarted", "Scan started"),
		"Scan complete": a("toast.scanComplete", "Scan complete"),
		"Scan failed": a("toast.scanFailed", "Scan failed"),
		"Permission denied": a("toast.permissionDenied", "Permission denied"),
		"Language changed. Reload the page for full effect.": a("toast.languageChanged", "Language changed. Reload the page for full effect."),
		"Tag added": a("toast.tagAdded", "Tag added"),
		"Tag removed": a("toast.tagRemoved", "Tag removed"),
		"Rating saved": a("toast.ratingSaved", "Rating saved"),
		"Failed to create collection": a("toast.failedCreateCollection", "Failed to create collection"),
		"Failed to delete collection": a("toast.failedDeleteCollection", "Failed to delete collection")
	};
	if (n[t]) return n[t];
	let r;
	if (r = t.match(/Rating set to (\d+) star(?:s)?/i), r) return a("toast.ratingSetN", "Rating set to {n} stars", { n: Number(r[1]) });
	if (r = t.match(/Downloading (.+?)\.\.\./i), r) return a("toast.downloadingFile", "Downloading {filename}...", { filename: r[1] });
	if (r = t.match(/Playback ([0-9]+(?:\.[0-9]+)?)x/i), r) return a("toast.playbackRate", "Playback {rate}x", { rate: Number(r[1]).toFixed(2) });
	if (r = t.match(/Metadata refreshed(?:\s*(.*))?/i), r) return a("toast.metadataRefreshed", "Metadata refreshed{suffix}", { suffix: r[1] ? " (" + r[1] + ")" : "" });
	if (r = t.match(/Error renaming(?: file)?:\s*(.+)/i), r) return a("toast.errorRenaming", "Error renaming file: {error}", { error: r[1] });
	if (r = t.match(/Error deleting(?: files?| file)?:\s*(.+)/i), r) return a("toast.errorDeleting", "Error deleting file: {error}", { error: r[1] });
	if (r = t.match(/Tag merge failed:\s*(.+)/i), r) return a("toast.tagMergeFailed", "Tag merge failed: {error}", { error: r[1] });
	if (r = t.match(/Delete failed:\s*(.+)/i), r) return a("toast.deleteFailed", "Delete failed: {error}", { error: r[1] });
	if (r = t.match(/Analysis not started:\s*(.+)/i), r) return a("toast.analysisNotStarted", "Analysis not started: {error}", { error: r[1] });
	if (r = t.match(/(\d+)\s+files deleted successfully!/i), r) return a("toast.filesDeletedSuccessN", "{n} files deleted successfully!", { n: Number(r[1]) });
	if (r = t.match(/(\d+)\s+files deleted,\s+(\d+)\s+failed\./i), r) return a("toast.filesDeletedPartial", "{success} files deleted, {failed} failed.", {
		success: Number(r[1]),
		failed: Number(r[2])
	});
	if (r = t.match(/(\d+)\s+files?\s+deleted/i), r) return a("toast.filesDeletedShort", "{n} files deleted", { n: Number(r[1]) });
	if (r = t.match(/(\d+)\s+deleted,\s+(\d+)\s+failed/i), r) return a("toast.filesDeletedShortPartial", "{success} deleted, {failed} failed", {
		success: Number(r[1]),
		failed: Number(r[2])
	});
	if (r = t.match(/^(.+?)\s+copied to clipboard!$/i), r) return a("toast.copiedToClipboardNamed", "{name} copied to clipboard!", { name: r[1] });
	if (r = t.match(/Folder created:\s*(.+)/i), r) return a("toast.folderCreated", "Folder created: {name}", { name: r[1] });
	if (r = t.match(/Failed to create folder:\s*(.+)/i), r) return a("toast.createFolderFailedDetail", "Failed to create folder: {error}", { error: r[1] });
	if (r = t.match(/Failed to rename folder:\s*(.+)/i), r) return a("toast.renameFolderFailedDetail", "Failed to rename folder: {error}", { error: r[1] });
	if (r = t.match(/Failed to move folder:\s*(.+)/i), r) return a("toast.moveFolderFailedDetail", "Failed to move folder: {error}", { error: r[1] });
	if (r = t.match(/Failed to delete folder:\s*(.+)/i), r) return a("toast.deleteFolderFailedDetail", "Failed to delete folder: {error}", { error: r[1] });
	if (r = t.match(/Error removing from collection:\s*(.+)/i), r) return a("toast.removeFromCollectionError", "Error removing from collection: {error}", { error: r[1] });
	if (r = t.match(/^Failed to (.+)$/i), r) {
		let e = r[1].toLowerCase(), t = {
			"add folder": a("toast.failedAddFolder", "Failed to add custom folder"),
			"remove folder": a("toast.failedRemoveFolder", "Failed to remove custom folder"),
			"create collection": a("toast.failedCreateCollection", "Failed to create collection"),
			"delete collection": a("toast.failedDeleteCollection", "Failed to delete collection")
		};
		for (let [n, r] of Object.entries(t)) if (e.includes(n)) return r;
	}
	return t;
}
function M(t, n = "info", r, i) {
	if (n = we(n), t = Oe(t), r ??= De(n), !i?.noHistory) try {
		ye(Te(t, n, r, i), n, r ?? void 0);
	} catch {}
	let o = !(Number.isFinite(Number(r)) && Number(r) > 0);
	try {
		let i = e();
		if (i && typeof i.add == "function") {
			let e = n;
			e === "warning" && (e = "warn");
			let s = a("manager.title"), c = t;
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
			o || (l.life = r), i.add(l);
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
		message: j(t),
		duration: o ? 0 : r
	});
}
//#endregion
//#region ui/api/clientAuth.ts
var ke = 2e3, Ae = 15e3, je = 8e3, N = "__mjr_write_token", P = "token", F = null, I = null, Me = null, L = T({
	ttlMs: ke,
	maxSize: 1
});
function Ne() {
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
function Pe() {
	try {
		let e = localStorage?.getItem?.(l), t = e ? JSON.parse(e) : {}, n = t && typeof t == "object" ? t : {}, r = n?.data && typeof n.data == "object" ? n.data : n;
		r?.security && typeof r.security == "object" && String(r.security.apiToken || "").trim() && (r.security.apiToken = "", localStorage?.setItem?.(l, JSON.stringify(n)));
	} catch (e) {
		console.debug?.(e);
	}
}
function Fe() {
	try {
		L.delete(P);
	} catch (e) {
		console.debug?.(e);
	}
	R(""), Pe();
}
function z() {
	let e = L.get(P);
	if (e !== void 0) return e;
	let t = Date.now(), n = Ne();
	if (n) return L.set(P, n, { at: t }), n;
	try {
		let e = localStorage?.getItem?.(l), n = e ? JSON.parse(e) : null, r = n?.data && typeof n.data == "object" ? n.data : n, i = String(r?.security?.apiToken || "").trim();
		if (i) {
			R(i);
			try {
				let e = n && typeof n == "object" ? n : {}, t = e?.data && typeof e.data == "object" ? e.data : e;
				t?.security && typeof t.security == "object" && (t.security.apiToken = "", localStorage?.setItem?.(l, JSON.stringify(e)), window?.dispatchEvent?.(new CustomEvent("mjr-settings-changed", { detail: { key: "security.apiToken" } })));
			} catch (e) {
				console.debug?.(e);
			}
		}
		return L.set(P, i, { at: t }), i;
	} catch {
		return L.set(P, "", { at: t }), "";
	}
}
function B(e) {
	let t = String(e || "").trim();
	if (!t) return !1;
	try {
		L.set(P, t), I = null, R(t), Pe();
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
var Ie = /^[A-Za-z0-9._\-~+/]+=*$/;
function Le(e) {
	let t = String(e || "").trim();
	return t ? Ie.test(t) ? B(t) : (console.debug?.("[MJR auth] Rejected malformed security token (invalid characters)"), !1) : !1;
}
function V(e = {}) {
	I = {
		code: String(e?.code || "").trim().toUpperCase(),
		error: String(e?.error || "").trim(),
		status: Number(e?.status || 0) || 0,
		at: Date.now()
	};
}
function Re() {
	let e = I;
	if (!e) return null;
	let t = Date.now() - (Number(e.at || 0) || 0);
	return t < 0 || t > Ae ? (I = null, null) : e;
}
function ze(e) {
	let t = Re(), n = String(e?.code || "").trim().toUpperCase(), r = String(e?.error || "").trim(), i = String(t?.code || "").trim().toUpperCase(), o = String(t?.error || "").trim().toLowerCase(), s = r.toLowerCase();
	return i === "FORBIDDEN" && (o.includes("already configured") || o.includes("rotate-token")) ? a("toast.writeAuthConfiguredTokenRequired", "Write access requires the Majoor API token already configured on the server. Open Settings -> Security -> API Token and enter the matching token.") : i === "AUTH_REQUIRED" && (o.includes("sign in to comfyui") || o.includes("authenticated comfyui user")) ? a("toast.writeAuthSignInRequired", "Write access is blocked. Sign in to ComfyUI first, then retry so Majoor can bootstrap the remote session token automatically.") : i === "BOOTSTRAP_DISABLED" || i === "AUTH_REQUIRED" && o.includes("bootstrap") || n === "AUTH_REQUIRED" && s.includes("api token") ? a("toast.writeAuthBootstrapHelp", "Write access is blocked. Sign in to ComfyUI and retry so Majoor can bootstrap the remote session automatically, or set a Majoor API token in Settings -> Security.") : "";
}
function Be(e) {
	let t = String(e || "").trim();
	if (!t) return;
	let n = Date.now(), r = Me;
	if (!(r && r.message === t && n - (Number(r.at || 0) || 0) < je)) {
		Me = {
			message: t,
			at: n
		};
		try {
			M({
				summary: a("toast.writeAuthTitle", "Majoor remote write access"),
				detail: t
			}, "warning", 6500, { noHistory: !0 });
		} catch (e) {
			console.debug?.(e);
		}
	}
}
function Ve(e) {
	let t = String(e?.code || "").trim().toUpperCase(), n = String(e?.error || "").trim().toLowerCase(), r = t === "FORBIDDEN" && n.includes("write operation blocked");
	if (t !== "AUTH_REQUIRED" && !r) return e;
	let i = ze(e);
	return i ? (Be(i), {
		...e,
		error: i
	}) : e;
}
async function He() {
	try {
		let e = await fetch("/mjr/am/settings/security/bootstrap-token", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				"X-Requested-With": "XMLHttpRequest"
			},
			body: "{}"
		});
		if (!(e.headers.get("content-type") || "").includes("application/json")) return V({
			code: "INVALID_RESPONSE",
			error: `Bootstrap token request returned non-JSON response (${e.status})`,
			status: e.status
		}), {
			ok: !1,
			token: !1
		};
		let t = await e.json().catch((e) => (console.debug?.("[MJR auth] JSON parse error:", e), null));
		if (!t || typeof t != "object") return V({
			code: "INVALID_RESPONSE",
			error: "Bootstrap token response was invalid.",
			status: e.status
		}), {
			ok: !1,
			token: !1
		};
		if (!t.ok) return V({
			code: t?.code,
			error: t?.error,
			status: e.status
		}), {
			ok: !1,
			token: !1
		};
		let n = String(t?.data?.token || "").trim();
		return n ? {
			ok: B(n),
			token: !0
		} : (I = null, {
			ok: !0,
			token: !1
		});
	} catch (e) {
		return V({
			code: "NETWORK_ERROR",
			error: e?.message || "Bootstrap token request failed.",
			status: 0
		}), {
			ok: !1,
			token: !1
		};
	}
}
async function Ue({ force: e = !1, allowCookieRefresh: t = !1 } = {}) {
	let n = z();
	if (n && !e) return n;
	let r = {
		ok: !1,
		token: !1
	};
	F ||= (async () => {
		try {
			return await He();
		} finally {
			F = null;
		}
	})();
	try {
		r = await F || r;
	} catch (e) {
		console.debug?.(e);
	}
	if (e && r?.ok && !r?.token && n) Fe();
	else if (e && !r?.ok) {
		let e = Re(), t = String(e?.code || "").trim().toUpperCase();
		(!t || !["NETWORK_ERROR", "INVALID_RESPONSE"].includes(t)) && Fe();
	}
	let i = z();
	return !i && t && r?.ok ? !0 : i;
}
function We() {
	L.clear();
}
//#endregion
//#region ui/api/clientOps.ts
async function Ge(e) {
	return !e || typeof e != "string" ? {
		ok: !1,
		error: "Missing mode",
		code: "INVALID_INPUT"
	} : Y("/mjr/am/settings/probe-backend", { mode: e });
}
async function Ke() {
	return J(r.SETTINGS_METADATA_FALLBACK);
}
async function qe({ image: e, media: t } = {}) {
	return Y(r.SETTINGS_METADATA_FALLBACK, {
		image: e,
		media: t
	});
}
async function Je() {
	return J(r.SETTINGS_VECTOR_SEARCH);
}
async function Ye(e = !0) {
	if (e && typeof e == "object") {
		let t = {};
		return "enabled" in e && (t.enabled = !!e.enabled), "caption_on_index" in e && (t.caption_on_index = !!e.caption_on_index), "captionOnIndex" in e && (t.caption_on_index = !!e.captionOnIndex), "index_on_scan" in e && (t.index_on_scan = !!e.index_on_scan), "indexOnScan" in e && (t.index_on_scan = !!e.indexOnScan), "unload_after_use" in e && (t.unload_after_use = !!e.unload_after_use), "unloadAfterUse" in e && (t.unload_after_use = !!e.unloadAfterUse), "concurrency" in e && (t.concurrency = Number(e.concurrency) || 1), "vectorConcurrency" in e && (t.concurrency = Number(e.vectorConcurrency) || 1), Y(r.SETTINGS_VECTOR_SEARCH, t);
	}
	return Y(r.SETTINGS_VECTOR_SEARCH, { enabled: !!e });
}
async function Xe() {
	return Y(r.SETTINGS_VECTOR_SEARCH_UNLOAD, {});
}
async function Ze() {
	return J(r.SETTINGS_EXECUTION_GROUPING);
}
async function Qe(e = !0) {
	return Y(r.SETTINGS_EXECUTION_GROUPING, { enabled: !!e });
}
async function $e() {
	return J(r.SETTINGS_HUGGINGFACE);
}
async function et(e = "") {
	return Y(r.SETTINGS_HUGGINGFACE, { token: String(e ?? "").trim() });
}
async function tt() {
	return J(r.SETTINGS_AI_LOGGING);
}
async function nt(e = !1) {
	return Y(r.SETTINGS_AI_LOGGING, { enabled: !!e });
}
async function rt() {
	return J(r.SETTINGS_ROUTE_LOGGING);
}
async function it(e = !1) {
	return Y(r.SETTINGS_ROUTE_LOGGING, { enabled: !!e });
}
async function at() {
	return J(r.SETTINGS_STARTUP_LOGGING);
}
async function ot(e = !1) {
	return Y(r.SETTINGS_STARTUP_LOGGING, { enabled: !!e });
}
async function st() {
	return J(r.SETTINGS_LTXAV_RGB_FALLBACK);
}
async function ct(e = !1) {
	return Y(r.SETTINGS_LTXAV_RGB_FALLBACK, { enabled: !!e });
}
async function lt() {
	return J(r.SETTINGS_OUTPUT_DIRECTORY);
}
async function ut(e, t = {}) {
	let n = String(e ?? "").trim();
	return Y(r.SETTINGS_OUTPUT_DIRECTORY, { output_directory: n }, t);
}
async function dt() {
	return J(r.SETTINGS_INDEX_DIRECTORY);
}
async function ft(e, t = {}) {
	let n = String(e ?? "").trim();
	return Y(r.SETTINGS_INDEX_DIRECTORY, { index_directory: n }, t);
}
async function pt(e = {}) {
	return J(r.SETTINGS_WORKFLOW_ROOTS, e);
}
async function mt(e, t = {}) {
	let n = Array.isArray(e) ? e.map((e) => String(e ?? "").trim()).filter(Boolean) : String(e ?? "").trim();
	return Y(r.SETTINGS_WORKFLOW_ROOTS, { workflow_roots: n }, t);
}
async function ht() {
	return J("/mjr/am/settings/security");
}
async function gt(e) {
	return Y("/mjr/am/settings/security", e && typeof e == "object" ? e : {});
}
async function _t() {
	let e = await Y("/mjr/am/settings/security/bootstrap-token", {});
	if (e?.ok) try {
		let t = String(e?.data?.token || "").trim();
		t && B(t);
	} catch (e) {
		console.debug?.(e);
	}
	return e;
}
async function vt(e) {
	if (e && typeof e == "object") {
		let n = String(e.filepath || e.path || e?.file_info?.filepath || "").trim();
		return e.id == null ? Y("/mjr/am/open-in-folder", { filepath: n }) : Y("/mjr/am/open-in-folder", { asset_id: t(e.id) });
	}
	return Y("/mjr/am/open-in-folder", { asset_id: t(e) });
}
async function yt({ op: e = "", path: t = "", name: n = "", destination: i = "", recursive: a = !0 } = {}, o = {}) {
	let s = {
		op: String(e || "").trim().toLowerCase(),
		path: String(t || "").trim()
	};
	return n != null && String(n).trim() && (s.name = String(n).trim()), i != null && String(i).trim() && (s.destination = String(i).trim()), s.op === "delete" && (s.recursive = !!a), Y(r.BROWSER_FOLDER_OP, s, o);
}
async function bt(e = {}) {
	let t = (e, t) => e == null ? t : !!e, n = String(e.scope || "output").trim().toLowerCase() || "output", i = e.customRootId ?? e.custom_root_id ?? e.rootId ?? e.root_id ?? e.customRoot ?? null, a = {
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
	return i && (a.custom_root_id = String(i)), Y(r.INDEX_RESET, a);
}
async function xt({ scope: e = "output", customRootId: t = "" } = {}) {
	let n = String(e || "output").trim().toLowerCase() || "output", i = String(t || "").trim(), a = { scope: n };
	return i && (a.custom_root_id = i), Y(r.WATCHER_SCOPE, a);
}
async function St(e = {}) {
	return J(r.WATCHER_STATUS, e);
}
async function Ct(e = !0) {
	return Y(r.WATCHER_TOGGLE, { enabled: !!e });
}
async function wt() {
	return J(r.WATCHER_SETTINGS);
}
async function Tt(e = {}) {
	return Y(r.WATCHER_SETTINGS, e);
}
async function Et(e = {}) {
	return J(r.TOOLS_STATUS, e);
}
async function Dt(e = {}) {
	return J(r.STATUS, e);
}
async function Ot() {
	return Y("/mjr/am/db/force-delete", {});
}
async function kt(e = {}) {
	return J(r.DB_BACKUPS, e);
}
async function At() {
	return Y(r.DB_BACKUP_SAVE, {});
}
async function jt({ name: e = "", useLatest: t = !1 } = {}) {
	let n = {};
	return e && (n.name = String(e)), t && (n.use_latest = !0), Y(r.DB_BACKUP_RESTORE, n);
}
async function Mt(e = 250) {
	return Y("/mjr/am/duplicates/analyze", { limit: Math.max(10, Math.min(5e3, Number(e) || 250)) });
}
async function Nt({ scope: e = "output", customRootId: t = "", maxGroups: n = 6, maxPairs: r = 10 } = {}, i = {}) {
	let a = `/mjr/am/duplicates/alerts?scope=${encodeURIComponent(String(e || "output"))}`;
	return t && (a += `&custom_root_id=${encodeURIComponent(String(t))}`), a += `&max_groups=${encodeURIComponent(String(Math.max(1, Number(n) || 6)))}`, a += `&max_pairs=${encodeURIComponent(String(Math.max(1, Number(r) || 10)))}`, J(a, i);
}
async function Pt(e, t = []) {
	return Y("/mjr/am/duplicates/merge-tags", {
		keep_asset_id: Number(e) || 0,
		merge_asset_ids: Array.isArray(t) ? t.map((e) => Number(e) || 0).filter((e) => e > 0) : []
	});
}
async function Ft(e) {
	let n, r;
	if (e && typeof e == "object") {
		n = t(e.id);
		let i = String(e.filepath || e.path || e?.file_info?.filepath || "").trim();
		r = n ? { asset_id: n } : { filepath: i };
	} else n = t(e), r = { asset_id: n };
	let i = await Y("/mjr/am/asset/delete", r);
	return i?.ok && n && Lt([n]), i;
}
async function It(e) {
	let n = Array.isArray(e) ? e.map((e) => t(e)).filter(Boolean) : [], r = await Y("/mjr/am/assets/delete", { ids: n });
	return r?.ok && Lt(n), r;
}
function Lt(e) {
	try {
		let t = (Array.isArray(e) ? e : [e]).map((e) => String(e || "").trim()).filter(Boolean);
		if (!t.length) return;
		window.dispatchEvent(new CustomEvent("mjr:assets-deleted", { detail: { ids: t } }));
	} catch (e) {
		console.debug?.(e);
	}
}
async function Rt(e, n) {
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
			let e = await Cn(r);
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
		let e = await Cn(r);
		e?.ok && e?.data && (i.data = {
			...i.data || {},
			asset: e.data
		});
	} catch (e) {
		console.debug?.(e);
	}
	return i;
}
async function zt() {
	let e = typeof AbortController < "u" ? new AbortController() : null, t = null;
	try {
		return e && (t = setTimeout(() => e.abort(), 1e4)), await J("/mjr/am/collections", e ? { signal: e.signal } : {});
	} finally {
		t && clearTimeout(t);
	}
}
async function Bt(e) {
	return Y("/mjr/am/collections", { name: String(e || "").trim() });
}
async function Vt(e) {
	let t = String(e || "").trim();
	return Y(`/mjr/am/collections/${encodeURIComponent(t)}/delete`, {});
}
async function Ht(e, t) {
	let n = String(e || "").trim(), r = Array.isArray(t) ? t : [];
	return Y(`/mjr/am/collections/${encodeURIComponent(n)}/add`, { assets: r });
}
async function Ut(e, t) {
	let n = String(e || "").trim(), r = Array.isArray(t) ? t : [];
	return Y(`/mjr/am/collections/${encodeURIComponent(n)}/remove`, { filepaths: r });
}
async function Wt(e) {
	let t = String(e || "").trim();
	return J(`/mjr/am/collections/${encodeURIComponent(t)}/assets`);
}
async function Gt(e, t = 20) {
	let n = String(e || "").trim();
	if (!n) return {
		ok: !1,
		error: "Empty query"
	};
	let i = t && typeof t == "object" ? t : { topK: Number(t) }, a = Math.max(1, Math.min(200, Number(i?.topK ?? 20) || 20)), o = String(i?.scope || "").trim(), c = String(i?.customRootId || "").trim(), l = `${r.VECTOR_SEARCH}?q=${encodeURIComponent(n)}&top_k=${a}`;
	return o && (l += `&scope=${encodeURIComponent(o)}`), c && (l += `&custom_root_id=${encodeURIComponent(c)}`), l = s(l, {
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
	}), J(l, { timeoutMs: 12e4 });
}
async function Kt(e, t = 20) {
	let n = String(e || "").trim();
	if (!n) return {
		ok: !1,
		error: "Missing asset ID"
	};
	let i = t && typeof t == "object" ? t : { topK: Number(t) }, a = Math.max(1, Math.min(200, Number(i?.topK ?? 20) || 20)), o = String(i?.scope || "").trim(), s = String(i?.customRootId || "").trim(), c = `${r.VECTOR_SIMILAR}/${encodeURIComponent(n)}?top_k=${a}`;
	return o && (c += `&scope=${encodeURIComponent(o)}`), s && (c += `&custom_root_id=${encodeURIComponent(s)}`), J(c, { dedupeKey: `vec:${n}:${a}:${o}:${s}` });
}
async function qt(e) {
	let t = String(e || "").trim();
	return t ? J(`${r.VECTOR_ALIGNMENT}/${encodeURIComponent(t)}`) : {
		ok: !1,
		error: "Missing asset ID"
	};
}
async function Jt(e) {
	let t = String(e || "").trim();
	return t ? Y(`${r.VECTOR_INDEX}/${encodeURIComponent(t)}`, {}) : {
		ok: !1,
		error: "Missing asset ID"
	};
}
async function Yt() {
	return J(r.VECTOR_STATS);
}
async function Xt(e = 64, t = {}) {
	let n = Math.max(1, Math.min(200, e)), i = typeof t?.onProgress == "function" ? t.onProgress : null, a = String(t?.scope || "").trim().toLowerCase(), o = String(t?.customRootId ?? t?.custom_root_id ?? "").trim(), s = `${r.VECTOR_BACKFILL}?batch_size=${n}&async=1`;
	a && (s += `&scope=${encodeURIComponent(a)}`), o && (s += `&custom_root_id=${encodeURIComponent(o)}`);
	let c = await Y(s, {}, { timeoutMs: 3e4 });
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
	let f = Number(t?.pollIntervalMs), p = Number(t?.pollTimeoutMs), m = Number.isFinite(f) ? Math.max(500, Math.min(1e4, Math.floor(f))) : an, h = Number.isFinite(p) ? Math.max(1e4, Math.min(sn, Math.floor(p))) : on, g = Date.now(), _ = null;
	for (; Date.now() - g < h;) {
		await y(m);
		let e = await J(`${r.VECTOR_BACKFILL_STATUS}?backfill_id=${encodeURIComponent(d)}`, { timeoutMs: 3e4 });
		if (!e?.ok) {
			_ = e;
			continue;
		}
		let t = e?.data || {}, n = String(t?.status || "").toLowerCase();
		_ = e;
		try {
			i?.(t);
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
	let v = await J(`${r.VECTOR_BACKFILL_STATUS}?backfill_id=${encodeURIComponent(d)}`, { timeoutMs: 3e4 }), b = v?.data || _?.data || {}, x = String(b?.status || "").toLowerCase();
	if (v?.ok && [
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
async function Zt(e) {
	let t = String(e || "").trim();
	return t ? Y(`${r.VECTOR_CAPTION}/${encodeURIComponent(t)}`, {}) : {
		ok: !1,
		error: "Missing asset ID"
	};
}
async function Qt(e, { topK: t = 50, scope: n = "output", customRootId: i = "", subfolder: a = null, kind: o = null, hasWorkflow: c = null, minRating: l = null, minSizeMB: u = null, maxSizeMB: d = null, minWidth: f = null, minHeight: p = null, maxWidth: m = null, maxHeight: h = null, workflowType: g = null, workflowId: _ = null, dateRange: v = null, dateExact: y = null } = {}) {
	let b = String(e || "").trim();
	if (!b) return {
		ok: !1,
		error: "Empty query"
	};
	let x = `${r.HYBRID_SEARCH}?q=${encodeURIComponent(b)}&top_k=${Math.max(1, Math.min(200, t))}&scope=${encodeURIComponent(n)}`;
	return i && (x += `&custom_root_id=${encodeURIComponent(i)}`), x = s(x, {
		subfolder: a,
		kind: o,
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
	}), J(x, { timeoutMs: 12e4 });
}
async function $t(e = 8) {
	return Y(r.VECTOR_SUGGEST_COLLECTIONS, { k: Math.max(2, Math.min(20, e)) });
}
//#endregion
//#region ui/api/client.ts
var en = 3e4, tn = "__MJR_API_CLIENT__", nn = 2e3, rn = 200, an = 1e3, on = 30 * 6e4, sn = 720 * 6e4, H = "settings", cn = "available-tags", U = T({
	ttlMs: nn,
	maxSize: 1
}), W = T({
	ttlMs: nn,
	maxSize: 1
}), G = T({
	ttlMs: () => fn(),
	maxSize: 1
}), ln = new Set([
	"1",
	"true",
	"yes",
	"on"
]), un = new Set([
	"0",
	"false",
	"no",
	"off"
]);
function dn(e, t = !1) {
	if (typeof e == "boolean") return e;
	if (typeof e == "number") return e !== 0;
	if (typeof e == "string") {
		let t = e.trim().toLowerCase();
		if (ln.has(t)) return !0;
		if (un.has(t)) return !1;
	}
	return !!t;
}
function fn() {
	try {
		let e = localStorage?.getItem?.("mjrSettings") || "{}", t = JSON.parse(e), n = t?.cache?.tagsTTLms ?? t?.cache?.tagsTTL ?? t?.cache?.tags_ttl_ms ?? null, r = Number(n);
		return Number.isFinite(r) ? Math.max(1e3, Math.min(10 * 6e4, Math.floor(r))) : en;
	} catch {
		return en;
	}
}
function pn() {
	U.clear();
}
function mn() {
	W.clear();
}
function K() {
	G.clear();
}
function hn(e) {
	return String(e ?? "").trim().toLowerCase() || "";
}
function gn(e) {
	let t = [], n = /* @__PURE__ */ new Set();
	for (let r of Array.isArray(e) ? e : []) {
		let e = String(r ?? "").trim();
		if (!e) continue;
		let i = hn(e);
		!i || n.has(i) || (n.add(i), t.push(e));
	}
	return t;
}
try {
	let e = typeof window < "u" ? window : null;
	e && !e[tn] && (e[tn] = { initialized: !0 }, e.addEventListener?.("storage", (e) => {
		try {
			e?.key === "mjrSettings" && (pn(), mn(), K(), We());
		} catch (e) {
			console.debug?.(e);
		}
	}), e.addEventListener?.("mjr-settings-changed", () => {
		pn(), mn(), K(), We();
	}));
} catch (e) {
	console.debug?.(e);
}
var _n = () => {
	let e = U.get(H);
	if (e !== void 0) return e;
	let t = Date.now();
	try {
		let e = localStorage?.getItem?.(l);
		if (!e) return U.set(H, !1, { at: t }), !1;
		let n = !!JSON.parse(e)?.observability?.enabled;
		return U.set(H, n, { at: t }), n;
	} catch {
		return U.set(H, !1, { at: t }), !1;
	}
}, vn = () => {
	let e = W.get(H);
	if (e !== void 0) return e;
	let t = Date.now();
	try {
		let e = localStorage?.getItem?.(l);
		if (!e) return W.set(H, !0, { at: t }), !0;
		let n = JSON.parse(e)?.ratingTagsSync?.enabled, r = n == null ? !0 : dn(n, !0);
		return W.set(H, r, { at: t }), r;
	} catch {
		return W.set(H, !0, { at: t }), !0;
	}
}, q = se({
	readObsEnabled: _n,
	readAuthToken: z,
	ensureWriteAuthToken: Ue,
	normalizeWriteAuthFailure: Ve
}), yn = q.fetchAPI;
async function J(e, t = {}) {
	return q.get(e, t);
}
async function Y(e, t, n = {}) {
	return q.post(e, t, n);
}
async function bn(e, n, r = {}) {
	let i = vn(), a = e && typeof e == "object" ? e : null, o = t(a ? a.id : e), s = { rating: Math.max(0, Math.min(5, Number(n) || 0)) };
	return o ? s.asset_id = o : a && (s.filepath = a.filepath || a.path || a?.file_info?.filepath || "", s.type = a.type || "output", s.root_id = c(a)), yn("/mjr/am/asset/rating", {
		...r,
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			...i ? { "X-MJR-RTSYNC": "on" } : {}
		},
		body: JSON.stringify(s)
	});
}
async function xn(e, n, i = {}) {
	let a = vn(), o = e && typeof e == "object" ? e : null, s = t(o ? o.id : e), l = String(o?.kind || o?.type || "").trim().toLowerCase() === "workflow", u = String(o?.filepath || o?.path || o?.file_info?.filepath || "").trim(), d = { tags: Array.isArray(n) ? n : [] };
	l && u ? d.filepath = u : s ? d.asset_id = s : o && (d.filepath = o.filepath || o.path || o?.file_info?.filepath || "", d.type = o.type || "output", d.root_id = c(o));
	let f = await yn(l && u ? r.WORKFLOWS_TAGS : "/mjr/am/asset/tags", {
		...i,
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			...a ? { "X-MJR-RTSYNC": "on" } : {}
		},
		body: JSON.stringify(d)
	});
	return f?.ok && K(), f;
}
async function Sn() {
	let e = G.get(cn);
	if (Array.isArray(e)) return {
		ok: !0,
		data: e,
		error: null,
		code: "OK",
		meta: { cached: !0 }
	};
	let t = await J("/mjr/am/tags");
	if (t?.ok && Array.isArray(t.data)) {
		let e = gn(t.data);
		return G.set(cn, e), {
			...t,
			data: e
		};
	}
	return t;
}
async function Cn(e, n = {}) {
	let r = encodeURIComponent(t(e));
	return J(`/mjr/am/asset/${r}`, {
		...n,
		dedupeKey: n?.dedupeKey || `meta:${r}`
	});
}
async function wn(e, n = {}) {
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
async function Tn(e, t = {}) {
	let n = Array.isArray(e) ? e : [], r = [];
	for (let e of n) {
		let t = Number(e);
		if (Number.isFinite(t) && (r.push(Math.trunc(t)), r.length >= rn)) break;
	}
	return r.length ? Y("/mjr/am/assets/batch", { asset_ids: r }, t) : {
		ok: !0,
		data: [],
		error: null,
		code: "OK"
	};
}
async function En(e, t = {}) {
	let n = o(e);
	return n ? J(n, t) : {
		ok: !1,
		data: null,
		error: "Missing workflow filepath",
		code: "INVALID_INPUT"
	};
}
async function Dn({ workflow: e = null, name: t = "", category: n = "", overwrite: i = !1, filepath: a = "" } = {}, o = {}) {
	return Y(r.WORKFLOWS_SAVE, {
		workflow: e,
		name: t,
		category: n,
		overwrite: i,
		filepath: a
	}, o);
}
async function On({ filepath: e = "", name: t = "" } = {}, n = {}) {
	return Y(r.WORKFLOWS_DUPLICATE, {
		filepath: e,
		name: t
	}, n);
}
async function kn({ filepath: e = "", name: t = "", category: n = "" } = {}, i = {}) {
	return Y(r.WORKFLOWS_MOVE, {
		filepath: e,
		name: t,
		category: n
	}, i);
}
async function An({ filepath: e = "" } = {}, t = {}) {
	return Y(r.WORKFLOWS_DELETE, { filepath: e }, t);
}
async function jn({ filepath: e = "" } = {}, t = {}) {
	return Y(r.WORKFLOWS_MARK_LOADED, { filepath: e }, t);
}
async function Mn({ filepath: e = "", favorite: t = !1 } = {}, n = {}) {
	return Y(r.WORKFLOWS_FAVORITE, {
		filepath: e,
		favorite: !!t
	}, n);
}
async function Nn({ filepath: e = "", task: t = "", model_family: n = "", provider: i = "", runs_on: a = "", notes: o = "" } = {}, s = {}) {
	return Y(r.WORKFLOWS_INFO, {
		filepath: e,
		task: t,
		model_family: n,
		provider: i,
		runs_on: a,
		notes: o
	}, s);
}
async function Pn({ filepath: e = "", limit: t = 12 } = {}, n = {}) {
	let i = Math.max(1, Math.min(50, Number(t) || 12));
	return J(`${r.WORKFLOWS_THUMBNAIL_CANDIDATES}?filepath=${encodeURIComponent(String(e || "").trim())}&limit=${encodeURIComponent(String(i))}`, n);
}
async function Fn(e = {}) {
	return J(r.WORKFLOWS_MODEL_FAMILIES, e);
}
async function In({ q: e = "*", limit: t = 100, offset: n = 0, sort: i = "mtime" } = {}, a = {}) {
	let o = Math.max(1, Math.min(500, Number(t) || 100)), s = Math.max(0, Number(n) || 0);
	return J(`${r.LIST}?scope=workflow&q=${encodeURIComponent(String(e || "*"))}&limit=${encodeURIComponent(String(o))}&offset=${encodeURIComponent(String(s))}&sort=${encodeURIComponent(String(i || "mtime"))}`, a);
}
async function Ln({ filepath: e = "", source_filepath: t = "" } = {}, n = {}) {
	return Y(r.WORKFLOWS_THUMBNAIL_SET, {
		filepath: e,
		source_filepath: t
	}, n);
}
async function Rn({ type: e = "output", filename: t = "", subfolder: n = "", root_id: r = "", rootId: i = "", filepath: a = "" } = {}, o = {}) {
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
async function zn({ filepath: e = "", root_id: t = "", subfolder: n = "" } = {}, i = {}) {
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
	let a = String(e || "").trim(), o = String(t || "").trim(), s = String(n || "").trim(), c = r.FOLDER_INFO, l = [];
	a ? (l.push(`filepath=${encodeURIComponent(a)}`), l.push("browser_mode=1")) : (o && l.push(`root_id=${encodeURIComponent(o)}`), s && l.push(`subfolder=${encodeURIComponent(s)}`)), l.length && (c += `?${l.join("&")}`);
	let u = await J(c, i);
	try {
		!u?.ok && Number(u?.status || 0) === 404 && (globalThis.__mjrFolderInfoSupported = !1);
	} catch (e) {
		console.debug?.(e);
	}
	return u;
}
//#endregion
//#region ui/utils/logging.ts
function Bn(e, ...t) {
	try {
		n.DEBUG_VERBOSE_ERRORS && console.debug(e, ...t);
	} catch {}
}
function Vn(e, t = "Majoor", { showToast: r = !1, toastType: i = "error" } = {}) {
	let a = e?.message || String(e || "Unknown error");
	try {
		n.DEBUG_VERBOSE_ERRORS ? console.error(`[Majoor][${t}]`, a, e) : console.debug(`[Majoor][${t}]`, a);
	} catch (e) {
		console.debug?.(e);
	}
	if (r && n.DEBUG_VERBOSE_ERRORS) try {
		M(`${t}: ${a}`, i, 4e3);
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
function Hn() {
	return X;
}
function Un(e) {
	X.scope = e == null ? null : String(e);
}
function Wn() {
	return !!X.suspended;
}
function Gn(e) {
	X.ratingHotkeysActive = !!e;
}
//#endregion
//#region ui/features/viewer/viewerRuntimeHosts.ts
var Z = null, Q = null, Kn = ".mjr-viewer-overlay", qn = ".mjr-mfv";
function Jn(e) {
	return !!e && typeof e.appendChild == "function";
}
function Yn() {
	return typeof document > "u" ? null : document?.body || null;
}
function Xn() {
	return typeof document > "u" ? null : document?.body || document?.documentElement || null;
}
function Zn(e) {
	return Jn(e) ? e === Yn() ? !0 : typeof e?.isConnected == "boolean" ? e.isConnected : !0 : !1;
}
function Qn(e) {
	return Jn(e) ? e : null;
}
function $(e) {
	return Zn(e) ? e : Yn();
}
function $n(e) {
	let t = Xn();
	return Zn(t) ? t : $(e);
}
function er(e, t, n = $) {
	let r = [], i = /* @__PURE__ */ new Set();
	for (let a of [
		n(t),
		Yn(),
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
function tr(e, t, n = $) {
	let r = n(t);
	if (!r) return;
	let i = er(e, t, n);
	for (let e of i) if (e && e.parentNode !== r) try {
		r.appendChild(e);
	} catch (e) {
		console.debug?.(e);
	}
}
function nr(e) {
	return Z = Qn(e), tr(Kn, Z), () => rr(e);
}
function rr(e) {
	(!e || Z === e) && (Z = null);
}
function ir(e) {
	return Q = Qn(e), tr(qn, Q, $n), () => ar(e);
}
function ar(e) {
	(!e || Q === e) && (Q = null);
}
function or(e) {
	let t = $(Z);
	try {
		t?.appendChild?.(e);
	} catch (e) {
		console.debug?.(e);
	}
	return t;
}
function sr(e) {
	let t = $n(Q);
	try {
		t?.appendChild?.(e);
	} catch (e) {
		console.debug?.(e);
	}
	return t;
}
function cr() {
	return er(Kn, Z);
}
//#endregion
export { ht as $, Nn as A, Mt as At, Vt as B, Yt as Bt, Pn as C, Ge as Ct, Y as D, Ye as Dt, kn as E, ot as Et, _t as F, Kt as Ft, Ze as G, de as Gt, tt as H, Le as Ht, yt as I, Zt as It, st as J, be as Jt, $e as K, Ce as Kt, Bt as L, qt as Lt, bn as M, Xe as Mt, xn as N, Tt as Nt, Dn as O, xt as Ot, Ht as P, Xt as Pt, Dt as Q, l as Qt, Ft as R, Jt as Rt, Fn as S, ut as St, jn as T, gt as Tt, Wt as U, M as Ut, Ot as V, $t as Vt, Nt as W, Ee as Wt, lt as X, T as Xt, Ke as Y, Se as Yt, rt as Z, u as Zt, Sn as _, Qe as _t, nr as a, pt as at, wn as b, ct as bt, Un as c, kt as ct, Vn as d, Ut as dt, at as et, An as f, Rt as ft, Tn as g, nt as gt, Cn as h, At as ht, ir as i, St as it, Ln as j, Ct as jt, Mn as k, mt as kt, Gn as l, Pt as lt, J as m, jt as mt, or as n, Je as nt, Hn as o, Qt as ot, On as p, bt as pt, dt as q, xe as qt, cr as r, wt as rt, Wn as s, zt as st, sr as t, Et as tt, Bn as u, vt as ut, Rn as v, et as vt, In as w, it as wt, En as x, qe as xt, zn as y, ft as yt, It as z, Gt as zt };
