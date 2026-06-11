import { $ as e, D as t, L as n, _t as r, a as i, et as a, ft as o, gt as s, ht as c, p as l, r as u } from "./events-DhWnn1NH.js";
//#region ui/app/settingsStore.ts
var d = "mjrSettings", f = "mjrMinimapSettings", p = new Set([
	"POST",
	"PUT",
	"DELETE",
	"PATCH"
]), m = 2e4, h = 3e5, ee = 3, g = 400, _ = "/mjr/am/settings/security/bootstrap-token", v = "/mjr/am/", y = /* @__PURE__ */ new Map();
function b(e) {
	return new Promise((t) => setTimeout(t, e));
}
function x(e) {
	return p.has(String(e || "").trim().toUpperCase());
}
function te(e) {
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
function ne(e) {
	return te(e).startsWith(v);
}
function S(e) {
	return te(e) === _;
}
function re(e) {
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
function ie(e = {}) {
	try {
		let t = Number(e?.timeoutMs);
		return Number.isFinite(t) ? Math.max(1e3, Math.min(h, Math.floor(t))) : m;
	} catch {
		return m;
	}
}
function ae(e = {}) {
	let t = e?.signal || null;
	if (typeof AbortController > "u") return {
		signal: t || void 0,
		timeoutMs: ie(e),
		cleanup: () => {}
	};
	let n = ie(e), r = new AbortController(), i = null, a = () => {
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
function oe(e, t, n = {}) {
	let r = String(e || "GET").trim().toUpperCase(), i = String(t || "").trim();
	return !r || !i ? "" : `${r}:${i}:timeout=${ie(n)}`;
}
function se(e, t) {
	let n = String(e || "").trim();
	if (!n) return t();
	if (y.has(n)) return y.get(n);
	let r = Promise.resolve().then(() => t()).finally(() => {
		try {
			y.delete(n);
		} catch (e) {
			console.debug?.(e);
		}
	});
	return y.set(n, r), r;
}
function ce(e, t, n) {
	if (x(t)) try {
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
function le(e, t) {
	if (t) try {
		e instanceof Headers ? (e.has("X-MJR-Token") || e.set("X-MJR-Token", t), e.has("Authorization") || e.set("Authorization", `Bearer ${t}`)) : ("X-MJR-Token" in e || (e["X-MJR-Token"] = t), "Authorization" in e || (e.Authorization = `Bearer ${t}`));
	} catch (e) {
		console.debug?.(e);
	}
}
async function ue(e, t, n, r, { ensureWriteAuthToken: i, normalizeWriteAuthFailure: a, fetchAPI: o, options: s, retryCount: c }) {
	let l = e.headers.get("content-type") || "";
	if (!l.includes("application/json")) return !r && x(n) && ne(t) && !S(t) && Number(e.status || 0) === 401 && await i({
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
	return !r && x(n) && !S(t) && !u?.ok && (String(u?.code || "").toUpperCase() === "AUTH_REQUIRED" || Number(u?.status || 0) === 401) && await i({
		force: !0,
		allowCookieRefresh: !0
	}) ? await o(t, {
		...s,
		_authRetryDone: !0
	}, c) : (x(n) && ne(t) && !S(t) && (u = a(u)), u);
}
function de({ readObsEnabled: e = () => !1, readAuthToken: t = () => "", ensureWriteAuthToken: n = async () => "", normalizeWriteAuthFailure: r = (e) => e, trackApiCall: i = null } = {}) {
	async function a(o, s = {}, c = 0) {
		let l = typeof performance < "u" ? performance.now() : Date.now(), u = ae(s), d = null;
		try {
			let i = (s.method || "GET").toUpperCase(), l = !!s?._authRetryDone, f = typeof Headers < "u" ? new Headers(s.headers || {}) : { ...s.headers };
			ce(f, i, !!e());
			let p = t();
			if (!p && x(i) && ne(o) && !S(o)) {
				try {
					await n();
				} catch (e) {
					console.debug?.(e);
				}
				p = t();
			}
			le(f, p);
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
			return d = await ue(await fetch(o, m), o, i, l, {
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
			if (c < ee && re(e)) {
				try {
					await b(g * (c + 1));
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
		return se(t?.dedupe === !1 ? "" : String(t?.dedupeKey || "").trim() || oe("GET", e, t), () => a(e, {
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
var fe = "mjr_toast_history_v1", pe = "mjr_toast_history_last_read_v1", me = 60, he = "mjr:toast-history-changed", w = null;
function T(e) {
	return String(e || "").trim();
}
function ge(e) {
	let t = T(e).toLowerCase();
	return t === "warn" ? "warning" : t === "danger" ? "error" : t || "info";
}
function _e(e) {
	let t = Number(e);
	return Number.isFinite(t) ? t : null;
}
function ve(e) {
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
function ye(e, t, n) {
	return e && t ? `${e}: ${t}` : t || e || n || "";
}
function be(e, t = "info", n = null) {
	if (!e || typeof e != "object") return null;
	let r = T(e.title || e.summary), i = T(e.detail), a = T(e.message || ye(r, i, T(e.fallbackMessage)));
	if (!a) return null;
	let o = _e(e.durationMs ?? e.duration ?? n), s = Number(e.createdAt), l = Number.isFinite(s) && s > 0 ? s : Date.now(), u = typeof e.persistent == "boolean" ? e.persistent : !(Number.isFinite(o) && (o ?? 0) > 0);
	return {
		id: T(e.id) || c(`th-${l}-`, 4),
		message: a,
		title: r,
		detail: i,
		type: ge(e.type || t),
		createdAt: l,
		durationMs: o,
		persistent: u,
		source: T(e.source),
		trackId: T(e.trackId),
		status: T(e.status),
		operation: T(e.operation),
		progress: ve(e.progress),
		forceStore: !!e.forceStore,
		actionLabel: T(e.actionLabel),
		actionUrl: T(e.actionUrl)
	};
}
function xe() {
	if (w === null) try {
		let e = localStorage.getItem(fe), t = e ? JSON.parse(e) : [];
		w = Array.isArray(t) ? t.map((e) => {
			if (e && typeof e == "object") return be(e);
			let t = T(e);
			return t ? be({ message: t }) : null;
		}).filter(Boolean) : [];
	} catch {
		w = [];
	}
}
function Se() {
	try {
		localStorage.setItem(fe, JSON.stringify(w));
	} catch {}
}
function Ce() {
	try {
		window.dispatchEvent(new CustomEvent(he));
	} catch {}
}
function we() {
	try {
		return Number(localStorage.getItem(pe)) || 0;
	} catch {
		return 0;
	}
}
function Te(e) {
	try {
		localStorage.setItem(pe, String(Number(e) || 0));
	} catch {}
}
function Ee(e, t, n) {
	xe();
	let r = be(e && typeof e == "object" ? e : {
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
	w.unshift(r), w.length > me && (w = w.slice(0, me)), Se(), Ce();
}
function De() {
	return xe(), w.map((e) => ({ ...e }));
}
function Oe() {
	xe();
	let e = we();
	return w.filter((t) => t.createdAt > e).length;
}
function ke() {
	Te(Date.now()), Ce();
}
function Ae() {
	xe(), w = [], Se(), Te(Date.now()), Ce();
}
//#endregion
//#region ui/app/toast.ts
function je(e) {
	let t = String(e || "info").trim().toLowerCase();
	return t === "warn" ? "warning" : t === "danger" ? "error" : t === "success" || t === "warning" || t === "error" ? t : "info";
}
function Me(e) {
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
function Ne(e, t, n, r) {
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
	return e && typeof e == "object" ? (a.title = String(i?.title || e.summary || "").trim(), a.detail = String(i?.detail || e.detail || e.message || "").trim(), a.message = Me(e), a) : (a.title = String(i?.title || "").trim(), a.detail = String(i?.detail || "").trim(), a.message = Me(e), a);
}
function Pe(e, t = "info", n, r) {
	try {
		let i = Ne(e, t, n, r);
		i.forceStore = !0, Ee(i, t, n ?? void 0);
	} catch {}
}
function Fe(e) {
	switch (e) {
		case "success": return 2e3;
		case "info": return 3e3;
		case "warning": return 4e3;
		case "error": return 5e3;
		default: return 5e3;
	}
}
function Ie(e) {
	if (typeof e != "string") return e;
	let t = e.trim(), n = {
		"Failed to update rating": l("toast.ratingUpdateFailed", "Failed to update rating"),
		"Error updating rating": l("toast.ratingUpdateError", "Error updating rating"),
		"Rating cleared": l("toast.ratingCleared", "Rating cleared"),
		"Failed to update tags": l("toast.tagsUpdateFailed", "Failed to update tags"),
		"Tags updated": l("toast.tagsUpdated", "Tags updated"),
		"Failed to toggle watcher": l("toast.watcherToggleFailed", "Failed to toggle watcher"),
		"No valid assets selected.": l("toast.noValidAssetsSelected", "No valid assets selected."),
		"Name collision in current view": l("toast.nameCollisionInView", "Name collision in current view"),
		"Failed to create collection.": l("toast.failedCreateCollectionDot", "Failed to create collection."),
		"Failed to add assets to collection.": l("toast.failedAddAssetsToCollection", "Failed to add assets to collection."),
		"Failed to remove from collection.": l("toast.removeFromCollectionFailed", "Failed to remove from collection."),
		"Collection created": l("toast.collectionCreated", "Collection created"),
		"Added to collection": l("toast.addedToCollection", "Added to collection"),
		"Removed from collection": l("toast.removedFromCollection", "Removed from collection"),
		"File renamed successfully!": l("toast.fileRenamedSuccess", "File renamed successfully!"),
		"Failed to rename file": l("toast.fileRenameFailed", "Failed to rename file"),
		"Failed to rename file.": l("toast.fileRenameFailed", "Failed to rename file."),
		"File deleted successfully!": l("toast.fileDeletedSuccess", "File deleted successfully!"),
		"Failed to delete file.": l("toast.fileDeleteFailed", "Failed to delete file."),
		"Failed to delete file. ": l("toast.fileDeleteFailed", "Failed to delete file."),
		"File deleted": l("toast.deleted", "File deleted"),
		"File renamed": l("toast.renamed", "File renamed"),
		"Folder created": l("toast.folderCreated", "Folder created"),
		"Folder renamed": l("toast.folderRenamed", "Folder renamed"),
		"Folder moved": l("toast.folderMoved", "Folder moved"),
		"Folder deleted": l("toast.folderDeleted", "Folder deleted"),
		"Failed to create folder": l("toast.createFolderFailed", "Failed to create folder"),
		"Failed to rename folder": l("toast.renameFolderFailed", "Failed to rename folder"),
		"Failed to move folder": l("toast.moveFolderFailed", "Failed to move folder"),
		"Failed to delete folder": l("toast.deleteFolderFailed", "Failed to delete folder"),
		"Failed to pin folder": l("toast.pinFolderFailed", "Failed to pin folder"),
		"Failed to unpin folder": l("toast.unpinFolderFailed", "Failed to unpin folder"),
		"Folder pinned as browser root": l("toast.folderPinnedAsBrowserRoot", "Folder pinned as browser root"),
		"Folder added": l("toast.folderAdded", "Folder added"),
		"Folder removed": l("toast.folderRemoved", "Folder removed"),
		"Folder linked successfully": l("toast.folderLinked", "Folder linked successfully"),
		"An error occurred while adding the custom folder": l("toast.errorAddingFolder", "An error occurred while adding the custom folder"),
		"An error occurred while removing the custom folder": l("toast.errorRemovingFolder", "An error occurred while removing the custom folder"),
		"Failed to add custom folder": l("toast.failedAddFolder", "Failed to add custom folder"),
		"Failed to remove custom folder": l("toast.failedRemoveFolder", "Failed to remove custom folder"),
		"Native folder browser unavailable. Please enter path manually.": l("toast.nativeBrowserUnavailable", "Native folder browser unavailable. Please enter path manually."),
		"Opened in folder": l("toast.openedInFolder", "Opened in folder"),
		"Failed to open folder": l("toast.openFolderFailed", "Failed to open folder"),
		"Failed to open folder.": l("toast.openFolderFailed", "Failed to open folder."),
		"File path copied to clipboard": l("toast.pathCopied", "File path copied to clipboard"),
		"Failed to copy path": l("toast.pathCopyFailed", "Failed to copy path"),
		"Failed to copy to clipboard": l("toast.copyClipboardFailed", "Failed to copy to clipboard"),
		"No file path available for this asset.": l("toast.noFilePath", "No file path available for this asset."),
		"Failed to refresh metadata.": l("toast.metadataRefreshFailed", "Failed to refresh metadata."),
		"Metadata refreshed": l("toast.metadataRefreshed", "Metadata refreshed"),
		"Duplicate analysis started": l("toast.dupAnalysisStarted", "Duplicate analysis started"),
		"Tags merged": l("toast.tagsMerged", "Tags merged"),
		"Duplicates deleted": l("toast.duplicatesDeleted", "Duplicates deleted"),
		"Rescanning file...": l("toast.rescanningFile", "Rescanning file..."),
		"Metadata enrichment complete": l("toast.enrichmentComplete", "Metadata enrichment complete"),
		"Playback speed is available for video media only": l("toast.playbackVideoOnly", "Playback speed is available for video media only"),
		"DB backup saved": l("toast.dbSaveSuccess", "DB backup saved"),
		"Failed to save DB backup": l("toast.dbSaveFailed", "Failed to save DB backup"),
		"DB restore started": l("toast.dbRestoreStarted", "DB restore started"),
		"Failed to restore DB backup": l("toast.dbRestoreFailed", "Failed to restore DB backup"),
		"Select a DB backup first": l("toast.dbRestoreSelect", "Select a DB backup first"),
		"Stopping running workers": l("toast.dbRestoreStopping", "Stopping running workers"),
		"Unlocking and resetting database": l("toast.dbRestoreResetting", "Unlocking and resetting database"),
		"Recreating database": l("toast.dbRestoreReplacing", "Recreating database"),
		"Replacing database files": l("toast.dbRestoreReplacing", "Replacing database files"),
		"Restarting scan": l("toast.dbRestoreRescan", "Restarting scan"),
		"Deleting database and rebuilding...": l("toast.dbDeleteTriggered", "Deleting database and rebuilding..."),
		"Database deleted and rebuilt. Files are being reindexed.": l("toast.dbDeleteSuccess", "Database deleted and rebuilt. Files are being reindexed."),
		"Failed to delete database": l("toast.dbDeleteFailed", "Failed to delete database"),
		"Database backup restored": l("toast.dbRestoreSuccess", "Database backup restored"),
		"Index reset started. Files will be reindexed in the background.": l("toast.resetStarted", "Index reset started. Files will be reindexed in the background."),
		"Failed to reset index": l("toast.resetFailed", "Failed to reset index"),
		"Reset triggered: Reindexing all files...": l("toast.resetTriggered", "Reset triggered: Reindexing all files..."),
		"Reset failed - database is corrupted. Use the \"Delete DB\" button to force-delete and rebuild.": l("toast.resetFailedCorrupt", "Reset failed - database is corrupted. Use the \"Delete DB\" button to force-delete and rebuild."),
		"Scan started": l("toast.scanStarted", "Scan started"),
		"Scan complete": l("toast.scanComplete", "Scan complete"),
		"Scan failed": l("toast.scanFailed", "Scan failed"),
		"Permission denied": l("toast.permissionDenied", "Permission denied"),
		"Language changed. Reload the page for full effect.": l("toast.languageChanged", "Language changed. Reload the page for full effect."),
		"Tag added": l("toast.tagAdded", "Tag added"),
		"Tag removed": l("toast.tagRemoved", "Tag removed"),
		"Rating saved": l("toast.ratingSaved", "Rating saved"),
		"Failed to create collection": l("toast.failedCreateCollection", "Failed to create collection"),
		"Failed to delete collection": l("toast.failedDeleteCollection", "Failed to delete collection")
	};
	if (n[t]) return n[t];
	let r;
	if (r = t.match(/Rating set to (\d+) star(?:s)?/i), r) return l("toast.ratingSetN", "Rating set to {n} stars", { n: Number(r[1]) });
	if (r = t.match(/Downloading (.+?)\.\.\./i), r) return l("toast.downloadingFile", "Downloading {filename}...", { filename: r[1] });
	if (r = t.match(/Playback ([0-9]+(?:\.[0-9]+)?)x/i), r) return l("toast.playbackRate", "Playback {rate}x", { rate: Number(r[1]).toFixed(2) });
	if (r = t.match(/Metadata refreshed(?:\s*(.*))?/i), r) return l("toast.metadataRefreshed", "Metadata refreshed{suffix}", { suffix: r[1] ? " (" + r[1] + ")" : "" });
	if (r = t.match(/Error renaming(?: file)?:\s*(.+)/i), r) return l("toast.errorRenaming", "Error renaming file: {error}", { error: r[1] });
	if (r = t.match(/Error deleting(?: files?| file)?:\s*(.+)/i), r) return l("toast.errorDeleting", "Error deleting file: {error}", { error: r[1] });
	if (r = t.match(/Tag merge failed:\s*(.+)/i), r) return l("toast.tagMergeFailed", "Tag merge failed: {error}", { error: r[1] });
	if (r = t.match(/Delete failed:\s*(.+)/i), r) return l("toast.deleteFailed", "Delete failed: {error}", { error: r[1] });
	if (r = t.match(/Analysis not started:\s*(.+)/i), r) return l("toast.analysisNotStarted", "Analysis not started: {error}", { error: r[1] });
	if (r = t.match(/(\d+)\s+files deleted successfully!/i), r) return l("toast.filesDeletedSuccessN", "{n} files deleted successfully!", { n: Number(r[1]) });
	if (r = t.match(/(\d+)\s+files deleted,\s+(\d+)\s+failed\./i), r) return l("toast.filesDeletedPartial", "{success} files deleted, {failed} failed.", {
		success: Number(r[1]),
		failed: Number(r[2])
	});
	if (r = t.match(/(\d+)\s+files?\s+deleted/i), r) return l("toast.filesDeletedShort", "{n} files deleted", { n: Number(r[1]) });
	if (r = t.match(/(\d+)\s+deleted,\s+(\d+)\s+failed/i), r) return l("toast.filesDeletedShortPartial", "{success} deleted, {failed} failed", {
		success: Number(r[1]),
		failed: Number(r[2])
	});
	if (r = t.match(/^(.+?)\s+copied to clipboard!$/i), r) return l("toast.copiedToClipboardNamed", "{name} copied to clipboard!", { name: r[1] });
	if (r = t.match(/Folder created:\s*(.+)/i), r) return l("toast.folderCreated", "Folder created: {name}", { name: r[1] });
	if (r = t.match(/Failed to create folder:\s*(.+)/i), r) return l("toast.createFolderFailedDetail", "Failed to create folder: {error}", { error: r[1] });
	if (r = t.match(/Failed to rename folder:\s*(.+)/i), r) return l("toast.renameFolderFailedDetail", "Failed to rename folder: {error}", { error: r[1] });
	if (r = t.match(/Failed to move folder:\s*(.+)/i), r) return l("toast.moveFolderFailedDetail", "Failed to move folder: {error}", { error: r[1] });
	if (r = t.match(/Failed to delete folder:\s*(.+)/i), r) return l("toast.deleteFolderFailedDetail", "Failed to delete folder: {error}", { error: r[1] });
	if (r = t.match(/Error removing from collection:\s*(.+)/i), r) return l("toast.removeFromCollectionError", "Error removing from collection: {error}", { error: r[1] });
	if (r = t.match(/^Failed to (.+)$/i), r) {
		let e = r[1].toLowerCase(), t = {
			"add folder": l("toast.failedAddFolder", "Failed to add custom folder"),
			"remove folder": l("toast.failedRemoveFolder", "Failed to remove custom folder"),
			"create collection": l("toast.failedCreateCollection", "Failed to create collection"),
			"delete collection": l("toast.failedDeleteCollection", "Failed to delete collection")
		};
		for (let [n, r] of Object.entries(t)) if (e.includes(n)) return r;
	}
	return t;
}
function Le(e, n = "info", r, i) {
	if (n = je(n), e = Ie(e), r ??= Fe(n), !i?.noHistory) try {
		Ee(Ne(e, n, r, i), n, r ?? void 0);
	} catch {}
	let a = !(Number.isFinite(Number(r)) && Number(r) > 0);
	try {
		let i = t();
		if (i && typeof i.add == "function") {
			let t = n;
			t === "warning" && (t = "warn");
			let o = l("manager.title"), s = e;
			if (typeof e == "object" && e?.summary) o = e.summary, s = e.detail || "";
			else if (typeof e != "string") try {
				s = e.message || String(e);
			} catch (e) {
				console.debug?.(e);
			}
			let c = {
				severity: t,
				summary: o,
				detail: s
			};
			a || (c.life = r), i.add(c);
			return;
		}
	} catch (e) {
		console.debug("Majoor: extensionManager.toast failed", e);
	}
	let o = globalThis?.app || (typeof window < "u" ? window?.app : null);
	if (o?.ui?.toast) try {
		return o.ui.toast(e, n);
	} catch (e) {
		console.debug("Native app.ui.toast failed", e);
	}
	console.warn("[Majoor Toast] Native toast API unavailable", {
		type: n,
		message: Me(e),
		duration: a ? 0 : r
	});
}
//#endregion
//#region ui/api/clientAuth.ts
var Re = 2e3, ze = 15e3, Be = 8e3, Ve = "__mjr_write_token", E = "token", He = null, D = null, Ue = null, O = C({
	ttlMs: Re,
	maxSize: 1
});
function We() {
	try {
		return "";
	} catch {
		return "";
	}
}
function Ge(e) {
	let t = String(e || "").trim();
	try {
		return !!t || !t;
	} catch {
		return !1;
	}
}
function Ke() {
	try {
		let e = localStorage?.getItem?.(d), t = e ? JSON.parse(e) : {}, n = t && typeof t == "object" ? t : {}, r = n?.data && typeof n.data == "object" ? n.data : n;
		r?.security && typeof r.security == "object" && String(r.security.apiToken || "").trim() && (r.security.apiToken = "", localStorage?.setItem?.(d, JSON.stringify(n)));
	} catch (e) {
		console.debug?.(e);
	}
}
function qe() {
	try {
		O.delete(E);
	} catch (e) {
		console.debug?.(e);
	}
	Ge(""), Ke();
}
function Je() {
	let e = O.get(E);
	if (e !== void 0) return e;
	let t = Date.now(), n = We();
	if (n) return O.set(E, n, { at: t }), n;
	try {
		let e = localStorage?.getItem?.(d), n = e ? JSON.parse(e) : null, r = n?.data && typeof n.data == "object" ? n.data : n, i = String(r?.security?.apiToken || "").trim();
		if (i) {
			Ge(i);
			try {
				let e = n && typeof n == "object" ? n : {}, t = e?.data && typeof e.data == "object" ? e.data : e;
				t?.security && typeof t.security == "object" && (t.security.apiToken = "", localStorage?.setItem?.(d, JSON.stringify(e)), window?.dispatchEvent?.(new CustomEvent("mjr-settings-changed", { detail: { key: "security.apiToken" } })));
			} catch (e) {
				console.debug?.(e);
			}
		}
		return O.set(E, i, { at: t }), i;
	} catch {
		return O.set(E, "", { at: t }), "";
	}
}
function Ye(e) {
	let t = String(e || "").trim();
	if (!t) return !1;
	try {
		O.set(E, t), D = null, Ge(t), Ke();
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
var Xe = /^[A-Za-z0-9._\-~+/]+=*$/;
function Ze(e) {
	let t = String(e || "").trim();
	return t ? Xe.test(t) ? Ye(t) : (console.debug?.("[MJR auth] Rejected malformed security token (invalid characters)"), !1) : !1;
}
function Qe(e = {}) {
	D = {
		code: String(e?.code || "").trim().toUpperCase(),
		error: String(e?.error || "").trim(),
		status: Number(e?.status || 0) || 0,
		at: Date.now()
	};
}
function $e() {
	let e = D;
	if (!e) return null;
	let t = Date.now() - (Number(e.at || 0) || 0);
	return t < 0 || t > ze ? (D = null, null) : e;
}
function et(e) {
	let t = $e(), n = String(e?.code || "").trim().toUpperCase(), r = String(e?.error || "").trim(), i = String(t?.code || "").trim().toUpperCase(), a = String(t?.error || "").trim().toLowerCase(), o = r.toLowerCase();
	return i === "FORBIDDEN" && (a.includes("already configured") || a.includes("rotate-token")) ? l("toast.writeAuthConfiguredTokenRequired", "Write access requires the Majoor API token already configured on the server. Open Settings -> Security -> API Token and enter the matching token.") : i === "AUTH_REQUIRED" && (a.includes("sign in to comfyui") || a.includes("authenticated comfyui user")) ? l("toast.writeAuthSignInRequired", "Write access is blocked. Sign in to ComfyUI first, then retry so Majoor can bootstrap the remote session token automatically.") : i === "BOOTSTRAP_DISABLED" || i === "AUTH_REQUIRED" && a.includes("bootstrap") || n === "AUTH_REQUIRED" && o.includes("api token") ? l("toast.writeAuthBootstrapHelp", "Write access is blocked. Sign in to ComfyUI and retry so Majoor can bootstrap the remote session automatically, or set a Majoor API token in Settings -> Security.") : "";
}
function tt(e) {
	let t = String(e || "").trim();
	if (!t) return;
	let n = Date.now(), r = Ue;
	if (!(r && r.message === t && n - (Number(r.at || 0) || 0) < Be)) {
		Ue = {
			message: t,
			at: n
		};
		try {
			Le({
				summary: l("toast.writeAuthTitle", "Majoor remote write access"),
				detail: t
			}, "warning", 6500, { noHistory: !0 });
		} catch (e) {
			console.debug?.(e);
		}
	}
}
function nt(e) {
	let t = String(e?.code || "").trim().toUpperCase(), n = String(e?.error || "").trim().toLowerCase(), r = t === "FORBIDDEN" && n.includes("write operation blocked");
	if (t !== "AUTH_REQUIRED" && !r) return e;
	let i = et(e);
	return i ? (tt(i), {
		...e,
		error: i
	}) : e;
}
async function rt() {
	try {
		let e = await fetch("/mjr/am/settings/security/bootstrap-token", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				"X-Requested-With": "XMLHttpRequest"
			},
			body: "{}"
		});
		if (!(e.headers.get("content-type") || "").includes("application/json")) return Qe({
			code: "INVALID_RESPONSE",
			error: `Bootstrap token request returned non-JSON response (${e.status})`,
			status: e.status
		}), {
			ok: !1,
			token: !1
		};
		let t = await e.json().catch((e) => (console.debug?.("[MJR auth] JSON parse error:", e), null));
		if (!t || typeof t != "object") return Qe({
			code: "INVALID_RESPONSE",
			error: "Bootstrap token response was invalid.",
			status: e.status
		}), {
			ok: !1,
			token: !1
		};
		if (!t.ok) return Qe({
			code: t?.code,
			error: t?.error,
			status: e.status
		}), {
			ok: !1,
			token: !1
		};
		let n = String(t?.data?.token || "").trim();
		return n ? {
			ok: Ye(n),
			token: !0
		} : (D = null, {
			ok: !0,
			token: !1
		});
	} catch (e) {
		return Qe({
			code: "NETWORK_ERROR",
			error: e?.message || "Bootstrap token request failed.",
			status: 0
		}), {
			ok: !1,
			token: !1
		};
	}
}
async function it({ force: e = !1, allowCookieRefresh: t = !1 } = {}) {
	let n = Je();
	if (n && !e) return n;
	let r = {
		ok: !1,
		token: !1
	};
	He ||= (async () => {
		try {
			return await rt();
		} finally {
			He = null;
		}
	})();
	try {
		r = await He || r;
	} catch (e) {
		console.debug?.(e);
	}
	if (e && r?.ok && !r?.token && n) qe();
	else if (e && !r?.ok) {
		let e = $e(), t = String(e?.code || "").trim().toUpperCase();
		(!t || !["NETWORK_ERROR", "INVALID_RESPONSE"].includes(t)) && qe();
	}
	let i = Je();
	return !i && t && r?.ok ? !0 : i;
}
function at() {
	O.clear();
}
//#endregion
//#region ui/api/clientOps.ts
async function ot(e) {
	return !e || typeof e != "string" ? {
		ok: !1,
		error: "Missing mode",
		code: "INVALID_INPUT"
	} : N("/mjr/am/settings/probe-backend", { mode: e });
}
async function st() {
	return M(e.SETTINGS_METADATA_FALLBACK);
}
async function ct({ image: t, media: n } = {}) {
	return N(e.SETTINGS_METADATA_FALLBACK, {
		image: t,
		media: n
	});
}
async function lt() {
	return M(e.SETTINGS_VECTOR_SEARCH);
}
async function ut(t = !0) {
	if (t && typeof t == "object") {
		let n = {};
		return "enabled" in t && (n.enabled = !!t.enabled), "caption_on_index" in t && (n.caption_on_index = !!t.caption_on_index), "captionOnIndex" in t && (n.caption_on_index = !!t.captionOnIndex), N(e.SETTINGS_VECTOR_SEARCH, n);
	}
	return N(e.SETTINGS_VECTOR_SEARCH, { enabled: !!t });
}
async function dt() {
	return M(e.SETTINGS_EXECUTION_GROUPING);
}
async function ft(t = !0) {
	return N(e.SETTINGS_EXECUTION_GROUPING, { enabled: !!t });
}
async function pt() {
	return M(e.SETTINGS_HUGGINGFACE);
}
async function mt(t = "") {
	return N(e.SETTINGS_HUGGINGFACE, { token: String(t ?? "").trim() });
}
async function ht() {
	return M(e.SETTINGS_AI_LOGGING);
}
async function gt(t = !1) {
	return N(e.SETTINGS_AI_LOGGING, { enabled: !!t });
}
async function _t() {
	return M(e.SETTINGS_ROUTE_LOGGING);
}
async function vt(t = !1) {
	return N(e.SETTINGS_ROUTE_LOGGING, { enabled: !!t });
}
async function yt() {
	return M(e.SETTINGS_STARTUP_LOGGING);
}
async function bt(t = !1) {
	return N(e.SETTINGS_STARTUP_LOGGING, { enabled: !!t });
}
async function xt() {
	return M(e.SETTINGS_LTXAV_RGB_FALLBACK);
}
async function St(t = !1) {
	return N(e.SETTINGS_LTXAV_RGB_FALLBACK, { enabled: !!t });
}
async function Ct() {
	return M(e.SETTINGS_OUTPUT_DIRECTORY);
}
async function wt(t, n = {}) {
	let r = String(t ?? "").trim();
	return N(e.SETTINGS_OUTPUT_DIRECTORY, { output_directory: r }, n);
}
async function Tt() {
	return M(e.SETTINGS_INDEX_DIRECTORY);
}
async function Et(t, n = {}) {
	let r = String(t ?? "").trim();
	return N(e.SETTINGS_INDEX_DIRECTORY, { index_directory: r }, n);
}
async function Dt() {
	return M("/mjr/am/settings/security");
}
async function Ot(e) {
	return N("/mjr/am/settings/security", e && typeof e == "object" ? e : {});
}
async function kt() {
	let e = await N("/mjr/am/settings/security/bootstrap-token", {});
	if (e?.ok) try {
		let t = String(e?.data?.token || "").trim();
		t && Ye(t);
	} catch (e) {
		console.debug?.(e);
	}
	return e;
}
async function At(e) {
	if (e && typeof e == "object") {
		let t = String(e.filepath || e.path || e?.file_info?.filepath || "").trim();
		return e.id == null ? N("/mjr/am/open-in-folder", { filepath: t }) : N("/mjr/am/open-in-folder", { asset_id: s(e.id) });
	}
	return N("/mjr/am/open-in-folder", { asset_id: s(e) });
}
async function jt({ op: t = "", path: n = "", name: r = "", destination: i = "", recursive: a = !0 } = {}, o = {}) {
	let s = {
		op: String(t || "").trim().toLowerCase(),
		path: String(n || "").trim()
	};
	return r != null && String(r).trim() && (s.name = String(r).trim()), i != null && String(i).trim() && (s.destination = String(i).trim()), s.op === "delete" && (s.recursive = !!a), N(e.BROWSER_FOLDER_OP, s, o);
}
async function Mt(t = {}) {
	let n = (e, t) => e == null ? t : !!e, r = String(t.scope || "output").trim().toLowerCase() || "output", i = t.customRootId ?? t.custom_root_id ?? t.rootId ?? t.root_id ?? t.customRoot ?? null, a = {
		scope: r,
		reindex: n(t.reindex, !0),
		hard_reset_db: n(t.hardResetDb ?? t.hard_reset_db ?? t.deleteDbFiles ?? t.delete_db_files ?? t.deleteDb ?? t.delete_db ?? void 0, r === "all"),
		clear_scan_journal: n(t.clearScanJournal ?? t.clear_scan_journal, !0),
		clear_metadata_cache: n(t.clearMetadataCache ?? t.clear_metadata_cache, !0),
		clear_asset_metadata: n(t.clearAssetMetadata ?? t.clear_asset_metadata, !0),
		clear_assets: n(t.clearAssets ?? t.clear_assets, !0),
		preserve_vectors: n(t.preserveVectors ?? t.preserve_vectors ?? t.keepVectors ?? t.keep_vectors, !1),
		rebuild_fts: n(t.rebuildFts ?? t.rebuild_fts, !0),
		incremental: n(t.incremental, !1),
		fast: n(t.fast, !0),
		background_metadata: n(t.backgroundMetadata ?? t.background_metadata, !0),
		maintenance_force: n(t.maintenanceForce ?? t.maintenance_force, !1)
	};
	return i && (a.custom_root_id = String(i)), N(e.INDEX_RESET, a);
}
async function Nt({ scope: t = "output", customRootId: n = "" } = {}) {
	let r = String(t || "output").trim().toLowerCase() || "output", i = String(n || "").trim(), a = { scope: r };
	return i && (a.custom_root_id = i), N(e.WATCHER_SCOPE, a);
}
async function Pt(t = {}) {
	return M(e.WATCHER_STATUS, t);
}
async function Ft(t = !0) {
	return N(e.WATCHER_TOGGLE, { enabled: !!t });
}
async function It() {
	return M(e.WATCHER_SETTINGS);
}
async function Lt(t = {}) {
	return N(e.WATCHER_SETTINGS, t);
}
async function Rt(t = {}) {
	return M(e.TOOLS_STATUS, t);
}
async function zt(t = {}) {
	return M(e.STATUS, t);
}
async function Bt() {
	return N("/mjr/am/db/force-delete", {});
}
async function Vt(t = {}) {
	return M(e.DB_BACKUPS, t);
}
async function Ht() {
	return N(e.DB_BACKUP_SAVE, {});
}
async function Ut({ name: t = "", useLatest: n = !1 } = {}) {
	let r = {};
	return t && (r.name = String(t)), n && (r.use_latest = !0), N(e.DB_BACKUP_RESTORE, r);
}
async function Wt(e = 250) {
	return N("/mjr/am/duplicates/analyze", { limit: Math.max(10, Math.min(5e3, Number(e) || 250)) });
}
async function Gt({ scope: e = "output", customRootId: t = "", maxGroups: n = 6, maxPairs: r = 10 } = {}, i = {}) {
	let a = `/mjr/am/duplicates/alerts?scope=${encodeURIComponent(String(e || "output"))}`;
	return t && (a += `&custom_root_id=${encodeURIComponent(String(t))}`), a += `&max_groups=${encodeURIComponent(String(Math.max(1, Number(n) || 6)))}`, a += `&max_pairs=${encodeURIComponent(String(Math.max(1, Number(r) || 10)))}`, M(a, i);
}
async function Kt(e, t = []) {
	return N("/mjr/am/duplicates/merge-tags", {
		keep_asset_id: Number(e) || 0,
		merge_asset_ids: Array.isArray(t) ? t.map((e) => Number(e) || 0).filter((e) => e > 0) : []
	});
}
async function qt(e) {
	let t, n;
	if (e && typeof e == "object") {
		t = s(e.id);
		let r = String(e.filepath || e.path || e?.file_info?.filepath || "").trim();
		n = t ? { asset_id: t } : { filepath: r };
	} else t = s(e), n = { asset_id: t };
	let r = await N("/mjr/am/asset/delete", n);
	return r?.ok && t && Yt([t]), r;
}
async function Jt(e) {
	let t = Array.isArray(e) ? e.map((e) => s(e)).filter(Boolean) : [], n = await N("/mjr/am/assets/delete", { ids: t });
	return n?.ok && Yt(t), n;
}
function Yt(e) {
	try {
		let t = (Array.isArray(e) ? e : [e]).map((e) => String(e || "").trim()).filter(Boolean);
		if (!t.length) return;
		window.dispatchEvent(new CustomEvent("mjr:assets-deleted", { detail: { ids: t } }));
	} catch (e) {
		console.debug?.(e);
	}
}
async function Xt(e, t) {
	let n;
	if (e && typeof e == "object") {
		n = s(e.id);
		let r = String(e.filepath || e.path || e?.file_info?.filepath || "").trim(), i = n ? await N("/mjr/am/asset/rename", {
			asset_id: n,
			new_name: t
		}) : await N("/mjr/am/asset/rename", {
			filepath: r,
			new_name: t
		});
		if (i?.ok && n) try {
			let e = await Rn(n);
			e?.ok && e?.data && (i.data = {
				...i.data || {},
				asset: e.data
			});
		} catch (e) {
			console.debug?.(e);
		}
		return i;
	}
	n = s(e);
	let r = await N("/mjr/am/asset/rename", {
		asset_id: n,
		new_name: t
	});
	if (r?.ok && n) try {
		let e = await Rn(n);
		e?.ok && e?.data && (r.data = {
			...r.data || {},
			asset: e.data
		});
	} catch (e) {
		console.debug?.(e);
	}
	return r;
}
async function Zt() {
	let e = typeof AbortController < "u" ? new AbortController() : null, t = null;
	try {
		return e && (t = setTimeout(() => e.abort(), 1e4)), await M("/mjr/am/collections", e ? { signal: e.signal } : {});
	} finally {
		t && clearTimeout(t);
	}
}
async function Qt(e) {
	return N("/mjr/am/collections", { name: String(e || "").trim() });
}
async function $t(e) {
	let t = String(e || "").trim();
	return N(`/mjr/am/collections/${encodeURIComponent(t)}/delete`, {});
}
async function en(e, t) {
	let n = String(e || "").trim(), r = Array.isArray(t) ? t : [];
	return N(`/mjr/am/collections/${encodeURIComponent(n)}/add`, { assets: r });
}
async function tn(e, t) {
	let n = String(e || "").trim(), r = Array.isArray(t) ? t : [];
	return N(`/mjr/am/collections/${encodeURIComponent(n)}/remove`, { filepaths: r });
}
async function nn(e) {
	let t = String(e || "").trim();
	return M(`/mjr/am/collections/${encodeURIComponent(t)}/assets`);
}
async function rn(t, n = 20) {
	let r = String(t || "").trim();
	if (!r) return {
		ok: !1,
		error: "Empty query"
	};
	let i = n && typeof n == "object" ? n : { topK: Number(n) }, o = Math.max(1, Math.min(200, Number(i?.topK ?? 20) || 20)), s = String(i?.scope || "").trim(), c = String(i?.customRootId || "").trim(), l = `${e.VECTOR_SEARCH}?q=${encodeURIComponent(r)}&top_k=${o}`;
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
	}), M(l, { timeoutMs: 12e4 });
}
async function an(t, n = 20) {
	let r = String(t || "").trim();
	if (!r) return {
		ok: !1,
		error: "Missing asset ID"
	};
	let i = n && typeof n == "object" ? n : { topK: Number(n) }, a = Math.max(1, Math.min(200, Number(i?.topK ?? 20) || 20)), o = String(i?.scope || "").trim(), s = String(i?.customRootId || "").trim(), c = `${e.VECTOR_SIMILAR}/${encodeURIComponent(r)}?top_k=${a}`;
	return o && (c += `&scope=${encodeURIComponent(o)}`), s && (c += `&custom_root_id=${encodeURIComponent(s)}`), M(c, { dedupeKey: `vec:${r}:${a}:${o}:${s}` });
}
async function on(t) {
	let n = String(t || "").trim();
	return n ? M(`${e.VECTOR_ALIGNMENT}/${encodeURIComponent(n)}`) : {
		ok: !1,
		error: "Missing asset ID"
	};
}
async function sn(t) {
	let n = String(t || "").trim();
	return n ? N(`${e.VECTOR_INDEX}/${encodeURIComponent(n)}`, {}) : {
		ok: !1,
		error: "Missing asset ID"
	};
}
async function cn() {
	return M(e.VECTOR_STATS);
}
async function ln(t = 64, n = {}) {
	let r = Math.max(1, Math.min(200, t)), i = typeof n?.onProgress == "function" ? n.onProgress : null, a = String(n?.scope || "").trim().toLowerCase(), o = String(n?.customRootId ?? n?.custom_root_id ?? "").trim(), s = `${e.VECTOR_BACKFILL}?batch_size=${r}&async=1`;
	a && (s += `&scope=${encodeURIComponent(a)}`), o && (s += `&custom_root_id=${encodeURIComponent(o)}`);
	let c = await N(s, {}, { timeoutMs: 3e4 });
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
	let f = Number(n?.pollIntervalMs), p = Number(n?.pollTimeoutMs), m = Number.isFinite(f) ? Math.max(500, Math.min(1e4, Math.floor(f))) : _n, h = Number.isFinite(p) ? Math.max(1e4, Math.min(yn, Math.floor(p))) : vn, ee = Date.now(), g = null;
	for (; Date.now() - ee < h;) {
		await b(m);
		let t = await M(`${e.VECTOR_BACKFILL_STATUS}?backfill_id=${encodeURIComponent(d)}`, { timeoutMs: 3e4 });
		if (!t?.ok) {
			g = t;
			continue;
		}
		let n = t?.data || {}, r = String(n?.status || "").toLowerCase();
		g = t;
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
	let _ = await M(`${e.VECTOR_BACKFILL_STATUS}?backfill_id=${encodeURIComponent(d)}`, { timeoutMs: 3e4 }), v = _?.data || g?.data || {}, y = String(v?.status || "").toLowerCase();
	if (_?.ok && [
		"queued",
		"running",
		"pending"
	].includes(y)) {
		try {
			i?.(v);
		} catch (e) {
			console.debug?.(e);
		}
		return {
			ok: !0,
			code: "PENDING",
			status: 202,
			data: {
				...v,
				pending: !0,
				timed_out: !0,
				poll_timeout_ms: h,
				backfill_id: String(v?.backfill_id || d),
				status: y || "running"
			},
			meta: { pending: !0 }
		};
	}
	return _?.ok && y === "failed" ? {
		ok: !1,
		error: String(v?.error || "Vector backfill failed"),
		code: String(v?.code || "DB_ERROR"),
		data: v,
		status: 500
	} : {
		ok: !1,
		error: `Vector backfill polling timed out after ${h}ms`,
		code: "TIMEOUT",
		data: v || null,
		status: 408
	};
}
async function un(t) {
	let n = String(t || "").trim();
	return n ? N(`${e.VECTOR_CAPTION}/${encodeURIComponent(n)}`, {}) : {
		ok: !1,
		error: "Missing asset ID"
	};
}
async function dn(t, { topK: n = 50, scope: r = "output", customRootId: i = "", subfolder: o = null, kind: s = null, hasWorkflow: c = null, minRating: l = null, minSizeMB: u = null, maxSizeMB: d = null, minWidth: f = null, minHeight: p = null, maxWidth: m = null, maxHeight: h = null, workflowType: ee = null, workflowId: g = null, dateRange: _ = null, dateExact: v = null } = {}) {
	let y = String(t || "").trim();
	if (!y) return {
		ok: !1,
		error: "Empty query"
	};
	let b = `${e.HYBRID_SEARCH}?q=${encodeURIComponent(y)}&top_k=${Math.max(1, Math.min(200, n))}&scope=${encodeURIComponent(r)}`;
	return i && (b += `&custom_root_id=${encodeURIComponent(i)}`), b = a(b, {
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
		workflowType: ee,
		workflowId: g,
		dateRange: _,
		dateExact: v
	}), M(b, { timeoutMs: 12e4 });
}
async function fn(t = 8) {
	return N(e.VECTOR_SUGGEST_COLLECTIONS, { k: Math.max(2, Math.min(20, t)) });
}
//#endregion
//#region ui/api/client.ts
var pn = 3e4, mn = "__MJR_API_CLIENT__", hn = 2e3, gn = 200, _n = 1e3, vn = 30 * 6e4, yn = 720 * 6e4, k = "settings", bn = "available-tags", A = C({
	ttlMs: hn,
	maxSize: 1
}), j = C({
	ttlMs: hn,
	maxSize: 1
}), xn = C({
	ttlMs: () => Tn(),
	maxSize: 1
}), Sn = new Set([
	"1",
	"true",
	"yes",
	"on"
]), Cn = new Set([
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
		return Number.isFinite(r) ? Math.max(1e3, Math.min(10 * 6e4, Math.floor(r))) : pn;
	} catch {
		return pn;
	}
}
function En() {
	A.clear();
}
function Dn() {
	j.clear();
}
function On() {
	xn.clear();
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
		!i || n.has(i) || (n.add(i), t.push(e));
	}
	return t;
}
try {
	let e = typeof window < "u" ? window : null;
	e && !e[mn] && (e[mn] = { initialized: !0 }, e.addEventListener?.("storage", (e) => {
		try {
			e?.key === "mjrSettings" && (En(), Dn(), On(), at());
		} catch (e) {
			console.debug?.(e);
		}
	}), e.addEventListener?.("mjr-settings-changed", () => {
		En(), Dn(), On(), at();
	}));
} catch (e) {
	console.debug?.(e);
}
var jn = () => {
	let e = A.get(k);
	if (e !== void 0) return e;
	let t = Date.now();
	try {
		let e = localStorage?.getItem?.(d);
		if (!e) return A.set(k, !1, { at: t }), !1;
		let n = !!JSON.parse(e)?.observability?.enabled;
		return A.set(k, n, { at: t }), n;
	} catch {
		return A.set(k, !1, { at: t }), !1;
	}
}, Mn = () => {
	let e = j.get(k);
	if (e !== void 0) return e;
	let t = Date.now();
	try {
		let e = localStorage?.getItem?.(d);
		if (!e) return j.set(k, !0, { at: t }), !0;
		let n = JSON.parse(e)?.ratingTagsSync?.enabled, r = n == null ? !0 : wn(n, !0);
		return j.set(k, r, { at: t }), r;
	} catch {
		return j.set(k, !0, { at: t }), !0;
	}
}, Nn = de({
	readObsEnabled: jn,
	readAuthToken: Je,
	ensureWriteAuthToken: it,
	normalizeWriteAuthFailure: nt
}), Pn = Nn.fetchAPI;
async function M(e, t = {}) {
	return Nn.get(e, t);
}
async function N(e, t, n = {}) {
	return Nn.post(e, t, n);
}
async function Fn(e, t, n = {}) {
	let i = Mn(), a = e && typeof e == "object" ? e : null, o = s(a ? a.id : e), c = { rating: Math.max(0, Math.min(5, Number(t) || 0)) };
	return o ? c.asset_id = o : a && (c.filepath = a.filepath || a.path || a?.file_info?.filepath || "", c.type = a.type || "output", c.root_id = r(a)), Pn("/mjr/am/asset/rating", {
		...n,
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			...i ? { "X-MJR-RTSYNC": "on" } : {}
		},
		body: JSON.stringify(c)
	});
}
async function In(t, n, i = {}) {
	let a = Mn(), o = t && typeof t == "object" ? t : null, c = s(o ? o.id : t), l = String(o?.kind || o?.type || "").trim().toLowerCase() === "workflow", u = String(o?.filepath || o?.path || o?.file_info?.filepath || "").trim(), d = { tags: Array.isArray(n) ? n : [] };
	l && u ? d.filepath = u : c ? d.asset_id = c : o && (d.filepath = o.filepath || o.path || o?.file_info?.filepath || "", d.type = o.type || "output", d.root_id = r(o));
	let f = await Pn(l && u ? e.WORKFLOWS_TAGS : "/mjr/am/asset/tags", {
		...i,
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			...a ? { "X-MJR-RTSYNC": "on" } : {}
		},
		body: JSON.stringify(d)
	});
	return f?.ok && On(), f;
}
async function Ln() {
	let e = xn.get(bn);
	if (Array.isArray(e)) return {
		ok: !0,
		data: e,
		error: null,
		code: "OK",
		meta: { cached: !0 }
	};
	let t = await M("/mjr/am/tags");
	if (t?.ok && Array.isArray(t.data)) {
		let e = An(t.data);
		return xn.set(bn, e), {
			...t,
			data: e
		};
	}
	return t;
}
async function Rn(e, t = {}) {
	let n = encodeURIComponent(s(e));
	return M(`/mjr/am/asset/${n}`, {
		...t,
		dedupeKey: t?.dedupeKey || `meta:${n}`
	});
}
async function zn(e, t = {}) {
	let n = s(e);
	if (!n) return {
		ok: !1,
		data: null,
		error: "Missing assetId",
		code: "INVALID_INPUT"
	};
	let r = `/mjr/am/viewer/info?asset_id=${encodeURIComponent(n)}`;
	t.refresh && (r += "&refresh=1");
	let { refresh: i, ...a } = t;
	return M(r, a);
}
async function Bn(e, t = {}) {
	let n = Array.isArray(e) ? e : [], r = [];
	for (let e of n) {
		let t = Number(e);
		if (Number.isFinite(t) && (r.push(Math.trunc(t)), r.length >= gn)) break;
	}
	return r.length ? N("/mjr/am/assets/batch", { asset_ids: r }, t) : {
		ok: !0,
		data: [],
		error: null,
		code: "OK"
	};
}
async function Vn(e, t = {}) {
	let n = o(e);
	return n ? M(n, t) : {
		ok: !1,
		data: null,
		error: "Missing workflow filepath",
		code: "INVALID_INPUT"
	};
}
async function Hn({ workflow: t = null, name: n = "", category: r = "", overwrite: i = !1, filepath: a = "" } = {}, o = {}) {
	return N(e.WORKFLOWS_SAVE, {
		workflow: t,
		name: n,
		category: r,
		overwrite: i,
		filepath: a
	}, o);
}
async function Un({ filepath: t = "", name: n = "" } = {}, r = {}) {
	return N(e.WORKFLOWS_DUPLICATE, {
		filepath: t,
		name: n
	}, r);
}
async function Wn({ filepath: t = "", name: n = "", category: r = "" } = {}, i = {}) {
	return N(e.WORKFLOWS_MOVE, {
		filepath: t,
		name: n,
		category: r
	}, i);
}
async function Gn({ filepath: t = "" } = {}, n = {}) {
	return N(e.WORKFLOWS_DELETE, { filepath: t }, n);
}
async function Kn({ filepath: t = "" } = {}, n = {}) {
	return N(e.WORKFLOWS_MARK_LOADED, { filepath: t }, n);
}
async function qn({ filepath: t = "", favorite: n = !1 } = {}, r = {}) {
	return N(e.WORKFLOWS_FAVORITE, {
		filepath: t,
		favorite: !!n
	}, r);
}
async function Jn({ filepath: t = "", task: n = "", model_family: r = "", provider: i = "", runs_on: a = "", notes: o = "" } = {}, s = {}) {
	return N(e.WORKFLOWS_INFO, {
		filepath: t,
		task: n,
		model_family: r,
		provider: i,
		runs_on: a,
		notes: o
	}, s);
}
async function Yn({ filepath: t = "", limit: n = 12 } = {}, r = {}) {
	let i = Math.max(1, Math.min(50, Number(n) || 12));
	return M(`${e.WORKFLOWS_THUMBNAIL_CANDIDATES}?filepath=${encodeURIComponent(String(t || "").trim())}&limit=${encodeURIComponent(String(i))}`, r);
}
async function Xn(t = {}) {
	return M(e.WORKFLOWS_MODEL_FAMILIES, t);
}
async function Zn({ q: t = "*", limit: n = 100, offset: r = 0, sort: i = "mtime" } = {}, a = {}) {
	let o = Math.max(1, Math.min(500, Number(n) || 100)), s = Math.max(0, Number(r) || 0);
	return M(`${e.LIST}?scope=workflow&q=${encodeURIComponent(String(t || "*"))}&limit=${encodeURIComponent(String(o))}&offset=${encodeURIComponent(String(s))}&sort=${encodeURIComponent(String(i || "mtime"))}`, a);
}
async function Qn({ filepath: t = "", source_filepath: n = "" } = {}, r = {}) {
	return N(e.WORKFLOWS_THUMBNAIL_SET, {
		filepath: t,
		source_filepath: n
	}, r);
}
async function $n({ type: e = "output", filename: t = "", subfolder: n = "", root_id: r = "", rootId: i = "", filepath: a = "" } = {}, o = {}) {
	let s = String(e || "output").trim().toLowerCase() || "output", c = String(t || "").trim(), l = String(n || "").trim(), u = String(r || i || "").trim(), d = String(a || "").trim();
	if (!c) return {
		ok: !1,
		data: null,
		error: "Missing filename",
		code: "INVALID_INPUT"
	};
	let f = `/mjr/am/metadata?type=${encodeURIComponent(s)}&filename=${encodeURIComponent(c)}`;
	return d && (f += `&filepath=${encodeURIComponent(d)}`), l && (f += `&subfolder=${encodeURIComponent(l)}`), u && (f += `&root_id=${encodeURIComponent(u)}`), M(f, o);
}
async function er({ filepath: t = "", root_id: n = "", subfolder: r = "" } = {}, i = {}) {
	try {
		if (globalThis.__mjrFolderInfoSupported === !1) return {
			ok: !1,
			data: null,
			error: "Folder info endpoint unavailable",
			code: "UNAVAILABLE"
		};
		if (globalThis.__mjrFolderInfoSupported == null) {
			let e = await M("/mjr/am/routes");
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
	let a = String(t || "").trim(), o = String(n || "").trim(), s = String(r || "").trim(), c = e.FOLDER_INFO, l = [];
	a ? (l.push(`filepath=${encodeURIComponent(a)}`), l.push("browser_mode=1")) : (o && l.push(`root_id=${encodeURIComponent(o)}`), s && l.push(`subfolder=${encodeURIComponent(s)}`)), l.length && (c += `?${l.join("&")}`);
	let u = await M(c, i);
	try {
		!u?.ok && Number(u?.status || 0) === 404 && (globalThis.__mjrFolderInfoSupported = !1);
	} catch (e) {
		console.debug?.(e);
	}
	return u;
}
//#endregion
//#region ui/utils/logging.ts
function tr(e, ...t) {
	try {
		i.DEBUG_VERBOSE_ERRORS && console.debug(e, ...t);
	} catch {}
}
function nr(e, t = "Majoor", { showToast: n = !1, toastType: r = "error" } = {}) {
	let a = e?.message || String(e || "Unknown error");
	try {
		i.DEBUG_VERBOSE_ERRORS ? console.error(`[Majoor][${t}]`, a, e) : console.debug(`[Majoor][${t}]`, a);
	} catch (e) {
		console.debug?.(e);
	}
	if (n && i.DEBUG_VERBOSE_ERRORS) try {
		Le(`${t}: ${a}`, r, 4e3);
	} catch (e) {
		console.debug?.(e);
	}
}
//#endregion
//#region ui/features/panel/panelRuntimeRefs.ts
var P = null;
function rr(e) {
	return e ? typeof e?.isConnected == "boolean" ? e.isConnected : !0 : !1;
}
function ir() {
	try {
		let e = document.getElementById("mjr-assets-grid") || document.querySelector(".mjr-grid");
		if (rr(e)) return e;
	} catch (e) {
		console.debug?.(e);
	}
	return null;
}
function ar(e) {
	return P = e || null, P;
}
function or(e = null) {
	(!e || P === e) && (P = null);
}
function sr() {
	return rr(P) ? P : (P = null, ir());
}
//#endregion
//#region ui/features/grid/GridSelectionManager.ts
function cr(e) {
	let t = /* @__PURE__ */ new Set();
	if (!e) return t;
	try {
		let n = e.dataset?.mjrSelectedAssetIds;
		if (n) {
			let e = JSON.parse(n);
			if (Array.isArray(e)) for (let n of e) n != null && t.add(String(n));
			return t;
		}
	} catch (e) {
		console.warn("[MJR] selection state parse error:", e);
	}
	try {
		let n = e.dataset?.mjrSelectedAssetId;
		n && t.add(String(n));
	} catch (e) {
		console.debug?.(e);
	}
	return t;
}
function lr(e, t, n = "") {
	let r = Array.from(t || []), i = n ? String(n) : r[0] ? String(r[0]) : "";
	try {
		r.length ? (e.dataset.mjrSelectedAssetIds = JSON.stringify(r), i ? e.dataset.mjrSelectedAssetId = String(i) : delete e.dataset.mjrSelectedAssetId) : (delete e.dataset.mjrSelectedAssetIds, delete e.dataset.mjrSelectedAssetId);
	} catch (e) {
		console.debug?.(e);
	}
	return r;
}
function ur(e, t, n) {
	if (!e) return;
	let r = t instanceof Set ? t : new Set(Array.from(t || []).map(String));
	try {
		let t = typeof n == "function" ? n(e) : [];
		for (let e of t) {
			let t = e?.dataset?.mjrAssetId;
			t && r.has(String(t)) ? (e.classList.add("is-selected"), e.setAttribute("aria-selected", "true")) : (e.classList.remove("is-selected"), e.setAttribute("aria-selected", "false"));
		}
	} catch (e) {
		console.debug?.(e);
	}
}
function dr(e, t, { activeId: n = "" } = {}, r) {
	if (!e) return [];
	let i = new Set(Array.from(t || []).map(String).filter(Boolean)), a = lr(e, i, n);
	ur(e, i, r);
	let o = {
		selectedIds: a,
		activeId: n || a[0] || ""
	};
	try {
		e.dispatchEvent?.(new CustomEvent("mjr:selection-changed", { detail: o }));
	} catch (e) {
		console.debug?.(e);
	}
	try {
		window.dispatchEvent(new CustomEvent("mjr:selection-changed", { detail: o }));
	} catch (e) {
		console.debug?.(e);
	}
	return a;
}
//#endregion
//#region ui/features/panel/controllers/hotkeysState.ts
var F = {
	suspended: !1,
	scope: null,
	ratingHotkeysActive: !1
};
function fr() {
	return F;
}
function pr(e) {
	F.scope = e == null ? null : String(e);
}
function mr() {
	return !!F.suspended;
}
function hr(e) {
	F.ratingHotkeysActive = !!e;
}
//#endregion
//#region ui/features/viewer/viewerRuntimeHosts.ts
var I = null, L = null, gr = ".mjr-viewer-overlay", _r = ".mjr-mfv";
function vr(e) {
	return !!e && typeof e.appendChild == "function";
}
function yr() {
	return typeof document > "u" ? null : document?.body || null;
}
function br() {
	return typeof document > "u" ? null : document?.body || document?.documentElement || null;
}
function xr(e) {
	return vr(e) ? e === yr() ? !0 : typeof e?.isConnected == "boolean" ? e.isConnected : !0 : !1;
}
function Sr(e) {
	return vr(e) ? e : null;
}
function Cr(e) {
	return xr(e) ? e : yr();
}
function wr(e) {
	let t = br();
	return xr(t) ? t : Cr(e);
}
function Tr(e, t, n = Cr) {
	let r = [], i = /* @__PURE__ */ new Set();
	for (let a of [
		n(t),
		yr(),
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
function Er(e, t, n = Cr) {
	let r = n(t);
	if (!r) return;
	let i = Tr(e, t, n);
	for (let e of i) if (e && e.parentNode !== r) try {
		r.appendChild(e);
	} catch (e) {
		console.debug?.(e);
	}
}
function Dr(e) {
	return I = Sr(e), Er(gr, I), () => Or(e);
}
function Or(e) {
	(!e || I === e) && (I = null);
}
function kr(e) {
	return L = Sr(e), Er(_r, L, wr), () => Ar(e);
}
function Ar(e) {
	(!e || L === e) && (L = null);
}
function jr(e) {
	let t = Cr(I);
	try {
		t?.appendChild?.(e);
	} catch (e) {
		console.debug?.(e);
	}
	return t;
}
function Mr(e) {
	let t = wr(L);
	try {
		t?.appendChild?.(e);
	} catch (e) {
		console.debug?.(e);
	}
	return t;
}
function Nr() {
	return Tr(gr, I);
}
//#endregion
//#region ui/features/viewer/floatingViewerManager.ts
var Pr = null, Fr = null;
async function Ir() {
	return Pr || (Fr ||= import("./FloatingViewer-JujDPzMu.js").then((e) => (Pr = e.FloatingViewer, Pr)), Fr);
}
var R = null, Lr = null;
async function Rr() {
	if (!R) return Lr ||= import("./NodeStreamController-EQygLyLg.js").then((e) => {
		R = e.setNodeStreamActive;
	}), Lr;
}
var z = Object.freeze({
	SIMPLE: "simple",
	AB: "ab",
	SIDE: "side",
	GRID: "grid",
	GRAPH: "graph"
});
function zr(e) {
	let t = String(e || "").trim().toLowerCase();
	return t === "sidebyside" ? z.SIDE : Object.values(z).includes(t) ? t : "";
}
var B = null;
function Br() {
	return i.MFV_LIVE_DEFAULT !== !1;
}
function Vr() {
	return i.MFV_PREVIEW_DEFAULT !== !1;
}
var V = Br(), H = Vr(), U = !1, Hr = null, Ur = !1, W = null, Wr = 0;
function Gr() {
	V = Br(), H = Vr(), B?.setLiveActive(V), B?.setPreviewActive(H);
}
async function G() {
	if (!B) {
		let e = await Ir();
		B || (B = new e({ controller: {
			close: () => $.close(),
			toggle: () => $.toggle(),
			toggleLive: () => $.toggleLive(),
			togglePreview: () => $.togglePreview(),
			toggleNodeStream: () => $.toggleNodeStream(),
			popOut: () => $.popOut(),
			onModeChanged: (e) => {
				B?.isVisible && e !== z.SIMPLE && Qr();
			},
			handleForwardedKeydown: (e) => _i(e)
		} }), Mr(B.render()));
	}
	try {
		let e = B?.element || null;
		e?.isConnected === !1 && Mr(e);
	} catch (e) {
		console.debug?.(e);
	}
	return B;
}
function Kr() {
	try {
		W?.abort();
	} catch (e) {
		console.debug?.(e);
	}
	W = null;
}
function qr() {
	try {
		let e = window.__MJR_LAST_SELECTION_GRID__;
		if (e?.isConnected) return e;
	} catch (e) {
		console.debug?.(e);
	}
	return sr();
}
function Jr() {
	if (B) {
		try {
			B.dispose?.();
		} catch (e) {
			console.debug?.(e);
		}
		B = null;
	}
}
function K(e) {
	typeof window > "u" || window.dispatchEvent(new CustomEvent(u.MFV_VISIBILITY_CHANGED, { detail: { visible: !!e } }));
}
function q(e) {
	e && (e.setLiveActive(V), e.setPreviewActive(H), e.setNodeStreamActive?.(U));
}
function J(e) {
	e?.setNodeStreamSelection && e.setNodeStreamSelection(Hr || null);
}
function Yr(e, t) {
	if (!e) return;
	let n = e._mode;
	if (!(n === z.AB || n === z.SIDE || n === z.GRID)) {
		e.loadMediaA(t, { autoMode: !0 });
		return;
	}
	let r = e.getPinnedSlots();
	if (n === z.GRID) {
		let n = [
			"A",
			"B",
			"C",
			"D"
		].find((e) => !r.has(e));
		if (!n) return;
		let i = {
			A: e._mediaA,
			B: e._mediaB,
			C: e._mediaC,
			D: e._mediaD
		};
		i[n] = t, e.loadMediaQuad(i.A, i.B, i.C, i.D);
		return;
	}
	let i = r.has("A"), a = r.has("B");
	if (!(i && a)) {
		if (a) {
			e.loadMediaPair(t, e._mediaB);
			return;
		}
		e.loadMediaPair(e._mediaA, t);
	}
}
function Xr(e) {
	try {
		let t = qr();
		if (!t) return null;
		let n = Array.from(t.querySelectorAll("[data-mjr-asset-id]")), r = n.findIndex((t) => t.dataset.mjrAssetId === String(e));
		if (r < 0) return null;
		let i = (n[r + 1] ?? n[r - 1] ?? null)?.dataset?.mjrAssetId ?? null;
		return i && i !== String(e) ? i : null;
	} catch (e) {
		return console.debug?.("[MFV] _findAdjacentGridId error", e), null;
	}
}
async function Zr(e) {
	if (!e.length || !B) return;
	Kr();
	let t = ++Wr, n = typeof AbortController < "u" ? new AbortController() : null;
	W = n;
	try {
		let r = B.getPinnedSlots(), i = r.size > 0, a = B._mode, o = a === z.GRID, s = a === z.AB || a === z.SIDE, c = o ? 4 : 2, l = e.slice(0, c);
		if (i && (s || o)) {
			let e = c - r.size;
			l = l.slice(0, Math.max(1, e));
		} else if (l.length === 1 && s) {
			let e = Xr(l[0]);
			e && (l = [l[0], e]);
		}
		let u = await Bn(l, n ? { signal: n.signal } : {});
		if (n?.signal.aborted || Wr !== t || !u?.ok || !Array.isArray(u.data) || !u.data.length || !B) return;
		let d = u.data;
		if (o) {
			if (i) {
				let e = {
					A: B._mediaA,
					B: B._mediaB,
					C: B._mediaC,
					D: B._mediaD
				}, t = [
					"A",
					"B",
					"C",
					"D"
				].filter((e) => !r.has(e)), n = 0;
				for (let r of t) n < d.length && (e[r] = d[n++]);
				B.loadMediaQuad(e.A, e.B, e.C, e.D);
			} else d.length >= 3 ? B.loadMediaQuad(d[0], d[1], d[2], d[3] || null) : d.length >= 2 ? B.loadMediaPair(d[0], d[1]) : B.loadMediaA(d[0], { autoMode: !0 });
			return;
		}
		if (r.has("A") && r.has("B") && B._mediaA && B._mediaB) return;
		r.has("A") && B._mediaA ? B.loadMediaPair(B._mediaA, d[0]) : r.has("B") && B._mediaB ? B.loadMediaPair(d[0], B._mediaB) : l.length >= 2 && d.length >= 2 ? B.loadMediaPair(d[0], d[1]) : B.loadMediaA(d[0], { autoMode: !0 });
	} catch (e) {
		e?.name !== "AbortError" && nr(e, "floatingViewerManager._loadFromIds");
	} finally {
		W === n && (W = null);
	}
}
function Qr() {
	try {
		let e = qr();
		if (!e) return;
		let t = cr(e);
		if (!t.size) return;
		Zr(Array.from(t));
	} catch (e) {
		console.debug?.("[MFV] Error reading current grid selection", e);
	}
}
function $r(e) {
	if (!B?.isVisible || B._mode === z.GRAPH) return;
	let t = Array.isArray(e?.detail?.selectedAssets) ? e.detail.selectedAssets : [], n = new Set(t.filter((e) => String(e?.kind || "").toLowerCase() === "folder").map((e) => String(e?.id || "")).filter(Boolean)), r = Array.isArray(e?.detail?.selectedIds) ? e.detail.selectedIds.map(String).filter((e) => !!e && !n.has(e)) : [];
	if (r.length) {
		Zr(r);
		return;
	}
	try {
		let e = qr();
		if (!e) return;
		let t = Array.from(cr(e)).map(String).filter(Boolean);
		if (!t.length) return;
		Zr(t);
	} catch (e) {
		console.debug?.("[MFV] selection fallback failed", e);
	}
}
function Y() {
	Ur || typeof window > "u" || (window.addEventListener(u.SELECTION_CHANGED, $r), Ur = !0);
}
function ei() {
	typeof window < "u" && window.removeEventListener(u.SELECTION_CHANGED, $r), Ur = !1, Kr();
}
var X = !1, ti = null, Z = null, Q = "";
function ni() {
	B?.isVisible && B.refreshSidebar?.();
}
function ri() {
	ii();
	let e = typeof window < "u" ? window : globalThis;
	if (typeof e.requestAnimationFrame == "function") {
		Q = "raf", Z = e.requestAnimationFrame(() => {
			Z = null, Q = "", ni();
		});
		return;
	}
	Q = "timeout", Z = e.setTimeout(() => {
		Z = null, Q = "", ni();
	}, 16);
}
function ii() {
	if (Z == null) return;
	let e = typeof window < "u" ? window : globalThis;
	try {
		Q === "raf" && typeof e.cancelAnimationFrame == "function" ? e.cancelAnimationFrame(Z) : typeof e.clearTimeout == "function" && e.clearTimeout(Z);
	} catch (e) {
		console.debug?.(e);
	}
	Z = null, Q = "";
}
function ai() {
	if (!X) try {
		ti = n(ri, { includePointerFallback: !0 }), X = typeof ti == "function";
	} catch (e) {
		console.debug?.("[MFV] _bindNodeSelectionListener error", e);
	}
}
function oi() {
	if (X) {
		ii();
		try {
			ti?.();
		} catch (e) {
			console.debug?.("[MFV] _unbindNodeSelectionListener error", e);
		}
		ti = null, X = !1;
	}
}
var $ = {
	isGraphModeVisible() {
		return !!(B?.isVisible && B?._mode === z.GRAPH);
	},
	async openAssets({ assets: e = [], asset: t = null, index: n = 0, mode: r = "" } = {}) {
		let i = Array.isArray(e) ? e.filter(Boolean) : t ? [t] : [];
		if (!i.length) return !1;
		let a = await G(), o = !!a.isVisible, s = Math.max(0, Math.min(Number(n) || 0, i.length - 1)), c = zr(r);
		c && a.setMode(c), a.show(), q(a), Y(), ai();
		let l = a._mode;
		return l === z.GRID && i.length >= 3 ? a.loadMediaQuad(i[0], i[1], i[2], i[3] || null) : (l === z.AB || l === z.SIDE) && i.length >= 2 ? a.loadMediaPair(i[0], i[1]) : a.loadMediaA(i[s], { autoMode: !1 }), o || K(!0), !0;
	},
	async open() {
		let e = await G();
		e.show(), q(e), Y(), ai(), X || requestAnimationFrame(() => ai()), Qr(), U && J(e), K(!0);
	},
	close() {
		if (B) try {
			B.isPopped && B.popIn(), B.hide();
		} catch (e) {
			console.debug?.(e);
		}
		ei(), B?.setNodeStreamSelection?.(null), oi(), K(!1);
	},
	async toggle() {
		B?.isVisible ? $.close() : await $.open();
	},
	toggleLive() {
		$.setLiveActive(!V);
	},
	togglePreview() {
		$.setPreviewActive(!H);
	},
	async toggleCompareAB() {
		let e = await G();
		if (!e.isVisible) {
			e.setMode(z.AB), e.show(), q(e), Y(), Qr(), K(!0);
			return;
		}
		let t = {
			[z.AB]: z.SIDE,
			[z.SIDE]: z.SIMPLE,
			[z.GRID]: z.SIMPLE,
			[z.SIMPLE]: z.AB
		}[e._mode] || z.AB;
		e.setMode(t), t !== z.SIMPLE && Qr();
	},
	async upsertWithContent(e) {
		let t = await G(), n = !!t.isVisible;
		!n && i.MFV_LIVE_AUTO_OPEN === !1 || (t.show(), q(t), Y(), Yr(t, e), n || K(!0));
	},
	setLiveActive(e) {
		V = !!e, B?.setLiveActive(V);
	},
	getLiveActive() {
		return V;
	},
	async popOut() {
		let e = await G();
		e.isPopped ? e.popIn() : (e.isVisible || await $.open(), e.popOut());
	},
	setPreviewActive(e) {
		H = !!e, B?.setPreviewActive(H);
	},
	getPreviewActive() {
		return H;
	},
	async feedPreviewBlob(e, t = {}) {
		if (!H) return;
		let n = await G(), r = !!n.isVisible;
		!r && i.MFV_PREVIEW_AUTO_OPEN === !1 || (n.isVisible || n.show(), q(n), n.loadPreviewBlob(e, ...Object.keys(t).length ? [t] : []), r || K(!0));
	},
	toggleNodeStream() {
		$.setNodeStreamActive(!U);
	},
	setNodeStreamActive(e) {
		U = !!e, U || (Hr = null), Rr().then(() => {
			R && R(U);
		}), B?.setNodeStreamActive?.(U), U ? B && J(B) : B?.setNodeStreamSelection?.(null);
	},
	getNodeStreamActive() {
		return U;
	},
	setNodeStreamSelection(e, t, n) {
		Hr = e == null || e === "" ? null : {
			nodeId: e,
			classType: t,
			title: n
		};
		let r = B;
		r && J(r);
	},
	async feedNodeStream(e) {
		if (!U) return;
		let t = await G(), n = !!t.isVisible;
		!n && i.MFV_NODE_STREAM_AUTO_OPEN === !1 || (t.isVisible || (t.show(), Y()), q(t), J(t), Yr(t, e), n || K(!0));
	}
}, si = !1, ci = () => $.open(), li = () => $.close(), ui = () => $.toggle(), di = () => $.toggleLive(), fi = () => $.togglePreview(), pi = () => $.toggleNodeStream(), mi = () => $.popOut(), hi = () => {
	try {
		B?.isPopped && B.popIn();
	} catch {}
}, gi = (e) => {
	let t = String(e?.detail?.key || "");
	(!t || t === "viewer" || t === "viewer.mfvLiveDefault" || t === "viewer.mfvPreviewDefault") && Gr();
}, _i = (e) => {
	if (!B?.isVisible || mr() || fr().scope === "viewer") return;
	let t = e?.key?.toLowerCase?.() || "";
	if (e?.target?.isContentEditable || e?.target?.closest?.("input, textarea, select, [contenteditable='true']")) return;
	let n = () => {
		e.preventDefault?.(), e.stopPropagation?.(), e.stopImmediatePropagation?.();
	};
	if (!e?.ctrlKey && !e?.metaKey && !e?.altKey && !e?.shiftKey) {
		if (t === "v") {
			n(), $.toggle();
			return;
		}
		if (t === "k") {
			n(), $.togglePreview();
			return;
		}
		if (t === "l") {
			n(), $.toggleLive();
			return;
		}
		if (t === "n") {
			n(), $.toggleNodeStream();
			return;
		}
		t === "c" && (n(), $.toggleCompareAB());
		return;
	}
};
function vi() {
	si || typeof window > "u" || !window?.addEventListener || (window.addEventListener(u.MFV_OPEN, ci), window.addEventListener(u.MFV_CLOSE, li), window.addEventListener(u.MFV_TOGGLE, ui), window.addEventListener(u.MFV_LIVE_TOGGLE, di), window.addEventListener(u.MFV_PREVIEW_TOGGLE, fi), window.addEventListener(u.MFV_NODESTREAM_TOGGLE, pi), window.addEventListener(u.MFV_POPOUT, mi), window.addEventListener(u.SETTINGS_CHANGED, gi), window.addEventListener("keydown", _i, !0), window.addEventListener("beforeunload", hi), si = !0);
}
function yi() {
	if (typeof window > "u" || !window?.removeEventListener) {
		si = !1;
		return;
	}
	window.removeEventListener(u.MFV_OPEN, ci), window.removeEventListener(u.MFV_CLOSE, li), window.removeEventListener(u.MFV_TOGGLE, ui), window.removeEventListener(u.MFV_LIVE_TOGGLE, di), window.removeEventListener(u.MFV_PREVIEW_TOGGLE, fi), window.removeEventListener(u.MFV_NODESTREAM_TOGGLE, pi), window.removeEventListener(u.MFV_POPOUT, mi), window.removeEventListener(u.SETTINGS_CHANGED, gi), window.removeEventListener("keydown", _i, !0), window.removeEventListener("beforeunload", hi), si = !1;
}
function bi({ reinstallGlobalHandlers: e = !1 } = {}) {
	let t = !!B?.isVisible;
	try {
		B?.isPopped && B.popIn();
	} catch (e) {
		console.debug?.(e);
	}
	yi(), ei(), oi(), Kr(), Wr += 1, V = Br(), H = Vr(), U = !1;
	try {
		R && R(!1);
	} catch (e) {
		console.debug?.(e);
	}
	Jr(), t && K(!1), e && vi();
}
//#endregion
export { dt as $, De as $t, Xn as A, ot as At, Fn as B, an as Bt, Rn as C, gt as Ct, er as D, St as Dt, $n as E, Et, N as F, Nt as Ft, Qt as G, cn as Gt, en as H, on as Ht, Hn as I, Wt as It, $t as J, Le as Jt, qt as K, fn as Kt, qn as L, Ft as Lt, Zn as M, Ot as Mt, Kn as N, bt as Nt, zn as O, ct as Ot, Wn as P, ut as Pt, Gt as Q, Oe as Qt, Jn as R, Lt as Rt, M as S, Ht as St, Ln as T, mt as Tt, kt as U, sn as Ut, In as V, un as Vt, jt as W, rn as Wt, ht as X, he as Xt, Bt as Y, Pe as Yt, nn as Z, Ae as Zt, ar as _, At as _t, Nr as a, _t as at, Gn as b, Mt as bt, fr as c, yt as ct, hr as d, It as dt, ke as en, pt as et, cr as f, Pt as ft, sr as g, Kt as gt, or as h, Vt as ht, jr as i, Ct as it, Yn as j, vt as jt, Vn as k, wt as kt, mr as l, Rt as lt, dr as m, Zt as mt, vi as n, f as nn, xt as nt, kr as o, zt as ot, lr as p, dn as pt, Jt as q, Ze as qt, bi as r, d as rn, st as rt, Dr as s, Dt as st, $ as t, C as tn, Tt as tt, pr as u, lt as ut, tr as v, tn as vt, Bn as w, ft as wt, Un as x, Ut as xt, nr as y, Xt as yt, Qn as z, ln as zt };
