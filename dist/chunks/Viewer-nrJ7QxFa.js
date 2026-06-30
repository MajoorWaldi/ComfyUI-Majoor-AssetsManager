import { P as e, V as t, _ as n, c as r, d as i, g as a, ht as o, n as s, o as c, pt as l, qt as u, r as d, s as f, x as p, y as m } from "./viewerRuntimeHosts-BbCWOXEG.js";
import { a as h, ct as g, h as _, i as v, m as y, n as b, o as x, pt as S, r as C, rt as w, t as T } from "./events-CrhYyn_G.js";
import { A as E, a as D, c as O, d as k, f as A, i as j, k as M, o as N, r as P, s as F, u as ee } from "./mediaFps-Td0vBA3X.js";
import { tt as I } from "./mjr-primevue-n1rsQYJg.js";
import { c as te, n as L, o as ne, r as R, s as z, t as re } from "./ratingUpdater-Df0o0F6s.js";
import { a as B, n as ie } from "./VideoControls-Bjj2YM2u.js";
import { n as V, r as ae } from "./state-DPiaUMw1.js";
import { c as oe, d as H, f as se, i as ce, l as le, n as ue, p as de, r as fe, s as U, t as pe, u as me } from "./mediaPlayer-JtHPHKzH.js";
//#region ui/features/contextmenu/viewerContextMenuState.ts
function he() {
	return {
		open: !1,
		x: 0,
		y: 0,
		items: [],
		title: ""
	};
}
var W = I({
	portalOwnerId: "",
	mountedPortalIds: [],
	main: he(),
	submenu: he(),
	tags: {
		open: !1,
		x: 0,
		y: 0,
		asset: null,
		onChanged: null
	}
}), ge = 1;
function G(e) {
	e && (e.open = !1, e.x = 0, e.y = 0, e.items = [], e.title = "");
}
function K(e = "") {
	try {
		window.dispatchEvent(new CustomEvent("mjr-close-all-menus", { detail: { source: String(e || "") } }));
	} catch (e) {
		console.debug?.(e);
	}
}
function q() {
	let e = `mjr-viewer-context-menu-portal-${ge++}`;
	return W.mountedPortalIds.push(e), W.portalOwnerId ||= e, e;
}
function J(e) {
	let t = W.mountedPortalIds.filter((t) => t !== e);
	W.mountedPortalIds.splice(0, W.mountedPortalIds.length, ...t), W.portalOwnerId === e && (W.portalOwnerId = W.mountedPortalIds[0] || "");
}
function _e(e) {
	return String(W.portalOwnerId || "") === String(e || "");
}
function Y({ x: e = 0, y: t = 0, items: n = [], title: r = "" } = {}) {
	K("viewer"), xe(), ye(), W.main.open = !0, W.main.x = Number(e) || 0, W.main.y = Number(t) || 0, W.main.items = Array.isArray(n) ? n.filter(Boolean) : [], W.main.title = String(r || "");
}
function X() {
	G(W.main), ye();
}
function ve({ x: e = 0, y: t = 0, items: n = [], title: r = "" } = {}) {
	W.submenu.open = !0, W.submenu.x = Number(e) || 0, W.submenu.y = Number(t) || 0, W.submenu.items = Array.isArray(n) ? n.filter(Boolean) : [], W.submenu.title = String(r || "");
}
function ye() {
	G(W.submenu);
}
function be({ x: e = 0, y: t = 0, asset: n = null, onChanged: r = null } = {}) {
	X(), W.tags.open = !!n, W.tags.x = Number(e) || 0, W.tags.y = Number(t) || 0, W.tags.asset = n || null, W.tags.onChanged = typeof r == "function" ? r : null;
}
function xe() {
	W.tags.open = !1, W.tags.x = 0, W.tags.y = 0, W.tags.asset = null, W.tags.onChanged = null;
}
function Se() {
	X(), xe();
}
//#endregion
//#region ui/features/viewer/ViewerContextMenu.ts
var Ce = {
	COPY_PATH: "Ctrl+Shift+C",
	DOWNLOAD: "S",
	OPEN_IN_FOLDER: "Ctrl+Shift+E",
	ADD_TO_COLLECTION: "B",
	EDIT_TAGS: "T",
	RATING_SUBMENU: "1-5",
	RENAME: "F2",
	DELETE: "Del"
}, we = [
	"B",
	"KB",
	"MB",
	"GB",
	"TB"
], Te = /* @__PURE__ */ new WeakMap(), Ee = 1;
function De(e = "viewer-menu-item") {
	return `${e}-${Ee++}`;
}
function Z(e, t, n, r, i = {}) {
	return {
		id: De(),
		type: "item",
		label: String(e || ""),
		iconClass: t ? String(t) : "",
		rightHint: n ? String(n) : "",
		action: typeof r == "function" ? r : null,
		disabled: !!i.disabled,
		closeOnSelect: i.closeOnSelect !== !1,
		submenu: Array.isArray(i.submenu) ? i.submenu.filter(Boolean) : null
	};
}
function Oe() {
	return {
		id: De("viewer-menu-separator"),
		type: "separator"
	};
}
function ke(e) {
	let t = String(e || "").trim();
	if (!t) return !1;
	if (t.startsWith("/")) return !0;
	try {
		let e = new URL(t);
		return e.protocol === "http:" || e.protocol === "https:";
	} catch {
		return !1;
	}
}
function Ae(t, n, r) {
	let a = t?.id;
	try {
		t.rating = n;
	} catch (e) {
		console.debug?.(e);
	}
	try {
		r?.();
	} catch (e) {
		console.debug?.(e);
	}
	if (a) {
		L(String(a), n, {
			successMessage: n > 0 ? `Rating set to ${n} stars` : "Rating cleared",
			errorMessage: "Failed to update rating",
			warnPrefix: "[ViewerContextMenu]",
			onSuccess: () => {
				E(T, {
					assetId: String(a),
					rating: n
				}, { warnPrefix: "[ViewerContextMenu]" });
			},
			onFailure: (e) => {
				i(e, "[ViewerContextMenu] Rating update", { showToast: !0 });
			}
		});
		return;
	}
	e(t, n).catch((e) => {
		i(e, "[ViewerContextMenu] Rating update", { showToast: !0 });
	});
}
function je(e) {
	let t = Number(e);
	if (!Number.isFinite(t) || t < 0) return "";
	let n = 0;
	for (; t >= 1024 && n < we.length - 1;) t /= 1024, n += 1;
	return `${n === 0 ? `${Math.round(t)}` : t.toFixed(2)} ${we[n]}`;
}
function Me(e, t, n) {
	let r = [
		5,
		4,
		3,
		2,
		1
	].map((r) => Z(`${r} Stars`, "pi pi-star", null, async () => {
		Ae(e, r, t);
	}, { disabled: !n }));
	return r.push(Oe()), r.push(Z(y("ctx.resetRating", "Reset rating"), "pi pi-star", "0", async () => {
		Ae(e, 0, t);
	}, { disabled: !n })), r;
}
function Ne({ asset: e, event: n, getCurrentViewUrl: r, onAssetChanged: a }) {
	let s = typeof r == "function" ? r(e) : w(e), c = !!(e?.id || e?.filepath);
	return [
		Z(y("ctx.openInNewTab", "Open in New Tab"), "pi pi-external-link", null, async () => {
			ke(s) && window.open(s, "_blank", "noopener,noreferrer");
		}),
		Z(y("ctx.copyPath", "Copy path"), "pi pi-copy", Ce.COPY_PATH, async () => {
			let t = e?.filepath ? String(e.filepath) : "";
			if (!t) {
				u(y("toast.noFilePath"), "error");
				return;
			}
			try {
				await navigator.clipboard.writeText(t), u(y("toast.pathCopied"), "success", 2e3);
			} catch (e) {
				console.error("[ViewerContextMenu] Copy failed:", e), u(y("toast.pathCopyFailed"), "error");
			}
		}),
		Z(y("ctx.downloadOriginal", "Download Original"), "pi pi-download", Ce.DOWNLOAD, async () => {
			if (!e || !e.filepath) return;
			let t = g(e.filepath), n = document.createElement("a");
			n.href = t, n.download = e.filename, document.body.appendChild(n), n.click(), document.body.removeChild(n), u(y("toast.downloadingFile", "Downloading {filename}...", { filename: e.filename }), "info", 3e3);
		}, { disabled: !e?.filepath }),
		Z(y("ctx.openInFolder", "Open in folder"), "pi pi-folder-open", Ce.OPEN_IN_FOLDER, async () => {
			let t = await l(e);
			t?.ok ? u(y("toast.openedInFolder"), "info", 2e3) : u(t?.error || y("toast.openFolderFailed"), "error");
		}, { disabled: !(e?.id || e?.filepath) }),
		Z(y("ctx.addToCollection", "Add to collection"), "pi pi-bookmark", Ce.ADD_TO_COLLECTION, async () => {
			try {
				await R({
					x: n?.clientX,
					y: n?.clientY,
					assets: [e]
				});
			} catch (e) {
				console.error("[ViewerContextMenu] Add to collection failed:", e);
			}
		}),
		Oe(),
		Z(y("ctx.editTags", "Edit tags"), "pi pi-tags", Ce.EDIT_TAGS, async () => {
			be({
				x: (Number(n?.clientX) || 0) + 6,
				y: (Number(n?.clientY) || 0) + 6,
				asset: e,
				onChanged: ((...t) => {
					let n = t[0];
					e.tags = n, E(b, {
						assetId: String(e.id),
						tags: n
					}, { warnPrefix: "[ViewerContextMenu]" });
					try {
						a?.();
					} catch (e) {
						console.debug?.(e);
					}
				})
			});
		}, { closeOnSelect: !1 }),
		Oe(),
		Z(y("ctx.setRating", "Set rating"), "pi pi-star", `${Ce.RATING_SUBMENU} >`, null, {
			disabled: !c,
			closeOnSelect: !1,
			submenu: Me(e, a, c)
		}),
		Z(y("ctx.refreshMetadata", "Refresh metadata"), "pi pi-sync", "R", async () => {
			if (e?.id) try {
				let t = await p(e.id, { refresh: !0 });
				if (!t?.ok || !t?.data) {
					u(t?.error || y("toast.metadataRefreshFailed", "Failed to refresh metadata."), "error");
					return;
				}
				let n = t.data;
				try {
					E(h, {
						assetId: String(e.id),
						info: n
					}, { warnPrefix: "[ViewerContextMenu]" });
				} catch (e) {
					console.debug?.(e);
				}
				let r = [], i = je(n?.size_bytes);
				i && r.push(i), n?.mime && r.push(n.mime), u(y("toast.metadataRefreshed", "Metadata refreshed{suffix}", { suffix: r.length ? ` (${r.join(", ")})` : "" }), "success", 3e3);
			} catch (e) {
				i(e, "[ViewerContextMenu] Metadata refresh", { showToast: !0 });
			}
		}, { disabled: !e?.id }),
		Oe(),
		Z(y("ctx.rename", "Rename"), "pi pi-pencil", Ce.RENAME, async () => {
			if (!(e?.id || e?.filepath)) return;
			let t = e.filename || "", n = z(await M(y("dialog.rename.title", "Rename file"), t), t);
			if (!n || n === t) return;
			let r = te(n);
			if (!r.valid) {
				u(r.reason, "error");
				return;
			}
			try {
				let t = await o(e, n);
				if (t?.ok) {
					let r = t?.data?.asset;
					r && typeof r == "object" ? Object.assign(e, r) : (e.filename = n, e.filepath = e.filepath.replace(/[^\\/]+$/, n), e.path &&= String(e.path).replace(/[^\\/]+$/, n), e.file_info && typeof e.file_info == "object" && (e.file_info.filename = n, e.file_info.filepath && (e.file_info.filepath = String(e.file_info.filepath).replace(/[^\\/]+$/, n)), e.file_info.path && (e.file_info.path = String(e.file_info.path).replace(/[^\\/]+$/, n)))), u(y("toast.fileRenamedSuccess"), "success");
					try {
						window.dispatchEvent(new CustomEvent("mjr:reload-grid", { detail: { reason: "viewer-rename" } }));
					} catch (e) {
						console.debug?.(e);
					}
					a?.();
				} else u(t?.error || y("toast.fileRenameFailed"), "error");
			} catch (e) {
				u(y("toast.errorRenaming", "Error renaming file: {error}", { error: e?.message || String(e || "") }), "error");
			}
		}, { disabled: !(e?.id || e?.filepath) }),
		Z(y("ctx.delete", "Delete"), "pi pi-trash", Ce.DELETE, async () => {
			if ((e?.id || e?.filepath) && await ne(1, e?.filename)) try {
				let n = await t(e);
				n?.ok ? (u(y("toast.fileDeletedSuccess"), "success"), a?.()) : u(n?.error || y("toast.fileDeleteFailed"), "error");
			} catch (e) {
				u(y("toast.errorDeleting", "Error deleting file: {error}", { error: e?.message || String(e || "") }), "error");
			}
		}, { disabled: !(e?.id || e?.filepath) })
	];
}
function Pe({ overlayEl: e, getCurrentAsset: t, getCurrentViewUrl: n, onAssetChanged: r } = {}) {
	if (!e || typeof t != "function") return;
	let i = Te.get(e);
	if (typeof i?.unbind == "function") return i.unbind;
	let a = async (i) => {
		if (!e.contains(i.target)) return;
		i.preventDefault(), i.stopPropagation();
		let a = t();
		a && Y({
			x: i.clientX,
			y: i.clientY,
			items: Ne({
				asset: a,
				event: i,
				getCurrentViewUrl: n,
				onAssetChanged: r
			})
		});
	};
	try {
		e.addEventListener("contextmenu", a);
	} catch (e) {
		console.error("[ViewerContextMenu] Failed to bind:", e);
	}
	let o = () => {
		try {
			e.removeEventListener("contextmenu", a);
		} catch (e) {
			console.debug?.(e);
		}
		try {
			re();
			let e = globalThis?._ratingDebounceTimers;
			e && typeof e.clear == "function" && e.clear();
		} catch (e) {
			console.debug?.(e);
		}
		try {
			Se();
		} catch (e) {
			console.debug?.(e);
		}
		Te.delete(e);
	};
	return Te.set(e, { unbind: o }), o;
}
function Fe(e) {
	let t = e ? Te.get(e) : null;
	try {
		t?.unbind?.();
	} catch (e) {
		console.debug?.(e);
	}
}
//#endregion
//#region ui/features/viewer/ViewerState.ts
var Ie = "mjr_viewer_prefs_v1";
function Le() {
	try {
		let e = _.get(Ie);
		if (!e) return {};
		let t = JSON.parse(e);
		return t && typeof t == "object" ? t : {};
	} catch {
		return {};
	}
}
function Re(e) {
	try {
		if (!e) return;
		let t = {
			analysisMode: String(e.analysisMode || "none"),
			loupeEnabled: !!e.loupeEnabled,
			probeEnabled: !!e.probeEnabled,
			hudEnabled: !!e.hudEnabled,
			genInfoOpen: !!e.genInfoOpen,
			audioVisualizerMode: String(e.audioVisualizerMode || "artistic"),
			abWipePercent: Number.isFinite(Number(e._abWipePercent)) ? Number(e._abWipePercent) : 50
		};
		_.set(Ie, JSON.stringify(t));
	} catch (e) {
		console.debug?.(e);
	}
}
//#endregion
//#region ui/features/viewer/lifecycle.ts
function ze(e) {
	if (e) {
		try {
			e._mjrSyncAbort?.abort?.();
		} catch (e) {
			console.debug?.(e);
		}
		try {
			e._mjrSyncAbort = null;
		} catch (e) {
			console.debug?.(e);
		}
		try {
			let t = e.querySelectorAll?.("video, audio");
			if (t && t.length) for (let e of t) {
				try {
					e.pause?.();
				} catch (e) {
					console.debug?.(e);
				}
				try {
					e?._mjrAudioViz?.destroy?.();
				} catch (e) {
					console.debug?.(e);
				}
				try {
					e._mjrAudioViz = null;
				} catch (e) {
					console.debug?.(e);
				}
				try {
					e.currentTime = 0;
				} catch (e) {
					console.debug?.(e);
				}
				try {
					e.removeAttribute?.("src");
				} catch (e) {
					console.debug?.(e);
				}
				try {
					e.load?.();
				} catch (e) {
					console.debug?.(e);
				}
			}
		} catch (e) {
			console.debug?.(e);
		}
		try {
			let t = e.querySelectorAll?.(".mjr-viewer-media, .mjr-viewer-audio-viz");
			if (t && t.length) for (let e of t) {
				try {
					e?._mjrProc?.destroy?.();
				} catch (e) {
					console.debug?.(e);
				}
				try {
					e._mjrProc = null;
				} catch (e) {
					console.debug?.(e);
				}
				try {
					e.width = 0, e.height = 0;
				} catch (e) {
					console.debug?.(e);
				}
			}
		} catch (e) {
			console.debug?.(e);
		}
	}
}
function Be(e) {
	let t = [];
	try {
		e._mjrViewerUnsubs = t;
	} catch (e) {
		console.debug?.(e);
	}
	let n = {
		unsubs: t,
		safeAddListener: F,
		safeCall: O,
		destroyMediaProcessorsIn: ze,
		_observer: null,
		disposeAll: () => {
			try {
				n._observer?.disconnect?.();
			} catch (e) {
				console.debug?.(e);
			}
			try {
				for (let e of t) O(e);
			} catch (e) {
				console.debug?.(e);
			}
			try {
				t.length = 0;
			} catch (e) {
				console.debug?.(e);
			}
		}
	};
	try {
		if (e && typeof MutationObserver < "u") {
			let t = new MutationObserver(() => {
				try {
					if (!document.contains(e)) {
						try {
							t.disconnect();
						} catch (e) {
							console.debug?.(e);
						}
						O(() => n.disposeAll?.(), "lifecycle:autoDispose");
					}
				} catch (e) {
					console.debug?.(e);
				}
			}), r = e?.parentElement;
			r ? t.observe(r, { childList: !0 }) : t.observe(document.body, { childList: !0 }), n._observer = t;
		}
	} catch (e) {
		console.debug?.(e);
	}
	try {
		e._mjrViewerLifecycle = n;
	} catch (e) {
		console.debug?.(e);
	}
	return n;
}
//#endregion
//#region ui/components/buttons.ts
function Ve(e, t) {
	let n = document.createElement("button");
	n.textContent = e, n.title = t || "";
	try {
		n.setAttribute("aria-label", t || e || "Button");
	} catch (e) {
		console.debug?.(e);
	}
	return n.style.cssText = "\n        padding: 6px 12px;\n        background: transparent;\n        border: 1px solid rgba(255, 255, 255, 0.3);\n        color: white;\n        border-radius: 4px;\n        cursor: pointer;\n        font-size: 14px;\n        transition: all 0.2s;\n        display: inline-flex;\n        align-items: center;\n        justify-content: center;\n    ", n.onmouseenter = () => {
		n.disabled || (n.style.background = "rgba(255, 255, 255, 0.1)");
	}, n.onmouseleave = () => {
		n.disabled || (n.style.background = "transparent");
	}, n;
}
function He(e, t) {
	let n = document.createElement("button");
	n.textContent = e, n.dataset.mode = t;
	try {
		n.setAttribute("aria-label", e), n.setAttribute("aria-pressed", "false");
	} catch (e) {
		console.debug?.(e);
	}
	return n.style.cssText = "\n        padding: 4px 12px;\n        background: linear-gradient(180deg, rgba(206, 211, 218, 0.1), rgba(206, 211, 218, 0.03));\n        border: 0.8px solid rgba(196, 202, 210, 0.3);\n        color: rgba(230, 233, 238, 0.95);\n        border-radius: 4px;\n        cursor: pointer;\n        font-size: 12px;\n        transition: all 0.16s;\n    ", n;
}
//#endregion
//#region ui/features/viewer/toolbarControls.ts
function Ue({ VIEWER_MODES: e, state: t, onToolsChanged: n, onCompareModeChanged: r, onExportFrame: i, onCopyFrame: a, onAudioVizModeChanged: o, getCanAB: s } = {}) {
	let c = {
		channel: "rgb",
		exposureEV: 0,
		gamma: 1,
		analysisMode: "none",
		scopesMode: "off",
		gridMode: 0,
		overlayMaskEnabled: !1,
		overlayMaskOpacity: .65,
		overlayFormat: "image",
		probeEnabled: !1,
		loupeEnabled: !1,
		hudEnabled: !0,
		distractionFree: !1,
		genInfoOpen: !0,
		abCompareMode: "wipe",
		audioVisualizerMode: "artistic"
	}, l = document.createElement("div");
	l.className = "mjr-viewer-tools", l.style.cssText = "\n        display: block;\n        padding: 8px 8px 6px;\n        border-top: 0.8px solid rgba(196, 202, 210, 0.16);\n        background: rgba(12, 14, 19, 0.22);\n    ";
	let u = document.createElement("div");
	u.className = "mjr-viewer-tools-deck", u.style.cssText = "display:flex; flex-wrap:nowrap; gap:8px; align-items:center; min-width:0; overflow-x:auto; overflow-y:hidden;";
	let d = ({ key: e, eyebrow: t, title: n } = {}) => {
		let r = document.createElement("section");
		r.className = "mjr-viewer-tools-panel", e && (r.dataset.panel = String(e)), r.style.cssText = "display:flex; flex-direction:column; gap:4px; min-width:0; padding:5px 6px; border-radius:10px; border:1px solid rgba(255,255,255,0.08); background:linear-gradient(180deg, rgba(255,255,255,0.045), rgba(255,255,255,0.02)); box-shadow:inset 0 1px 0 rgba(255,255,255,0.04); flex:0 0 auto;";
		let i = document.createElement("div");
		i.className = "mjr-viewer-tools-panel-head", i.style.cssText = "display:none; align-items:flex-start; justify-content:space-between; gap:6px; min-width:0;";
		let a = document.createElement("div");
		a.className = "mjr-viewer-tools-panel-heading", a.style.cssText = "display:flex; flex-direction:column; gap:1px; min-width:0;";
		let o = document.createElement("span");
		o.className = "mjr-viewer-tools-panel-eyebrow", o.textContent = t || "";
		let s = document.createElement("span");
		s.className = "mjr-viewer-tools-panel-title", s.textContent = n || "";
		let c = document.createElement("div");
		return c.className = "mjr-viewer-tools-panel-body", c.style.cssText = "display:flex; align-items:center; flex-wrap:nowrap; gap:6px; min-width:0;", a.appendChild(o), a.appendChild(s), i.appendChild(a), r.appendChild(i), r.appendChild(c), {
			panel: r,
			body: c,
			head: i,
			heading: a,
			eyebrowEl: o,
			titleEl: s
		};
	}, f = d({
		key: "grade",
		eyebrow: "Image",
		title: "Adjustments"
	}), p = d({
		key: "overlay",
		eyebrow: "Viewer",
		title: "Guides & Compare"
	}), m = d({
		key: "inspect",
		eyebrow: "Inspect",
		title: "Probe"
	}), h = d({
		key: "actions",
		eyebrow: "Actions",
		title: "Reset & Export"
	}), g = d({
		key: "info",
		eyebrow: "Infos",
		title: "Help"
	}), _ = document.createElement("div");
	_.className = "mjr-viewer-tools-actions", _.style.cssText = "display:flex; align-items:center; justify-content:flex-start; gap:6px; flex-wrap:wrap; min-width:0;";
	let v = document.createElement("div");
	v.className = "mjr-viewer-tools-meta", v.style.cssText = "display:flex; align-items:center; justify-content:flex-start; gap:6px; flex-wrap:nowrap; min-width:0;";
	let b = ({ key: e, label: t, accentRgb: n } = {}) => {
		let r = document.createElement("div");
		if (r.className = "mjr-viewer-tools-group", e && (r.dataset.group = String(e)), n && r.style.setProperty("--mjr-group-accent", String(n)), r.style.cssText = "display:flex; align-items:center; gap:6px; padding:2px 6px; border-radius:8px; border:1px solid rgba(196,202,210,0.14); background:rgba(10,12,16,0.22);", t) {
			let e = document.createElement("span");
			e.className = "mjr-viewer-tools-group-label", e.textContent = t, e.style.cssText = "font-size: 10px; color: rgba(255,255,255,0.7);", r.appendChild(e);
		}
		return r;
	}, x = (e, t) => {
		let n = document.createElement("select");
		n.title = e || "", n.className = "mjr-viewer-tools-select", n.style.cssText = "\n            height: 24px;\n            padding: 0 6px;\n            border-radius: 6px;\n            border: 0.8px solid rgba(196, 202, 210, 0.24);\n            background: linear-gradient(180deg, rgba(210, 214, 220, 0.06), rgba(210, 214, 220, 0.02));\n            color: rgba(230,233,238,0.92);\n            font-size: 11px;\n            outline: none;\n        ";
		for (let e of t || []) {
			let t = document.createElement("option");
			t.value = String(e.value), t.textContent = String(e.label), n.appendChild(t);
		}
		return n;
	}, S = (e, { min: t, max: n, step: r, value: i }) => {
		let a = document.createElement("div");
		a.className = "mjr-viewer-tools-range", a.style.cssText = "display:flex; align-items:center; gap:6px;";
		let o = document.createElement("input");
		o.type = "range", o.className = "mjr-viewer-tools-range-input", o.min = String(t), o.max = String(n), o.step = String(r), o.value = String(i), o.title = e || "", o.style.cssText = "\n            width: 92px;\n            accent-color: rgba(255,255,255,0.85);\n        ";
		let s = document.createElement("span");
		return s.style.cssText = "font-size: 11px; color: rgba(255,255,255,0.9); min-width: 38px; text-align: right;", s.textContent = String(i), a.appendChild(o), a.appendChild(s), {
			wrap: a,
			input: o,
			out: s
		};
	}, C = (e, t, { iconClass: n = null, accentRgb: r = null } = {}) => {
		let i = document.createElement("button");
		if (i.type = "button", i.className = "mjr-viewer-tool-btn", i.setAttribute("aria-label", t || e || "Toggle"), i.setAttribute("aria-pressed", "false"), r) try {
			i.dataset.accentRgb = String(r);
		} catch (e) {
			console.debug?.(e);
		}
		if (n) {
			let t = document.createElement("span");
			t.className = `pi ${n}`.trim(), t.setAttribute("aria-hidden", "true"), t.style.fontSize = "14px", i.appendChild(t);
			let r = document.createElement("span");
			r.textContent = e || "", r.style.cssText = "position:absolute; width:1px; height:1px; padding:0; margin:-1px; overflow:hidden; clip:rect(0,0,0,0); white-space:nowrap; border:0;", i.appendChild(r);
		} else i.textContent = e;
		i.title = t || "", i.style.cssText = "\n            height: 24px;\n            padding: 0 8px;\n            border-radius: 6px;\n            border: 0.8px solid rgba(196, 202, 210, 0.24);\n            background: linear-gradient(180deg, rgba(210,214,220,0.06), rgba(210,214,220,0.02));\n            color: rgba(230,233,238,0.92);\n            cursor: pointer;\n            font-size: 11px;\n            user-select: none;\n            display: inline-flex;\n            align-items: center;\n            justify-content: center;\n            gap: 6px;\n            position: relative;\n        ", i.dataset.active = "0";
		let a = (e) => {
			let t = !!e;
			i.dataset.active = t ? "1" : "0";
			try {
				i.setAttribute("aria-pressed", t ? "true" : "false");
			} catch (e) {
				console.debug?.(e);
			}
			let n = String(i.dataset?.accentRgb || "").trim();
			t && n ? (i.style.background = `rgba(${n}, 0.12)`, i.style.borderColor = `rgba(${n}, 0.38)`, i.style.boxShadow = `0 0 0 0.8px rgba(${n}, 0.12) inset`) : (i.style.background = t ? "rgba(214,218,224,0.12)" : "rgba(210,214,220,0.06)", i.style.borderColor = t ? "rgba(214,218,224,0.38)" : "rgba(196,202,210,0.24)", i.style.boxShadow = "");
		};
		return a(!1), {
			b: i,
			setActive: a
		};
	}, w = x("Channel View", [
		{
			value: "rgb",
			label: "RGB"
		},
		{
			value: "r",
			label: "R"
		},
		{
			value: "g",
			label: "G"
		},
		{
			value: "b",
			label: "B"
		},
		{
			value: "a",
			label: "Alpha"
		},
		{
			value: "l",
			label: "Luma"
		}
	]);
	w.title = y("tooltip.colorChannels", "View color channels or luminance");
	let T = S("Exposure (EV)", {
		min: -10,
		max: 10,
		step: .1,
		value: 0
	}), E = S("Gamma", {
		min: .1,
		max: 3,
		step: .01,
		value: 1
	}), D = Object.freeze({
		channel: "120, 180, 255",
		exposure: "255, 200, 70",
		gamma: "190, 150, 255",
		analysis: "255, 140, 80",
		zebra: "255, 90, 90",
		overlay: "110, 240, 190",
		probe: "120, 255, 170",
		loupe: "180, 140, 255",
		compare: "90, 220, 220",
		geninfo: "200, 170, 255",
		audioviz: "255, 150, 80"
	}), k = Object.freeze({
		borderColor: "rgba(255,255,255,0.14)",
		background: "rgba(255,255,255,0.08)",
		boxShadow: ""
	}), A = (e, { accentRgb: t, active: n, title: r } = {}) => {
		try {
			if (!e) return;
			if (r && (e.title = String(r)), !n) {
				e.style.borderColor = k.borderColor, e.style.background = k.background, e.style.boxShadow = k.boxShadow;
				return;
			}
			let i = String(t || "").trim();
			if (!i) return;
			e.style.borderColor = `rgba(${i},0.55)`, e.style.background = `rgba(${i},0.14)`, e.style.boxShadow = `0 0 0 1px rgba(${i},0.14) inset`;
		} catch (e) {
			console.debug?.(e);
		}
	}, j = (e) => {
		try {
			let t = String(e || "rgb");
			if (w.style.boxShadow = "", t === "r") {
				w.style.borderColor = "rgba(255,90,90,0.60)", w.style.background = "rgba(255,90,90,0.14)", w.style.boxShadow = "0 0 0 1px rgba(255,90,90,0.14) inset";
				return;
			}
			if (t === "g") {
				w.style.borderColor = "rgba(90,255,140,0.55)", w.style.background = "rgba(90,255,140,0.12)", w.style.boxShadow = "0 0 0 1px rgba(90,255,140,0.12) inset";
				return;
			}
			if (t === "b") {
				w.style.borderColor = "rgba(90,160,255,0.60)", w.style.background = "rgba(90,160,255,0.12)", w.style.boxShadow = "0 0 0 1px rgba(90,160,255,0.12) inset";
				return;
			}
			if (t === "l") {
				w.style.borderColor = "rgba(255,210,90,0.60)", w.style.background = "rgba(255,210,90,0.12)", w.style.boxShadow = "0 0 0 1px rgba(255,210,90,0.12) inset";
				return;
			}
			if (t === "a") {
				w.style.borderColor = "rgba(220,220,220,0.35)", w.style.background = "rgba(255,255,255,0.10)", w.style.boxShadow = "0 0 0 1px rgba(255,255,255,0.08) inset";
				return;
			}
			if (t === "rgb") {
				w.style.borderColor = "rgba(255,255,255,0.22)", w.style.background = "linear-gradient(90deg, rgba(255,90,90,0.16), rgba(90,255,140,0.14), rgba(90,160,255,0.16))", w.style.boxShadow = "0 0 0 1px rgba(255,255,255,0.10) inset";
				return;
			}
			w.style.borderColor = "rgba(255,255,255,0.14)", w.style.background = "rgba(255,255,255,0.08)";
		} catch (e) {
			console.debug?.(e);
		}
	}, M = (e, { accentRgb: t, active: n } = {}) => {
		try {
			if (!e) return;
			if (!n) {
				e.style.color = "rgba(255,255,255,0.9)";
				return;
			}
			let r = String(t || "").trim();
			if (!r) return;
			e.style.color = `rgb(${r})`;
		} catch (e) {
			console.debug?.(e);
		}
	}, N = (e, { accentRgb: t, active: n } = {}) => {
		try {
			if (!e) return;
			if (!n) {
				e.style.background = "", e.style.borderColor = "transparent", e.style.boxShadow = "";
				return;
			}
			let r = String(t || "").trim();
			if (!r) return;
			e.style.background = `rgba(${r},0.10)`, e.style.borderColor = `rgba(${r},0.38)`, e.style.boxShadow = `0 0 0 1px rgba(${r},0.12) inset`;
		} catch (e) {
			console.debug?.(e);
		}
	}, P = C("Zebra", "Zebra Highlights (Z)", {
		iconClass: "pi-bars",
		accentRgb: D.zebra
	}), F = C("Scopes", "Scopes overlay", {
		iconClass: "pi-chart-bar",
		accentRgb: D.analysis
	}), ee = x("Scopes", [
		{
			value: "off",
			label: "Off"
		},
		{
			value: "hist",
			label: "Histogram"
		},
		{
			value: "wave",
			label: "Waveform"
		},
		{
			value: "both",
			label: "Both"
		}
	]);
	ee.title = y("tooltip.scopesHistogram", "Show histogram/waveform scopes");
	let I = C("Grid", "Grid (G)", {
		iconClass: "pi-th-large",
		accentRgb: D.overlay
	}), te = x("Grid Overlay", [
		{
			value: 0,
			label: "Off"
		},
		{
			value: 1,
			label: "Thirds"
		},
		{
			value: 2,
			label: "Center"
		},
		{
			value: 3,
			label: "Safe"
		},
		{
			value: 4,
			label: "Golden"
		}
	]);
	te.title = ie(y("tooltip.gridOverlay", "Grid overlay (rule of thirds, center)"), "G");
	let L = C("Mask", "Format mask (dim outside)", {
		iconClass: "pi-stop",
		accentRgb: D.overlay
	}), ne = x("Format", [
		{
			value: "image",
			label: "Image"
		},
		{
			value: "16:9",
			label: "16:9"
		},
		{
			value: "1:1",
			label: "1:1"
		},
		{
			value: "4:3",
			label: "4:3"
		},
		{
			value: "2.39",
			label: "2.39"
		},
		{
			value: "9:16",
			label: "9:16"
		}
	]);
	ne.title = y("tooltip.aspectRatioMask", "Aspect ratio overlay mask");
	let R = S("Mask Opacity", {
		min: 0,
		max: .9,
		step: .05,
		value: .65
	}), z = C("Probe", "Pixel Probe (I)", {
		iconClass: "pi-eye",
		accentRgb: D.probe
	}), re = C("Loupe", "Loupe (L)", {
		iconClass: "pi-search-plus",
		accentRgb: D.loupe
	}), B = C("HUD", "Viewer HUD", {
		iconClass: "pi-info-circle",
		accentRgb: D.overlay
	}), V = C("Focus", "Distraction-free mode (X)", {
		iconClass: "pi-window-maximize",
		accentRgb: D.overlay
	}), ae = C("Gen", ie("Generation info (prompt/model)", "D"), {
		iconClass: "pi-book",
		accentRgb: D.geninfo
	}), oe = x("A/B Compare Mode", [
		{
			value: "wipe",
			label: "Wipe (H)"
		},
		{
			value: "wipeV",
			label: "Wipe (V)"
		},
		{
			value: "difference",
			label: "Difference"
		},
		{
			value: "absdiff",
			label: "AbsDiff"
		},
		{
			value: "add",
			label: "Add"
		},
		{
			value: "subtract",
			label: "Subtract"
		},
		{
			value: "multiply",
			label: "Multiply"
		},
		{
			value: "screen",
			label: "Screen"
		}
	]);
	oe.title = y("tooltip.compareBlendMode", "Compare blend mode");
	let H = x("Audio Visualizer", [{
		value: "simple",
		label: "Simple"
	}, {
		value: "artistic",
		label: "Artistic"
	}]);
	H.title = y("tooltip.audioVisualizer", "Audio visualizer mode");
	let se = Ve("Reset", y("tooltip.resetPlayerControls", "Reset all viewer controls"));
	se.style.height = "26px", se.style.fontSize = "11px", se.style.padding = "0 8px", se.classList?.add?.("mjr-viewer-tool-btn", "mjr-viewer-tool-btn--reset"), se.classList?.add?.("mjr-viewer-tools-action", "mjr-viewer-tools-action--primary"), se.style.marginLeft = "auto";
	let ce = document.createElement("button");
	ce.type = "button", ce.title = y("tooltip.exportFrame", "Save current frame as PNG"), ce.setAttribute("aria-label", y("tooltip.exportFrame", "Save frame as PNG")), ce.className = "mjr-viewer-tool-btn mjr-viewer-tool-btn--reset", ce.style.cssText = "height:24px; padding:0 8px; display:inline-flex; align-items:center; justify-content:center;";
	let le = document.createElement("span");
	le.className = "pi pi-download", le.setAttribute("aria-hidden", "true"), le.style.fontSize = "14px", ce.appendChild(le), ce.classList?.add?.("mjr-viewer-tools-action");
	try {
		ce.style.display = "none";
	} catch (e) {
		console.debug?.(e);
	}
	let ue = document.createElement("button");
	ue.type = "button", ue.title = y("tooltip.copyFrame", "Copy current frame to clipboard"), ue.setAttribute("aria-label", y("tooltip.copyFrame", "Copy frame to clipboard")), ue.className = "mjr-viewer-tool-btn mjr-viewer-tool-btn--reset", ue.style.cssText = "height:24px; padding:0 8px; display:inline-flex; align-items:center; justify-content:center;";
	let de = document.createElement("span");
	de.className = "pi pi-copy", de.setAttribute("aria-hidden", "true"), de.style.fontSize = "14px", ue.appendChild(de), ue.classList?.add?.("mjr-viewer-tools-action");
	try {
		ue.style.display = "none";
	} catch (e) {
		console.debug?.(e);
	}
	let fe = b({
		key: "channel",
		label: "Channel",
		accentRgb: D.channel
	});
	fe.appendChild(w), f.body.appendChild(fe);
	let U = b({
		key: "exposure",
		label: "EV",
		accentRgb: D.exposure
	});
	U.appendChild(T.wrap), f.body.appendChild(U);
	let pe = b({
		key: "gamma",
		label: "Gamma",
		accentRgb: D.gamma
	});
	pe.appendChild(E.wrap), f.body.appendChild(pe);
	let me = () => {
		try {
			t.exposureEV = 0;
		} catch (e) {
			console.debug?.(e);
		}
		try {
			T.input.value = "0", T.out.textContent = "0.0EV";
		} catch (e) {
			console.debug?.(e);
		}
		O(n);
	}, he = () => {
		try {
			t.gamma = 1;
		} catch (e) {
			console.debug?.(e);
		}
		try {
			E.input.value = "1", E.out.textContent = "1.00";
		} catch (e) {
			console.debug?.(e);
		}
		O(n);
	}, W = () => {
		try {
			Object.assign(t, c);
		} catch (e) {
			console.debug?.(e);
		}
		O(r), O(o), O(n);
	};
	try {
		let e = U.querySelector?.(".mjr-viewer-tools-group-label");
		e && (e.title = y("tooltip.resetExposure", "Reset EV to 0"), e.style.cursor = "pointer", e.style.userSelect = "none");
	} catch (e) {
		console.debug?.(e);
	}
	try {
		T.out.title = y("tooltip.resetExposure", "Reset EV to 0"), T.out.style.cursor = "pointer", T.out.style.userSelect = "none";
	} catch (e) {
		console.debug?.(e);
	}
	try {
		let e = pe.querySelector?.(".mjr-viewer-tools-group-label");
		e && (e.title = y("tooltip.resetGamma", "Reset Gamma to 1.00"), e.style.cursor = "pointer", e.style.userSelect = "none");
	} catch (e) {
		console.debug?.(e);
	}
	try {
		E.out.title = y("tooltip.resetGamma", "Reset Gamma to 1.00"), E.out.style.cursor = "pointer", E.out.style.userSelect = "none";
	} catch (e) {
		console.debug?.(e);
	}
	let ge = b({
		key: "analysis",
		label: "Analysis",
		accentRgb: D.analysis
	});
	ge.appendChild(P.b), ge.appendChild(F.b), ge.appendChild(ee), f.body.appendChild(ge);
	let G = b({
		key: "overlay-guides",
		label: "Guides",
		accentRgb: D.overlay
	});
	G.appendChild(I.b), G.appendChild(te), G.appendChild(L.b), G.appendChild(ne), G.appendChild(R.wrap), p.body.appendChild(G);
	let K = b({
		key: "overlay-inspect",
		label: "Inspect",
		accentRgb: D.overlay
	});
	[
		z.b,
		re.b,
		B.b,
		V.b,
		ae.b
	].forEach((e, t) => {
		t > 0 && (e.style.marginLeft = "4px"), K.appendChild(e);
	}), m.body.appendChild(K);
	let q = b({
		key: "compare",
		label: "Compare",
		accentRgb: D.compare
	});
	q.style.borderRadius = "8px", q.style.padding = "4px 6px", q.style.border = "1px solid transparent", q.style.transition = "background 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease", q.appendChild(oe), p.body.appendChild(q);
	let J = b({
		key: "audio-viz",
		label: "Audio Viz",
		accentRgb: D.audioviz
	});
	J.appendChild(H), p.body.appendChild(J), _.appendChild(se), _.appendChild(ce), _.appendChild(ue);
	let _e = document.createElement("div");
	_e.className = "mjr-viewer-tools-group mjr-viewer-tools-group--3d", _e.textContent = "LMB rotate | RMB pan | Scroll zoom", _e.style.cssText = [
		"display:none",
		"align-items:center",
		"padding:2px 8px",
		"border-radius:999px",
		"border:1px solid rgba(255,255,255,0.12)",
		"background:rgba(255,255,255,0.06)",
		"color:rgba(255,255,255,0.55)",
		"font-size:10px",
		"font-weight:400",
		"letter-spacing:0.01em"
	].join(";"), v.appendChild(_e);
	let Y = document.createElement("div");
	Y.style.cssText = "position: relative; display:inline-flex; align-items:center;", Y.className = "mjr-viewer-tools-action", Y.style.marginLeft = "4px";
	let X = document.createElement("button");
	X.type = "button", X.title = y("tooltip.viewerShortcuts", "Viewer shortcuts"), X.setAttribute("aria-label", y("tooltip.viewerShortcuts", "Viewer shortcuts")), X.style.cssText = "\n        height: 24px;\n        padding: 0 8px;\n        border-radius: 6px;\n        border: 1px solid rgba(255,255,255,0.14);\n        background: rgba(255,255,255,0.08);\n        color: rgba(255,255,255,0.92);\n        cursor: pointer;\n        display: inline-flex;\n        align-items: center;\n        justify-content: center;\n    ";
	let ve = document.createElement("span");
	ve.className = "pi pi-question-circle", ve.setAttribute("aria-hidden", "true"), ve.style.fontSize = "14px", X.appendChild(ve);
	let ye = document.createElement("div");
	ye.className = "mjr-viewer-help", ye.style.cssText = "\n        position: absolute;\n        right: 0;\n        top: 32px;\n        min-width: 260px;\n        max-width: 360px;\n        padding: 10px 12px;\n        border-radius: 8px;\n        background: rgba(0,0,0,0.88);\n        border: 1px solid rgba(255,255,255,0.16);\n        color: rgba(255,255,255,0.92);\n        font-size: 12px;\n        line-height: 1.4;\n        box-shadow: 0 8px 24px rgba(0,0,0,0.35);\n        display: none;\n        z-index: 10002;\n    ";
	try {
		let e = document.createElement("div");
		e.textContent = "Shortcuts", e.style.cssText = "font-weight:600; margin-bottom:6px;";
		let t = document.createElement("div");
		t.style.cssText = "display:grid; grid-template-columns: 1fr 1fr; gap: 4px 10px;";
		let n = (e, n) => {
			let r = document.createElement("div"), i = document.createElement("span");
			i.style.cssText = "opacity:.75;", i.textContent = String(e || ""), r.appendChild(i), r.appendChild(document.createTextNode(` ${String(n || "")}`)), t.appendChild(r);
		};
		n("Esc", "Close"), n("Space", "Play/Pause"), n("+", "Zoom In"), n("-", "Zoom Out"), n("Alt+1", "1:1 Zoom"), n("G", "Grid"), n("D", "Gen Info"), n("Z", "Zebra"), n("I", "Probe"), n("L", "Loupe"), n("X", "Focus Mode"), n("C", "Copy Color"), n("[ / ]", "Speed -/+"), n("\\", "Speed 1x"), n("< / >", "Prev/Next"), n("0-5", "Rating"), ye.appendChild(e), ye.appendChild(t);
	} catch (e) {
		console.debug?.(e);
	}
	return Y.appendChild(X), Y.appendChild(ye), v.appendChild(Y), h.body.appendChild(_), g.body.appendChild(v), u.appendChild(f.panel), u.appendChild(p.panel), u.appendChild(m.panel), u.appendChild(h.panel), u.appendChild(g.panel), l.appendChild(u), {
		toolsRow: l,
		gradePanel: f,
		overlayPanel: p,
		inspectPanel: m,
		actionPanel: h,
		infoPanel: g,
		toolsActions: _,
		toolsMeta: v,
		chGroup: fe,
		expGroup: U,
		gamGroup: pe,
		anaGroup: ge,
		ovGuidesGroup: G,
		ovInspectGroup: K,
		cmpGroup: q,
		audGroup: J,
		model3dHint: _e,
		helpWrap: Y,
		helpBtn: X,
		helpPop: ye,
		channelsSelect: w,
		exposureCtl: T,
		gammaCtl: E,
		zebraToggle: P,
		scopesToggle: F,
		scopesSelect: ee,
		gridToggle: I,
		gridModeSelect: te,
		maskToggle: L,
		formatSelect: ne,
		maskOpacityCtl: R,
		probeToggle: z,
		loupeToggle: re,
		hudToggle: B,
		focusToggle: V,
		genInfoToggle: ae,
		compareModeSelect: oe,
		audioVizModeSelect: H,
		resetGradeBtn: se,
		exportBtn: ce,
		copyBtn: ue,
		resetExposure: me,
		resetGamma: he,
		resetViewerTools: W,
		ACCENT: D,
		setSelectHighlighted: A,
		setChannelSelectStyle: j,
		setValueHighlighted: M,
		setGroupHighlighted: N,
		DEFAULT_TOOL_STATE: c
	};
}
//#endregion
//#region ui/features/viewer/toolbarActions.ts
function We({ unsubs: e, state: t, VIEWER_MODES: n, onMode: r, onClose: i, onToolsChanged: a, onCompareModeChanged: o, onAudioVizModeChanged: s, onExportFrame: c, onCopyFrame: l, singleBtn: u, abBtn: d, sideBtn: f, closeBtn: p, channelsSelect: m, compareModeSelect: h, audioVizModeSelect: g, exposureCtl: _, gammaCtl: v, zebraToggle: y, scopesToggle: b, scopesSelect: x, gridToggle: S, gridModeSelect: C, maskToggle: w, formatSelect: T, maskOpacityCtl: E, probeToggle: D, loupeToggle: k, hudToggle: A, focusToggle: j, genInfoToggle: M, resetGradeBtn: N, exportBtn: P, copyBtn: ee, resetExposure: I, resetGamma: te, resetViewerTools: L, expGroup: ne, gamGroup: R }) {
	e.push(F(u, "click", () => r?.(n.SINGLE))), e.push(F(d, "click", () => r?.(n.AB_COMPARE))), e.push(F(f, "click", () => r?.(n.SIDE_BY_SIDE))), e.push(F(p, "click", () => i?.())), e.push(F(m, "change", () => {
		try {
			t.channel = String(m.value || "rgb");
		} catch (e) {
			console.debug?.(e);
		}
		O(a);
	})), e.push(F(h, "change", () => {
		try {
			t.abCompareMode = String(h.value || "wipe");
		} catch (e) {
			console.debug?.(e);
		}
		O(o), O(a);
	})), e.push(F(g, "change", () => {
		try {
			t.audioVisualizerMode = String(g.value || "artistic");
		} catch (e) {
			console.debug?.(e);
		}
		O(s), O(a);
	})), e.push(F(_.input, "input", () => {
		let e = Math.max(-10, Math.min(10, Number(_.input.value) || 0));
		t.exposureEV = Math.round(e * 10) / 10;
		try {
			_.out.textContent = `${t.exposureEV.toFixed(1)}EV`;
		} catch (e) {
			console.debug?.(e);
		}
		O(a);
	})), e.push(F(_.input, "dblclick", I)), e.push(F(_.out, "click", I)), e.push(F(ne.querySelector?.(".mjr-viewer-tools-group-label"), "click", I)), e.push(F(v.input, "input", () => {
		let e = Math.max(.1, Math.min(3, Number(v.input.value) || 1));
		t.gamma = Math.round(e * 100) / 100;
		try {
			v.out.textContent = t.gamma.toFixed(2);
		} catch (e) {
			console.debug?.(e);
		}
		O(a);
	})), e.push(F(v.input, "dblclick", te)), e.push(F(v.out, "click", te)), e.push(F(R.querySelector?.(".mjr-viewer-tools-group-label"), "click", te)), e.push(F(y.b, "click", () => {
		t.analysisMode = t.analysisMode === "zebra" ? "none" : "zebra", O(a);
	})), e.push(F(b.b, "click", () => {
		try {
			let e = String(t.scopesMode || "off") === "off" ? "both" : "off";
			t.scopesMode = e;
			try {
				x.value = String(e);
			} catch (e) {
				console.debug?.(e);
			}
		} catch (e) {
			console.debug?.(e);
		}
		O(a);
	})), e.push(F(x, "change", () => {
		try {
			t.scopesMode = String(x.value || "off");
		} catch {
			try {
				t.scopesMode = "off";
			} catch (e) {
				console.debug?.(e);
			}
		}
		O(a);
	})), e.push(F(S.b, "click", () => {
		t.gridMode = +!Number(t.gridMode), O(a);
	})), e.push(F(C, "change", () => {
		try {
			let e = Number(C.value);
			t.gridMode = Number.isFinite(e) ? e : 0;
		} catch {
			try {
				t.gridMode = 0;
			} catch (e) {
				console.debug?.(e);
			}
		}
		O(a);
	})), e.push(F(w.b, "click", () => {
		try {
			t.overlayMaskEnabled = !t.overlayMaskEnabled;
		} catch (e) {
			console.debug?.(e);
		}
		O(a);
	})), e.push(F(T, "change", () => {
		try {
			t.overlayFormat = String(T.value || "image");
		} catch {
			try {
				t.overlayFormat = "image";
			} catch (e) {
				console.debug?.(e);
			}
		}
		O(a);
	})), e.push(F(E.input, "input", () => {
		try {
			let e = Number(E.input.value);
			t.overlayMaskOpacity = Math.round(Math.max(0, Math.min(.9, Number.isFinite(e) ? e : .65)) * 100) / 100, E.out.textContent = t.overlayMaskOpacity.toFixed(2);
		} catch (e) {
			console.debug?.(e);
		}
		O(a);
	})), e.push(F(D.b, "click", () => {
		t.probeEnabled = !t.probeEnabled, O(a);
	})), e.push(F(k.b, "click", () => {
		t.loupeEnabled = !t.loupeEnabled, O(a);
	})), e.push(F(A.b, "click", () => {
		t.hudEnabled = !t.hudEnabled, O(a);
	})), e.push(F(j.b, "click", () => {
		t.distractionFree = !t.distractionFree, O(a);
	})), e.push(F(M.b, "click", () => {
		try {
			t.genInfoOpen = !t.genInfoOpen;
		} catch (e) {
			console.debug?.(e);
		}
		O(a);
	})), e.push(F(N, "click", () => {
		L();
	})), e.push(F(P, "click", () => {
		try {
			c?.();
		} catch (e) {
			console.debug?.(e);
		}
	})), e.push(F(ee, "click", () => {
		try {
			l?.();
		} catch (e) {
			console.debug?.(e);
		}
	}));
}
function Ge({ state: e, VIEWER_MODES: t, getCanAB: n, header: r, toolsRow: i, chGroup: a, expGroup: o, gamGroup: s, anaGroup: c, gradePanel: l, overlayPanel: u, inspectPanel: d, infoPanel: f, actionPanel: p, ovGuidesGroup: m, ovInspectGroup: h, model3dHint: g, helpWrap: _, channelsSelect: v, compareModeSelect: y, audioVizModeSelect: b, exposureCtl: x, gammaCtl: S, zebraToggle: C, scopesToggle: w, scopesSelect: T, gridToggle: E, gridModeSelect: D, maskToggle: O, formatSelect: k, maskOpacityCtl: A, probeToggle: j, loupeToggle: M, hudToggle: N, focusToggle: P, genInfoToggle: F, exportBtn: ee, copyBtn: I, resetGradeBtn: te, cmpGroup: L, audGroup: ne, ACCENT: R, setSelectHighlighted: z, setChannelSelectStyle: re, setValueHighlighted: B, setGroupHighlighted: ie }) {
	let V = e?.assets?.[e?.currentIndex] || null, ae = String(V?.kind || "").toLowerCase() === "model3d";
	try {
		let e = ae ? "none" : "";
		a.style.display = e, o.style.display = e, s.style.display = e, c.style.display = e, te.style.display = e, g.style.display = ae ? "inline-flex" : "none", l.panel.style.display = ae ? "none" : "", u.panel.style.display = ae ? "none" : "", f.panel.style.display = "", p.panel.style.display = "";
		let t = h.querySelector?.(".mjr-viewer-tools-group-label");
		if (ae) {
			m.style.display = "none", h.style.display = "", t && (t.style.display = "none"), _.style.display = "none", r.style.padding = "10px 16px", r.style.gap = "6px", i.style.padding = "6px 8px 6px";
			for (let e of [
				E.b,
				D,
				O.b,
				k,
				A.wrap,
				j.b,
				M.b,
				N.b
			]) try {
				e.style.display = "none";
			} catch {}
		} else {
			m.style.display = "", h.style.display = "", t && (t.style.display = ""), _.style.display = "", l.panel.style.display = "", u.panel.style.display = "", f.panel.style.display = "", p.panel.style.display = "", r.style.padding = "8px 16px", r.style.gap = "6px", i.style.padding = "8px 8px 6px";
			for (let e of [
				E.b,
				D,
				O.b,
				k,
				A.wrap,
				j.b,
				M.b,
				N.b
			]) try {
				e.style.display = "";
			} catch {}
		}
	} catch (e) {
		console.debug?.(e);
	}
	try {
		v.value = String(e.channel || "rgb");
	} catch (e) {
		console.debug?.(e);
	}
	try {
		y.value = String(e.abCompareMode || "wipe");
		let r = typeof n == "function" ? !!n() : !1, i = e.mode === t.AB_COMPARE && r, a = e.mode === t.SIDE_BY_SIDE, o = i || a;
		y.disabled = !i;
		try {
			L.dataset.active = o ? "1" : "0", L.style.display = o ? "" : "none", ie(L, {
				accentRgb: R.compare,
				active: o
			}), L.title = o ? "Compare tools (active)" : "Compare tools";
		} catch (e) {
			console.debug?.(e);
		}
	} catch (e) {
		console.debug?.(e);
	}
	try {
		let t = String(V?.kind || "") === "audio";
		ne.style.display = t ? "" : "none", b.disabled = !t, b.value = String(e.audioVisualizerMode || "artistic");
	} catch (e) {
		console.debug?.(e);
	}
	try {
		let t = Math.round((Number(e.exposureEV) || 0) * 10) / 10;
		x.input.value = String(t), x.out.textContent = `${t.toFixed(1)}EV`;
	} catch (e) {
		console.debug?.(e);
	}
	try {
		let t = Math.max(.1, Math.min(3, Number(e.gamma) || 1));
		S.input.value = String(t), S.out.textContent = t.toFixed(2);
	} catch (e) {
		console.debug?.(e);
	}
	try {
		C.setActive(e.analysisMode === "zebra");
	} catch (e) {
		console.debug?.(e);
	}
	try {
		let t = String(e.scopesMode || "off");
		w.setActive(t !== "off"), T.value = t;
	} catch (e) {
		console.debug?.(e);
	}
	try {
		let e = String(V?.kind || ""), t = e === "video" || e === "model3d";
		ee.style.display = t ? "" : "none", I.style.display = t ? "" : "none";
		let n = !!(globalThis?.ClipboardItem && navigator?.clipboard?.write);
		I.style.display = t && n ? "" : "none";
	} catch (e) {
		console.debug?.(e);
	}
	try {
		E.setActive((Number(e.gridMode) || 0) !== 0);
	} catch (e) {
		console.debug?.(e);
	}
	try {
		D.value = String(Number(e.gridMode) || 0);
	} catch (e) {
		console.debug?.(e);
	}
	try {
		O.setActive(!!e.overlayMaskEnabled), k.value = String(e.overlayFormat || "image"), A.input.value = String(Number(e.overlayMaskOpacity ?? .65)), A.out.textContent = Number(e.overlayMaskOpacity ?? .65).toFixed(2);
	} catch (e) {
		console.debug?.(e);
	}
	try {
		j.setActive(!!e.probeEnabled), M.setActive(!!e.loupeEnabled);
	} catch (e) {
		console.debug?.(e);
	}
	try {
		N.setActive(!!e.hudEnabled);
	} catch (e) {
		console.debug?.(e);
	}
	try {
		P.setActive(!!e.distractionFree);
	} catch (e) {
		console.debug?.(e);
	}
	try {
		F.setActive(!!e.genInfoOpen);
	} catch (e) {
		console.debug?.(e);
	}
	try {
		re(String(e.channel || "rgb"));
	} catch (e) {
		console.debug?.(e);
	}
	try {
		let t = Math.round((Number(e.exposureEV) || 0) * 10) / 10;
		B(x.out, {
			accentRgb: R.exposure,
			active: Math.abs(t) > 1e-4
		});
	} catch (e) {
		console.debug?.(e);
	}
	try {
		let t = Math.round((Number(e.gamma) || 1) * 100) / 100;
		B(S.out, {
			accentRgb: R.gamma,
			active: Math.abs(t - 1) > 1e-4
		});
	} catch (e) {
		console.debug?.(e);
	}
	try {
		let t = String(e.scopesMode || "off");
		z(T, {
			accentRgb: R.analysis,
			active: t !== "off",
			title: t === "off" ? "Scopes" : "Scopes (active)"
		});
	} catch (e) {
		console.debug?.(e);
	}
	try {
		let t = Number(e.gridMode) || 0;
		z(D, {
			accentRgb: R.overlay,
			active: t !== 0,
			title: t === 0 ? "Grid Overlay" : "Grid Overlay (active)"
		});
	} catch (e) {
		console.debug?.(e);
	}
	try {
		let t = String(e.overlayFormat || "image");
		z(k, {
			accentRgb: R.overlay,
			active: t !== "image",
			title: t === "image" ? "Format" : "Format (active)"
		});
	} catch (e) {
		console.debug?.(e);
	}
	try {
		let r = typeof n == "function" ? !!n() : !1, i = e.mode === t.AB_COMPARE && r, a = String(e.abCompareMode || "wipe");
		z(y, {
			accentRgb: R.compare,
			active: i && a !== "wipe",
			title: i && a !== "wipe" ? "Compare Mode (modified)" : "A/B Compare Mode"
		});
	} catch (e) {
		console.debug?.(e);
	}
	try {
		let t = String(V?.kind || "") === "audio", n = String(e.audioVisualizerMode || "artistic");
		z(b, {
			accentRgb: R.audioviz,
			active: t && n !== "simple",
			title: "Audio visualizer mode"
		});
	} catch (e) {
		console.debug?.(e);
	}
	try {
		let t = !!e.genInfoOpen, n = F?.b;
		n && t && (n.style.borderColor = `rgba(${R.geninfo},0.55)`, n.style.background = `rgba(${R.geninfo},0.14)`);
	} catch (e) {
		console.debug?.(e);
	}
}
function Ke({ state: e, VIEWER_MODES: t, singleBtn: n, abBtn: r, sideBtn: i, canAB: a, canSide: o }) {
	try {
		let s = !!a?.(), c = !!o?.();
		r.disabled = !s, i.disabled = !c, r.style.opacity = r.disabled ? "0.35" : e.mode === t.AB_COMPARE ? "1" : "0.6", i.style.opacity = i.disabled ? "0.35" : e.mode === t.SIDE_BY_SIDE ? "1" : "0.6", n.style.opacity = e.mode === t.SINGLE ? "1" : "0.6", n.style.fontWeight = e.mode === t.SINGLE ? "600" : "400";
		try {
			n.setAttribute("aria-pressed", e.mode === t.SINGLE ? "true" : "false"), r.setAttribute("aria-pressed", e.mode === t.AB_COMPARE ? "true" : "false"), i.setAttribute("aria-pressed", e.mode === t.SIDE_BY_SIDE ? "true" : "false");
		} catch (e) {
			console.debug?.(e);
		}
	} catch (e) {
		console.debug?.(e);
	}
}
//#endregion
//#region ui/features/viewer/toolbar.ts
function qe({ VIEWER_MODES: e, state: t, lifecycle: n, onClose: r, _onZoomIn: i, _onZoomOut: a, _onZoomReset: o, _onZoomOneToOne: s, onMode: c, onToolsChanged: l, onCompareModeChanged: u, onExportFrame: d, onCopyFrame: f, onAudioVizModeChanged: p, onToggleFullscreen: m, getCanAB: h } = {}) {
	let g = n?.unsubs || [], _ = document.createElement("div");
	_.className = "mjr-viewer-header", _.style.cssText = "\n        display: flex;\n        flex-direction: column;\n        gap: 6px;\n        padding: 8px 16px;\n        background: linear-gradient(170deg, rgba(24, 27, 33, 0.96), rgba(17, 19, 25, 0.97));\n        border-bottom: 0.8px solid rgba(196, 202, 210, 0.2);\n        color: white;\n        box-sizing: border-box;\n    ";
	let v = document.createElement("div");
	v.className = "mjr-viewer-header-top", v.style.cssText = "\n        display: flex;\n        align-items: center;\n        justify-content: center;\n        gap: 12px;\n        position: relative;\n        padding-right: 84px;\n        padding-left: 12px;\n        min-width: 0;\n        box-sizing: border-box;\n    ";
	let b = document.createElement("div");
	b.className = "mjr-viewer-header-meta mjr-viewer-header-meta--left", b.style.cssText = "display:flex; align-items:center; gap:10px; min-width:0; overflow:hidden;";
	let x = document.createElement("div");
	x.className = "mjr-viewer-title-line", x.style.cssText = "display:flex; align-items:center; justify-content:center; gap:8px; min-width:0; flex-wrap:nowrap; overflow:hidden;";
	let S = document.createElement("div");
	S.className = "mjr-viewer-title-wrap", S.style.cssText = "display:flex; align-items:center; justify-content:center; gap:12px; min-width:0; max-width:min(100%, calc(100vw - 220px)); text-align:center;";
	let C = document.createElement("span");
	C.className = "mjr-viewer-filename", C.style.cssText = "font-size: 13px; font-weight: 600; min-width:0; max-width:min(60vw, 820px); overflow:hidden; text-overflow:ellipsis; white-space:nowrap; text-align:center;";
	let w = document.createElement("div");
	w.className = "mjr-viewer-badges", w.style.cssText = "display:flex; gap:6px; align-items:center; flex-wrap:nowrap; min-width:0;";
	let T = document.createElement("div");
	T.className = "mjr-viewer-header-meta mjr-viewer-header-meta--right", T.style.cssText = "display:none; align-items:center; gap:10px; min-width:0; justify-content:flex-end; overflow:hidden;";
	let E = document.createElement("span");
	E.className = "mjr-viewer-filename mjr-viewer-filename--right", E.style.cssText = "font-size: 14px; font-weight: 500; min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; text-align:right;";
	let D = document.createElement("div");
	D.className = "mjr-viewer-badges mjr-viewer-badges--right", D.style.cssText = "display:flex; gap:8px; align-items:center; flex-wrap:wrap; justify-content:flex-end;", x.appendChild(C), x.appendChild(w), S.appendChild(x), T.appendChild(D), T.appendChild(E);
	let O = document.createElement("div");
	O.className = "mjr-viewer-mode-buttons", O.style.cssText = "display: flex; gap: 4px;";
	let k = He("Single", e.SINGLE);
	k.title = y("tooltip.singleViewMode", "Single view mode (one image)");
	let A = He("A/B", e.AB_COMPARE);
	A.title = y("tooltip.compareOverlayMode", "A/B compare mode (overlay)");
	let j = He("Side", e.SIDE_BY_SIDE);
	j.title = y("tooltip.compareSideBySide", "Side-by-side comparison mode"), O.appendChild(k), O.appendChild(A), O.appendChild(j);
	let M = Ve("X", "Close (Esc)");
	M.style.fontSize = "18px";
	try {
		M.classList.add("mjr-viewer-close"), M.textContent = "";
		let e = document.createElement("span");
		e.className = "pi pi-times", e.setAttribute("aria-hidden", "true"), M.appendChild(e);
	} catch (e) {
		console.debug?.(e);
	}
	let N = Ve("[ ]", "Toggle Fullscreen (F)");
	try {
		N.classList.add("mjr-viewer-fs");
	} catch (e) {
		console.debug?.(e);
	}
	N.style.fontSize = "16px";
	try {
		N.style.position = "absolute", N.style.top = "8px", N.style.left = "", N.style.right = "48px", N.style.zIndex = "10002", N.style.width = "34px", N.style.height = "34px", N.style.padding = "0", N.style.display = "inline-flex", N.style.alignItems = "center", N.style.justifyContent = "center", N.style.borderRadius = "8px";
		let e = document.createElement("span");
		e.className = "pi pi-window-maximize", e.setAttribute("aria-hidden", "true"), N.textContent = "", N.appendChild(e);
		let t = () => {
			try {
				let t = document.fullscreenElement != null;
				e.className = t ? "pi pi-window-minimize" : "pi pi-window-maximize", N.title = t ? "Exit Fullscreen (F)" : "Enter Fullscreen (F)";
			} catch (e) {
				console.debug?.(e);
			}
		};
		if (N.onclick = (e) => {
			e.stopPropagation(), m?.();
		}, n?.safeAddListener) n.safeAddListener(document, "fullscreenchange", t);
		else try {
			document.addEventListener("fullscreenchange", t);
			let e = () => {
				try {
					document.removeEventListener("fullscreenchange", t);
				} catch (e) {
					console.debug?.(e);
				}
			};
			_._mjrCleanup ? _._mjrCleanup.push(e) : _._mjrCleanup = [e];
		} catch (e) {
			console.debug?.(e);
		}
		t();
	} catch (e) {
		console.debug?.(e);
	}
	let P = document.createElement("div");
	P.className = "mjr-viewer-header-area mjr-viewer-header-area--left", P.style.cssText = "display:none; align-items:center; gap:12px; min-width:0; flex:1 1 0; overflow:hidden;", P.appendChild(b);
	let ee = document.createElement("div");
	ee.className = "mjr-viewer-header-area mjr-viewer-header-area--center", ee.style.cssText = "display:flex; align-items:center; justify-content:center; gap:12px; flex:1 1 auto; min-width:0;", S.appendChild(O), ee.appendChild(S);
	let I = document.createElement("div");
	I.className = "mjr-viewer-header-area mjr-viewer-header-area--right", I.style.cssText = "display:none; align-items:center; justify-content:flex-end; gap:12px; min-width:0; flex:1 1 0; overflow:hidden;", I.appendChild(T), v.appendChild(P), v.appendChild(ee), v.appendChild(I);
	try {
		M.style.position = "absolute", M.style.top = "8px", M.style.left = "", M.style.right = "8px", M.style.transform = "", M.style.zIndex = "10002", M.style.width = "34px", M.style.height = "34px", M.style.padding = "0", M.style.display = "inline-flex", M.style.alignItems = "center", M.style.justifyContent = "center", M.style.borderRadius = "8px";
	} catch (e) {
		console.debug?.(e);
	}
	_.appendChild(v), _.appendChild(N), _.appendChild(M);
	let { toolsRow: te, gradePanel: L, overlayPanel: ne, inspectPanel: R, actionPanel: z, infoPanel: re, toolsActions: B, toolsMeta: ie, chGroup: V, expGroup: ae, gamGroup: oe, anaGroup: H, ovGuidesGroup: se, ovInspectGroup: ce, cmpGroup: le, audGroup: ue, model3dHint: de, helpWrap: fe, helpBtn: U, helpPop: pe, channelsSelect: me, exposureCtl: he, gammaCtl: W, zebraToggle: ge, scopesToggle: G, scopesSelect: K, gridToggle: q, gridModeSelect: J, maskToggle: _e, formatSelect: Y, maskOpacityCtl: X, probeToggle: ve, loupeToggle: ye, hudToggle: be, focusToggle: xe, genInfoToggle: Se, compareModeSelect: Ce, audioVizModeSelect: we, resetGradeBtn: Te, exportBtn: Ee, copyBtn: De, resetExposure: Z, resetGamma: Oe, resetViewerTools: ke, ACCENT: Ae, setSelectHighlighted: je, setChannelSelectStyle: Me, setValueHighlighted: Ne, setGroupHighlighted: Pe } = Ue({
		VIEWER_MODES: e,
		state: t,
		onToolsChanged: l,
		onCompareModeChanged: u,
		onExportFrame: d,
		onCopyFrame: f,
		onAudioVizModeChanged: p,
		getCanAB: h
	});
	_.appendChild(te), We({
		unsubs: g,
		state: t,
		VIEWER_MODES: e,
		onMode: c,
		onClose: r,
		onToolsChanged: l,
		onCompareModeChanged: u,
		onAudioVizModeChanged: p,
		onExportFrame: d,
		onCopyFrame: f,
		singleBtn: k,
		abBtn: A,
		sideBtn: j,
		closeBtn: M,
		channelsSelect: me,
		compareModeSelect: Ce,
		audioVizModeSelect: we,
		exposureCtl: he,
		gammaCtl: W,
		zebraToggle: ge,
		scopesToggle: G,
		scopesSelect: K,
		gridToggle: q,
		gridModeSelect: J,
		maskToggle: _e,
		formatSelect: Y,
		maskOpacityCtl: X,
		probeToggle: ve,
		loupeToggle: ye,
		hudToggle: be,
		focusToggle: xe,
		genInfoToggle: Se,
		resetGradeBtn: Te,
		exportBtn: Ee,
		copyBtn: De,
		resetExposure: Z,
		resetGamma: Oe,
		resetViewerTools: ke,
		expGroup: ae,
		gamGroup: oe
	});
	let Fe = () => Ge({
		state: t,
		VIEWER_MODES: e,
		getCanAB: h,
		header: _,
		toolsRow: te,
		chGroup: V,
		expGroup: ae,
		gamGroup: oe,
		anaGroup: H,
		gradePanel: L,
		overlayPanel: ne,
		inspectPanel: R,
		infoPanel: re,
		actionPanel: z,
		ovGuidesGroup: se,
		ovInspectGroup: ce,
		model3dHint: de,
		helpWrap: fe,
		channelsSelect: me,
		compareModeSelect: Ce,
		audioVizModeSelect: we,
		exposureCtl: he,
		gammaCtl: W,
		zebraToggle: ge,
		scopesToggle: G,
		scopesSelect: K,
		gridToggle: q,
		gridModeSelect: J,
		maskToggle: _e,
		formatSelect: Y,
		maskOpacityCtl: X,
		probeToggle: ve,
		loupeToggle: ye,
		hudToggle: be,
		focusToggle: xe,
		genInfoToggle: Se,
		exportBtn: Ee,
		copyBtn: De,
		resetGradeBtn: Te,
		cmpGroup: le,
		audGroup: ue,
		ACCENT: Ae,
		setSelectHighlighted: je,
		setChannelSelectStyle: Me,
		setValueHighlighted: Ne,
		setGroupHighlighted: Pe
	}), Ie = ({ canAB: n, canSide: r } = {}) => Ke({
		state: t,
		VIEWER_MODES: e,
		singleBtn: k,
		abBtn: A,
		sideBtn: j,
		canAB: n,
		canSide: r
	});
	try {
		let e = null, t = () => {
			try {
				e?.abort?.();
			} catch (e) {
				console.debug?.(e);
			}
			e = null;
			try {
				pe.style.display = "none";
			} catch (e) {
				console.debug?.(e);
			}
		}, n = () => {
			t(), e = new AbortController();
			try {
				pe.style.display = "";
			} catch (e) {
				console.debug?.(e);
			}
			try {
				document.addEventListener("mousedown", (e) => {
					fe.contains(e.target) || t();
				}, {
					capture: !0,
					signal: e.signal
				}), document.addEventListener("keydown", (e) => {
					e.key === "Escape" && t();
				}, {
					capture: !0,
					signal: e.signal
				}), document.addEventListener("scroll", t, {
					capture: !0,
					passive: !0,
					signal: e.signal
				});
			} catch (e) {
				console.debug?.(e);
			}
		};
		g.push(() => t()), g.push(F(U, "click", () => {
			pe.style.display === "none" ? n() : t();
		}));
	} catch (e) {
		console.debug?.(e);
	}
	return {
		headerEl: _,
		headerTopEl: v,
		filenameEl: C,
		badgesBarEl: w,
		filenameRightEl: E,
		badgesBarRightEl: D,
		leftAreaEl: P,
		leftMetaEl: b,
		centerAreaEl: ee,
		rightMetaEl: T,
		rightAreaEl: I,
		titleLineEl: x,
		titleWrapEl: S,
		modeButtonsEl: O,
		syncToolsUIFromState: Fe,
		syncModeButtons: Ie
	};
}
//#endregion
//#region ui/features/viewer/keyboard.ts
function Je(e) {
	if (!e) return null;
	try {
		if (typeof e.prompt == "string" && e.prompt.trim()) return e.prompt.trim();
		if (e.geninfo) {
			let t = e.geninfo;
			if (typeof t.prompt == "string" && t.prompt.trim()) return t.prompt.trim();
			if (typeof t.positive_prompt == "string" && t.positive_prompt.trim()) {
				let e = t.positive_prompt.trim();
				return typeof t.negative_prompt == "string" && t.negative_prompt.trim() && (e += "\n\nNegative prompt: " + t.negative_prompt.trim()), e;
			}
		}
		let t = e.metadata_raw;
		if (t && typeof t == "object") {
			if (typeof t.prompt == "string" && t.prompt.trim()) return t.prompt.trim();
			let e = t.geninfo || t.GenInfo || t.generation;
			if (e && typeof e == "object") {
				if (typeof e.prompt == "string" && e.prompt.trim()) return e.prompt.trim();
				if (typeof e.positive_prompt == "string" && e.positive_prompt.trim()) {
					let t = e.positive_prompt.trim();
					return typeof e.negative_prompt == "string" && e.negative_prompt.trim() && (t += "\n\nNegative prompt: " + e.negative_prompt.trim()), t;
				}
			}
		}
		if (typeof t == "string" && t.includes("Negative prompt:")) return t.trim();
	} catch (e) {
		console.debug?.(e);
	}
	return null;
}
function Ye({ overlay: e, _content: t, singleView: n, state: r, VIEWER_MODES: i, computeOneToOneZoom: a, setZoom: o, scheduleOverlayRedraw: s, scheduleApplyGrade: c, syncToolsUIFromState: l, applyDistractionFreeUI: d, navigateViewerAssets: p, closeViewer: m, renderBadges: h, updateAssetRating: g, safeDispatchCustomEvent: _, ASSET_RATING_CHANGED_EVENT: v, probeTooltip: x, loupeWrap: S, getVideoControls: C, lifecycle: w, renderGenInfoPanel: T } = {}) {
	let E = w?.unsubs || [], D = null, k = null, A = () => {
		try {
			D && clearTimeout(D);
		} catch (e) {
			console.debug?.(e);
		}
		D = null, k = null;
	}, j = (e, t) => {
		A(), k = {
			assetId: e,
			rating: t
		}, D = setTimeout(async () => {
			let e = k;
			if (D = null, k = null, e?.assetId) try {
				let t = await g?.(e.assetId, e.rating);
				if (!t?.ok) {
					u(t?.error || y("toast.ratingUpdateFailed"), "error");
					return;
				}
				u(y("toast.ratingSetN", { n: e.rating }), "success", 1500), _?.(v, {
					assetId: String(e.assetId),
					rating: e.rating
				}, { warnPrefix: "[Viewer]" });
			} catch {
				u(y("toast.ratingUpdateError"), "error");
			}
		}, 300);
	}, M = () => {
		try {
			document.fullscreenElement ? document?.exitFullscreen?.() : e?.requestFullscreen?.();
		} catch (e) {
			console.debug?.(e);
		}
	}, N = (t) => {
		let g = () => {
			try {
				t.preventDefault(), t.stopPropagation(), t.stopImmediatePropagation?.();
			} catch (e) {
				console.debug?.(e);
			}
		}, v = r?.mode === i?.SINGLE, w = r?.assets?.[r?.currentIndex], E = () => {
			try {
				return !!t?.target?.closest?.(".mjr-viewer-playerbar");
			} catch {
				return !1;
			}
		}, D = () => {
			let e = String(t?.key || "");
			return e === " " || e === "Spacebar" || e === "ArrowLeft" || e === "ArrowRight" || e === "Home" || e === "End" || e === "[" || e === "{" || e === "]" || e === "}" || e === "\\" || e === "|" || e === "i" || e === "I" || e === "o" || e === "O";
		};
		if (f()) return;
		try {
			if (e?.style?.display === "none") return;
		} catch (e) {
			console.debug?.(e);
		}
		try {
			let e = t?.target;
			if (e && (e.tagName === "INPUT" || e.tagName === "TEXTAREA" || e.isContentEditable) && !(v && w?.kind === "video" && E() && D())) {
				if (t.key === "f" || t.key === "F") {
					g(), M();
					return;
				}
				t.key === "Escape" && (g(), W.tags.open ? xe() : O(m));
				return;
			}
		} catch (e) {
			console.debug?.(e);
		}
		let k = async (e) => {
			if (!v || !w?.id || e !== "0" && e !== "1" && e !== "2" && e !== "3" && e !== "4" && e !== "5") return !1;
			let t = e === "0" ? 0 : Number(e);
			if (!Number.isFinite(t)) return !1;
			try {
				return w.rating = t, O(h), j(w.id, t), !0;
			} catch {
				return !0;
			}
		}, A = () => {
			try {
				return C?.() || null;
			} catch {
				return null;
			}
		}, N = async (e) => {
			if (!v || w?.kind !== "video") return !1;
			try {
				let t = A();
				if (t?.stepFrames) return t.stepFrames(e), !0;
			} catch (e) {
				console.debug?.(e);
			}
			let t = n?.querySelector?.("video");
			if (!t) return !1;
			try {
				t.pause?.();
			} catch (e) {
				console.debug?.(e);
			}
			let r = 1 / 30 * e;
			try {
				let n = Number(t.duration), i = Math.max(0, Math.min(Number.isFinite(n) ? n : Infinity, (t.currentTime || 0) + r));
				t.currentTime = i;
				try {
					t.dispatchEvent?.(new CustomEvent("mjr:frameStep", { detail: {
						direction: e,
						time: i
					} }));
				} catch (e) {
					console.debug?.(e);
				}
				return !0;
			} catch {
				return !0;
			}
		}, P = (e, { absolute: t = !1 } = {}) => {
			try {
				let n = A();
				if (!n) return !1;
				if (t) {
					let t = n.setPlaybackRate?.(e);
					return Number.isFinite(Number(t)) ? (r.playbackRate = Number(t), u(y("toast.playbackRate", "Playback {rate}x", { rate: Number(t).toFixed(2) }), "info", 1200), !0) : !1;
				}
				let i = n.adjustPlaybackRate?.(e);
				return Number.isFinite(Number(i)) ? (r.playbackRate = Number(i), u(y("toast.playbackRate", "Playback {rate}x", { rate: Number(i).toFixed(2) }), "info", 1200), !0) : !1;
			} catch {
				return !1;
			}
		};
		if ((t.ctrlKey || t.metaKey) && (t.key === "c" || t.key === "C")) try {
			let e = Je(w);
			if (e) {
				g(), navigator.clipboard?.writeText?.(e).then(() => u(y("toast.promptCopied", "Prompt copied to clipboard"), "success", 1500)).catch(() => u(y("toast.copyFailed", "Copy failed"), "error", 1500));
				return;
			}
		} catch (e) {
			console.debug?.(e);
		}
		if (v && !t.altKey && !t.ctrlKey && !t.metaKey && (t.key === "0" || t.key === "1" || t.key === "2" || t.key === "3" || t.key === "4" || t.key === "5")) {
			g(), k(t.key);
			return;
		}
		switch (t.key) {
			case "1": {
				if (!t.altKey) break;
				let e = O(a);
				if (e == null) break;
				g();
				try {
					let t = Math.abs((Number(r?.zoom) || 1) - e) < .01;
					o?.(t ? 1 : e, {
						clientX: r?._lastPointerX,
						clientY: r?._lastPointerY
					});
				} catch (e) {
					console.debug?.(e);
				}
				break;
			}
			case "g":
			case "G":
				g();
				try {
					r.gridMode = ((Number(r.gridMode) || 0) + 1) % 5;
				} catch (e) {
					console.debug?.(e);
				}
				O(s), O(l);
				break;
			case "f":
			case "F":
				g(), M();
				break;
			case "d":
			case "D":
				g();
				try {
					r.genInfoOpen = !r.genInfoOpen;
				} catch (e) {
					console.debug?.(e);
				}
				O(l), O(T);
				break;
			case "t":
			case "T":
				if (!w?.id) break;
				g(), be({
					x: Number(r?._lastPointerX) || Math.round((e?.clientWidth || 0) / 2),
					y: Number(r?._lastPointerY) || Math.round((e?.clientHeight || 0) / 2),
					asset: w,
					onChanged: ((...e) => {
						let t = e[0];
						w.tags = t, _(b, {
							assetId: String(w.id),
							tags: t
						}, { warnPrefix: "[ViewerKeyboard]" }), O(h);
					})
				});
				break;
			case "z":
			case "Z":
				g();
				try {
					r.analysisMode = r.analysisMode === "zebra" ? "none" : "zebra";
				} catch (e) {
					console.debug?.(e);
				}
				O(l), O(c);
				break;
			case "i":
			case "I":
				if (v && w?.kind === "video" && A()?.setInPoint?.()) {
					g(), u(y("toast.inPointSet", "In point set"), "info", 1200);
					break;
				}
				g();
				try {
					r.probeEnabled = !r.probeEnabled;
				} catch (e) {
					console.debug?.(e);
				}
				try {
					r.probeEnabled || (x.style.display = "none");
				} catch (e) {
					console.debug?.(e);
				}
				O(l);
				break;
			case "o":
			case "O":
				if (v && w?.kind === "video" && A()?.setOutPoint?.()) {
					g(), u(y("toast.outPointSet", "Out point set"), "info", 1200);
					break;
				}
				break;
			case "Home":
				if (v && w?.kind === "video" && A()?.goToIn?.()) {
					g();
					break;
				}
				break;
			case "End":
				if (v && w?.kind === "video" && A()?.goToOut?.()) {
					g();
					break;
				}
				break;
			case "l":
			case "L":
				g();
				try {
					r.loupeEnabled = !r.loupeEnabled;
				} catch (e) {
					console.debug?.(e);
				}
				try {
					r.loupeEnabled || (S.style.display = "none");
				} catch (e) {
					console.debug?.(e);
				}
				O(l);
				break;
			case "x":
			case "X":
				g();
				try {
					r.distractionFree = !r.distractionFree;
				} catch (e) {
					console.debug?.(e);
				}
				O(l), O(d), O(T);
				break;
			case "c":
			case "C": {
				let e = r?._probe;
				if (!e || e.r == null || e.g == null || e.b == null) break;
				let t = `#${[
					e.r,
					e.g,
					e.b
				].map((e) => Math.max(0, Math.min(255, Number(e) || 0)).toString(16).padStart(2, "0")).join("")}`;
				try {
					let e = navigator?.clipboard;
					e?.writeText && (g(), e.writeText(t).catch(() => {}));
				} catch (e) {
					console.debug?.(e);
				}
				break;
			}
			case " ":
			case "Spacebar":
				if (v && w?.kind === "video") {
					let e = n?.querySelector?.("video");
					if (e) {
						g();
						try {
							let e = A();
							if (e?.togglePlay) {
								e.togglePlay();
								break;
							}
						} catch (e) {
							console.debug?.(e);
						}
						try {
							if (e.paused) {
								let t = e.play?.();
								t && typeof t.catch == "function" && t.catch(() => {});
							} else e.pause?.();
						} catch (e) {
							console.debug?.(e);
						}
						break;
					}
				}
				break;
			case "Tab":
				g();
				try {
					e?.contains?.(document.activeElement) || e?.focus?.();
				} catch (e) {
					console.debug?.(e);
				}
				break;
			case "Escape":
				g(), W.tags.open ? xe() : O(m);
				break;
			case "ArrowLeft":
				if (v && t.target?.closest?.(".mjr-viewer-playerbar")) {
					g(), N(-1);
					break;
				}
				g(), O(() => p?.(-1));
				break;
			case "ArrowRight":
				if (v && t.target?.closest?.(".mjr-viewer-playerbar")) {
					g(), N(1);
					break;
				}
				g(), O(() => p?.(1));
				break;
			case "[":
			case "{":
				g(), P(-.25) || u(y("toast.playbackVideoOnly"), "warning", 1400);
				break;
			case "]":
			case "}":
				g(), P(.25) || u(y("toast.playbackVideoOnly"), "warning", 1400);
				break;
			case "\\":
			case "|":
				g(), P(1, { absolute: !0 }) || u(y("toast.playbackVideoOnly"), "warning", 1400);
				break;
			case "+":
			case "=":
				g();
				try {
					o?.((Number(r?.zoom) || 1) + .25, {
						clientX: r?._lastPointerX,
						clientY: r?._lastPointerY
					});
				} catch (e) {
					console.debug?.(e);
				}
				break;
			case "-":
			case "_":
				g();
				try {
					o?.((Number(r?.zoom) || 1) - .25, {
						clientX: r?._lastPointerX,
						clientY: r?._lastPointerY
					});
				} catch (e) {
					console.debug?.(e);
				}
				break;
		}
	}, P = null, ee = () => {
		try {
			if (P) return;
			P = F(window, "keydown", N, !0);
		} catch (e) {
			console.debug?.(e);
		}
	}, I = () => {
		try {
			O(P);
		} catch (e) {
			console.debug?.(e);
		}
		P = null;
	};
	return E.push(() => A()), E.push(() => I()), {
		bind: ee,
		unbind: I,
		dispose: () => {
			A(), I();
		}
	};
}
//#endregion
//#region ui/features/viewer/grid.ts
function Xe({ gridCanvas: e, content: t, state: n, VIEWER_MODES: r, getPrimaryMedia: i, getViewportRect: a, clearCanvas: o } = {}) {
	let s = () => {
		try {
			let e = n?.mode;
			return e === r?.AB_COMPARE ? t?.querySelector?.(".mjr-viewer-ab") || t || null : e === r?.SIDE_BY_SIDE ? t?.querySelector?.(".mjr-viewer-sidebyside") || t || null : t?.querySelector?.(".mjr-viewer-single") || t || null;
		} catch {
			return t || null;
		}
	}, c = (e, i) => {
		try {
			if (!e) return i || null;
			let a = n?.mode;
			if (a === r?.SIDE_BY_SIDE || a === r?.AB_COMPARE) {
				let t = e;
				for (; t && t !== i && t.parentElement;) {
					if (t.parentElement === i) return t;
					t = t.parentElement;
				}
				return i || null;
			}
			return i || t || null;
		} catch {
			return i || t || null;
		}
	}, l = (e) => {
		try {
			let t = e?.dataset?.mjrAssetId;
			if (t == null || t === "") return n?.assets?.[n?.currentIndex] || null;
			let r = Array.isArray(n?.assets) ? n.assets : [];
			for (let e of r) try {
				if (e?.id != null && String(e.id) === String(t)) return e;
			} catch (e) {
				console.debug?.(e);
			}
			return n?.assets?.[n?.currentIndex] || null;
		} catch {
			return n?.assets?.[n?.currentIndex] || null;
		}
	}, u = (e, t = null) => {
		try {
			if (!e) return {
				w: 0,
				h: 0
			};
			if (e instanceof HTMLCanvasElement) {
				let t = Number(e._mjrNaturalW) || Number(e.width) || 0, n = Number(e._mjrNaturalH) || Number(e.height) || 0;
				if (t > 0 && n > 0) return {
					w: t,
					h: n
				};
			}
			let r = Number(e.videoWidth) || Number(e.naturalWidth) || 0, i = Number(e.videoHeight) || Number(e.naturalHeight) || 0;
			if (r > 0 && i > 0) return {
				w: r,
				h: i
			};
			try {
				let e = Number(t?.width) || 0, n = Number(t?.height) || 0;
				if (e > 0 && n > 0) return {
					w: e,
					h: n
				};
			} catch (e) {
				console.debug?.(e);
			}
			try {
				let e = Number(n?._mediaW) || 0, t = Number(n?._mediaH) || 0;
				if (e > 0 && t > 0) return {
					w: e,
					h: t
				};
			} catch (e) {
				console.debug?.(e);
			}
			try {
				let e = n?.assets?.[n?.currentIndex] || null, t = Number(e?.width) || 0, r = Number(e?.height) || 0;
				if (t > 0 && r > 0) return {
					w: t,
					h: r
				};
			} catch (e) {
				console.debug?.(e);
			}
			return {
				w: 0,
				h: 0
			};
		} catch {
			return {
				w: 0,
				h: 0
			};
		}
	}, d = (e, t, n, r) => {
		try {
			let i = Number(e) || 0, a = Number(t) || 0, o = Number(n) || 0, s = Number(r) || 0;
			if (!(i > 0 && a > 0 && o > 0 && s > 0)) return {
				x: 0,
				y: 0,
				w: i,
				h: a
			};
			let c = o / s;
			if (!Number.isFinite(c) || c <= 0) return {
				x: 0,
				y: 0,
				w: i,
				h: a
			};
			let l = a, u = a * c;
			return {
				x: (i - u) / 2,
				y: 0,
				w: u,
				h: l
			};
		} catch {
			return {
				x: 0,
				y: 0,
				w: Number(e) || 0,
				h: Number(t) || 0
			};
		}
	}, f = (e, t, n, r, i) => {
		try {
			let a = Math.max(.1, Math.min(16, Number(n) || 1)), o = Number(t?.x) || 0, s = Number(t?.y) || 0, c = Number(e?.x) || 0, l = Number(e?.y) || 0, u = Number(e?.w) || 0, d = Number(e?.h) || 0, f = Number(r) || 0, p = Number(i) || 0;
			return {
				x: o + (c - o) * a + f,
				y: s + (l - s) * a + p,
				w: u * a,
				h: d * a
			};
		} catch {
			return {
				x: 0,
				y: 0,
				w: 0,
				h: 0
			};
		}
	}, p = (e, t, n, r) => {
		try {
			let i = t || {}, a = Number(i.x) || 0, o = Number(i.y) || 0, s = Number(i.w) || 0, c = Number(i.h) || 0;
			if (!(s > 8 && c > 8)) return;
			let l = String(n || "");
			if (!l) return;
			let u = Math.max(6, Math.round(6 * r)), d = Math.max(3, Math.round(3 * r)), f = Math.max(11, Math.round(11 * r));
			e.save(), e.font = `${f}px var(--comfy-font, ui-sans-serif, system-ui)`, e.textAlign = "left", e.textBaseline = "top";
			let p = Math.ceil(e.measureText(l).width) + u * 2, m = f + d * 2, h = a + Math.max(2, Math.round(8 * r)), g = o + Math.max(2, Math.round(8 * r));
			e.fillStyle = "rgba(0,0,0,0.55)", e.strokeStyle = "rgba(255,255,255,0.18)", e.lineWidth = Math.max(1, Math.round(1 * r)), e.beginPath();
			let _ = Math.max(6, Math.round(8 * r));
			e.moveTo(h + _, g), e.arcTo(h + p, g, h + p, g + m, _), e.arcTo(h + p, g + m, h, g + m, _), e.arcTo(h, g + m, h, g, _), e.arcTo(h, g, h + p, g, _), e.closePath(), e.fill(), e.stroke(), e.fillStyle = "rgba(255,255,255,0.92)", e.fillText(l, h + u, g + d), e.restore();
		} catch {
			try {
				e.restore();
			} catch (e) {
				console.debug?.(e);
			}
		}
	}, m = () => {
		try {
			let t = a?.();
			if (!t) return {
				w: 0,
				h: 0,
				dpr: 1
			};
			let n = Math.max(1, Math.min(3, Number(window.devicePixelRatio) || 1)), r = Math.max(1, Math.floor(t.width * n)), i = Math.max(1, Math.floor(t.height * n));
			try {
				e?.width !== r && (e.width = r), e?.height !== i && (e.height = i);
			} catch (e) {
				console.debug?.(e);
			}
			return {
				w: r,
				h: i,
				dpr: n
			};
		} catch {
			return {
				w: 0,
				h: 0,
				dpr: 1
			};
		}
	}, h = (e, t, n) => {
		try {
			let r = String(e || "image");
			if (r === "image") {
				let e = u(t), r = (Number(e.w) || 0) / (Number(e.h) || 1);
				if (Number.isFinite(r) && r > 0) return r;
				let i = (Number(n?.width) || 0) / (Number(n?.height) || 1);
				return Number.isFinite(i) && i > 0 ? i : 1;
			}
			return r === "16:9" ? 16 / 9 : r === "9:16" ? 9 / 16 : r === "1:1" ? 1 : r === "4:3" ? 4 / 3 : r === "2.39" ? 2.39 : 1;
		} catch {
			return 1;
		}
	}, g = (e, t, n) => {
		try {
			let r = Number(e) || 0, i = Number(t) || 0, a = Number(n) || 1;
			if (!(r > 0 && i > 0 && a > 0)) return {
				x: 0,
				y: 0,
				w: r,
				h: i
			};
			let o = r / i, s = r, c = i;
			return a >= o ? (s = r, c = r / a) : (c = i, s = i * a), {
				x: (r - s) / 2,
				y: (i - c) / 2,
				w: s,
				h: c
			};
		} catch {
			return {
				x: 0,
				y: 0,
				w: Number(e) || 0,
				h: Number(t) || 0
			};
		}
	}, _ = (t, n, r) => {
		try {
			let i = Math.max(0, Math.min(.92, Number(r)));
			if (!(i > 0)) return;
			t.save(), t.globalCompositeOperation = "source-over", t.fillStyle = `rgba(0,0,0,${i})`, t.fillRect(0, 0, e.width, e.height), t.globalCompositeOperation = "destination-out", t.fillStyle = "rgba(0,0,0,1)";
			let a = Array.isArray(n) ? n : [n];
			for (let e of a) {
				if (!e) continue;
				let n = Number(e.x) || 0, r = Number(e.y) || 0, i = Number(e.w) || 0, a = Number(e.h) || 0;
				i > 1 && a > 1 && t.fillRect(n, r, i, a);
			}
			t.restore();
		} catch {
			try {
				t.restore();
			} catch (e) {
				console.debug?.(e);
			}
		}
	}, v = (e, t, n) => {
		try {
			e.save();
			try {
				e.setLineDash?.([Math.max(2, 4 * n), Math.max(2, 3 * n)]);
			} catch (e) {
				console.debug?.(e);
			}
			e.strokeStyle = "rgba(255,255,255,0.22)", e.lineWidth = Math.max(1, Math.floor(1 * n)), e.strokeRect(t.x + .5, t.y + .5, t.w - 1, t.h - 1), e.restore();
		} catch {
			try {
				e.restore();
			} catch (e) {
				console.debug?.(e);
			}
		}
	};
	return {
		ensureCanvasSize: m,
		redrawGrid: ({ w: t, h: m, dpr: y } = {}) => {
			try {
				let b = e?.getContext?.("2d");
				if (!b) return;
				try {
					o?.(b, t, m);
				} catch (e) {
					console.debug?.(e);
				}
				let x = a?.();
				if (!x) return;
				let S = Number(x.width) || 0, C = Number(x.height) || 0;
				if (!(S > 1 && C > 1)) return;
				let w = s(), T = n?.mode, E = (() => {
					try {
						if (T === r?.SINGLE) return [i?.()].filter(Boolean);
						let e = w?.querySelectorAll?.(".mjr-viewer-media") || [];
						return Array.from(e || []).filter(Boolean);
					} catch {
						return [i?.()].filter(Boolean);
					}
				})();
				if (!E.length) return;
				let D = [], O = [];
				for (let e of E) try {
					let t = c(e, w)?.getBoundingClientRect?.() || null;
					if (!t) continue;
					let r = Number(t.width) || 0, i = Number(t.height) || 0;
					if (!(r > 1 && i > 1)) continue;
					let a = l(e), o = u(e, a), s = d(r, i, o.w, o.h), p = h(n?.overlayFormat, e, {
						width: s.w,
						height: s.h
					}), m = g(s.w, s.h, p), _ = (Number(t.left) || 0) - (Number(x.left) || 0), v = (Number(t.top) || 0) - (Number(x.top) || 0), b = {
						x: _ + (s.x || 0),
						y: v + (s.y || 0),
						w: s.w || r,
						h: s.h || i
					}, S = {
						x: b.x + (m.x || 0),
						y: b.y + (m.y || 0),
						w: m.w || b.w,
						h: m.h || b.h
					}, C = {
						x: _ + r / 2,
						y: v + i / 2
					}, T = Number(n?.zoom) || 1, E = (Number(n?.panX) || 0) / T, k = (Number(n?.panY) || 0) / T, A = f(b, C, T, E, k), j = f(S, C, T, E, k), M = {
						x: A.x * y,
						y: A.y * y,
						w: A.w * y,
						h: A.h * y,
						_sizeLabel: (() => {
							try {
								let e = Number(a?.width) || Number(o.w) || 0, t = Number(a?.height) || Number(o.h) || 0;
								if (e > 0 && t > 0) return `${e}x${t}`;
							} catch (e) {
								console.debug?.(e);
							}
							return "";
						})()
					}, N = {
						x: j.x * y,
						y: j.y * y,
						w: j.w * y,
						h: j.h * y
					};
					M.w > 1 && M.h > 1 && O.push(M), N.w > 1 && N.h > 1 && D.push(N);
				} catch (e) {
					console.debug?.(e);
				}
				if (!D.length && !O.length) return;
				let k = D.length ? D : O, A = k[0] || null;
				try {
					if (n?.overlayMaskEnabled) {
						_(b, k, n?.overlayMaskOpacity ?? .65);
						for (let e of k) try {
							v(b, e, y);
						} catch (e) {
							console.debug?.(e);
						}
					}
				} catch (e) {
					console.debug?.(e);
				}
				try {
					if (n?.hudEnabled && n?.mode === r?.SINGLE) for (let e of O) {
						try {
							b.save(), b.strokeStyle = "rgba(255,255,255,0.22)", b.lineWidth = Math.max(1, Math.floor(1 * y)), b.strokeRect(e.x + .5, e.y + .5, e.w - 1, e.h - 1), b.restore();
						} catch {
							try {
								b.restore();
							} catch (e) {
								console.debug?.(e);
							}
						}
						try {
							p(b, e, e._sizeLabel || "", y);
						} catch (e) {
							console.debug?.(e);
						}
					}
				} catch (e) {
					console.debug?.(e);
				}
				if (n?.mode !== r?.SINGLE || (n?.gridMode || 0) === 0 || !A) return;
				try {
					b.save(), b.translate(A.x, A.y), b.strokeStyle = "rgba(255, 255, 255, 0.22)", b.lineWidth = Math.max(2, Math.round(1.25 * y));
					let e = (e, t, n, r) => {
						try {
							b.beginPath(), b.moveTo(Math.round(e) + .5, Math.round(t) + .5), b.lineTo(Math.round(n) + .5, Math.round(r) + .5), b.stroke();
						} catch (e) {
							console.debug?.(e);
						}
					};
					if (n.gridMode === 1) e(A.w / 3, 0, A.w / 3, A.h), e(2 * A.w / 3, 0, 2 * A.w / 3, A.h), e(0, A.h / 3, A.w, A.h / 3), e(0, 2 * A.h / 3, A.w, 2 * A.h / 3);
					else if (n.gridMode === 2) e(A.w / 2, 0, A.w / 2, A.h), e(0, A.h / 2, A.w, A.h / 2);
					else if (n.gridMode === 3) {
						let e = (e, t) => {
							try {
								b.save(), b.strokeStyle = `rgba(255,255,255,${t})`;
								let n = Math.round(A.w * e), r = Math.round(A.h * e), i = Math.round(A.w * (1 - e * 2)), a = Math.round(A.h * (1 - e * 2));
								b.strokeRect(n + .5, r + .5, i, a);
							} catch (e) {
								console.debug?.(e);
							} finally {
								try {
									b.restore();
								} catch (e) {
									console.debug?.(e);
								}
							}
						};
						e(.05, .24), e(.1, .18);
					} else if (n.gridMode === 4) {
						let t = .382, n = 1 - t;
						e(A.w * t, 0, A.w * t, A.h), e(A.w * n, 0, A.w * n, A.h), e(0, A.h * t, A.w, A.h * t), e(0, A.h * n, A.w, A.h * n);
					}
				} catch (e) {
					console.debug?.(e);
				} finally {
					try {
						b.restore();
					} catch (e) {
						console.debug?.(e);
					}
				}
			} catch (e) {
				console.debug?.(e);
			}
		}
	};
}
//#endregion
//#region ui/features/viewer/probe.ts
function Ze({ overlay: e, content: t, state: n, VIEWER_MODES: r, getPrimaryMedia: i, getMediaNaturalSize: a, _getViewportRect: o, positionOverlayBox: s, probeTooltip: c, loupeWrap: l, onLoupeRedraw: u, lifecycle: d } = {}) {
	let f = d?.unsubs || [], p = document.createElement("canvas");
	p.width = 1, p.height = 1;
	let m = null;
	try {
		m = p.getContext("2d", { willReadFrequently: !0 });
	} catch (e) {
		console.debug?.(e);
	}
	let h = null, g = null, _ = null, v = () => {
		try {
			c.style.display = "none";
		} catch (e) {
			console.debug?.(e);
		}
		try {
			l.style.display = "none";
		} catch (e) {
			console.debug?.(e);
		}
		try {
			n._probe = null;
		} catch (e) {
			console.debug?.(e);
		}
	}, y = (e) => {
		try {
			let t = e?.x, n = e?.y, r = e?.r, i = e?.g, a = e?.b, o = e?.a, s = Array.isArray(e?.raw) ? e.raw : null, c = Array.isArray(e?.lin) ? e.lin : null, l = Number(e?.scale), u = (e) => {
				let t = Number(e);
				return Number.isFinite(t) ? t.toFixed(3) : "?";
			}, d = r != null && i != null && a != null ? `#${[
				r,
				i,
				a
			].map((e) => Math.max(0, Math.min(255, Number(e) || 0)).toString(16).padStart(2, "0")).join("")}` : "", f = Number.isFinite(l) && l > 0 && l < .999 ? ` (proc ${(l * 100).toFixed(0)}%)` : "", p = [];
			return p.push(`X: ${t ?? "?"}  Y: ${n ?? "?"}${f}`), p.push(`RGBA8: ${r ?? "?"} ${i ?? "?"} ${a ?? "?"} ${o ?? "?"}`), s && s.length >= 3 && p.push(`RGB: ${u(s[0])} ${u(s[1])} ${u(s[2])}`), c && c.length >= 3 && p.push(`HDR: ${u(c[0])} ${u(c[1])} ${u(c[2])}`), d && p.push(d), p.join("\n");
		} catch {
			return "";
		}
	}, b = (e, t, n) => {
		if (!m) return null;
		try {
			m.clearRect(0, 0, 1, 1);
		} catch (e) {
			console.debug?.(e);
		}
		try {
			let r = Number(t) || 0, i = Number(n) || 0;
			if (e?.tagName === "CANVAS") {
				let t = Number(e._mjrPixelScale) || 1;
				r = Math.floor(r * t), i = Math.floor(i * t);
			}
			m.drawImage(e, r, i, 1, 1, 0, 0, 1, 1);
			let a = m.getImageData(0, 0, 1, 1)?.data;
			return !a || a.length < 4 ? null : {
				r: a[0],
				g: a[1],
				b: a[2],
				a: a[3]
			};
		} catch {
			return null;
		}
	}, x = (t, o) => {
		try {
			if (e?.style?.display === "none" || n?.mode !== r?.SINGLE || !n?.probeEnabled && !n?.loupeEnabled) return v();
			let d = i?.();
			if (!d) return v();
			let f = d.getBoundingClientRect();
			if (!f || !(f.width > 2 && f.height > 2)) return v();
			let p = (Number(t) || 0) - f.left, m = (Number(o) || 0) - f.top;
			if (p < 0 || m < 0 || p > f.width || m > f.height) return v();
			let { w: h, h: g } = a?.(d) || {
				w: 0,
				h: 0
			};
			if (!(h > 0 && g > 0)) return v();
			let _ = p / f.width, x = m / f.height, S = Math.max(0, Math.min(h - 1, Math.floor(_ * h))), C = Math.max(0, Math.min(g - 1, Math.floor(x * g))), w = null;
			if (n?.probeEnabled) {
				try {
					let e = d?._mjrProc;
					if (e?.sampleAtOriginal) {
						let t = e.sampleAtOriginal(S, C);
						t && (w = {
							x: S,
							y: C,
							...t
						});
					}
				} catch (e) {
					console.debug?.(e);
				}
				if (!w) {
					let e = b(d, S, C);
					e && (w = {
						x: S,
						y: C,
						...e
					});
				}
			}
			w ||= {
				x: S,
				y: C
			};
			try {
				n._probe = w;
			} catch (e) {
				console.debug?.(e);
			}
			if (n?.probeEnabled) {
				try {
					c.textContent = y(w), c.style.display = "";
				} catch (e) {
					console.debug?.(e);
				}
				O(() => s?.(c, t, o, {
					offsetX: 18,
					offsetY: 18
				}));
			} else try {
				c.style.display = "none";
			} catch (e) {
				console.debug?.(e);
			}
			if (n?.loupeEnabled) O(() => u?.(d, S, C, t, o));
			else try {
				l.style.display = "none";
			} catch (e) {
				console.debug?.(e);
			}
		} catch (e) {
			console.debug?.(e);
		}
	}, S = (e, t) => {
		g = e, _ = t;
		try {
			if (h != null) return;
			h = requestAnimationFrame(() => {
				h = null, x(g, _);
			});
		} catch (e) {
			console.debug?.(e);
		}
	};
	try {
		t && !t._mjrProbeBound && (f.push(F(t, "mousemove", (e) => {
			try {
				S(e.clientX, e.clientY);
			} catch (e) {
				console.debug?.(e);
			}
		}, {
			passive: !0,
			capture: !0
		})), f.push(F(t, "mouseleave", () => {
			v();
		}, {
			passive: !0,
			capture: !0
		})), t._mjrProbeBound = !0);
	} catch (e) {
		console.debug?.(e);
	}
	return {
		hide: v,
		dispose: () => {
			try {
				h != null && cancelAnimationFrame(h);
			} catch (e) {
				console.debug?.(e);
			}
			h = null, v();
		}
	};
}
//#endregion
//#region ui/features/viewer/loupe.ts
function Qe({ state: e, loupeCanvas: t, loupeWrap: n, getMediaNaturalSize: r, positionOverlayBox: i } = {}) {
	let a = null;
	try {
		a = t?.getContext?.("2d", { willReadFrequently: !0 });
	} catch (e) {
		console.debug?.(e);
	}
	return {
		redraw: (o, s, c, l, u) => {
			try {
				if (!e?.loupeEnabled || !a || !o) return;
				let { w: d, h: f } = r?.(o) || {
					w: 0,
					h: 0
				};
				if (!(d > 0 && f > 0)) return;
				let p = Math.max(48, Math.min(240, Number(e.loupeSize) || 120)), m = Math.max(2, Math.min(20, Number(e.loupeMagnification) || 8));
				try {
					t.width !== p && (t.width = p), t.height !== p && (t.height = p);
				} catch (e) {
					console.debug?.(e);
				}
				let h = Math.max(3, Math.floor(p / m)), g = o?.tagName === "CANVAS" && Number(o._mjrPixelScale) || 1, _ = o?.tagName === "CANVAS" ? Number(o.width) || 0 : d, v = o?.tagName === "CANVAS" ? Number(o.height) || 0 : f;
				if (!(_ > 0 && v > 0)) return;
				let y = Math.max(1, Math.floor(h * g)), b = Math.floor(y / 2), x = Math.floor((Number(s) || 0) * g), S = Math.floor((Number(c) || 0) * g), C = Math.max(0, Math.min(_ - y, x - b)), w = Math.max(0, Math.min(v - y, S - b));
				a.imageSmoothingEnabled = !1, a.clearRect(0, 0, p, p), a.drawImage(o, C, w, y, y, 0, 0, p, p), a.strokeStyle = "rgba(255,255,255,0.75)", a.lineWidth = 1, a.beginPath(), a.moveTo(p / 2 + .5, 0), a.lineTo(p / 2 + .5, p), a.moveTo(0, p / 2 + .5), a.lineTo(p, p / 2 + .5), a.stroke();
				try {
					n.style.display = "", n.style.width = `${p}px`, n.style.height = `${p}px`;
				} catch (e) {
					console.debug?.(e);
				}
				try {
					i?.(n, l, u, {
						offsetX: 18,
						offsetY: -p - 18
					});
				} catch (e) {
					console.debug?.(e);
				}
			} catch (e) {
				console.debug?.(e);
			}
		},
		hide: () => {
			try {
				n.style.display = "none";
			} catch (e) {
				console.debug?.(e);
			}
		}
	};
}
//#endregion
//#region ui/features/viewer/metadata.ts
function $e({ state: e, VIEWER_MODES: t, APP_CONFIG: n, getAssetMetadata: r, getAssetsBatch: i } = {}) {
	let a = /* @__PURE__ */ new Map(), o = n?.VIEWER_META_TTL_MS ?? 3e4, s = n?.VIEWER_META_MAX_ENTRIES ?? 500, c = 0, l = null, u = () => {
		if (a.size <= s) return;
		let e = Date.now();
		try {
			for (let [t, n] of a.entries()) n && e - (n.at || 0) > o && a.delete(t);
		} catch (e) {
			console.debug?.(e);
		}
		if (!(a.size <= s)) try {
			let e = Array.from(a.entries()).sort((e, t) => (e?.[1]?.at || 0) - (t?.[1]?.at || 0)), t = a.size - s;
			for (let n = 0; n < t; n++) {
				let t = e[n]?.[0];
				t != null && a.delete(t);
			}
		} catch (e) {
			console.debug?.(e);
		}
	}, d = (e, t) => {
		if (!(!e || !t || typeof t != "object")) {
			try {
				t.rating !== void 0 && (e.rating = t.rating);
			} catch (e) {
				console.debug?.(e);
			}
			try {
				t.tags !== void 0 && (e.tags = t.tags);
			} catch (e) {
				console.debug?.(e);
			}
		}
	}, f = async (e, { signal: t } = {}) => {
		let n = Array.isArray(e) ? e : [], r = Date.now(), s = [];
		for (let e of n) {
			let t = e?.id;
			if (t == null) continue;
			let n = String(t), i = a.get(n);
			if (i && r - (i.at || 0) < o) {
				d(e, i.data);
				continue;
			}
			s.push(t);
		}
		if (s.length) try {
			let e = await i?.(s, t ? { signal: t } : {}), o = Array.isArray(e?.data) ? e.data : [];
			for (let e of o) {
				let t = e?.id;
				if (t == null) continue;
				let n = String(t);
				a.set(n, {
					at: r,
					data: e
				});
			}
			u();
			for (let e of n) {
				let t = e?.id;
				if (t == null) continue;
				let n = a.get(String(t));
				n && n.data && d(e, n.data);
			}
		} catch (e) {
			console.debug?.(e);
		}
	};
	return {
		hydrateVisibleMetadata: async () => {
			let n = e?.assets?.[e?.currentIndex], r = e?.compareAsset, i = e?.mode;
			++c;
			try {
				l?.abort?.();
			} catch (e) {
				console.debug?.(e);
			}
			l = new AbortController();
			let a = l.signal;
			try {
				if (i === t?.SINGLE) return n && await f([n], { signal: a }), void 0;
				let o = (Array.isArray(e?.assets) ? e.assets.slice(0, 4) : []).slice();
				r && o.push(r), await f(o, { signal: a });
			} catch (e) {
				console.debug?.(e);
			}
		},
		hydrateAssetMetadata: async (e, { signal: t } = {}) => {
			let n = e?.id;
			if (n == null) return;
			let i = String(n), s = Date.now(), c = a.get(i);
			if (c && s - (c.at || 0) < o) {
				d(e, c.data);
				return;
			}
			try {
				let o = await r?.(n, t ? { signal: t } : {});
				o?.ok && o.data && (a.set(i, {
					at: s,
					data: o.data
				}), u(), d(e, o.data));
			} catch (e) {
				console.debug?.(e);
			}
		},
		hydrateAssetsMetadataBatch: f,
		getCached: (e) => {
			try {
				return a.get(String(e));
			} catch {
				return null;
			}
		},
		setCached: (e, t) => {
			try {
				a.set(String(e), {
					at: Date.now(),
					data: t
				}), u();
			} catch (e) {
				console.debug?.(e);
			}
		},
		deleteCached: (e) => {
			try {
				a.delete(String(e));
			} catch (e) {
				console.debug?.(e);
			}
		},
		abort: () => {
			O(() => l?.abort?.()), l = null;
		},
		dispose: () => {
			O(() => l?.abort?.()), l = null, O(() => a.clear());
		},
		cleanupCache: () => {
			O(u);
		},
		_noop: N
	};
}
//#endregion
//#region ui/features/viewer/constants.ts
var Q = Object.freeze({
	MIN: .1,
	MAX: 16
});
//#endregion
//#region ui/features/viewer/panzoom.ts
function et({ overlay: e, content: t, singleView: n, abView: r, sideView: i, state: a, VIEWER_MODES: o, scheduleOverlayRedraw: s, lifecycle: c } = {}) {
	let l = c?.safeCall || O, u = c?.safeAddListener || F, d = c?.unsubs || [], f = () => {
		try {
			return a?.mode === o?.SINGLE && n?.querySelector?.(".mjr-viewer-media") || null;
		} catch {
			return null;
		}
	}, p = (e) => {
		try {
			if (!e) return {
				w: 0,
				h: 0
			};
			let t = Number(e?._mjrNaturalW) || 0, n = Number(e?._mjrNaturalH) || 0;
			if (t > 0 && n > 0) return {
				w: t,
				h: n
			};
			if (e.tagName === "IMG") return {
				w: Number(e.naturalWidth) || 0,
				h: Number(e.naturalHeight) || 0
			};
			if (e.tagName === "VIDEO") return {
				w: Number(e.videoWidth) || 0,
				h: Number(e.videoHeight) || 0
			};
			if (e.tagName === "CANVAS") return {
				w: Number(e._mjrNaturalW) || Number(e.width) || 0,
				h: Number(e._mjrNaturalH) || Number(e.height) || 0
			};
		} catch (e) {
			console.debug?.(e);
		}
		return {
			w: 0,
			h: 0
		};
	}, m = () => {
		try {
			let e = t?.getBoundingClientRect?.();
			return e && e.width > 0 && e.height > 0 ? e : null;
		} catch {
			return null;
		}
	}, h = () => {
		try {
			let e = n;
			a?.mode === o?.AB_COMPARE ? e = r : a?.mode === o?.SIDE_BY_SIDE && (e = i);
			let t = e?.querySelector?.(".mjr-viewer-media");
			if (!t) return;
			let { w: s, h: c } = p(t);
			s > 0 && c > 0 && (a._mediaW = s, a._mediaH = c);
		} catch (e) {
			console.debug?.(e);
		}
	}, g = (e, { clampPanToBounds: t, applyTransform: n } = {}) => {
		if (!e || e._mjrMediaSizeBound) return;
		e._mjrMediaSizeBound = !0;
		let r = () => {
			h();
			try {
				t?.();
			} catch (e) {
				console.debug?.(e);
			}
			try {
				n?.();
			} catch (e) {
				console.debug?.(e);
			}
		};
		try {
			e.tagName === "IMG" ? e.addEventListener("load", () => requestAnimationFrame(r), { once: !0 }) : e.tagName === "VIDEO" && e.addEventListener("loadedmetadata", () => requestAnimationFrame(r), { once: !0 });
		} catch (e) {
			console.debug?.(e);
		}
	}, _ = () => {
		try {
			if (!e || e.style.display === "none") return;
			let s = Math.max(Q.MIN, Math.min(Q.MAX, Number(a?.zoom) || 1)), c = a?.assets?.[a?.currentIndex], l = Number(c?.width) || 0, u = Number(c?.height) || 0;
			if (l > 0 && u > 0 || (h(), l = Number(a?._mediaW) || 0, u = Number(a?._mediaH) || 0), !(l > 0 && u > 0)) return;
			let d = l / u;
			if (!Number.isFinite(d) || d <= 0) return;
			let { w: f, h: p } = (() => {
				let s = Date.now();
				try {
					let e = a?._viewportCache;
					if (e && e.mode === a?.mode && s - (e.at || 0) < 250) {
						let t = Number(e.w) || 0, n = Number(e.h) || 0;
						if (t > 0 && n > 0) return {
							w: t,
							h: n
						};
					}
				} catch (e) {
					console.debug?.(e);
				}
				let c = Math.max(Number(t?.clientWidth) || 0, Number(e?.clientWidth) || 0), l = Math.max(Number(t?.clientHeight) || 0, Number(e?.clientHeight) || 0), u = (e, t) => ({
					w: Math.max(Number(e) || 0, c),
					h: Math.max(Number(t) || 0, l)
				}), d = null;
				if (a?.mode === o?.SINGLE) d = u(n?.clientWidth, n?.clientHeight);
				else if (a?.mode === o?.AB_COMPARE) d = u(r?.clientWidth, r?.clientHeight);
				else {
					let e = Array.from(i?.children || []).filter((e) => e && e.nodeType === 1);
					if (e.length) {
						let t = Infinity, n = Infinity;
						for (let r of e) {
							let e = Number(r.clientWidth) || 0, i = Number(r.clientHeight) || 0;
							e > 0 && (t = Math.min(t, e)), i > 0 && (n = Math.min(n, i));
						}
						Number.isFinite(t) && Number.isFinite(n) && (d = u(t, n));
					}
					d ||= u(i?.clientWidth, i?.clientHeight);
				}
				try {
					a._viewportCache = {
						mode: a?.mode,
						w: d.w,
						h: d.h,
						at: s
					};
				} catch (e) {
					console.debug?.(e);
				}
				return d;
			})();
			if (!(f > 0 && p > 0)) {
				e?.style?.display !== "none" && requestAnimationFrame(_);
				return;
			}
			let m = f / p, g = 0, v = 0;
			d > m ? (g = f, v = f / d) : (v = p, g = p * d);
			let y = g * s, b = v * s, x = y > f + 1 || b > p + 1;
			if (!(s > 1.001) && !x) {
				a.panX = 0, a.panY = 0;
				return;
			}
			let S = Math.max(0, y - f), C = Math.max(0, b - p), w = S / 2 * s, T = C / 2 * s;
			a.panX = Math.max(-w, Math.min(w, Number(a?.panX) || 0)), a.panY = Math.max(-T, Math.min(T, Number(a?.panY) || 0));
		} catch (e) {
			console.debug?.(e);
		}
	}, v = () => {
		let e = Math.max(Q.MIN, Math.min(Q.MAX, Number(a?.zoom) || 1)), t = Number(a?.panX) || 0, n = Number(a?.panY) || 0;
		return `translate3d(${t / e}px, ${n / e}px, 0) scale(${e})`;
	}, y = () => {
		try {
			if (!t) return;
			if (!e || e.style.display === "none") {
				t.style.cursor = "";
				return;
			}
			let n = Number(a?.zoom) || 1, { w: r, h: i } = p(f()) || {
				w: 0,
				h: 0
			}, o = m(), s = o && r > 0 && i > 0 ? E(r, i, o.width, o.height, n) : !1;
			if (!(n > 1.01 || s)) {
				t.style.cursor = "";
				return;
			}
			t.style.cursor = "grab";
		} catch (e) {
			console.debug?.(e);
		}
	}, b = ({ skipFit: t = !1 } = {}) => {
		try {
			_();
			let n = v(), r = w(), i = e?.querySelectorAll?.(".mjr-viewer-media") || [];
			for (let e of i) try {
				if (e?._mjrDisableViewerTransform) continue;
				if (!t) {
					let t = T(e, r)?.getBoundingClientRect?.() || null;
					if (t) {
						let n = Number(t.width) || 0, r = Number(t.height) || 0;
						if (n > 1 && r > 1) {
							let { w: t, h: i } = p(e) || {
								w: 0,
								h: 0
							};
							if (t > 0 && i > 0) {
								let a = C(t, i, n, r);
								a.w > 1 && a.h > 1 && (e.style.width = `${Math.round(a.w)}px`, e.style.height = `${Math.round(a.h)}px`);
							}
						}
					}
				}
				e.style.transform = n;
			} catch (e) {
				console.debug?.(e);
			}
			try {
				s?.();
			} catch (e) {
				console.debug?.(e);
			}
		} catch (e) {
			console.debug?.(e);
		}
	}, S = (e, { clientX: n = null, clientY: r = null } = {}) => {
		try {
			let i = Math.max(Q.MIN, Math.min(Q.MAX, Number(a?.zoom) || 1)), o = Math.max(Q.MIN, Math.min(Q.MAX, Number(e) || i));
			try {
				a._userInteracted = !0;
			} catch (e) {
				console.debug?.(e);
			}
			let s = Number(a?.panX) || 0, c = Number(a?.panY) || 0;
			if (n != null && r != null && Number.isFinite(Number(n)) && Number.isFinite(Number(r))) try {
				let e = t?.getBoundingClientRect?.();
				if (e && e.width > 0 && e.height > 0) {
					let t = e.left + e.width / 2, l = e.top + e.height / 2, u = (Number(n) || 0) - t, d = (Number(r) || 0) - l, f = o / i;
					s = Math.round(((Number(a?.panX) || 0) * f + (1 - f) * u) * 10) / 10, c = Math.round(((Number(a?.panY) || 0) * f + (1 - f) * d) * 10) / 10;
				}
			} catch (e) {
				console.debug?.(e);
			}
			else if (o !== i) {
				let e = o / i;
				s = Math.round((Number(a?.panX) || 0) * e * 10) / 10, c = Math.round((Number(a?.panY) || 0) * e * 10) / 10;
			}
			a.zoom = o, a.panX = s, a.panY = c, Math.abs(a.zoom - 1) < .001 && (a.zoom = 1, a.panX = 0, a.panY = 0), a.targetZoom = a.zoom, b({ skipFit: !0 }), y();
		} catch (e) {
			console.debug?.(e);
		}
	}, C = (e, t, n, r) => {
		try {
			let i = Number(e) || 0, a = Number(t) || 0, o = Number(n) || 0, s = Number(r) || 0;
			if (!(i > 0 && a > 0 && o > 0 && s > 0)) return {
				w: 0,
				h: 0
			};
			let c = i / a;
			return !Number.isFinite(c) || c <= 0 ? {
				w: 0,
				h: 0
			} : {
				w: s * c,
				h: s
			};
		} catch {
			return {
				w: 0,
				h: 0
			};
		}
	}, w = () => {
		try {
			let e = a?.mode;
			return e === o?.AB_COMPARE ? r || t || null : e === o?.SIDE_BY_SIDE ? i || t || null : n || t || null;
		} catch {
			return t || null;
		}
	}, T = (e, n) => {
		try {
			if (!e) return n || null;
			let r = a?.mode;
			if (r === o?.SIDE_BY_SIDE || r === o?.AB_COMPARE) {
				let t = e;
				for (; t && t !== n && t.parentElement;) {
					if (t.parentElement === n) return t;
					t = t.parentElement;
				}
				return n || null;
			}
			return n || t || null;
		} catch {
			return n || t || null;
		}
	}, E = (e, t, n, r, i) => {
		try {
			let a = C(e, t, n, r);
			if (!(a.w > 0 && a.h > 0)) return !1;
			let o = Math.max(Q.MIN, Math.min(Q.MAX, Number(i) || 1)), s = a.w * o, c = a.h * o;
			return s > (Number(n) || 0) + 1 || c > (Number(r) || 0) + 1;
		} catch {
			return !1;
		}
	}, D = () => {
		try {
			let e = f();
			if (!e) return null;
			let { w: t, h: n } = p(e);
			if (!(t > 0 && n > 0)) return null;
			let r = m();
			if (!r) return null;
			let i = C(t, n, r.width, r.height);
			if (!(i.w > 0 && i.h > 0)) return null;
			let a = t / i.w;
			return !Number.isFinite(a) || a <= 0 ? null : Math.max(Q.MIN, Math.min(Q.MAX, a));
		} catch {
			return null;
		}
	}, k = {
		active: !1,
		pointerId: null,
		startX: 0,
		startY: 0,
		startPanX: 0,
		startPanY: 0,
		raf: 0
	}, A = () => {
		k.raf ||= requestAnimationFrame(() => {
			k.raf = 0, b({ skipFit: !0 }), y();
		});
	}, j = (n) => {
		if (!e || e.style.display === "none" || le(n?.target)) return;
		let r = Number(a?.zoom) || 1, i = (() => {
			try {
				return !!x?.VIEWER_ALLOW_PAN_AT_ZOOM_1;
			} catch {
				return !1;
			}
		})();
		if (!(() => {
			try {
				if (i) return !0;
				let { w: e, h: t } = p(f()) || {
					w: 0,
					h: 0
				}, n = m();
				return !n || !(e > 0 && t > 0) ? r > 1.01 : r > 1.01 || E(e, t, n.width, n.height, r);
			} catch {
				return r > 1.01;
			}
		})()) {
			try {
				a._panHintAt = Date.now(), a._panHintX = n?.clientX ?? null, a._panHintY = n?.clientY ?? null;
			} catch (e) {
				console.debug?.(e);
			}
			try {
				a._panHintTimer && clearTimeout(a._panHintTimer);
			} catch (e) {
				console.debug?.(e);
			}
			try {
				a._panHintTimer = setTimeout(() => {
					try {
						a._panHintAt = 0;
					} catch (e) {
						console.debug?.(e);
					}
					l(s);
				}, 950);
			} catch (e) {
				console.debug?.(e);
			}
			l(s);
			return;
		}
		let o = n.button === 0, c = n.button === 1;
		if (!(!o && !c)) {
			try {
				let e = n.target;
				if (e && (e.tagName === "INPUT" || e.tagName === "TEXTAREA" || e.tagName === "SELECT" || e.isContentEditable)) return;
			} catch (e) {
				console.debug?.(e);
			}
			try {
				if (n?.target?.closest?.(".mjr-video-controls") || n?.target?.closest?.(".mjr-context-menu") || n?.target?.closest?.(".mjr-ab-slider") || le(n?.target)) return;
			} catch (e) {
				console.debug?.(e);
			}
			try {
				if (!t?.contains?.(n.target)) return;
			} catch {
				return;
			}
			k.active = !0;
			try {
				a._userInteracted = !0;
			} catch (e) {
				console.debug?.(e);
			}
			k.pointerId = n.pointerId;
			try {
				a._lastPointerX = n.clientX, a._lastPointerY = n.clientY;
			} catch (e) {
				console.debug?.(e);
			}
			k.startX = n.clientX, k.startY = n.clientY, k.startPanX = Number(a?.panX) || 0, k.startPanY = Number(a?.panY) || 0;
			try {
				n.preventDefault(), n.stopPropagation(), n.stopImmediatePropagation?.();
			} catch (e) {
				console.debug?.(e);
			}
			try {
				t?.setPointerCapture?.(n.pointerId);
			} catch (e) {
				console.debug?.(e);
			}
			try {
				t && (t.style.cursor = "grabbing");
			} catch (e) {
				console.debug?.(e);
			}
		}
	}, M = (e) => {
		if (!k.active) return;
		try {
			if (e?.target?.closest?.(".mjr-video-controls")) return;
		} catch (e) {
			console.debug?.(e);
		}
		try {
			e.preventDefault(), e.stopPropagation(), e.stopImmediatePropagation?.();
		} catch (e) {
			console.debug?.(e);
		}
		let t = (Number(e.clientX) || 0) - k.startX, n = (Number(e.clientY) || 0) - k.startY, r = Math.max(Q.MIN, Math.min(Q.MAX, Number(a?.zoom) || 1)), i = Math.max(1, r);
		a.panX = k.startPanX + t * i, a.panY = k.startPanY + n * i;
		try {
			a._lastPointerX = e.clientX, a._lastPointerY = e.clientY;
		} catch (e) {
			console.debug?.(e);
		}
		A();
	}, N = (e) => {
		if (k.active) {
			k.active = !1, k.pointerId = null;
			try {
				k.raf && cancelAnimationFrame(k.raf);
			} catch (e) {
				console.debug?.(e);
			}
			k.raf = 0, b({ skipFit: !1 });
			try {
				t?.releasePointerCapture?.(e.pointerId);
			} catch (e) {
				console.debug?.(e);
			}
			y();
		}
	}, P = (n) => {
		if (!(!e || e.style.display === "none")) {
			try {
				if (!t?.contains?.(n.target)) return;
			} catch (e) {
				console.debug?.(e);
			}
			try {
				if (le(n?.target)) return;
			} catch (e) {
				console.debug?.(e);
			}
			try {
				n.preventDefault(), n.stopPropagation(), n.stopImmediatePropagation?.();
			} catch (e) {
				console.debug?.(e);
			}
			Math.abs((Number(a?.targetZoom) || 1) - 1) < .01 ? S(Math.min(8, (Number(a?.targetZoom) || 1) * 4), {
				clientX: n.clientX,
				clientY: n.clientY
			}) : S(1, {
				clientX: n.clientX,
				clientY: n.clientY
			});
		}
	};
	try {
		t && !t._mjrPanBound && (d.push(u(t, "pointerdown", j, {
			passive: !1,
			capture: !0
		})), d.push(u(t, "pointermove", M, {
			passive: !1,
			capture: !0
		})), d.push(u(t, "pointerup", N, {
			passive: !0,
			capture: !0
		})), d.push(u(t, "pointercancel", N, {
			passive: !0,
			capture: !0
		})), t._mjrPanBound = !0);
	} catch (e) {
		console.debug?.(e);
	}
	try {
		t && !t._mjrDblClickResetBound && (d.push(u(t, "dblclick", P, {
			passive: !1,
			capture: !0
		})), t._mjrDblClickResetBound = !0);
	} catch (e) {
		console.debug?.(e);
	}
	return {
		getPrimaryMedia: f,
		getMediaNaturalSize: p,
		getViewportRect: m,
		updateMediaNaturalSize: h,
		attachMediaLoadHandlers: g,
		clampPanToBounds: _,
		mediaTransform: v,
		applyTransform: b,
		setZoom: S,
		computeOneToOneZoom: D,
		updatePanCursor: y,
		dispose: () => {
			l(() => {
				k.active = !1, k.pointerId = null, k.raf && cancelAnimationFrame(k.raf), k.raf = 0;
			});
		}
	};
}
//#endregion
//#region ui/features/viewer/videoProcessorWebGL.ts
var tt = "\nattribute vec2 a_position;\nvarying vec2 v_uv;\nvoid main() {\n    // Quad covers -1..1\n    gl_Position = vec4(a_position, 0, 1);\n    // Map -1..1 to 0..1\n    v_uv = a_position * 0.5 + 0.5;\n    // In WebGL, textures are usually flipped relative to Image/Video elements if not handled.\n    // We'll flip Y in fragment shader or here.\n    v_uv.y = 1.0 - v_uv.y;\n}\n", nt = "\nprecision mediump float;\nvarying vec2 v_uv;\nuniform sampler2D u_image;\nuniform float u_exposure_scale;\nuniform float u_gamma_inv;\nuniform int u_channel; // 0=RGB, 1=R, 2=G, 3=B\nuniform int u_analysis; // 0=None, 1=Zebra\nuniform float u_zebra_threshold;\nuniform vec2 u_resolution;\n\nfloat getLuma(vec3 c) { return dot(c, vec3(0.2126, 0.7152, 0.0722)); }\n\nvoid main() {\n    vec4 texColor = texture2D(u_image, v_uv);\n    vec3 color = texColor.rgb;\n\n    // Exposure\n    color *= u_exposure_scale;\n\n    // Analysis (Zebra) or Gamma\n    bool isZebra = false;\n    if (u_analysis == 1) {\n        float luma = getLuma(color);\n        if (luma >= u_zebra_threshold) {\n            isZebra = true;\n            // Stripe pattern: (x + y) % 16 < 8\n            // gl_FragCoord is in window pixels\n            float stripe = mod(gl_FragCoord.x + gl_FragCoord.y, 32.0);\n            if (stripe < 16.0) {\n                 gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0); // Black\n            } else {\n                 gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0); // White\n            }\n        }\n    }\n\n    if (!isZebra) {\n        // Gamma\n        // fast pow?\n        color = pow(clamp(color, 0.0, 1.0), vec3(u_gamma_inv));\n\n        // Channel Selector\n        if (u_channel == 1) color = vec3(color.r);\n        else if (u_channel == 2) color = vec3(color.g);\n        else if (u_channel == 3) color = vec3(color.b);\n\n        gl_FragColor = vec4(color, texColor.a);\n    }\n}\n";
function rt(e, t, n) {
	let r = e.createShader(t);
	return e.shaderSource(r, n), e.compileShader(r), e.getShaderParameter(r, e.COMPILE_STATUS) ? r : (console.warn("WebGL Shader Error:", e.getShaderInfoLog(r)), e.deleteShader(r), null);
}
function it(e, t, n) {
	let r = e.createProgram();
	if (e.attachShader(r, t), e.attachShader(r, n), e.linkProgram(r), !e.getProgramParameter(r, e.LINK_STATUS)) {
		console.warn("WebGL Program Error:", e.getProgramInfoLog(r));
		try {
			e.deleteProgram(r);
		} catch (e) {
			console.debug?.(e);
		}
		return null;
	}
	return r;
}
function at() {
	try {
		let e = document.createElement("canvas");
		return !!(window.WebGLRenderingContext && (e.getContext("webgl") || e.getContext("experimental-webgl")));
	} catch {
		return !1;
	}
}
function ot(e) {
	let { canvas: t, videoEl: n, getGradeParams: r } = e, i = null, a = null, o = 4096, s = !1, c = {
		type: "webgl",
		ready: !1,
		naturalW: 0,
		naturalH: 0,
		scale: 1,
		_destroyed: !1
	};
	function l() {
		let e = null;
		try {
			e = t.getContext("webgl", {
				alpha: !1,
				preserveDrawingBuffer: !0
			});
		} catch (e) {
			console.debug?.(e);
		}
		if (!e) try {
			e = t.getContext("experimental-webgl", {
				alpha: !1,
				preserveDrawingBuffer: !0
			});
		} catch (e) {
			console.debug?.(e);
		}
		return e && (o = e.getParameter(e.MAX_TEXTURE_SIZE) || 4096), e;
	}
	if (i = l(), !i) return null;
	let u = (e = "") => {
		if (!i) return;
		let t = i.getError();
		t !== i.NO_ERROR && console.error(`WebGL Error [${e}]: ${t}`);
	}, d = () => {
		if (!i || !a) return;
		let { positionBuffer: e, texture: t, program: n } = a;
		try {
			i.bindTexture(i.TEXTURE_2D, null);
		} catch (e) {
			console.debug?.(e);
		}
		try {
			i.bindBuffer(i.ARRAY_BUFFER, null);
		} catch (e) {
			console.debug?.(e);
		}
		try {
			i.useProgram(null);
		} catch (e) {
			console.debug?.(e);
		}
		try {
			i.deleteTexture(t);
		} catch (e) {
			console.debug?.(e);
		}
		try {
			i.deleteBuffer(e);
		} catch (e) {
			console.debug?.(e);
		}
		try {
			i.deleteProgram(n);
		} catch (e) {
			console.debug?.(e);
		}
		a = null;
	}, f = () => {
		if (!i) return null;
		d();
		let e = rt(i, i.VERTEX_SHADER, tt), t = rt(i, i.FRAGMENT_SHADER, nt);
		if (!e || !t) return e && i.deleteShader(e), t && i.deleteShader(t), null;
		let n = it(i, e, t);
		if (i.deleteShader(e), i.deleteShader(t), !n) return null;
		u("setupResources:createProgram");
		let r = {
			position: i.getAttribLocation(n, "a_position"),
			u_image: i.getUniformLocation(n, "u_image"),
			u_exposure: i.getUniformLocation(n, "u_exposure_scale"),
			u_gamma: i.getUniformLocation(n, "u_gamma_inv"),
			u_channel: i.getUniformLocation(n, "u_channel"),
			u_analysis: i.getUniformLocation(n, "u_analysis"),
			u_thresh: i.getUniformLocation(n, "u_zebra_threshold"),
			u_res: i.getUniformLocation(n, "u_resolution")
		}, a = i.createBuffer();
		i.bindBuffer(i.ARRAY_BUFFER, a), i.bufferData(i.ARRAY_BUFFER, new Float32Array([
			-1,
			-1,
			1,
			-1,
			-1,
			1,
			-1,
			1,
			1,
			-1,
			1,
			1
		]), i.STATIC_DRAW), u("setupResources:bufferData");
		let o = i.createTexture();
		return i.bindTexture(i.TEXTURE_2D, o), i.texParameteri(i.TEXTURE_2D, i.TEXTURE_WRAP_S, i.CLAMP_TO_EDGE), i.texParameteri(i.TEXTURE_2D, i.TEXTURE_WRAP_T, i.CLAMP_TO_EDGE), i.texParameteri(i.TEXTURE_2D, i.TEXTURE_MIN_FILTER, i.LINEAR), i.texParameteri(i.TEXTURE_2D, i.TEXTURE_MAG_FILTER, i.LINEAR), u("setupResources:texSetup"), {
			program: n,
			loc: r,
			positionBuffer: a,
			texture: o
		};
	}, p = () => s || c._destroyed || (i ||= l(), !i) ? !1 : (a ||= f(), !!a), m = () => {
		if (!s && i && n?.videoWidth) {
			let e = n.videoWidth, r = n.videoHeight, a = o || i.getParameter(i.MAX_TEXTURE_SIZE) || 4096;
			if (e > a || r > a) {
				let t = Math.min(a / e, a / r);
				e = Math.floor(e * t), r = Math.floor(r * t);
			}
			return (t.width !== e || t.height !== r) && (t.width = e, t.height = r, i.viewport(0, 0, e, r)), !0;
		}
		return !1;
	}, h = (e) => {
		if (!s && p() && m()) {
			let { program: o, loc: s, positionBuffer: c, texture: l } = a;
			i.useProgram(o), i.activeTexture(i.TEXTURE0), i.bindTexture(i.TEXTURE_2D, l);
			try {
				i.texImage2D(i.TEXTURE_2D, 0, i.RGBA, i.RGBA, i.UNSIGNED_BYTE, n);
			} catch (e) {
				console.warn("WebGL texImage2D failed", e), u("texImage2D");
				return;
			}
			u("texImage2D"), i.uniform1i(s.u_image, 0);
			let d = e || (r ? r() : {}), f = Number(d.exposureEV) || 0, p = Math.max(.1, Math.min(3, Number(d.gamma) || 1)), m = +(d.analysisMode === "zebra"), h = 0;
			d.channel === "r" && (h = 1), d.channel === "g" && (h = 2), d.channel === "b" && (h = 3), i.uniform1f(s.u_exposure, 2 ** f), i.uniform1f(s.u_gamma, 1 / p), i.uniform1i(s.u_channel, h), i.uniform1i(s.u_analysis, m), i.uniform1f(s.u_thresh, d.zebraThreshold ?? .95), i.uniform2f(s.u_res, t.width, t.height), i.enableVertexAttribArray(s.position), i.bindBuffer(i.ARRAY_BUFFER, c), i.vertexAttribPointer(s.position, 2, i.FLOAT, !1, 0, 0), i.drawArrays(i.TRIANGLES, 0, 6), u("drawArrays");
		}
	}, g = (e) => {
		e.preventDefault(), s = !0, d();
	}, _ = () => {
		i = l(), s = !1, a = null, p();
	};
	return t.addEventListener("webglcontextlost", g), t.addEventListener("webglcontextrestored", _), {
		update: h,
		destroy: () => {
			if (c._destroyed = !0, c.ready = !1, d(), i) try {
				i.getExtension("WEBGL_lose_context")?.loseContext?.();
			} catch (e) {
				console.debug?.(e);
			}
			t.removeEventListener("webglcontextlost", g), t.removeEventListener("webglcontextrestored", _);
		}
	};
}
//#endregion
//#region ui/features/viewer/videoProcessor.ts
function st({ canvas: e, videoEl: t, disableWebGL: n, pauseDuringExecution: r = null, getGradeParams: i, isDefaultGrade: a, _tonemap: o, maxProcPixelsVideo: s, throttleFps: c, safeAddListener: l, safeCall: u, onReady: d } = {}) {
	let f = r == null ? !!x?.VIEWER_PAUSE_DURING_EXECUTION : !!r, p = null;
	if (!n && at()) try {
		p = ot({
			canvas: e,
			videoEl: t,
			getGradeParams: i,
			isDefaultGrade: a,
			maxProcPixelsVideo: s
		});
	} catch (e) {
		console.warn("WebGL Init failed, falling back to 2D", e), p = null;
	}
	let m = p ? null : (() => {
		try {
			return e.getContext("2d", {
				willReadFrequently: !0,
				alpha: !0
			});
		} catch {
			return null;
		}
	})(), h = document.createElement("canvas"), g = (() => {
		try {
			return h.getContext("2d", {
				willReadFrequently: !0,
				alpha: !1
			});
		} catch {
			return null;
		}
	})(), _ = document.createElement("canvas");
	_.width = 1, _.height = 1;
	let v = (() => {
		try {
			return _.getContext("2d", {
				willReadFrequently: !0,
				alpha: !1
			});
		} catch {
			return null;
		}
	})(), y = {
		ready: !1,
		_rendering: !1,
		_destroyed: !1,
		_rvfc: null,
		_rafIdLoop: null,
		_rafIdSchedule: null,
		_seekRaf: null,
		_lastHeavyRenderAt: 0,
		_throttleTimer: null,
		_connectRAF: null,
		_connectTries: 0,
		_buffer: null,
		_lut: null,
		_lutKey: "",
		_lastFrameTime: -1,
		_lastHeavySig: "",
		_runtimePaused: !1
	}, b = [], S = (e, t) => se(s, e, t), w = () => {
		try {
			let n = Number(t?.videoWidth) || 0, r = Number(t?.videoHeight) || 0;
			if (!(n > 0 && r > 0)) return !1;
			y.naturalW = n, y.naturalH = r, y.scale = S(n, r);
			let i = Math.max(1, Math.round(n * y.scale)), a = Math.max(1, Math.round(r * y.scale));
			return h.width !== i && (h.width = i), h.height !== a && (h.height = a), p || (e.width !== i && (e.width = i), e.height !== a && (e.height = a)), e._mjrNaturalW = n, e._mjrNaturalH = r, e._mjrPixelScale = y.scale, y.ready = !0, !0;
		} catch {
			return !1;
		}
	}, T = () => {
		if (!g || !y.ready) return !1;
		try {
			return g.drawImage(t, 0, 0, h.width, h.height), !0;
		} catch {
			return !1;
		}
	}, E = () => {
		if (!y.ready) return;
		let n = y.lastParams || i?.() || {};
		if (p) {
			p.update(n);
			return;
		}
		if (!m || !g) return;
		if (a?.(n)) {
			try {
				m.clearRect(0, 0, e.width, e.height), m.drawImage(t, 0, 0, e.width, e.height);
			} catch (e) {
				console.debug?.(e);
			}
			return;
		}
		if (!T()) return;
		let r;
		try {
			r = g.getImageData(0, 0, h.width, h.height);
		} catch {
			try {
				m.clearRect(0, 0, e.width, e.height), m.drawImage(t, 0, 0, e.width, e.height);
			} catch (e) {
				console.debug?.(e);
			}
			return;
		}
		let o = h.width, s = h.height, c = y._buffer;
		if (!c || c.width !== o || c.height !== s) try {
			c = m.createImageData(o, s), y._buffer = c;
		} catch {
			try {
				c = new ImageData(o, s), y._buffer = c;
			} catch {
				return;
			}
		}
		if (!c) return;
		let l = Number(n.exposureEV) || 0, u = 1 / Math.max(.1, Math.min(3, Number(n.gamma) || 1)), d = String(n.channel || "rgb"), f = String(n.analysisMode || "none"), _ = V(n.zebraThreshold ?? .95), v = 2 ** l, b = r.data, x = c.data, S = f !== "zebra" && d === "rgb", C = null;
		if (S) {
			let e = `${v.toFixed(6)}|${u.toFixed(6)}`;
			if (!y._lut || y._lutKey !== e) {
				let t = new Uint8ClampedArray(256);
				for (let e = 0; e < 256; e += 1) {
					let n = e / 255;
					t[e] = Math.round(V(n * v) ** +u * 255);
				}
				y._lut = t, y._lutKey = e;
			}
			C = y._lut;
		}
		if (C) for (let e = 0; e < x.length; e += 4) x[e] = C[b[e] ?? 0], x[e + 1] = C[b[e + 1] ?? 0], x[e + 2] = C[b[e + 2] ?? 0], x[e + 3] = 255;
		else for (let e = 0; e < x.length; e += 4) {
			let t = (b[e] ?? 0) / 255, n = (b[e + 1] ?? 0) / 255, r = (b[e + 2] ?? 0) / 255, i = (b[e + 3] ?? 255) / 255, a = t * v, s = n * v, c = r * v, l = .2126 * a + .7152 * s + .0722 * c;
			if (f === "zebra") if (V(l) >= _) {
				let t = (Math.floor(e / 4) % o + Math.floor(e / 4 / o) & 7) < 3;
				a = +!!t, s = +!!t, c = +!!t;
			} else a = V(a) ** +u, s = V(s) ** +u, c = V(c) ** +u;
			else a = V(a) ** +u, s = V(s) ** +u, c = V(c) ** +u;
			if (d === "r") s = a, c = a;
			else if (d === "g") a = s, c = s;
			else if (d === "b") a = c, s = c;
			else if (d === "a") a = i, s = i, c = i;
			else if (d === "l") {
				let e = V(l) ** +u;
				a = e, s = e, c = e;
			}
			x[e] = Math.round(V(a) * 255), x[e + 1] = Math.round(V(s) * 255), x[e + 2] = Math.round(V(c) * 255), x[e + 3] = 255;
		}
		try {
			m.putImageData(c, 0, 0);
		} catch (e) {
			console.debug?.(e);
		}
	}, D = () => {
		if (!y._destroyed && e?.isConnected && (y.ready || w(), y.ready)) {
			try {
				let e = y.lastParams || i?.() || {};
				if (!a?.(e)) {
					let n = Number(t?.currentTime) || 0, r = `${Number(e.exposureEV) || 0}|${Number(e.gamma) || 1}|${String(e.channel || "rgb")}|${String(e.analysisMode || "none")}|${Number(e.zebraThreshold ?? .95)}`;
					if (Math.abs(n - (Number(y._lastFrameTime) || 0)) < 1e-6 && r === String(y._lastHeavySig || "")) return;
					y._lastFrameTime = n, y._lastHeavySig = r;
				}
			} catch (e) {
				console.debug?.(e);
			}
			E();
		}
	}, O = () => {
		if (!y._destroyed) {
			try {
				if (e?.isConnected) {
					y._connectRAF = null, y._connectTries = 0, A();
					return;
				}
			} catch (e) {
				console.debug?.(e);
			}
			if (y._connectRAF == null) {
				if (y._connectTries = (Number(y._connectTries) || 0) + 1, y._connectTries > 20) {
					y._connectRAF = null, y._connectTries = 0;
					return;
				}
				try {
					y._connectRAF = requestAnimationFrame(() => {
						y._connectRAF = null, O();
					});
				} catch {
					y._connectRAF = null;
				}
			}
		}
	}, k = () => {
		try {
			let e = Number(c);
			return !Number.isFinite(e) || e <= 0 ? 0 : Math.max(0, Math.floor(1e3 / Math.max(1, e)));
		} catch {
			return 0;
		}
	}, A = () => {
		if (y._destroyed || y._runtimePaused || y._rendering) return;
		if (!e?.isConnected) {
			O();
			return;
		}
		let n = y.lastParams || i?.() || {}, r = !a?.(n), o = r && !t?.paused ? k() : 0;
		if (o > 0) {
			let e = Date.now(), t = (Number(y._lastHeavyRenderAt) || 0) + o;
			if (e < t) {
				try {
					y._throttleTimer && clearTimeout(y._throttleTimer);
				} catch (e) {
					console.debug?.(e);
				}
				try {
					y._throttleTimer = setTimeout(() => {
						try {
							y._throttleTimer = null;
						} catch (e) {
							console.debug?.(e);
						}
						A();
					}, Math.min(250, Math.max(0, t - e)));
				} catch (e) {
					console.debug?.(e);
				}
				return;
			}
		}
		y._rendering = !0;
		try {
			y._rafIdSchedule = requestAnimationFrame(() => {
				y._rafIdSchedule = null, y._rendering = !1, D();
				try {
					r && (y._lastHeavyRenderAt = Date.now());
				} catch (e) {
					console.debug?.(e);
				}
			});
		} catch {
			y._rendering = !1;
		}
	}, j = () => {
		if (y._destroyed || y._runtimePaused) return;
		try {
			y._rvfc != null && typeof t?.cancelVideoFrameCallback == "function" && (t.cancelVideoFrameCallback(y._rvfc), y._rvfc = null);
		} catch (e) {
			console.debug?.(e);
		}
		try {
			y._rafIdLoop != null && (cancelAnimationFrame(y._rafIdLoop), y._rafIdLoop = null);
		} catch (e) {
			console.debug?.(e);
		}
		try {
			if (typeof t?.requestVideoFrameCallback == "function") {
				let n = () => {
					if (!y._destroyed && e?.isConnected && (A(), !t.paused)) try {
						y._rvfc = t.requestVideoFrameCallback(n);
					} catch (e) {
						console.debug?.(e);
					}
				};
				try {
					y._rvfc = t.requestVideoFrameCallback(n);
				} catch (e) {
					console.debug?.(e);
				}
				return;
			}
		} catch (e) {
			console.debug?.(e);
		}
		let n = () => {
			if (!y._destroyed && e?.isConnected && (A(), !t.paused)) try {
				y._rafIdLoop = requestAnimationFrame(n);
			} catch (e) {
				console.debug?.(e);
			}
		};
		try {
			y._rafIdLoop = requestAnimationFrame(n);
		} catch (e) {
			console.debug?.(e);
		}
	}, M = (e) => {
		y.lastParams = e || y.lastParams || i?.(), A();
	}, N = () => {
		y._runtimePaused = !0;
		try {
			y._throttleTimer && clearTimeout(y._throttleTimer);
		} catch (e) {
			console.debug?.(e);
		}
		y._throttleTimer = null;
		try {
			y._rvfc != null && typeof t?.cancelVideoFrameCallback == "function" && t.cancelVideoFrameCallback(y._rvfc);
		} catch (e) {
			console.debug?.(e);
		}
		y._rvfc = null;
		try {
			y._rafIdLoop != null && cancelAnimationFrame(y._rafIdLoop);
		} catch (e) {
			console.debug?.(e);
		}
		y._rafIdLoop = null;
		try {
			y._rafIdSchedule != null && cancelAnimationFrame(y._rafIdSchedule);
		} catch (e) {
			console.debug?.(e);
		}
		y._rafIdSchedule = null;
		try {
			y._seekRaf != null && cancelAnimationFrame(y._seekRaf);
		} catch (e) {
			console.debug?.(e);
		}
		y._seekRaf = null, y._rendering = !1;
	}, P = () => {
		if (y._runtimePaused = !1, t?.paused) {
			A();
			return;
		}
		j(), A();
	}, F = (e, t) => {
		try {
			if (y.ready || w(), !y.ready) return null;
			T();
			let n = y.scale || 1, r = Math.max(0, Math.min(h.width - 1, Math.floor((Number(e) || 0) * n))), i = Math.max(0, Math.min(h.height - 1, Math.floor((Number(t) || 0) * n)));
			if (!v) return null;
			v.clearRect(0, 0, 1, 1), v.drawImage(h, r, i, 1, 1, 0, 0, 1, 1);
			let a = v.getImageData(0, 0, 1, 1)?.data;
			if (!a || a.length < 4) return null;
			let o = a[0] ?? 0, s = a[1] ?? 0, c = a[2] ?? 0, l = a[3] ?? 255, u = [
				o / 255,
				s / 255,
				c / 255,
				l / 255
			], d = 2 ** (Number(y.lastParams?.exposureEV) || 0);
			return {
				r: o,
				g: s,
				b: c,
				a: l,
				raw: u,
				lin: [
					u[0] * d,
					u[1] * d,
					u[2] * d,
					u[3]
				],
				scale: y.scale
			};
		} catch {
			return null;
		}
	}, ee = () => {
		w(), A();
		try {
			d?.({
				naturalW: y.naturalW,
				naturalH: y.naturalH,
				pixelScale: y.scale
			});
		} catch (e) {
			console.debug?.(e);
		}
	}, I = (e) => {
		if (f) {
			if (String(e?.detail?.active_prompt_id || "").trim()) {
				N();
				return;
			}
			P();
		}
	};
	try {
		let n = () => {
			y._runtimePaused || j();
		}, r = () => {
			try {
				y._seekRaf != null && cancelAnimationFrame(y._seekRaf);
			} catch (e) {
				console.debug?.(e);
			}
			y._seekRaf = null;
		};
		b.push(l?.(t, "loadedmetadata", ee, { once: !0 }) || (() => {})), b.push(l?.(t, "seeking", () => {
			if (y._destroyed || y._runtimePaused) return;
			try {
				if (!t?.paused) {
					A();
					return;
				}
			} catch (e) {
				console.debug?.(e);
			}
			if (y._seekRaf != null) return;
			let n = () => {
				if (y._seekRaf = null, y._destroyed || !e?.isConnected) return;
				A();
				let r = !1;
				try {
					r = !!t?.seeking;
				} catch (e) {
					console.debug?.(e);
				}
				if (r) try {
					y._seekRaf = requestAnimationFrame(n);
				} catch (e) {
					console.debug?.(e);
				}
			};
			try {
				y._seekRaf = requestAnimationFrame(n);
			} catch (e) {
				console.debug?.(e);
			}
		}, { passive: !0 }) || (() => {})), b.push(l?.(t, "seeked", () => {
			r(), A();
		}, { passive: !0 }) || (() => {})), b.push(l?.(t, "pause", A, { passive: !0 }) || (() => {})), b.push(l?.(t, "play", n, { passive: !0 }) || (() => {})), b.push(l?.(t, "timeupdate", () => {
			try {
				if (!t?.paused && typeof t?.requestVideoFrameCallback == "function") return;
			} catch (e) {
				console.debug?.(e);
			}
			A();
		}, { passive: !0 }) || (() => {})), b.push(l?.(t, "error", () => {
			y.ready = !1;
			try {
				let n = t?.error?.code, r = t?.error?.message || "", i, a;
				n === 2 ? (i = "Failed to load video (network / path error)", a = "Check file permissions / path, or try re-indexing.") : n === 3 ? (i = "Failed to load video (decode error - unsupported codec?)", a = "Browser may not support this codec (e.g. H.265/HEVC). Try converting to H.264/MP4.") : n === 4 ? (i = "Failed to load video (unsupported format or codec)", a = "Browser cannot decode this file (e.g. H.265/HEVC). Try converting to H.264/MP4.") : (i = "Failed to load video", a = r || "Check file permissions / path, or try re-indexing."), console.warn("[MJR] Video load error", {
					code: n,
					message: r,
					src: t?.src
				}), H(e, i, a);
			} catch (e) {
				console.debug?.(e);
			}
		}, { passive: !0 }) || (() => {})), f && (window.addEventListener(C.RUNTIME_STATUS, I), String(window?.__MJR_EXECUTION_RUNTIME__?.active_prompt_id || "").trim() && N());
	} catch (e) {
		console.debug?.(e);
	}
	return {
		setParams: M,
		sampleAtOriginal: F,
		getInfo: () => ({
			...y,
			renderer: p ? "webgl" : "2d"
		}),
		pause: N,
		resume: P,
		destroy: () => {
			p && p.destroy(), y._destroyed = !0;
			try {
				window.removeEventListener(C.RUNTIME_STATUS, I);
			} catch (e) {
				console.debug?.(e);
			}
			try {
				y._throttleTimer && clearTimeout(y._throttleTimer);
			} catch (e) {
				console.debug?.(e);
			}
			y._throttleTimer = null;
			try {
				y._connectRAF != null && cancelAnimationFrame(y._connectRAF);
			} catch (e) {
				console.debug?.(e);
			}
			y._connectRAF = null, y._connectTries = 0;
			try {
				y._rvfc != null && typeof t?.cancelVideoFrameCallback == "function" && t.cancelVideoFrameCallback(y._rvfc);
			} catch (e) {
				console.debug?.(e);
			}
			try {
				y._rafIdLoop != null && cancelAnimationFrame(y._rafIdLoop);
			} catch (e) {
				console.debug?.(e);
			}
			try {
				y._rafIdSchedule != null && cancelAnimationFrame(y._rafIdSchedule);
			} catch (e) {
				console.debug?.(e);
			}
			try {
				y._seekRaf != null && cancelAnimationFrame(y._seekRaf);
			} catch (e) {
				console.debug?.(e);
			}
			try {
				for (let e of b) u?.(e);
			} catch (e) {
				console.debug?.(e);
			}
			try {
				h.width = 0, h.height = 0;
			} catch (e) {
				console.debug?.(e);
			}
			try {
				e.width = 0, e.height = 0;
			} catch (e) {
				console.debug?.(e);
			}
			y._buffer = null;
		}
	};
}
//#endregion
//#region ui/features/viewer/audioVisualizer.ts
function ct(e, t, n) {
	let r = Number(e);
	return Number.isFinite(r) ? Math.max(t, Math.min(n, r)) : t;
}
function lt(e) {
	try {
		let t = String(e || "").toLowerCase();
		if (t === "simple" || t === "artistic") return t;
		if (t === "webgl" || t === "webgl3d") return "simple";
	} catch (e) {
		console.debug?.(e);
	}
	try {
		let e = String(x?.VIEWER_AUDIO_VISUALIZER_MODE || "simple").toLowerCase();
		if (e === "artistic") return "artistic";
		if (e === "webgl3d" || e === "webgl") return "simple";
	} catch (e) {
		console.debug?.(e);
	}
	return "simple";
}
function ut(e) {
	let t = e.getContext("2d");
	if (!t) return null;
	let n = (e, t) => {
		try {
			let n = Math.max(0, Math.min(e.length - 1, Math.floor(t * (e.length - 1))));
			return (Number(e[n]) || 0) / 255;
		} catch {
			return 0;
		}
	}, r = (e, t) => {
		let r = n(e, .18 + t * .18), i = n(e, .28 + t * .16), a = n(e, .4 + t * .06), o = n(e, .46 + t * .03);
		return r * .28 + i * .36 + a * .24 + o * .12;
	}, i = (e, t) => {
		let r = n(e, .01 + t * .06), i = n(e, .04 + t * .07), a = n(e, .09 + t * .04);
		return r * .45 + i * .35 + a * .2;
	}, a = (e, t) => {
		let r = n(e, .64 + t * .18), i = n(e, .78 + t * .12), a = n(e, .92 + t * .06);
		return r * .34 + i * .38 + a * .28;
	};
	return {
		draw(n, o, s = 0) {
			try {
				let o = e.width || 0, c = e.height || 0;
				if (!(o > 1 && c > 1)) return;
				let l = Number(s) * .001 * .12 % 1;
				t.clearRect(0, 0, o, c);
				let u = o * .5, d = c * .52, f = Math.max(36, Math.min(140, Math.floor(o / 12))), p = Math.min(o * .56, f * 8), m = p / Math.max(1, f - 1), h = u - p * .5, g = d - c * .08;
				t.fillStyle = "rgba(255,255,255,0.95)";
				for (let e = 0; e < f; e++) {
					let i = h + e * m, a = r(n, (e / Math.max(1, f - 1) + l) % 1), o = g - a * c * .11, s = 1.2 + a * 1.2;
					t.beginPath(), t.arc(i, o, s, 0, Math.PI * 2), t.fill();
				}
				t.fillStyle = "rgba(255,255,255,0.9)";
				for (let e = 0; e < f; e++) {
					let n = h + e * m;
					t.beginPath(), t.arc(n, d, 1.6, 0, Math.PI * 2), t.fill();
				}
				let _ = Math.max(1.5, m * .45);
				for (let e = 0; e < f; e++) {
					let r = h + e * m, o = e / Math.max(1, f - 1), s = (o + l) % 1, u = i(n, s), p = a(n, s), g = 1 - Math.abs(o * 2 - 1), v = ((u * .62 + p * .38) * .84 + g * .16) ** 1.1 * c * .32;
					t.fillStyle = "rgba(255,255,255,0.96)", t.fillRect(r - _ * .5, d + 1, _, v);
				}
			} catch (e) {
				console.debug?.(e);
			}
		},
		destroy() {}
	};
}
function dt(e, { pseudo3d: t = !1 } = {}) {
	let n = null;
	try {
		n = e.getContext("webgl", {
			antialias: !0,
			alpha: !0,
			preserveDrawingBuffer: !0
		});
	} catch {
		n = null;
	}
	if (!n) return null;
	let r = (e, t) => {
		let r = n.createShader(e);
		return r ? (n.shaderSource(r, t), n.compileShader(r), n.getShaderParameter(r, n.COMPILE_STATUS) ? r : (n.deleteShader(r), null)) : null;
	}, i = r(n.VERTEX_SHADER, "\nattribute vec2 aPos;\nvoid main() {\n  gl_Position = vec4(aPos, 0.0, 1.0);\n}\n"), a = r(n.FRAGMENT_SHADER, "\nprecision mediump float;\nuniform vec4 uColor;\nvoid main() {\n  gl_FragColor = uColor;\n}\n");
	if (!i || !a) return null;
	let o = n.createProgram();
	if (!o || (n.attachShader(o, i), n.attachShader(o, a), n.linkProgram(o), !n.getProgramParameter(o, n.LINK_STATUS))) return null;
	n.useProgram(o);
	let s = n.getAttribLocation(o, "aPos"), c = n.getUniformLocation(o, "uColor"), l = n.createBuffer();
	if (!l || s < 0 || !c) return null;
	let u = (e, t) => {
		n.bindBuffer(n.ARRAY_BUFFER, l), n.bufferData(n.ARRAY_BUFFER, e, n.DYNAMIC_DRAW), n.enableVertexAttribArray(s), n.vertexAttribPointer(s, 2, n.FLOAT, !1, 0, 0), n.uniform4f(c, t[0], t[1], t[2], t[3]), n.drawArrays(n.LINE_STRIP, 0, Math.floor(e.length / 2));
	}, d = (e, t) => {
		try {
			let n = Math.max(0, Math.min(e.length - 1, Math.floor(t * (e.length - 1))));
			return (Number(e[n]) || 0) / 255;
		} catch {
			return 0;
		}
	}, f = (e, t) => {
		let n = d(e, .18 + t * .18), r = d(e, .28 + t * .16), i = d(e, .4 + t * .06), a = d(e, .46 + t * .03);
		return n * .28 + r * .36 + i * .24 + a * .12;
	}, p = (e, t) => {
		let n = d(e, .01 + t * .06), r = d(e, .04 + t * .07), i = d(e, .09 + t * .04);
		return n * .45 + r * .35 + i * .2;
	}, m = (e, t) => {
		let n = d(e, .64 + t * .18), r = d(e, .78 + t * .12), i = d(e, .92 + t * .06);
		return n * .34 + r * .38 + i * .28;
	};
	return {
		draw(r, i, a = 0) {
			try {
				n.viewport(0, 0, e.width || 1, e.height || 1), n.clearColor(0, 0, 0, 0), n.clear(n.COLOR_BUFFER_BIT);
				let i = Math.max(48, Math.min(180, Math.floor((e.width || 640) / 7))), o = Number(a) * .001, s = new Float32Array(i * 2);
				for (let e = 0; e < i; e++) {
					let n = e / Math.max(1, i - 1), a = n * 2 - 1, c = f(r, n), l = t ? Math.sin(n * Math.PI * 4 + o * 1.1) * .18 : 0, u = t ? 1 / (1 + Math.max(-.7, l) * .8) : 1, d = ct((.18 + c * .32) * u, -.95, .95);
					s[e * 2] = a, s[e * 2 + 1] = d;
				}
				u(s, [
					1,
					1,
					1,
					.95
				]);
				let c = new Float32Array(i * 2);
				for (let e = 0; e < i; e++) {
					let n = e / Math.max(1, i - 1), a = n * 2 - 1, s = p(r, n), l = m(r, n), u = s * .62 + l * .38, d = t ? Math.sin(n * Math.PI * 3 + o * 1) * .14 : 0, f = t ? 1 / (1 + Math.max(-.7, d) * .8) : 1, h = ct(-u * .62 * f, -.95, 0);
					c[e * 2] = a, c[e * 2 + 1] = h;
				}
				u(c, [
					1,
					1,
					1,
					.9
				]);
			} catch (e) {
				console.debug?.(e);
			}
		},
		destroy() {
			try {
				n.deleteBuffer(l);
			} catch (e) {
				console.debug?.(e);
			}
			try {
				n.deleteProgram(o);
			} catch (e) {
				console.debug?.(e);
			}
			try {
				n.deleteShader(i);
			} catch (e) {
				console.debug?.(e);
			}
			try {
				n.deleteShader(a);
			} catch (e) {
				console.debug?.(e);
			}
		}
	};
}
function ft({ canvas: e, audioEl: t, mode: n, pauseDuringExecution: r = null } = {}) {
	if (!e || !t) return { destroy() {} };
	let i = r == null ? !!x?.VIEWER_PAUSE_DURING_EXECUTION : !!r, a = null, o = !1, s = null, c = null, l = null, u = null, d = null, f = null, p = 0, m = !1, h = 1e3 / ct(x?.VIEWER_AUDIO_VIS_FPS ?? 24, 8, 60), g = lt(n), _ = () => {
		try {
			let t = ct(window.devicePixelRatio || 1, 1, 2), n = Math.max(32, Math.floor((e.clientWidth || 640) * t)), r = Math.max(24, Math.floor((e.clientHeight || 140) * t));
			e.width !== n && (e.width = n), e.height !== r && (e.height = r);
		} catch (e) {
			console.debug?.(e);
		}
	}, v = (t = g) => {
		g = lt(t);
		try {
			f?.destroy?.();
		} catch (e) {
			console.debug?.(e);
		}
		f = null;
		try {
			_();
		} catch (e) {
			console.debug?.(e);
		}
		try {
			g === "artistic" && !x?.VIEWER_DISABLE_WEBGL_AUDIO && (f = dt(e, { pseudo3d: !0 }));
		} catch (e) {
			console.debug?.(e);
		}
		if (!f) try {
			f = ut(e);
		} catch (e) {
			console.debug?.(e), f = null;
		}
		return p = 0, g;
	}, y = () => {
		if (!(o || l)) try {
			let e = window.AudioContext || window.webkitAudioContext;
			if (!e) return;
			s = new e(), c = s.createMediaElementSource(t), l = s.createAnalyser(), l.fftSize = 1024, l.smoothingTimeConstant = .8, c.connect(l), l.connect(s.destination), u = new Uint8Array(l.frequencyBinCount), d = new Uint8Array(l.fftSize), f || v(g);
		} catch {
			l = null;
		}
	}, b = (e) => {
		if (!o) {
			try {
				a = requestAnimationFrame(b);
			} catch {
				a = null;
				return;
			}
			if (!m && !(!l || !f) && !(e - p < h)) {
				p = e;
				try {
					_(), l.getByteFrequencyData(u), l.getByteTimeDomainData(d), f.draw(u, d, e);
				} catch (e) {
					console.debug?.(e);
				}
			}
		}
	}, S = async () => {
		try {
			if (m || (y(), !s)) return;
			if (s.state === "suspended") try {
				await s.resume();
			} catch (e) {
				console.debug?.(e);
			}
			a ??= requestAnimationFrame(b);
		} catch (e) {
			console.debug?.(e);
		}
	}, w = () => {
		try {
			a != null && cancelAnimationFrame(a);
		} catch (e) {
			console.debug?.(e);
		}
		a = null;
	}, T = () => {
		S();
	}, E = () => w(), D = () => w(), O = () => _(), k = (e) => {
		if (i) {
			if (m = !!String(e?.detail?.active_prompt_id || "").trim(), m) {
				w();
				return;
			}
			t?.paused || S();
		}
	};
	try {
		_(), v(g);
	} catch (e) {
		console.debug?.(e);
	}
	try {
		t.addEventListener("play", T, { passive: !0 }), t.addEventListener("pause", E, { passive: !0 }), t.addEventListener("ended", D, { passive: !0 }), window.addEventListener("resize", O, { passive: !0 }), i && (window.addEventListener(C.RUNTIME_STATUS, k), String(window?.__MJR_EXECUTION_RUNTIME__?.active_prompt_id || "").trim() && (m = !0));
	} catch (e) {
		console.debug?.(e);
	}
	return {
		setMode(e) {
			return o ? g : v(e);
		},
		destroy() {
			if (!o) {
				o = !0, w();
				try {
					t.removeEventListener("play", T), t.removeEventListener("pause", E), t.removeEventListener("ended", D), window.removeEventListener("resize", O), window.removeEventListener(C.RUNTIME_STATUS, k);
				} catch (e) {
					console.debug?.(e);
				}
				try {
					f?.destroy?.();
				} catch (e) {
					console.debug?.(e);
				}
				try {
					c?.disconnect?.();
				} catch (e) {
					console.debug?.(e);
				}
				try {
					l?.disconnect?.();
				} catch (e) {
					console.debug?.(e);
				}
				try {
					s?.close?.();
				} catch (e) {
					console.debug?.(e);
				}
				c = null, l = null, s = null, f = null;
			}
		}
	};
}
//#endregion
//#region ui/features/viewer/mediaFactory.ts
function pt({ overlay: e, state: t, mediaTransform: n, updateMediaNaturalSize: r, clampPanToBounds: i, applyTransform: a, scheduleOverlayRedraw: o, getGradeParams: s, isDefaultGrade: c, tonemap: l, maxProcPixels: u, maxProcPixelsVideo: d, disableWebGL: f, videoGradeThrottleFps: p, safeAddListener: m, safeCall: h } = {}) {
	let g = h || O, _ = m || F, v = (e) => {
		try {
			let t = String(e?.ext || "").trim().toLowerCase();
			if (t) return t.startsWith(".") ? t : `.${t}`;
		} catch (e) {
			console.debug?.(e);
		}
		try {
			let t = String(e?.filename || e?.filepath || "").trim(), n = t.lastIndexOf(".");
			if (n >= 0) return t.slice(n).toLowerCase();
		} catch (e) {
			console.debug?.(e);
		}
		return "";
	}, y = (e) => {
		let t = v(e);
		return t === ".gif" || t === ".webp";
	}, b = (e, s) => {
		let c = document.createElement("img");
		c.className = "mjr-viewer-media";
		try {
			e?.id != null && c?.dataset && (c.dataset.mjrAssetId = String(e.id));
		} catch (e) {
			console.debug?.(e);
		}
		c.alt = String(e?.filename || "") || "image";
		try {
			c.decoding = "async";
		} catch (e) {
			console.debug?.(e);
		}
		try {
			c.loading = "eager";
		} catch (e) {
			console.debug?.(e);
		}
		try {
			c.draggable = !1;
		} catch (e) {
			console.debug?.(e);
		}
		c.src = s, c.style.cssText = `
            max-width: 100%;
            max-height: 100%;
            display: block;
            transform: ${n?.() || ""};
            transform-origin: center center;
        `;
		let l = () => {
			try {
				requestAnimationFrame(() => {
					try {
						t?._userInteracted || (r?.(), i?.(), a?.());
					} catch (e) {
						console.debug?.(e);
					}
				});
			} catch (e) {
				console.debug?.(e);
			}
			try {
				o?.();
			} catch (e) {
				console.debug?.(e);
			}
		}, u = () => {
			try {
				let t = document.createElement("canvas");
				t.className = "mjr-viewer-media";
				try {
					e?.id != null && t?.dataset && (t.dataset.mjrAssetId = String(e.id));
				} catch (e) {
					console.debug?.(e);
				}
				S(t, e), t.style.cssText = `
                    max-width: 100%;
                    max-height: 100%;
                    display: block;
                    transform: ${n?.() || ""};
                    transform-origin: center center;
                `, H(t, "Failed to load image"), c.replaceWith(t);
			} catch (e) {
				console.debug?.(e);
			}
		};
		try {
			c.addEventListener("load", l, { once: !0 });
		} catch (e) {
			console.debug?.(e);
		}
		try {
			c.addEventListener("error", u, { once: !0 });
		} catch (e) {
			console.debug?.(e);
		}
		return c;
	}, S = (e, t) => {
		try {
			if (!e || !(e instanceof HTMLCanvasElement)) return;
			let n = Number(t?.width) || 0, r = Number(t?.height) || 0;
			if (!(n > 0 && r > 0)) return;
			!Number(e._mjrNaturalW) && !Number(e._mjrNaturalH) && (e._mjrNaturalW = n, e._mjrNaturalH = r);
		} catch (e) {
			console.debug?.(e);
		}
	}, C = (e) => {
		try {
			return j(e);
		} catch {
			return null;
		}
	}, w = (e, t, n, r = "metadata") => {
		try {
			let i = Number(n);
			if (!Number.isFinite(i) || i <= 0) return;
			let a = Math.round(i * 1e3) / 1e3, o = String(e?._mjrDetectedFpsSource || "");
			if (r === "rvfc" && o && o !== "rvfc") return;
			let s = Number(e?._mjrDetectedFps || 0) || 0;
			if (s > 0 && Math.abs(s - a) < .01) return;
			e._mjrDetectedFps = a, e._mjrDetectedFpsSource = String(r || "metadata"), window.dispatchEvent(new CustomEvent("mjr:viewer-fps-detected", { detail: {
				fps: a,
				source: String(r || "metadata"),
				assetId: t?.id == null ? "" : String(t.id)
			} }));
		} catch (e) {
			console.debug?.(e);
		}
	}, T = (e, t) => {
		let n = !1;
		try {
			let r = C(t);
			r && (n = !0, w(e, t, r, "asset-metadata"));
		} catch (e) {
			console.debug?.(e);
		}
		try {
			e.addEventListener("loadedmetadata", () => {
				try {
					let r = C(t);
					r && (n = !0, w(e, t, r, "loadedmetadata"));
				} catch (e) {
					console.debug?.(e);
				}
			}, { once: !0 });
		} catch (e) {
			console.debug?.(e);
		}
		try {
			if (n || typeof e?.requestVideoFrameCallback != "function") return;
			let r = null, i = 0, a = 0, o = !1, s = (c, l) => {
				try {
					if (n || o) return;
					let c = Number(l?.mediaTime);
					if (Number.isFinite(c) && c >= 0) {
						if (r != null) {
							let e = c - r;
							e > 0 && e < 1 && (a += e, i += 1);
						}
						r = c;
					}
					if (i >= 10) {
						let n = a / Math.max(1, i), r = n > 0 ? 1 / n : 0;
						Number.isFinite(r) && r > 1 && (o = !0, w(e, t, r, "rvfc"));
					}
					i < 10 && !o && e.requestVideoFrameCallback(s);
				} catch (e) {
					console.debug?.(e);
				}
			};
			e.requestVideoFrameCallback(s);
		} catch (e) {
			console.debug?.(e);
		}
	}, E = (e, n, { compare: r = !1 } = {}) => {
		let i = document.createElement("div");
		if (i.className = "mjr-viewer-audio-shell", !r) {
			let t = document.createElement("div");
			t.className = "mjr-viewer-audio-header";
			let n = document.createElement("span");
			n.className = "mjr-viewer-audio-icon", n.innerHTML = "<i class=\"pi pi-volume-up\" aria-hidden=\"true\"></i>";
			let r = document.createElement("div");
			r.className = "mjr-viewer-audio-title-wrap";
			let a = document.createElement("div");
			a.className = "mjr-viewer-audio-title", a.textContent = String(e?.display_name || e?.displayName || e?.filename || "Audio");
			let o = document.createElement("div");
			o.className = "mjr-viewer-audio-meta";
			let s = String(e?.filename || "").split(".").pop() || "audio";
			o.textContent = String(s || "audio").toUpperCase(), r.appendChild(a), r.appendChild(o), t.appendChild(n), t.appendChild(r), i.appendChild(t);
		}
		let a = document.createElement("canvas");
		a.className = "mjr-viewer-audio-viz";
		let o = document.createElement("audio");
		o.className = "mjr-viewer-audio-src", o.src = n, o.controls = !1, o.autoplay = !0, o.preload = "metadata";
		try {
			let e = ft({
				canvas: a,
				audioEl: o,
				mode: t?.audioVisualizerMode,
				pauseDuringExecution: !0
			});
			o._mjrAudioViz = e, a._mjrProc = e;
		} catch {
			o._mjrAudioViz = null, a._mjrProc = null;
		}
		return i.appendChild(a), i.appendChild(o), i;
	};
	function D(e, m) {
		let h = document.createElement("div");
		h.className = "mjr-video-host", h.style.cssText = "\n            width: 100%;\n            height: 100%;\n            display: flex;\n            align-items: center;\n            justify-content: center;\n            position: relative;\n        ";
		let v = String(e?.kind || "").toLowerCase();
		if (oe(e) || v === "model3d") return U(e, m, {
			hostClassName: "mjr-model3d-host mjr-viewer-model3d-host",
			canvasClassName: "mjr-viewer-media mjr-model3d-render-canvas",
			pauseDuringExecution: !0,
			scheduleOverlayRedraw: o,
			onReady: () => {
				try {
					requestAnimationFrame(() => {
						try {
							t?._userInteracted || (r?.(), i?.(), a?.());
						} catch (e) {
							console.debug?.(e);
						}
					});
				} catch (e) {
					console.debug?.(e);
				}
				try {
					o?.();
				} catch (e) {
					console.debug?.(e);
				}
			}
		});
		if (v && v !== "image" && v !== "video" && v !== "audio") {
			let t = document.createElement("canvas");
			t.className = "mjr-viewer-media";
			try {
				e?.id != null && t?.dataset && (t.dataset.mjrAssetId = String(e.id));
			} catch (e) {
				console.debug?.(e);
			}
			S(t, e), t.style.cssText = `
                max-width: 100%;
                max-height: 100%;
                display: block;
                transform: ${n?.() || ""};
                transform-origin: center center;
            `;
			try {
				H(t, `Unsupported file type: ${v}`);
			} catch (e) {
				console.debug?.(e);
			}
			return t;
		}
		if (v === "audio") return E(e, m, { compare: !1 });
		if (v === "video") {
			let u = document.createElement("canvas");
			u.className = "mjr-viewer-media";
			try {
				e?.id != null && u?.dataset && (u.dataset.mjrAssetId = String(e.id));
			} catch (e) {
				console.debug?.(e);
			}
			S(u, e), u.style.cssText = `
                max-width: 100%;
                max-height: 100%;
                object-fit: contain;
                display: block;
                transform: ${n?.() || ""};
                transform-origin: center center;
            `;
			let v = document.createElement("video");
			v.className = "mjr-viewer-video-src", v.src = m, v.controls = !1, v.loop = !0, v.playsInline = !0, v.muted = !0, v.autoplay = !0, v.preload = "auto";
			try {
				"decode" in HTMLVideoElement.prototype && (v.decoding = "async");
			} catch {}
			v.style.cssText = "position:absolute; width:1px; height:1px; opacity:0; pointer-events:none;", T(v, e);
			try {
				u._mjrProc = st({
					canvas: u,
					videoEl: v,
					disableWebGL: f || !!x.VIEWER_DISABLE_WEBGL_VIDEO,
					pauseDuringExecution: x.VIEWER_PAUSE_DURING_EXECUTION,
					getGradeParams: s,
					isDefaultGrade: c,
					tonemap: l,
					maxProcPixelsVideo: d,
					throttleFps: p,
					safeAddListener: _,
					safeCall: g,
					onReady: () => {
						try {
							requestAnimationFrame(() => {
								try {
									t?._userInteracted || (r?.(), i?.(), a?.());
								} catch (e) {
									console.debug?.(e);
								}
							});
						} catch (e) {
							console.debug?.(e);
						}
						try {
							o?.();
						} catch (e) {
							console.debug?.(e);
						}
					}
				}), u._mjrProc?.setParams?.(s?.());
			} catch (e) {
				console.debug?.(e);
			}
			try {
				v.addEventListener("canplay", () => {
					try {
						let e = v.play?.();
						e && typeof e.catch == "function" && e.catch(() => {
							try {
								H(u, "Autoplay blocked (press Space / Play)");
							} catch (e) {
								console.debug?.(e);
							}
						});
					} catch {
						try {
							H(u, "Autoplay blocked (press Space / Play)");
						} catch (e) {
							console.debug?.(e);
						}
					}
				}, { once: !0 });
			} catch (e) {
				console.debug?.(e);
			}
			return h.appendChild(u), h.appendChild(v), h;
		}
		if (y(e)) return b(e, m);
		let C = document.createElement("canvas");
		C.className = "mjr-viewer-media";
		try {
			e?.id != null && C?.dataset && (C.dataset.mjrAssetId = String(e.id));
		} catch (e) {
			console.debug?.(e);
		}
		S(C, e), C.style.cssText = `
            max-width: 100%;
            max-height: 100%;
            object-fit: contain;
            display: block;
            transform: ${n?.() || ""};
            transform-origin: center center;
        `;
		try {
			C._mjrProc = me({
				canvas: C,
				url: m,
				getGradeParams: s,
				isDefaultGrade: c,
				tonemap: l,
				maxProcPixels: u,
				onReady: () => {
					try {
						requestAnimationFrame(() => {
							try {
								t?._userInteracted || (r?.(), i?.(), a?.());
							} catch (e) {
								console.debug?.(e);
							}
						});
					} catch (e) {
						console.debug?.(e);
					}
					try {
						o?.();
					} catch (e) {
						console.debug?.(e);
					}
				}
			}), C._mjrProc?.setParams?.(s?.());
		} catch (e) {
			console.debug?.(e);
		}
		return C;
	}
	function k(e, f) {
		let m = String(e?.kind || "").toLowerCase();
		if (oe(e) || m === "model3d") return U(e, f, {
			hostClassName: "mjr-model3d-host mjr-viewer-model3d-host",
			canvasClassName: "mjr-viewer-media mjr-model3d-render-canvas",
			pauseDuringExecution: !0,
			scheduleOverlayRedraw: o,
			onReady: () => {
				try {
					requestAnimationFrame(() => {
						try {
							t?._userInteracted || (r?.(), i?.(), a?.());
						} catch (e) {
							console.debug?.(e);
						}
					});
				} catch (e) {
					console.debug?.(e);
				}
				try {
					o?.();
				} catch (e) {
					console.debug?.(e);
				}
			}
		});
		if (m && m !== "image" && m !== "video" && m !== "audio") {
			let t = document.createElement("canvas");
			t.className = "mjr-viewer-media";
			try {
				e?.id != null && t?.dataset && (t.dataset.mjrAssetId = String(e.id));
			} catch (e) {
				console.debug?.(e);
			}
			S(t, e), t.style.cssText = `
                max-width: 100%;
                max-height: 100%;
                display: block;
                transform: ${n?.() || ""};
                transform-origin: center center;
            `;
			try {
				H(t, `Unsupported file type: ${m}`);
			} catch (e) {
				console.debug?.(e);
			}
			return t;
		}
		if (m === "audio") return E(e, f, { compare: !0 });
		if (m === "video") {
			let u = document.createElement("div");
			u.style.cssText = "width:100%; height:100%; position:relative; display:flex; align-items:center; justify-content:center;";
			let m = document.createElement("canvas");
			m.className = "mjr-viewer-media";
			try {
				e?.id != null && m?.dataset && (m.dataset.mjrAssetId = String(e.id));
			} catch (e) {
				console.debug?.(e);
			}
			S(m, e), m.style.cssText = `
                max-width: 100%;
                max-height: 100%;
                object-fit: contain;
                display: block;
                transform: ${n?.() || ""};
                transform-origin: center center;
            `;
			let h = document.createElement("video");
			h.className = "mjr-viewer-video-src", h.src = f, h.controls = !1, h.loop = !0, h.muted = !0, h.playsInline = !0, h.autoplay = !0, h.preload = "auto";
			try {
				"decode" in HTMLVideoElement.prototype && (h.decoding = "async");
			} catch {}
			h.style.cssText = "position:absolute; width:1px; height:1px; opacity:0; pointer-events:none;", T(h, e);
			try {
				m._mjrProc = st({
					canvas: m,
					videoEl: h,
					pauseDuringExecution: x.VIEWER_PAUSE_DURING_EXECUTION,
					getGradeParams: s,
					isDefaultGrade: c,
					tonemap: l,
					maxProcPixelsVideo: d,
					throttleFps: p,
					safeAddListener: _,
					safeCall: g,
					onReady: () => {
						try {
							requestAnimationFrame(() => {
								try {
									t?._userInteracted || (r?.(), i?.(), a?.());
								} catch (e) {
									console.debug?.(e);
								}
							});
						} catch (e) {
							console.debug?.(e);
						}
						try {
							o?.();
						} catch (e) {
							console.debug?.(e);
						}
					}
				}), m._mjrProc?.setParams?.(s?.());
			} catch (e) {
				console.debug?.(e);
			}
			return u.appendChild(m), u.appendChild(h), u;
		}
		if (y(e)) return b(e, f);
		let h = document.createElement("canvas");
		h.className = "mjr-viewer-media";
		try {
			e?.id != null && h?.dataset && (h.dataset.mjrAssetId = String(e.id));
		} catch (e) {
			console.debug?.(e);
		}
		S(h, e), h.style.cssText = `
            max-width: 100%;
            max-height: 100%;
            display: block;
            transform: ${n?.() || ""};
            transform-origin: center center;
        `;
		try {
			h._mjrProc = me({
				canvas: h,
				url: f,
				getGradeParams: s,
				isDefaultGrade: c,
				tonemap: l,
				maxProcPixels: u,
				onReady: () => {
					try {
						requestAnimationFrame(() => {
							try {
								t?._userInteracted || (r?.(), i?.(), a?.());
							} catch (e) {
								console.debug?.(e);
							}
						});
					} catch (e) {
						console.debug?.(e);
					}
					try {
						o?.();
					} catch (e) {
						console.debug?.(e);
					}
				}
			}), h._mjrProc?.setParams?.(s?.());
		} catch (e) {
			console.debug?.(e);
		}
		return h;
	}
	return {
		createMediaElement: D,
		createCompareMediaElement: k,
		applyTransformToVisibleMedia: () => {
			try {
				let t = n?.() || "", r = e?.querySelectorAll?.(".mjr-viewer-media") || [];
				for (let e of r) try {
					if (e?._mjrDisableViewerTransform) continue;
					e.style.transform = t;
				} catch (e) {
					console.debug?.(e);
				}
			} catch (e) {
				console.debug?.(e);
			}
		}
	};
}
//#endregion
//#region ui/features/viewer/imagePreloader.ts
function mt({ buildAssetViewURL: e, IMAGE_PRELOAD_EXTENSIONS: t, state: n }) {
	function r(e) {
		if (!e) return null;
		if (e.id != null) return `id:${e.id}`;
		let t = e.filepath || e.path || e.filename;
		return t ? `path:${t}` : null;
	}
	function i(e) {
		if (!e) return !1;
		let n = String(e.kind || "").toLowerCase();
		if (n === "image" || n.startsWith("image/")) return !0;
		let r = String(e.filepath || e.path || e.filename || "").split(".").pop()?.toLowerCase() || "";
		return t.has(r);
	}
	function a(e) {
		if (e) try {
			n._preloadRefs = n._preloadRefs || /* @__PURE__ */ new Set(), n._preloadRefs.add(e);
			let t = () => {
				try {
					n._preloadRefs?.delete?.(e);
				} catch (e) {
					console.debug?.(e);
				}
			};
			e.addEventListener("load", t, {
				once: !0,
				passive: !0
			}), e.addEventListener("error", t, {
				once: !0,
				passive: !0
			});
		} catch (e) {
			console.debug?.(e);
		}
	}
	function o(e, t) {
		if (!e || !t || !i(e)) return;
		let o = r(e) || t;
		if (o) {
			if (n._preloadedAssetKeys = n._preloadedAssetKeys || /* @__PURE__ */ new Set(), n._preloadedAssetKeys.has(o)) return;
			if (n._preloadedAssetKeys.add(o), n._preloadedAssetKeys.size > 250) try {
				n._preloadedAssetKeys.clear();
			} catch (e) {
				console.debug?.(e);
			}
		}
		try {
			let e = new Image();
			e.decoding = "async";
			try {
				e.loading = "lazy";
			} catch (e) {
				console.debug?.(e);
			}
			e.alt = "", e.src = t, a(e);
		} catch (e) {
			console.debug?.(e);
		}
	}
	function s(t, n) {
		let r = Array.isArray(t) ? t : [];
		if (!r.length) return;
		let i = [
			n - 1,
			n + 1,
			n - 2,
			n + 2,
			n - 3,
			n + 3
		];
		for (let t of i) {
			if (t < 0 || t >= r.length) continue;
			let n = r[t];
			n && o(n, e(n));
		}
	}
	return {
		preloadAdjacentAssets: s,
		preloadImageForAsset: o,
		trackPreloadRef: a
	};
}
//#endregion
//#region ui/features/metadata/genInfoCompare.ts
function ht(e, t) {
	for (let n of t) {
		let t = n.split("."), r = e;
		for (let e of t) {
			if (r == null) break;
			r = r?.[e];
		}
		if (r != null && String(r).trim?.() !== "") return r;
	}
	return "";
}
function gt(e) {
	if (e == null) return "";
	if (typeof e == "string") return e.trim();
	if (typeof e == "number" || typeof e == "boolean") return String(e);
	try {
		return JSON.stringify(e);
	} catch {
		return String(e);
	}
}
var _t = [
	{
		key: "positive",
		label: "Positive Prompt",
		paths: [
			"geninfo.positive.value",
			"positive_prompt",
			"prompt"
		]
	},
	{
		key: "negative",
		label: "Negative Prompt",
		paths: ["geninfo.negative.value", "negative_prompt"]
	},
	{
		key: "model",
		label: "Model",
		paths: [
			"geninfo.checkpoint.name",
			"model",
			"checkpoint"
		]
	},
	{
		key: "lora",
		label: "LoRA",
		paths: [
			"geninfo.loras",
			"loras",
			"lora"
		]
	},
	{
		key: "sampler",
		label: "Sampler",
		paths: ["geninfo.sampler.name", "sampler"]
	},
	{
		key: "scheduler",
		label: "Scheduler",
		paths: ["geninfo.scheduler.name", "scheduler"]
	},
	{
		key: "steps",
		label: "Steps",
		paths: ["geninfo.steps.value", "steps"]
	},
	{
		key: "cfg",
		label: "CFG",
		paths: ["geninfo.cfg.value", "cfg"]
	},
	{
		key: "denoise",
		label: "Denoise",
		paths: ["geninfo.denoise.value", "denoise"]
	},
	{
		key: "seed",
		label: "Seed",
		paths: ["geninfo.seed.value", "seed"]
	},
	{
		key: "workflow_nodes",
		label: "Workflow Nodes",
		paths: ["geninfo.workflow_nodes", "workflow.nodes"]
	}
];
function vt(e, t) {
	return _t.map((n) => {
		let r = gt(ht(e, n.paths)), i = gt(ht(t, n.paths));
		return {
			key: n.key,
			label: n.label,
			left: r,
			right: i,
			changed: r !== i
		};
	}).filter((e) => e.left || e.right);
}
//#endregion
//#region ui/features/viewer/metadataCompare.ts
function yt(e) {
	return String(e ?? "").trim() || "-";
}
function bt(e, t) {
	let n = document.createElement("div");
	return n.textContent = yt(e), n.style.cssText = [
		"min-width:0",
		"white-space:pre-wrap",
		"overflow-wrap:anywhere",
		"font-size:11px",
		"line-height:1.35",
		"color:rgba(255,255,255,0.84)",
		t ? "background:rgba(255,193,7,0.10)" : "background:rgba(255,255,255,0.035)",
		"border:1px solid rgba(255,255,255,0.08)",
		"border-radius:6px",
		"padding:6px 7px"
	].join(";"), n;
}
function xt(e, t) {
	let n = vt(e, t).filter((e) => yt(e?.left) !== "-" || yt(e?.right) !== "-");
	if (!n.length) return null;
	let r = document.createElement("div");
	r.style.cssText = "display:flex;flex-direction:column;gap:8px;margin:0 0 14px 0;padding:10px;border:1px solid rgba(144,220,220,0.22);border-radius:10px;background:rgba(90,220,220,0.06);";
	let i = document.createElement("div");
	i.textContent = y("viewer.metadataCompare", "Metadata compare"), i.style.cssText = "font-size:12px;font-weight:700;color:rgba(255,255,255,0.9);letter-spacing:0.02em", r.appendChild(i);
	for (let e of n.slice(0, 24)) {
		let t = document.createElement("div");
		t.style.cssText = "display:grid;grid-template-columns:minmax(74px,0.42fr) 1fr 1fr;gap:6px;align-items:start";
		let n = document.createElement("div");
		n.textContent = String(e?.label || e?.key || "").trim(), n.style.cssText = "font-size:11px;font-weight:650;color:rgba(255,255,255,0.70);padding-top:6px;overflow-wrap:anywhere", t.appendChild(n);
		let i = !!e?.changed;
		t.appendChild(bt(e?.left, i)), t.appendChild(bt(e?.right, i)), r.appendChild(t);
	}
	return r;
}
//#endregion
//#region ui/features/viewer/viewerInstanceManager.ts
function St(e) {
	let t = d();
	if (t.length) {
		let e = t[t.length - 1];
		for (let n of t) if (n !== e) {
			try {
				n?._mjrViewerAPI?.dispose?.();
			} catch (e) {
				console.debug?.(e);
			}
			try {
				n.remove?.();
			} catch (e) {
				console.debug?.(e);
			}
		}
		if (e && e._mjrViewerAPI) return e._mjrViewerAPI;
		try {
			e?.remove?.();
		} catch (e) {
			console.debug?.(e);
		}
	}
	let n = e();
	return s(n), n._mjrViewerAPI;
}
//#endregion
//#region ui/features/viewer/playerBarManager.ts
function Ct({ state: e, APP_CONFIG: t, VIEWER_MODES: n, overlay: r, navBar: i, playerBarHost: a, singleView: o, abView: s, sideView: c, metadataHydrator: l, isPlayableViewerKind: u, collectPlayableMediaElements: d, pickPrimaryPlayableMedia: f, mountUnifiedMediaControls: p, installFollowerVideoSync: m, getViewerInfo: h, scheduleOverlayRedraw: g, viewerInfoCacheGet: _, viewerInfoCacheSet: v }) {
	function y() {
		try {
			e._videoControlsDestroy && e._videoControlsDestroy();
		} catch (e) {
			console.debug?.(e);
		}
		e._videoControlsDestroy = null, e._videoControlsMounted = null, e._activeVideoEl = null, e._activeVideoAssetId = null, e.nativeFps = null;
		try {
			e._videoSyncAbort?.abort?.();
		} catch (e) {
			console.debug?.(e);
		}
		e._videoSyncAbort = null;
		try {
			e._videoRateAbort?.abort?.();
		} catch (e) {
			console.debug?.(e);
		}
		e._videoRateAbort = null;
		try {
			e._videoMetaAbort?.abort?.();
		} catch (e) {
			console.debug?.(e);
		}
		e._videoMetaAbort = null;
		try {
			e._videoFpsEventAbort?.abort?.();
		} catch (e) {
			console.debug?.(e);
		}
		e._videoFpsEventAbort = null;
		try {
			e._scopesVideoAbort?.abort?.();
		} catch (e) {
			console.debug?.(e);
		}
		e._scopesVideoAbort = null;
		try {
			a.innerHTML = "";
		} catch (e) {
			console.debug?.(e);
		}
		try {
			a.style.display = "none";
		} catch (e) {
			console.debug?.(e);
		}
		try {
			i.style.display = "";
		} catch (e) {
			console.debug?.(e);
		}
	}
	async function b() {
		try {
			let b = e.assets[e.currentIndex], x = b?.id ?? null;
			if (!u(b?.kind)) {
				y();
				return;
			}
			let S = null, C = [];
			try {
				C = d({
					mode: e.mode,
					VIEWER_MODES: n,
					singleView: o,
					abView: s,
					sideView: c
				});
			} catch {
				C = [];
			}
			try {
				S = f(C);
			} catch {
				S = C[0] || null;
			}
			if (!S) {
				y();
				return;
			}
			if (e._activeVideoEl && e._activeVideoEl === S && e._activeVideoAssetId === x && e._videoControlsDestroy) {
				try {
					i.style.display = "none", a.style.display = "";
				} catch (e) {
					console.debug?.(e);
				}
				return;
			}
			y();
			try {
				i.style.display = "none";
			} catch (e) {
				console.debug?.(e);
			}
			try {
				a.style.display = "";
			} catch (e) {
				console.debug?.(e);
			}
			let w, T;
			try {
				let e = (e) => {
					try {
						let t = j(e);
						return {
							fps: t,
							frameCount: D(e, t)
						};
					} catch {
						return {
							fps: null,
							frameCount: null
						};
					}
				}, t = e(b);
				if (t.fps != null && (w = t.fps), t.frameCount != null && (T = t.frameCount), w == null || T == null) {
					let t = l?.getCached?.(b?.id), n = t?.data ? e(t.data) : {
						fps: null,
						frameCount: null
					};
					w == null && n.fps != null && (w = n.fps), T == null && n.frameCount != null && (T = n.frameCount);
				}
			} catch (e) {
				console.debug?.(e);
			}
			try {
				if (w == null) {
					let e = Number(S?._mjrDetectedFps);
					Number.isFinite(e) && e > 0 && (w = e);
				}
			} catch (e) {
				console.debug?.(e);
			}
			let E = String(b?.kind || "").toLowerCase() === "audio" ? "audio" : "video", O = p(S, {
				variant: "viewerbar",
				hostEl: a,
				fullscreenEl: r,
				initialFps: w,
				initialFrameCount: T,
				initialPlaybackRate: Number(e?.playbackRate) || 1,
				mediaKind: E
			});
			e._videoControlsMounted = O || null, e._videoControlsDestroy = O?.destroy || null, e._activeVideoEl = S, e._activeVideoAssetId = x;
			try {
				e._videoRateAbort?.abort?.();
			} catch (e) {
				console.debug?.(e);
			}
			try {
				let t = new AbortController();
				e._videoRateAbort = t, S.addEventListener("ratechange", () => {
					try {
						let t = Number(S.playbackRate);
						Number.isFinite(t) && t > 0 && (e.playbackRate = t);
					} catch (e) {
						console.debug?.(e);
					}
				}, {
					signal: t.signal,
					passive: !0
				});
			} catch (e) {
				console.debug?.(e);
			}
			try {
				e.nativeFps = Number(w) > 0 ? Number(w) : null;
			} catch (e) {
				console.debug?.(e);
			}
			try {
				if (E === "audio") {
					let e = S.play?.();
					e && typeof e.catch == "function" && e.catch(() => {});
				}
			} catch (e) {
				console.debug?.(e);
			}
			try {
				if (E === "video" && e.mode === n?.SINGLE) {
					S.muted = !1;
					let e = S.play?.();
					e && typeof e.catch == "function" && e.catch(() => {});
				}
			} catch (e) {
				console.debug?.(e);
			}
			try {
				e._scopesVideoAbort?.abort?.();
			} catch (e) {
				console.debug?.(e);
			}
			if (E === "video") try {
				let n = new AbortController();
				e._scopesVideoAbort = n;
				let i = () => {
					try {
						if (String(e?.scopesMode || "off") === "off") return;
					} catch (e) {
						console.debug?.(e);
					}
					g();
				};
				S.addEventListener("seeked", i, {
					signal: n.signal,
					passive: !0
				}), S.addEventListener("loadeddata", i, {
					signal: n.signal,
					passive: !0
				}), S.addEventListener("play", i, {
					signal: n.signal,
					passive: !0
				}), S.addEventListener("pause", i, {
					signal: n.signal,
					passive: !0
				});
				let a = 1e3 / Math.max(1, Math.min(30, Math.floor(Number(t.VIEWER_SCOPES_FPS) || 10))), o = () => {
					if (!n.signal.aborted) {
						try {
							if (document?.hidden) return;
						} catch (e) {
							console.debug?.(e);
						}
						try {
							if (r.style.display === "none") return;
						} catch (e) {
							console.debug?.(e);
						}
						try {
							if (String(e?.scopesMode || "off") !== "off" && !S.paused) {
								let t = performance.now();
								t - (Number(e?._scopesLastAt) || 0) >= a && (e._scopesLastAt = t, g());
							}
						} catch (e) {
							console.debug?.(e);
						}
						try {
							requestAnimationFrame(o);
						} catch (e) {
							console.debug?.(e);
						}
					}
				};
				try {
					requestAnimationFrame(o);
				} catch (e) {
					console.debug?.(e);
				}
			} catch (e) {
				console.debug?.(e);
			}
			else e._scopesVideoAbort = null;
			try {
				e._videoSyncAbort?.abort?.();
			} catch (e) {
				console.debug?.(e);
			}
			try {
				if (e._videoSyncAbort = null, E === "video" && C.length > 1) {
					let t = C.filter((e) => e && e !== S);
					e._videoSyncAbort = m(S, t);
				}
			} catch (e) {
				console.debug?.(e);
			}
			if (E === "video") {
				try {
					let t = (e) => P(e), n = (e) => {
						let t = Number(e);
						return !Number.isFinite(t) || t <= 0 ? null : Math.floor(t);
					}, r = (r) => {
						try {
							if (!r || typeof r != "object") return;
							let i = t(r?.fps_raw ?? r?.fps ?? r?.frame_rate), a = n(r?.frame_count);
							i != null && (e.nativeFps = i), (i != null || a != null) && O?.setMediaInfo?.({
								fps: i,
								frameCount: a
							});
						} catch (e) {
							console.debug?.(e);
						}
					};
					try {
						let e = _(b?.id);
						e && r(e);
					} catch (e) {
						console.debug?.(e);
					}
					try {
						e._videoMetaAbort?.abort?.();
					} catch (e) {
						console.debug?.(e);
					}
					let i = new AbortController();
					e._videoMetaAbort = i, (async () => {
						try {
							let t = await h(b?.id, { signal: i.signal });
							if (!t?.ok || !t.data || e._activeVideoEl !== S) return;
							try {
								v(b?.id, t.data);
							} catch (e) {
								console.debug?.(e);
							}
							r(t.data);
						} catch (e) {
							console.debug?.(e);
						}
					})();
				} catch (e) {
					console.debug?.(e);
				}
				try {
					e._videoFpsEventAbort?.abort?.();
				} catch (e) {
					console.debug?.(e);
				}
				try {
					let t = new AbortController();
					e._videoFpsEventAbort = t, window.addEventListener("mjr:viewer-fps-detected", (t) => {
						try {
							let n = t?.detail || {}, r = String(n?.assetId || ""), i = String(b?.id ?? "");
							if (!r || !i || r !== i || e._activeVideoEl !== S) return;
							let a = Number(n?.fps);
							if (!Number.isFinite(a) || a <= 0) return;
							let o = String(n?.source || "");
							(o !== "rvfc" || !(Number(e.nativeFps) > 0)) && (e.nativeFps = a), O?.setMediaInfo?.({
								fps: a,
								fpsSource: o
							});
						} catch (e) {
							console.debug?.(e);
						}
					}, {
						signal: t.signal,
						passive: !0
					});
				} catch (e) {
					console.debug?.(e);
				}
			} else {
				try {
					e._videoMetaAbort?.abort?.();
				} catch (e) {
					console.debug?.(e);
				}
				e._videoMetaAbort = null;
				try {
					e._videoFpsEventAbort?.abort?.();
				} catch (e) {
					console.debug?.(e);
				}
				e._videoFpsEventAbort = null;
			}
		} catch {
			y();
		}
	}
	return {
		destroyPlayerBar: y,
		syncPlayerBar: b
	};
}
//#endregion
//#region ui/features/viewer/viewerThemeStyles.ts
var wt = "min(400px, 42vw)", Tt = `calc(${wt} + 24px)`, Et = "mjr-viewer-modern-theme";
function Dt() {
	try {
		if (document.getElementById(Et)) return;
		let e = document.createElement("style");
		e.id = Et, e.textContent = `
            .mjr-viewer-overlay {
                --mjr-viewer-surface: rgba(14, 18, 24, 0.78);
                --mjr-viewer-surface-strong: rgba(10, 13, 18, 0.9);
                --mjr-viewer-surface-soft: rgba(255, 255, 255, 0.045);
                --mjr-viewer-border: rgba(255, 255, 255, 0.11);
                --mjr-viewer-border-strong: rgba(255, 255, 255, 0.18);
                --mjr-viewer-shadow: 0 24px 80px rgba(0, 0, 0, 0.42);
                --mjr-viewer-shadow-soft: 0 14px 40px rgba(0, 0, 0, 0.22);
                --mjr-viewer-radius: 22px;
                isolation: isolate;
            }

            .mjr-viewer-overlay::before {
                content: "";
                position: absolute;
                inset: 0;
                pointer-events: none;
                background:
                    radial-gradient(circle at top left, rgba(87, 153, 255, 0.14), transparent 34%),
                    radial-gradient(circle at top right, rgba(78, 224, 196, 0.12), transparent 28%),
                    radial-gradient(circle at bottom center, rgba(255, 184, 107, 0.08), transparent 28%);
                opacity: 0.95;
                z-index: 0;
            }

            .mjr-viewer-overlay > * {
                position: relative;
                z-index: 1;
            }

            .mjr-viewer-header,
            .mjr-viewer-content-row,
            .mjr-filmstrip,
            .mjr-viewer-footer,
            .mjr-viewer-geninfo {
                box-shadow: var(--mjr-viewer-shadow-soft);
            }

            .mjr-viewer-header {
                margin: 18px 18px 0;
                border-radius: calc(var(--mjr-viewer-radius) - 2px);
                border: 1px solid var(--mjr-viewer-border) !important;
                backdrop-filter: blur(20px) saturate(140%);
            }

            .mjr-viewer-header-top {
                min-height: 42px;
            }

            .mjr-viewer-header-area--center {
                padding-inline: 8px;
            }

            .mjr-viewer-mode-buttons {
                padding: 4px;
                border-radius: 999px;
                background: rgba(255, 255, 255, 0.045);
                border: 1px solid rgba(255, 255, 255, 0.08);
                box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.04);
            }

            .mjr-viewer-close,
            .mjr-viewer-fs,
            .mjr-viewer-nav-btn {
                border-color: rgba(255, 255, 255, 0.14) !important;
                background: rgba(255, 255, 255, 0.05) !important;
                backdrop-filter: blur(16px) saturate(140%);
                box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.06);
                transition: transform 0.18s ease, background 0.18s ease, border-color 0.18s ease;
            }

            .mjr-viewer-close:hover,
            .mjr-viewer-fs:hover,
            .mjr-viewer-nav-btn:hover {
                transform: translateY(-1px);
                background: rgba(255, 255, 255, 0.085) !important;
                border-color: rgba(255, 255, 255, 0.22) !important;
            }

            .mjr-viewer-content-row {
                margin: 14px 18px 0;
                border-radius: calc(var(--mjr-viewer-radius) + 2px);
                border: 1px solid var(--mjr-viewer-border);
                background:
                    linear-gradient(180deg, rgba(19, 24, 31, 0.78), rgba(10, 14, 20, 0.88)),
                    radial-gradient(circle at top, rgba(255, 255, 255, 0.04), transparent 42%);
                overflow: hidden;
                box-shadow: var(--mjr-viewer-shadow);
            }

            .mjr-viewer-content {
                background:
                    radial-gradient(circle at center, rgba(255, 255, 255, 0.035), transparent 55%),
                    linear-gradient(180deg, rgba(7, 10, 14, 0.28), rgba(7, 10, 14, 0.62));
            }

            .mjr-viewer-probe,
            .mjr-viewer-loupe {
                backdrop-filter: blur(14px) saturate(125%);
            }

            .mjr-viewer-geninfo {
                width: ${wt} !important;
                top: 16px !important;
                bottom: 16px !important;
                border-radius: 20px;
                border: 1px solid var(--mjr-viewer-border-strong);
                background: linear-gradient(180deg, rgba(15, 19, 24, 0.92), rgba(9, 12, 16, 0.94)) !important;
                backdrop-filter: blur(22px) saturate(140%);
            }

            .mjr-viewer-geninfo--right {
                right: 16px !important;
            }

            .mjr-viewer-geninfo--left {
                left: 16px !important;
            }

            .mjr-viewer-footer {
                margin: 12px 18px 18px;
                border-radius: 18px;
                border: 1px solid var(--mjr-viewer-border) !important;
                backdrop-filter: blur(18px) saturate(135%);
                justify-content: space-between !important;
                flex-wrap: wrap;
                align-content: center;
            }

            .mjr-viewer-nav {
                padding: 6px;
                border-radius: 999px;
                background: rgba(255, 255, 255, 0.04);
                border: 1px solid rgba(255, 255, 255, 0.08);
            }

            .mjr-viewer-nav-btn {
                width: 42px;
                height: 42px;
                padding: 0 !important;
                border-radius: 999px !important;
                font-size: 22px !important;
                line-height: 1;
            }

            .mjr-viewer-index {
                min-height: 36px;
                padding: 0 14px;
                display: inline-flex;
                align-items: center;
                justify-content: center;
                border-radius: 999px;
                background: rgba(255, 255, 255, 0.05);
                border: 1px solid rgba(255, 255, 255, 0.08);
                letter-spacing: 0.02em;
            }

            .mjr-viewer-playerbar {
                flex: 1 1 320px;
                min-width: 260px;
            }

            @media (max-width: 960px) {
                .mjr-viewer-header,
                .mjr-viewer-content-row,
                .mjr-filmstrip,
                .mjr-viewer-footer {
                    margin-left: 10px;
                    margin-right: 10px;
                }

                .mjr-viewer-header {
                    margin-top: 10px;
                }

                .mjr-viewer-footer {
                    margin-bottom: 10px;
                    justify-content: center !important;
                }

                .mjr-viewer-playerbar {
                    min-width: 100%;
                }

                .mjr-viewer-geninfo {
                    width: min(100vw - 24px, 420px) !important;
                    left: 12px !important;
                    right: 12px !important;
                }

                .mjr-viewer-geninfo--left {
                    left: 12px !important;
                }
            }
        `, document.head.appendChild(e);
	} catch (e) {
		console.debug?.(e);
	}
}
//#endregion
//#region ui/features/viewer/filmstrip.ts
var Ot = 84, kt = 56, At = 74, jt = .45, Mt = "0px 240px 0px 240px", Nt = 3500;
function Pt(e) {
	let t = 2166136261, n = String(e || "");
	for (let e = 0; e < n.length; e += 1) t ^= n.charCodeAt(e), t = Math.imul(t, 16777619);
	return t >>> 0;
}
function Ft(e, t, n = 18) {
	let r = document.createElement("div");
	r.className = "mjr-filmstrip-audio-waveform";
	let i = Pt(t) || 1;
	for (let e = 0; e < n; e += 1) {
		i = Math.imul(i ^ i >>> 15, 2246822519) >>> 0;
		let t = i % 1e3 / 1e3, a = Math.sin(e / Math.max(1, n - 1) * Math.PI), o = document.createElement("span");
		o.style.height = `${Math.max(16, Math.min(92, Math.round(20 + a * 52 + t * 22)))}%`, o.style.opacity = String(.45 + t * .45), r.appendChild(o);
	}
	e.appendChild(r);
}
function It(e) {
	try {
		e?._mjrFilmstripReleaseTimer && (clearTimeout(e._mjrFilmstripReleaseTimer), e._mjrFilmstripReleaseTimer = null);
	} catch (e) {
		console.debug?.(e);
	}
}
function Lt(e) {
	if (!e) return;
	let t = String(e.dataset.lazySrc || "").trim();
	if (t) try {
		String(e.getAttribute("src") || "").trim() || (e.src = t, e.load());
	} catch (e) {
		console.debug?.(e);
	}
}
function Rt(e) {
	if (e) try {
		let t = e.play?.();
		t && typeof t.catch == "function" && t.catch(() => {});
	} catch (e) {
		console.debug?.(e);
	}
}
function zt(e) {
	if (e) try {
		e.pause?.();
	} catch (e) {
		console.debug?.(e);
	}
}
function Bt(e, { releaseSrc: t = !0 } = {}) {
	if (e) {
		It(e), zt(e);
		try {
			e._mjrFilmstripInView = !1;
		} catch (e) {
			console.debug?.(e);
		}
		if (t) try {
			e.getAttribute("src") && (e.removeAttribute("src"), e.load());
		} catch (e) {
			console.debug?.(e);
		}
	}
}
function Vt({ state: e, buildAssetViewURL: t, onNavigate: n, onCompare: r }) {
	let i = document.createElement("div");
	i.className = "mjr-filmstrip", i.style.cssText = `
        width: 100%;
        height: ${At}px;
        overflow-x: auto;
        overflow-y: hidden;
        background: linear-gradient(180deg, rgba(16, 20, 27, 0.82), rgba(10, 13, 18, 0.92));
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 18px;
        flex-shrink: 0;
        scrollbar-width: thin;
        scrollbar-color: rgba(255,255,255,0.14) transparent;
        box-sizing: border-box;
        display: none;
        box-shadow: 0 16px 36px rgba(0, 0, 0, 0.22);
    `;
	let a = document.createElement("div");
	a.className = "mjr-filmstrip-track", a.style.cssText = "\n        display: inline-flex;\n        align-items: center;\n        gap: 8px;\n        padding: 9px 12px;\n        min-height: 100%;\n        box-sizing: border-box;\n    ", i.appendChild(a);
	let o = [], s = null, c = /* @__PURE__ */ new Set(), l = -1, u = -1, d = () => {
		try {
			return new IntersectionObserver((e) => {
				let t = i.style.display !== "none", n = !document.hidden;
				for (let r of e) {
					let e = r.target;
					if (!(e instanceof HTMLVideoElement)) continue;
					let i = r.isIntersecting || r.intersectionRatio > 0;
					try {
						e._mjrFilmstripInView = i;
					} catch (e) {
						console.debug?.(e);
					}
					if (i && (It(e), Lt(e)), i && r.intersectionRatio >= jt && t && n ? Rt(e) : zt(e), !i) {
						It(e);
						try {
							e._mjrFilmstripReleaseTimer = setTimeout(() => {
								try {
									if (!e.isConnected) {
										Bt(e, { releaseSrc: !0 });
										return;
									}
									e._mjrFilmstripInView || Bt(e, { releaseSrc: !0 });
								} catch (e) {
									console.debug?.(e);
								}
							}, Nt);
						} catch (e) {
							console.debug?.(e);
						}
					}
				}
			}, {
				root: i,
				rootMargin: Mt,
				threshold: [0, jt]
			});
		} catch {
			return null;
		}
	}, f = (e) => {
		if (e) {
			try {
				e._mjrFilmstripInView = !1;
			} catch (e) {
				console.debug?.(e);
			}
			c.add(e);
			try {
				s ||= d(), s?.observe?.(e);
			} catch (e) {
				console.debug?.(e);
			}
		}
	}, p = ({ releaseSrc: e = !1 } = {}) => {
		for (let t of Array.from(c)) Bt(t, { releaseSrc: e });
	}, m = () => {
		for (let e of Array.from(c)) try {
			if (!e?._mjrFilmstripInView || !e?.isConnected) continue;
			Lt(e), Rt(e);
		} catch (e) {
			console.debug?.(e);
		}
	}, h = ({ releaseSrc: e = !0 } = {}) => {
		try {
			s?.disconnect?.();
		} catch (e) {
			console.debug?.(e);
		}
		s = null, p({ releaseSrc: e }), c.clear();
	}, g = () => {
		try {
			return !!window?.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
		} catch {
			return !1;
		}
	}, _ = (e, t = 1.08) => {
		if (!(!e || g())) {
			try {
				e._mjrFilmstripBounce?.cancel?.();
			} catch (e) {
				console.debug?.(e);
			}
			try {
				if (typeof e.animate != "function") return;
				let n = Math.min(1.18, t + .07), r = Math.max(1, t - .03), i = e.animate([
					{ transform: `scale(${t})` },
					{ transform: `scale(${n})` },
					{ transform: `scale(${r})` },
					{ transform: `scale(${t})` }
				], {
					duration: 420,
					easing: "cubic-bezier(0.22, 0.9, 0.32, 1.15)"
				});
				e._mjrFilmstripBounce = i, i.onfinish = () => {
					try {
						e._mjrFilmstripBounce === i && (e._mjrFilmstripBounce = null);
					} catch (e) {
						console.debug?.(e);
					}
				};
			} catch (e) {
				console.debug?.(e);
			}
		}
	}, v = (e, n) => {
		let r = document.createElement("div");
		r.className = "mjr-filmstrip-item", r.dataset.fidx = String(n), r._mjrAsset = e, r.style.cssText = `
            position: relative;
            width: ${Ot}px;
            height: ${kt}px;
            border-radius: 14px;
            overflow: hidden;
            cursor: pointer;
            flex-shrink: 0;
            border: 2px solid transparent;
            box-sizing: border-box;
            background: rgba(255,255,255,0.06);
            opacity: 0.58;
            transform: scale(1);
            transition: border-color 0.16s ease, opacity 0.16s ease, transform 0.18s ease, box-shadow 0.18s ease, filter 0.18s ease;
        `;
		let a = String(e?.kind || "").toLowerCase(), o = t(e);
		if (o && a === "video") {
			let e = document.createElement("video");
			e.className = "mjr-filmstrip-thumb", e.muted = !0, e.loop = !0, e.autoplay = !0, e.controls = !1, e.playsInline = !0, e.preload = "none", e.dataset.lazySrc = o, e.style.cssText = "\n                width: 100%;\n                height: 100%;\n                object-fit: cover;\n                display: block;\n                pointer-events: none;\n            ";
			try {
				e.disablePictureInPicture = !0;
			} catch (e) {
				console.debug?.(e);
			}
			return e.addEventListener("loadeddata", () => {
				try {
					e._mjrFilmstripInView && i.style.display !== "none" && !document.hidden && Rt(e);
				} catch (e) {
					console.debug?.(e);
				}
			}, { passive: !0 }), e.addEventListener("error", () => {
				try {
					e.style.display = "none";
				} catch (e) {
					console.debug?.(e);
				}
				Bt(e, { releaseSrc: !0 }), y(r);
			}, { once: !0 }), r.appendChild(e), C(r), f(e), r;
		}
		if (a === "audio") {
			let t = String(e?.thumbnail_url || e?.thumb_url || "").trim();
			if (t) {
				let n = document.createElement("img");
				n.className = "mjr-filmstrip-thumb", n.loading = "lazy", n.decoding = "async", n.src = t, n.alt = String(e?.filename || "Audio"), n.draggable = !1, n.style.cssText = "\n                    width: 100%;\n                    height: 100%;\n                    object-fit: cover;\n                    display: block;\n                    pointer-events: none;\n                ", n.addEventListener("error", () => {
					try {
						n.style.display = "none";
					} catch (e) {
						console.debug?.(e);
					}
					b(r);
				}, { once: !0 }), r.appendChild(n);
			} else b(r);
			return E(r), r;
		}
		if (a === "model3d") {
			let n = (() => {
				try {
					let n = String(e?.filename || "").trim();
					if (!n) return "";
					let r = n + ".png", i = String(e?.subfolder || "").trim(), a = String(e?.type || "output").trim();
					return e?.root_id ? t({
						...e,
						filename: r,
						kind: "image"
					}) : S(r, i || null, a);
				} catch {
					return "";
				}
			})();
			if (n) {
				let t = document.createElement("img");
				t.className = "mjr-filmstrip-thumb", t.loading = "lazy", t.decoding = "async", t.src = n, t.alt = String(e?.filename || "3D Model"), t.draggable = !1, t.style.cssText = "\n                    width: 100%;\n                    height: 100%;\n                    object-fit: cover;\n                    display: block;\n                    pointer-events: none;\n                ", t.addEventListener("error", () => {
					try {
						t.style.display = "none";
					} catch (e) {
						console.debug?.(e);
					}
					w(r);
				}, { once: !0 }), r.appendChild(t);
			} else w(r);
			return T(r), r;
		}
		if (o) {
			let e = document.createElement("img");
			return e.className = "mjr-filmstrip-thumb", e.loading = "lazy", e.decoding = "async", e.src = o, e.style.cssText = "\n                width: 100%;\n                height: 100%;\n                object-fit: cover;\n                display: block;\n                pointer-events: none;\n            ", e.addEventListener("error", () => {
				try {
					e.style.display = "none";
				} catch (e) {
					console.debug?.(e);
				}
			}, { once: !0 }), r.appendChild(e), r;
		}
		return x(r), r;
	};
	function y(e) {
		let t = document.createElement("div");
		t.style.cssText = "\n            position: absolute; inset: 0;\n            display: flex; align-items: center; justify-content: center;\n            font-size: 10px; font-weight: 700;\n            color: rgba(255,255,255,0.55);\n            pointer-events: none;\n            letter-spacing: 0.04em;\n        ", t.textContent = "VIDEO";
		try {
			e.appendChild(t);
		} catch (e) {
			console.debug?.(e);
		}
	}
	function b(e) {
		let t = document.createElement("div");
		t.className = "mjr-filmstrip-audio-thumb";
		let n = document.createElement("span");
		n.className = "mjr-filmstrip-audio-label", n.textContent = "AUDIO", Ft(t, e?._mjrAsset?.filename || e?.dataset?.mjrId || "audio"), t.appendChild(n);
		try {
			e.appendChild(t);
		} catch (e) {
			console.debug?.(e);
		}
	}
	function x(e) {
		let t = document.createElement("div");
		t.style.cssText = "\n            position: absolute; inset: 0;\n            display: flex; align-items: center; justify-content: center;\n            font-size: 18px; color: rgba(255,255,255,0.25);\n            pointer-events: none;\n        ", t.textContent = "?";
		try {
			e.appendChild(t);
		} catch (e) {
			console.debug?.(e);
		}
	}
	function C(e) {
		let t = document.createElement("div");
		t.style.cssText = "\n            position: absolute; bottom: 2px; right: 2px;\n            font-size: 7px; line-height: 1;\n            background: rgba(0,0,0,0.55); color: rgba(255,255,255,0.85);\n            padding: 2px 3px; border-radius: 2px;\n            pointer-events: none;\n            letter-spacing: 0.02em;\n        ", t.textContent = "VID", e.appendChild(t);
	}
	function w(e) {
		let t = document.createElement("div");
		t.style.cssText = "\n            position: absolute; inset: 0;\n            display: flex; align-items: center; justify-content: center;\n            font-size: 10px; font-weight: 700;\n            color: rgba(76, 175, 80, 0.7);\n            pointer-events: none;\n            letter-spacing: 0.04em;\n        ", t.textContent = "3D";
		try {
			e.appendChild(t);
		} catch (e) {
			console.debug?.(e);
		}
	}
	function T(e) {
		let t = document.createElement("div");
		t.style.cssText = "\n            position: absolute; bottom: 2px; right: 2px;\n            font-size: 7px; line-height: 1;\n            background: rgba(0,0,0,0.55); color: rgba(76, 175, 80, 0.95);\n            padding: 2px 3px; border-radius: 2px;\n            pointer-events: none;\n            letter-spacing: 0.02em;\n            font-weight: 700;\n        ", t.textContent = "3D", e.appendChild(t);
	}
	function E(e) {
		let t = document.createElement("div");
		t.style.cssText = "\n            position: absolute; bottom: 2px; right: 2px;\n            font-size: 7px; line-height: 1;\n            background: rgba(0,0,0,0.55); color: rgba(255,255,255,0.85);\n            padding: 2px 3px; border-radius: 2px;\n            pointer-events: none;\n            letter-spacing: 0.02em;\n        ", t.textContent = "AUD", e.appendChild(t);
	}
	let D = () => {
		h({ releaseSrc: !0 }), a.innerHTML = "", o = [];
		let t = Array.isArray(e.assets) ? e.assets : [];
		if (t.length < 2) {
			i.style.display = "none";
			return;
		}
		i.style.display = "";
		for (let e = 0; e < t.length; e++) {
			let n = v(t[e], e);
			a.appendChild(n), o.push(n);
		}
		k(!1);
	}, O = (t = {}) => {
		let n = t.isSingle !== !1, a = r != null && e.compareAsset != null, o = Array.isArray(e.assets) ? e.assets : [];
		if (!n && !a || o.length < 2) {
			i.style.display = "none", p({ releaseSrc: !1 });
			return;
		}
		i.style.display = "", m(), k(!0);
	};
	function k(t) {
		let n = Number(e.currentIndex) || 0, a = -1;
		r && e.compareAsset != null && (a = (Array.isArray(e.assets) ? e.assets : []).indexOf(e.compareAsset));
		for (let e = 0; e < o.length; e++) e === n ? (o[e].style.borderColor = "rgba(255, 255, 255, 0.98)", o[e].style.opacity = "1", o[e].style.transform = "scale(1.08)", o[e].style.filter = "saturate(1.12) brightness(1.08)", o[e].style.boxShadow = "0 0 0 1px rgba(255,255,255,0.45), 0 0 18px rgba(160,220,255,0.38), 0 8px 16px rgba(0,0,0,0.38)") : e === a ? (o[e].style.borderColor = "rgba(120, 186, 255, 0.98)", o[e].style.opacity = "0.96", o[e].style.transform = "scale(1.04)", o[e].style.filter = "saturate(1.07) brightness(1.03)", o[e].style.boxShadow = "0 0 0 1px rgba(120,186,255,0.38), 0 0 14px rgba(120,186,255,0.32), 0 6px 14px rgba(0,0,0,0.32)") : (o[e].style.borderColor = "transparent", o[e].style.opacity = "0.5", o[e].style.transform = "scale(1)", o[e].style.filter = "none", o[e].style.boxShadow = "none");
		n !== l && o[n] && _(o[n], 1.08), a >= 0 && a !== u && o[a] && _(o[a], 1.04), l = n, u = a;
		let s = o[n];
		if (s) try {
			s.scrollIntoView({
				behavior: t ? "smooth" : "instant",
				block: "nearest",
				inline: "center"
			});
		} catch {
			try {
				let e = s.offsetLeft - i.clientWidth / 2 + s.offsetWidth / 2;
				i.scrollTo({
					left: Math.max(0, e),
					behavior: t ? "smooth" : "instant"
				});
			} catch (e) {
				console.debug?.(e);
			}
		}
	}
	return i.addEventListener("click", (t) => {
		try {
			t.stopPropagation();
			let i = t.target.closest("[data-fidx]");
			if (!i) return;
			let a = Number(i.dataset.fidx);
			if (!Number.isFinite(a) || a < 0 || a >= (Array.isArray(e.assets) ? e.assets : []).length) return;
			r && (t.ctrlKey || t.metaKey) ? r(a) : n(a);
		} catch (e) {
			console.debug?.(e);
		}
	}, !0), i.addEventListener("wheel", (e) => {
		try {
			e.stopPropagation();
		} catch (e) {
			console.debug?.(e);
		}
	}, {
		passive: !0,
		capture: !0
	}), {
		el: i,
		rebuild: D,
		sync: O
	};
}
//#endregion
//#region ui/features/viewer/viewerShell.ts
function Ht() {
	let e = document.createElement("div");
	return e.className = "mjr-viewer-overlay mjr-assets-manager", e.style.cssText = "\n        position: fixed;\n        top: 0;\n        left: 0;\n        right: 0;\n        bottom: 0;\n        background: linear-gradient(180deg, rgba(6, 8, 12, 0.94), rgba(5, 7, 10, 0.985));\n        z-index: 10000;\n        pointer-events: auto;\n        display: none;\n        flex-direction: column;\n        box-sizing: border-box;\n        overflow: hidden;\n    ", e.tabIndex = -1, e.setAttribute("role", "dialog"), e;
}
function Ut({ state: e, buildAssetViewURL: t, onNavigate: n, onCompare: r }) {
	let i = document.createElement("div");
	i.className = "mjr-viewer-content-row", i.style.cssText = "\n        flex: 1;\n        display: flex;\n        min-height: 0;\n        overflow: hidden;\n        min-width: 0;\n    ";
	let a = document.createElement("div");
	a.className = "mjr-viewer-content", a.style.cssText = "\n        flex: 1;\n        min-width: 0;\n        position: relative;\n        overflow: hidden;\n        display: flex;\n        align-items: center;\n        justify-content: center;\n        isolation: isolate;\n    ";
	let o = document.createElement("div");
	o.className = "mjr-viewer-single", o.style.cssText = "\n        width: 100%;\n        height: 100%;\n        display: flex;\n        align-items: center;\n        justify-content: center;\n    ";
	let s = document.createElement("div");
	s.className = "mjr-viewer-ab", s.style.cssText = "\n        width: 100%;\n        height: 100%;\n        display: none;\n        position: relative;\n    ";
	let c = document.createElement("div");
	c.className = "mjr-viewer-sidebyside", c.style.cssText = "\n        width: 100%;\n        height: 100%;\n        display: none;\n        flex-direction: row;\n        gap: 2px;\n    ", a.appendChild(o), a.appendChild(s), a.appendChild(c);
	let l = document.createElement("div");
	l.className = "mjr-viewer-overlay-layer", l.style.cssText = "\n        position: absolute;\n        inset: 0;\n        pointer-events: none;\n        z-index: 50;\n    ";
	let u = document.createElement("canvas");
	u.className = "mjr-viewer-grid-canvas", u.style.cssText = "\n        position: absolute;\n        inset: 0;\n        width: 100%;\n        height: 100%;\n        display: none;\n    ";
	let d = document.createElement("div");
	d.className = "mjr-viewer-probe", d.style.cssText = "\n        position: absolute;\n        display: none;\n        padding: 7px 10px;\n        border-radius: 10px;\n        background: rgba(11, 14, 19, 0.78);\n        border: 1px solid rgba(255, 255, 255, 0.12);\n        color: rgba(255, 255, 255, 0.92);\n        font-size: 11px;\n        line-height: 1.2;\n        white-space: pre;\n        max-width: 280px;\n        transform: translate3d(0,0,0);\n        box-shadow: 0 18px 34px rgba(0,0,0,0.28);\n    ";
	let f = document.createElement("div");
	f.className = "mjr-viewer-loupe", f.style.cssText = "\n        position: absolute;\n        display: none;\n        width: 120px;\n        height: 120px;\n        border-radius: 14px;\n        overflow: hidden;\n        border: 1px solid rgba(255,255,255,0.14);\n        box-shadow: 0 18px 34px rgba(0,0,0,0.34);\n        background: rgba(9,12,16,0.72);\n        transform: translate3d(0,0,0);\n    ";
	let p = document.createElement("canvas");
	p.width = 120, p.height = 120, p.style.cssText = "width:100%; height:100%; display:block; image-rendering: pixelated;", f.appendChild(p), l.appendChild(u), l.appendChild(d), l.appendChild(f), a.appendChild(l);
	let m = document.createElement("div");
	m.className = "mjr-viewer-geninfo mjr-viewer-geninfo--right", m.style.cssText = `
        position: absolute;
        top: 16px;
        right: 16px;
        bottom: 16px;
        width: ${wt};
        display: none;
        flex-direction: column;
        overflow: hidden;
        background: rgba(12, 15, 20, 0.9);
        border-left: 1px solid rgba(255,255,255,0.12);
        pointer-events: auto;
        backdrop-filter: blur(10px);
        z-index: 10001;
    `;
	let h = document.createElement("div");
	h.style.cssText = "\n        display: flex;\n        align-items: center;\n        justify-content: space-between;\n        gap: 10px;\n        padding: 10px 12px;\n        border-bottom: 1px solid rgba(255,255,255,0.10);\n        color: rgba(255,255,255,0.92);\n    ";
	let g = document.createElement("div");
	g.textContent = "Generation Info", g.style.cssText = "font-size: 13px; font-weight: 600;", h.appendChild(g);
	let _ = document.createElement("div");
	_.style.cssText = "\n        flex: 1;\n        overflow: auto;\n        padding: 14px;\n        color: rgba(255,255,255,0.92);\n    ", m.appendChild(h), m.appendChild(_);
	let v = document.createElement("div");
	v.className = "mjr-viewer-geninfo mjr-viewer-geninfo--left", v.style.cssText = `
        position: absolute;
        top: 16px;
        left: 16px;
        bottom: 16px;
        width: ${wt};
        display: none;
        flex-direction: column;
        overflow: hidden;
        background: rgba(12, 15, 20, 0.9);
        border-right: 1px solid rgba(255,255,255,0.12);
        pointer-events: auto;
        backdrop-filter: blur(10px);
        z-index: 10001;
    `;
	let y = h.cloneNode(!0);
	y.replaceChildren();
	let b = document.createElement("div");
	b.textContent = "Generation Info (A)", b.style.cssText = "font-size: 13px; font-weight: 600;", y.appendChild(b);
	let x = document.createElement("div");
	x.style.cssText = "\n        flex: 1;\n        overflow: auto;\n        padding: 14px;\n        color: rgba(255,255,255,0.92);\n    ", v.appendChild(y), v.appendChild(x), i.appendChild(a);
	let S = document.createElement("div");
	S.className = "mjr-viewer-footer", S.style.cssText = "\n        display: flex;\n        justify-content: space-between;\n        align-items: center;\n        padding: 12px 20px;\n        background: rgba(13, 16, 22, 0.78);\n        border-top: 1px solid rgba(255, 255, 255, 0.1);\n        color: white;\n        gap: 14px 20px;\n        flex-wrap: wrap;\n    ";
	let C = Ve("<", "Previous (Left Arrow)");
	C.classList.add("mjr-viewer-nav-btn", "mjr-viewer-nav-btn--prev"), C.style.fontSize = "24px";
	let w = document.createElement("span");
	w.className = "mjr-viewer-index", w.style.cssText = "font-size: 14px; font-weight: 500;";
	let T = Ve(">", "Next (Right Arrow)");
	T.classList.add("mjr-viewer-nav-btn", "mjr-viewer-nav-btn--next"), T.style.fontSize = "24px";
	let E = document.createElement("div");
	E.className = "mjr-viewer-nav", E.style.cssText = "display:flex; align-items:center; gap:20px;", E.appendChild(C), E.appendChild(w), E.appendChild(T);
	let D = document.createElement("div");
	return D.className = "mjr-viewer-playerbar", D.style.cssText = "display:none; width: 100%;", S.appendChild(E), S.appendChild(D), {
		contentRow: i,
		content: a,
		singleView: o,
		abView: s,
		sideView: c,
		overlayLayer: l,
		gridCanvas: u,
		probeTooltip: d,
		loupeWrap: f,
		loupeCanvas: p,
		genInfoOverlay: m,
		genInfoTitle: g,
		genInfoBody: _,
		genInfoOverlayLeft: v,
		genInfoTitleLeft: b,
		genInfoBodyLeft: x,
		footer: S,
		prevBtn: C,
		indexInfo: w,
		nextBtn: T,
		navBar: E,
		playerBarHost: D,
		filmstrip: Vt({
			state: e,
			buildAssetViewURL: t,
			onNavigate: n,
			onCompare: r
		})
	};
}
//#endregion
//#region ui/features/viewer/viewerOverlayDismiss.ts
function Wt({ overlay: e, requestClose: t }) {
	try {
		let n = null;
		e.addEventListener("pointerdown", (e) => {
			e.isPrimary !== !1 && (n = {
				x: e.clientX,
				y: e.clientY,
				t: Date.now()
			});
		}, {
			capture: !0,
			passive: !0
		}), e.addEventListener("click", (e) => {
			try {
				if (e.defaultPrevented || e.button !== 0) return;
				if (n) {
					let t = e.clientX - n.x, r = e.clientY - n.y;
					if (Math.hypot(t, r) > 6 || Date.now() - n.t > 600) return;
				}
				let r = e.target;
				if (B(r, ".mjr-viewer-header") || B(r, ".mjr-viewer-footer") || B(r, ".mjr-viewer-geninfo") || B(r, ".mjr-video-controls") || B(r, ".mjr-context-menu") || B(r, ".mjr-ab-slider") || B(r, ".mjr-viewer-loupe") || B(r, ".mjr-viewer-probe") || B(r, ".mjr-viewer-media") || r && (r.tagName === "IMG" || r.tagName === "VIDEO" || r.tagName === "CANVAS")) return;
				t?.();
			} catch (e) {
				console.debug?.(e);
			}
		});
	} catch (e) {
		console.debug?.(e);
	}
}
//#endregion
//#region ui/components/ViewerRuntime.ts
var Gt = null, Kt = null, qt = null, Jt = null, Yt = null, Xt = null;
function Zt() {
	Gt || import("./abCompare-BXOoRlmV.js").then((e) => {
		Gt = e;
	}), Kt || import("./sideBySide-BdknjuP0.js").then((e) => {
		Kt = e;
	}), qt || import("./mediaPlayer-JtHPHKzH.js").then((e) => e.a).then((e) => {
		qt = e;
	}), Jt || import("./scopes-X1iFrTle.js").then((e) => {
		Jt = e;
	}), Yt || import("./genInfo-apJ7j0f4.js").then((e) => e.n).then((e) => {
		Yt = e;
	}), Xt || import("./frameExport-tksSZ7sb.js").then((e) => {
		Xt = e;
	});
}
var $ = {
	SINGLE: "single",
	AB_COMPARE: "ab",
	SIDE_BY_SIDE: "sidebyside"
};
function Qt() {
	Zt(), Dt();
	let t = Ht(), i = Be(t), o = i.unsubs || [], s = ae();
	s.mode = $.SINGLE;
	try {
		let e = Le();
		e && typeof e == "object" && (typeof e.analysisMode == "string" && (s.analysisMode = e.analysisMode || "none"), typeof e.loupeEnabled == "boolean" && (s.loupeEnabled = e.loupeEnabled), typeof e.probeEnabled == "boolean" && (s.probeEnabled = e.probeEnabled), typeof e.hudEnabled == "boolean" && (s.hudEnabled = e.hudEnabled), typeof e.genInfoOpen == "boolean" && (s.genInfoOpen = e.genInfoOpen), typeof e.audioVisualizerMode == "string" && (s.audioVisualizerMode = e.audioVisualizerMode || "artistic"), typeof e.abWipePercent == "number" && Number.isFinite(e.abWipePercent) && e.abWipePercent >= 0 && e.abWipePercent <= 100 && (s._abWipePercent = e.abWipePercent));
	} catch (e) {
		console.debug?.(e);
	}
	let l = new Set([
		"png",
		"jpg",
		"jpeg",
		"webp",
		"gif",
		"bmp",
		"tiff",
		"avif",
		"heic",
		"hdr",
		"svg",
		"apng"
	]), u = null, d = null;
	function f() {
		try {
			return u?.mediaTransform?.() || "";
		} catch {
			return "";
		}
	}
	function h() {
		try {
			u?.clampPanToBounds?.();
		} catch (e) {
			console.debug?.(e);
		}
	}
	function g() {
		try {
			u?.applyTransform?.();
		} catch (e) {
			console.debug?.(e);
		}
	}
	function _(e, t) {
		try {
			u?.setZoom?.(e, t);
		} catch (e) {
			console.debug?.(e);
		}
	}
	function S() {
		try {
			u?.updatePanCursor?.();
		} catch (e) {
			console.debug?.(e);
		}
	}
	function C() {
		try {
			return u?.getPrimaryMedia?.() || null;
		} catch {
			return null;
		}
	}
	function D(e) {
		try {
			return u?.getMediaNaturalSize?.(e) || {
				w: 0,
				h: 0
			};
		} catch {
			return {
				w: 0,
				h: 0
			};
		}
	}
	function j() {
		try {
			return u?.getViewportRect?.() || null;
		} catch {
			return null;
		}
	}
	function M() {
		try {
			return u?.computeOneToOneZoom?.() ?? null;
		} catch {
			return null;
		}
	}
	function N() {
		try {
			u?.updateMediaNaturalSize?.();
		} catch (e) {
			console.debug?.(e);
		}
	}
	function P(e, t) {
		try {
			return d?.createMediaElement?.(e, t) || document.createElement("div");
		} catch {
			return document.createElement("div");
		}
	}
	function I(e, t) {
		try {
			return d?.createCompareMediaElement?.(e, t) || document.createElement("div");
		} catch {
			return document.createElement("div");
		}
	}
	function te() {
		let e = !1;
		try {
			let t = s.mode === $.AB_COMPARE ? q : s.mode === $.SIDE_BY_SIDE ? J : K, n = Array.from(t?.querySelectorAll?.(".mjr-viewer-audio-viz") || []);
			for (let t of n) try {
				let n = t?._mjrProc || null;
				if (!n?.setMode) continue;
				n.setMode(s.audioVisualizerMode), e = !0;
			} catch (e) {
				console.debug?.(e);
			}
		} catch (e) {
			console.debug?.(e);
		}
		return e;
	}
	let L = null, ne = () => nn(), R = document.createElement("div");
	R.className = "mjr-viewer-header", R.style.cssText = "\n        display: flex;\n        flex-direction: column;\n        gap: 8px;\n        padding: 12px 20px;\n        background: var(--mjr-surface-0, rgba(0, 0, 0, 0.8));\n        border-bottom: 1px solid rgba(255, 255, 255, 0.1);\n        color: white;\n        box-sizing: border-box;\n    ";
	let z = document.createElement("span");
	z.className = "mjr-viewer-filename", z.style.cssText = "font-size: 14px; font-weight: 500; min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;";
	let re = document.createElement("div");
	re.className = "mjr-viewer-badges", re.style.cssText = "display:flex; gap:8px; align-items:center; flex-wrap:wrap;";
	let B = null, ie = null, V = null, oe = null, H = null, se = null, le = null, U = null, me = null, he = null, W = null;
	try {
		R.appendChild(z), R.appendChild(re);
	} catch (e) {
		console.debug?.(e);
	}
	try {
		L = qe({
			VIEWER_MODES: $,
			state: s,
			lifecycle: i,
			getCanAB: () => ft(),
			onToggleFullscreen: () => {
				try {
					if (document.fullscreenElement) try {
						document.exitFullscreen();
					} catch (e) {
						console.debug?.(e);
					}
					else try {
						t.requestFullscreen();
					} catch (e) {
						console.debug?.(e);
					}
				} catch (e) {
					console.debug?.(e);
				}
			},
			onClose: () => ne?.(),
			onMode: (e) => {
				try {
					if (e === $.AB_COMPARE && !ft() || e === $.SIDE_BY_SIDE && !ht()) return;
					s.mode = e, _t();
					try {
						L?.syncToolsUIFromState?.();
					} catch (e) {
						console.debug?.(e);
					}
				} catch (e) {
					console.debug?.(e);
				}
			},
			onZoomIn: () => {
				try {
					_((Number(s.zoom) || 1) + .25, {
						clientX: s._lastPointerX,
						clientY: s._lastPointerY
					});
				} catch (e) {
					console.debug?.(e);
				}
			},
			onZoomOut: () => {
				try {
					_((Number(s.zoom) || 1) - .25, {
						clientX: s._lastPointerX,
						clientY: s._lastPointerY
					});
				} catch (e) {
					console.debug?.(e);
				}
			},
			onZoomReset: () => {
				try {
					_(1);
				} catch (e) {
					console.debug?.(e);
				}
			},
			onZoomOneToOne: () => {
				try {
					let e = () => {
						let e = M();
						return e == null ? !1 : (_(Math.abs((Number(s.zoom) || 1) - e) < .01 ? 1 : e, {
							clientX: s._lastPointerX,
							clientY: s._lastPointerY
						}), !0);
					};
					if (e()) return;
					try {
						requestAnimationFrame(() => {
							try {
								N();
							} catch (e) {
								console.debug?.(e);
							}
							try {
								e();
							} catch (e) {
								console.debug?.(e);
							}
						});
					} catch (e) {
						console.debug?.(e);
					}
				} catch (e) {
					console.debug?.(e);
				}
			},
			onCompareModeChanged: () => {
				try {
					s.mode === $.AB_COMPARE && (vt(), Ot());
				} catch (e) {
					console.debug?.(e);
				}
			},
			onExportFrame: () => {
				try {
					ut({ toClipboard: !1 });
				} catch (e) {
					console.debug?.(e);
				}
			},
			onCopyFrame: () => {
				try {
					ut({ toClipboard: !0 });
				} catch (e) {
					console.debug?.(e);
				}
			},
			onAudioVizModeChanged: () => {
				try {
					let e = s.assets[s.currentIndex];
					if (String(e?.kind || "") !== "audio") return;
					te() || (vt(), Ot());
				} catch (e) {
					console.debug?.(e);
				}
			},
			onToolsChanged: () => {
				try {
					L?.syncToolsUIFromState?.();
				} catch (e) {
					console.debug?.(e);
				}
				try {
					Re(s);
				} catch (e) {
					console.debug?.(e);
				}
				try {
					gt();
				} catch (e) {
					console.debug?.(e);
				}
				try {
					if (s.mode === $.AB_COMPARE) {
						let e = String(s.abCompareMode || "wipe");
						e !== "wipe" && e !== "wipeV" && q?._mjrDiffRequest?.();
					}
				} catch (e) {
					console.debug?.(e);
				}
				try {
					s.probeEnabled || (X.style.display = "none");
				} catch (e) {
					console.debug?.(e);
				}
				try {
					s.loupeEnabled || (ve.style.display = "none");
				} catch (e) {
					console.debug?.(e);
				}
				try {
					tt();
				} catch (e) {
					console.debug?.(e);
				}
				try {
					It?.();
				} catch (e) {
					console.debug?.(e);
				}
				try {
					ct();
				} catch (e) {
					console.debug?.(e);
				}
			}
		}), L?.headerEl && (R = L.headerEl), L?.headerTopEl && (W = L.headerTopEl), L?.filenameEl && (z = L.filenameEl), L?.badgesBarEl && (re = L.badgesBarEl), L?.filenameRightEl && (B = L.filenameRightEl), L?.badgesBarRightEl && (ie = L.badgesBarRightEl), L?.leftAreaEl && (H = L.leftAreaEl), L?.leftMetaEl && (se = L.leftMetaEl), L?.centerAreaEl && (le = L.centerAreaEl), L?.rightMetaEl && (V = L.rightMetaEl), L?.rightAreaEl && (oe = L.rightAreaEl), L?.titleLineEl && (U = L.titleLineEl), L?.titleWrapEl && (me = L.titleWrapEl), L?.modeButtonsEl && (he = L.modeButtonsEl);
	} catch (e) {
		console.debug?.(e);
	}
	let { contentRow: ge, content: G, singleView: K, abView: q, sideView: J, overlayLayer: _e, gridCanvas: Y, probeTooltip: X, loupeWrap: ve, loupeCanvas: ye, genInfoOverlay: be, genInfoTitle: xe, genInfoBody: Se, genInfoOverlayLeft: Ce, genInfoTitleLeft: we, genInfoBodyLeft: Te, footer: Ee, prevBtn: De, indexInfo: Z, nextBtn: Oe, navBar: ke, playerBarHost: Ae, filmstrip: je } = Ut({
		state: s,
		buildAssetViewURL: w,
		onNavigate: (e) => {
			try {
				s.compareAsset != null && (s.compareAsset = null, s.mode = $.SINGLE), s.currentIndex = e, _t();
			} catch (e) {
				console.debug?.(e);
			}
		},
		onCompare: (e) => {
			try {
				let t = Array.isArray(s.assets) ? s.assets : [], n = t[e];
				if (!n || n === t[s.currentIndex]) return;
				if (n === s.compareAsset) {
					s.compareAsset = null, s.mode = $.SINGLE, _t();
					return;
				}
				t.length === 2 ? (s.compareAsset = t[1 - s.currentIndex], s.mode = Ne() ? $.SIDE_BY_SIDE : $.AB_COMPARE) : (s.compareAsset = n, s.mode = ht() ? $.SIDE_BY_SIDE : $.AB_COMPARE), _t();
			} catch (e) {
				console.debug?.(e);
			}
		}
	});
	t.appendChild(R), t.appendChild(ge);
	function Me() {
		try {
			if (s.compareAsset) return s.compareAsset;
			let e = Array.isArray(s.assets) ? s.assets : [];
			if (e.length === 2) return e[1 - (s.currentIndex || 0)] || null;
		} catch (e) {
			console.debug?.(e);
		}
		return null;
	}
	function Ne() {
		try {
			let e = s.assets?.[s.currentIndex] || null;
			return (qt?.isModel3DAsset?.(e) ?? !1) || (qt?.isModel3DAsset?.(Me()) ?? !1);
		} catch (e) {
			console.debug?.(e);
		}
		return !1;
	}
	t.appendChild(je.el), t.appendChild(Ee), t.appendChild(be), t.appendChild(Ce), Wt({
		overlay: t,
		requestClose: () => ne()
	});
	let Ie = $e({
		state: s,
		VIEWER_MODES: $,
		APP_CONFIG: x,
		getAssetMetadata: a,
		getAssetsBatch: n
	}), Ve = 300 * 1e3, He = /* @__PURE__ */ new Map(), Ue = () => {
		try {
			let e = Date.now();
			for (let [t, n] of He.entries()) {
				let r = Number(n?.at) || 0;
				(!r || e - r > Ve) && He.delete(t);
			}
			if (He.size <= 256) return;
			let t = Array.from(He.entries()).sort((e, t) => (Number(e?.[1]?.at) || 0) - (Number(t?.[1]?.at) || 0)), n = He.size - 256;
			for (let e = 0; e < n; e += 1) {
				let n = t?.[e]?.[0];
				n != null && He.delete(n);
			}
		} catch (e) {
			console.debug?.(e);
		}
	}, We = (e) => {
		try {
			let t = String(e ?? "");
			if (!t) return null;
			let n = He.get(t);
			if (!n || typeof n != "object") return null;
			let r = Number(n?.at) || 0;
			return !r || Date.now() - r > Ve ? (He.delete(t), null) : n?.data || null;
		} catch {
			return null;
		}
	}, Ge = (e, t) => {
		try {
			let n = String(e ?? "");
			if (!n || !t) return;
			He.set(n, {
				data: t,
				at: Date.now()
			}), Ue();
		} catch (e) {
			console.debug?.(e);
		}
	}, Ke = async () => {
		try {
			await Ie?.hydrateVisibleMetadata?.();
		} catch (e) {
			console.debug?.(e);
		}
	};
	try {
		u = et({
			overlay: t,
			content: G,
			singleView: K,
			abView: q,
			sideView: J,
			state: s,
			VIEWER_MODES: $,
			scheduleOverlayRedraw: tt,
			lifecycle: i
		});
	} catch {
		u = null;
	}
	let Je = (e, t, n) => {
		try {
			e.clearRect(0, 0, t, n);
		} catch (e) {
			console.debug?.(e);
		}
	}, Q = null;
	function tt(e) {
		try {
			if (t.style.display === "none") return;
			if (e === !0) {
				Q != null && (cancelAnimationFrame(Q), Q = null);
				try {
					rt();
				} catch (e) {
					console.debug?.(e);
				}
				return;
			}
			if (Q != null) return;
			Q = requestAnimationFrame(() => {
				Q = null;
				try {
					rt();
				} catch (e) {
					console.debug?.(e);
				}
			});
		} catch (e) {
			console.debug?.(e);
		}
	}
	let nt = Xe({
		gridCanvas: Y,
		content: G,
		state: s,
		VIEWER_MODES: $,
		getPrimaryMedia: () => {
			try {
				if (s?.mode === $.SINGLE) return K?.querySelector?.(".mjr-viewer-media") || null;
				if (s?.mode === $.AB_COMPARE) return q?.querySelector?.(".mjr-viewer-media") || null;
				if (s?.mode === $.SIDE_BY_SIDE) return J?.querySelector?.(".mjr-viewer-media") || null;
			} catch (e) {
				console.debug?.(e);
			}
			return null;
		},
		getViewportRect: j,
		clearCanvas: Je
	}), rt = () => {
		let e = (() => {
			try {
				let e = Number(s?._panHintAt) || 0;
				return e > 0 && Date.now() - e < 900;
			} catch {
				return !1;
			}
		})();
		try {
			let t = s?.mode === $.SINGLE && !!s?.hudEnabled, n = String(s?.scopesMode || "off") !== "off", r = !!s?.overlayMaskEnabled;
			Y.style.display = s.gridMode === 0 && !r && !e && !t && !n ? "none" : "";
		} catch (e) {
			console.debug?.(e);
		}
		let n = nt.ensureCanvasSize();
		if (n.w > 0 && n.h > 0) {
			if ((() => {
				let e = s?.mode === $.SINGLE && !!s?.hudEnabled;
				return (Number(s.gridMode) || 0) !== 0 || !!s?.overlayMaskEnabled || e;
			})()) nt.redrawGrid(n);
			else try {
				let e = Y.getContext("2d");
				e && Je(e, n.w, n.h);
			} catch (e) {
				console.debug?.(e);
			}
			if (e) try {
				let e = Y.getContext("2d");
				if (e) {
					let t = G?.getBoundingClientRect?.(), r = Number(s?._panHintX), i = Number(s?._panHintY), a = t && Number.isFinite(r) ? r - t.left : n.w / 2, o = t && Number.isFinite(i) ? i - t.top : n.h * .78, c = Math.max(10, Math.min(n.w - 10, a)), l = Math.max(10, Math.min(n.h - 10, o));
					e.save(), e.font = "12px var(--comfy-font, ui-sans-serif, system-ui)", e.textAlign = "center", e.textBaseline = "middle";
					let u = "Zoom in to pan", d = e.measureText(u), f = Math.min(n.w - 20, Math.max(140, d.width + 26));
					e.fillStyle = "rgba(0,0,0,0.65)", e.strokeStyle = "rgba(255,255,255,0.18)", e.lineWidth = 1, e.beginPath();
					let p = c - f / 2, m = l - 26 / 2;
					e.moveTo(p + 10, m), e.arcTo(p + f, m, p + f, m + 26, 10), e.arcTo(p + f, m + 26, p, m + 26, 10), e.arcTo(p, m + 26, p, m, 10), e.arcTo(p, m, p + f, m, 10), e.closePath(), e.fill(), e.stroke(), e.fillStyle = "rgba(255,255,255,0.92)", e.fillText(u, c, l), e.restore();
				}
			} catch (e) {
				console.debug?.(e);
			}
			try {
				let e = String(s?.scopesMode || "off");
				if (e !== "off") {
					let r = Y.getContext("2d");
					if (r) {
						let i = K;
						s?.mode === $.AB_COMPARE ? i = q : s?.mode === $.SIDE_BY_SIDE && (i = J);
						let a = i?.querySelector?.("canvas.mjr-viewer-media") || t?.querySelector?.("canvas.mjr-viewer-media");
						a && a instanceof HTMLCanvasElement && Jt?.drawScopesLight?.(r, {
							w: n.w,
							h: n.h
						}, a, {
							mode: e,
							channel: s?.channel
						});
					}
				}
			} catch (e) {
				console.debug?.(e);
			}
			if (s.mode !== $.SINGLE) {
				try {
					X.style.display = "none";
				} catch (e) {
					console.debug?.(e);
				}
				try {
					ve.style.display = "none";
				} catch (e) {
					console.debug?.(e);
				}
			}
		}
	}, it = (e) => {
		if (e) {
			try {
				for (let t of Array.from(e.childNodes || [])) try {
					t?._mjrDispose?.();
				} catch (e) {
					console.debug?.(e);
				}
			} catch (e) {
				console.debug?.(e);
			}
			try {
				e.replaceChildren();
			} catch (e) {
				console.debug?.(e);
			}
		}
	}, at = () => {
		try {
			s._genInfoAbort?.abort?.();
		} catch (e) {
			console.debug?.(e);
		}
		s._genInfoAbort = null;
		try {
			s._genInfoReqId = (Number(s._genInfoReqId) || 0) + 1;
		} catch (e) {
			console.debug?.(e);
		}
	}, ot = async (e, { signal: t } = {}) => {
		try {
			return await Yt?.ensureViewerMetadataAsset?.(e, {
				getAssetMetadata: a,
				getFileMetadataScoped: m,
				metadataCache: Ie,
				signal: t
			});
		} catch {
			return e;
		}
	}, st = (e) => {
		try {
			if (!e || typeof e != "object" || e?.geninfo || e?.prompt || e?.workflow || e?.metadata) return !1;
			if (String(e?.mime || e?.mimetype || e?.type || "").toLowerCase().startsWith("video/")) return !0;
			let t = String(e?.filepath || e?.path || e?.filename || e?.name || "").toLowerCase().split(".").pop() || "";
			return [
				"mp4",
				"webm",
				"mov",
				"mkv",
				"avi",
				"m4v",
				"gif"
			].includes(t), !0;
		} catch {
			return !1;
		}
	}, ct = async () => {
		let e = ft(), n = ht(), r = s.mode, i = !!s?.genInfoOpen && !s?.distractionFree, a = i && (r === $.AB_COMPARE && e || r === $.SIDE_BY_SIDE && n), o = a && r === $.SIDE_BY_SIDE && !s?.compareAsset && (s?.assets?.length ?? 0) > 2;
		try {
			if (be.style.display = i ? "flex" : "none", Ce.style.display = a ? "flex" : "none", t.style.paddingRight = i ? Tt : "0px", t.style.paddingLeft = a ? Tt : "0px", !i) {
				at();
				try {
					it(Se);
				} catch (e) {
					console.debug?.(e);
				}
				try {
					it(Te);
				} catch (e) {
					console.debug?.(e);
				}
				return;
			}
		} catch {
			return;
		}
		at();
		let c = (Number(s?._genInfoReqId) || 0) + 1;
		try {
			s._genInfoReqId = c;
		} catch (e) {
			console.debug?.(e);
		}
		let l = new AbortController();
		s._genInfoAbort = l;
		let u = ({ left: e = null, leftExtra: t = null, right: n = null, rightExtra: r = null, single: i = null } = {}) => {
			try {
				it(Se);
			} catch (e) {
				console.debug?.(e);
			}
			try {
				it(Te);
			} catch (e) {
				console.debug?.(e);
			}
			let c = () => {
				try {
					s?.genInfoOpen || (s.genInfoOpen = !0), ct();
				} catch (e) {
					console.debug?.(e);
				}
			}, l = (e, t, n, r) => {
				if (e) try {
					try {
						let i = Yt?.buildViewerMetadataBlocks?.({
							title: t,
							asset: n,
							ui: {
								loading: !!r,
								onRetry: c
							}
						});
						if (i) {
							e.appendChild(i);
							return;
						}
					} catch (e) {
						console.debug?.(e);
					}
					let i = document.createElement("div");
					if (i.style.cssText = "display:flex; flex-direction:column; gap:10px; margin-bottom: 14px;", t) {
						let e = document.createElement("div");
						e.textContent = t, e.style.cssText = "font-size: 12px; font-weight: 600; letter-spacing: 0.02em; color: rgba(255,255,255,0.86);", i.appendChild(e);
					}
					let a = document.createElement("div");
					a.style.cssText = "padding: 10px 12px; border-radius: 10px; border: 1px solid rgba(255,255,255,0.12); background: rgba(255,255,255,0.06); color: rgba(255,255,255,0.72);", a.textContent = y("viewer.noGenerationDataFile", "No generation data found for this file."), i.appendChild(a);
					try {
						let e = n?.metadata_raw;
						if (e != null) {
							let t = document.createElement("details");
							t.style.cssText = "border: 1px solid rgba(255,255,255,0.10); border-radius: 10px; background: rgba(255,255,255,0.04); overflow: hidden;";
							let n = document.createElement("summary");
							n.textContent = y("msg.rawMetadata", "Raw metadata"), n.style.cssText = "cursor: pointer; padding: 10px 12px; color: rgba(255,255,255,0.78); user-select: none;";
							let r = document.createElement("pre");
							r.style.cssText = "margin:0; padding: 10px 12px; max-height: 280px; overflow:auto; font-size: 11px; line-height: 1.35; color: rgba(255,255,255,0.86);";
							let a = "";
							try {
								a = typeof e == "string" ? e : JSON.stringify(e, null, 2);
							} catch {
								a = String(e);
							}
							a.length > 4e4 && (a = `${a.slice(0, 4e4)}\n...(truncated)...`), r.textContent = a, t.appendChild(n), t.appendChild(r), i.appendChild(t);
						}
					} catch (e) {
						console.debug?.(e);
					}
					e.appendChild(i);
				} catch (e) {
					console.debug?.(e);
				}
			};
			if (a) {
				if (e && (we.textContent = e.title || "Asset A", l(Te, t ? "Asset A" : "", e.asset, e.loading)), t && l(Te, "Asset C", t.asset, t.loading), n && (xe.textContent = n.title || "Asset B", l(Se, r ? "Asset B" : "", n.asset, n.loading)), r && l(Se, "Asset D", r.asset, r.loading), !o && e?.asset && n?.asset && !e.loading && !n.loading) try {
					let t = xt(e.asset, n.asset);
					t && Se.insertBefore(t, Se.firstChild || null);
				} catch (e) {
					console.debug?.(e);
				}
			} else i && (xe.textContent = i.title || "Generation Info", l(Se, "", i.asset, i.loading));
		};
		try {
			let e = s?.assets?.[s?.currentIndex] || null;
			if (!e) {
				u({});
				return;
			}
			let t = null, n = null, i = null, d = null, f = null;
			a ? r === $.SIDE_BY_SIDE ? s?.compareAsset ? (t = e, n = s.compareAsset) : (t = s.assets[0] || null, n = s.assets[1] || null, o && (i = s.assets[2] || null, d = s.assets[3] || null)) : (t = e, n = s?.compareAsset || (s.assets.length === 2 ? s.assets[1 - s.currentIndex] : null)) : f = e;
			let p = (e) => e ? Ie?.getCached?.(e.id)?.data || e : null;
			if (u({
				left: a ? {
					title: o ? "Assets A & C" : "Asset A",
					asset: p(t),
					loading: st(p(t))
				} : null,
				leftExtra: o && i ? {
					asset: p(i),
					loading: st(p(i))
				} : null,
				right: a ? {
					title: o ? "Assets B & D" : "Asset B",
					asset: p(n),
					loading: st(p(n))
				} : null,
				rightExtra: o && d ? {
					asset: p(d),
					loading: st(p(d))
				} : null,
				single: a ? null : {
					title: "Generation Info",
					asset: p(f),
					loading: st(p(f))
				}
			}), s._genInfoReqId !== c) return;
			if (a) {
				let e = t ? await ot(t, { signal: l.signal }) : null, r = n ? await ot(n, { signal: l.signal }) : null, a = i ? await ot(i, { signal: l.signal }) : null, f = d ? await ot(d, { signal: l.signal }) : null;
				if (s._genInfoReqId !== c) return;
				u({
					left: {
						title: o ? "Assets A & C" : "Asset A",
						asset: e,
						loading: !1
					},
					leftExtra: o && a ? {
						asset: a,
						loading: !1
					} : null,
					right: {
						title: o ? "Assets B & D" : "Asset B",
						asset: r,
						loading: !1
					},
					rightExtra: o && f ? {
						asset: f,
						loading: !1
					} : null
				});
			} else {
				let e = f ? await ot(f, { signal: l.signal }) : null;
				if (s._genInfoReqId !== c) return;
				u({ single: {
					title: "Generation Info",
					asset: e,
					loading: !1
				} });
			}
		} catch (e) {
			console.debug?.(e);
		}
	}, lt = null;
	function ut(e) {
		try {
			return !lt && Xt && (lt = Xt.createFrameExporter({
				state: s,
				VIEWER_MODES: $,
				singleView: K,
				abView: q,
				sideView: J
			})), lt?.exportCurrentFrame?.(e);
		} catch (e) {
			console.debug?.(e);
		}
	}
	let dt = () => {
		let e = (e) => {
			try {
				e && e.replaceChildren();
			} catch (e) {
				console.debug?.(e);
			}
		};
		e(re), e(ie);
		let t = (e, { showName: t } = {}) => {
			if (!e) return null;
			let n = document.createElement("div");
			n.className = "mjr-viewer-asset-pill", n.style.cssText = "\n                display: inline-flex;\n                align-items: center;\n                gap: 8px;\n                padding: 2px 8px;\n                border-radius: 999px;\n                border: 1px solid rgba(255,255,255,0.14);\n                background: rgba(255,255,255,0.08);\n                font-size: 12px;\n                max-width: 360px;\n                overflow: hidden;\n            ";
			let r = document.createElement("span");
			r.textContent = String(e.filename || ""), r.style.cssText = "max-width:200px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; opacity:0.95;";
			let i = ee(e.filename, e.kind, !!e?._mjrNameCollision);
			try {
				i.style.position = "static", i.style.top = "", i.style.left = "", i.style.padding = "2px 6px", i.style.fontSize = "10px", i.style.borderRadius = "6px", i.style.pointerEvents = "none";
			} catch (e) {
				console.debug?.(e);
			}
			let a = k(e.rating || 0);
			if (a) try {
				a.style.position = "static", a.style.top = "", a.style.right = "", a.style.padding = "2px 6px", a.style.fontSize = "12px";
			} catch (e) {
				console.debug?.(e);
			}
			let o = A(Array.isArray(e.tags) ? e.tags : []);
			if (o) try {
				o.style.position = "static", o.style.bottom = "", o.style.left = "", o.style.maxWidth = "220px", o.style.pointerEvents = "none";
			} catch (e) {
				console.debug?.(e);
			}
			n.appendChild(i), t && n.appendChild(r), a && n.appendChild(a), o && o.style.display !== "none" && n.appendChild(o);
			try {
				e.filepath && (n.title = String(e.filepath));
			} catch (e) {
				console.debug?.(e);
			}
			return n;
		}, n = s.mode === $.SINGLE, r = s.mode === $.AB_COMPARE && ft(), i = s.mode === $.SIDE_BY_SIDE && ht();
		if ((r || i) && ie) {
			let e = s.assets?.[s.currentIndex] || null, n = i && s.compareAsset != null, a = r ? s.compareAsset == null ? s.assets?.[0] || null : e : n ? e : s.assets?.[0] || null, o = r ? s.compareAsset == null ? s.assets?.[1] || null : s.compareAsset : n ? s.compareAsset : s.assets?.[Math.max(0, (s.assets?.length || 1) - 1)] || null, c = t(a, { showName: !1 }), l = t(o, { showName: !1 });
			try {
				c && re.appendChild(c);
			} catch (e) {
				console.debug?.(e);
			}
			try {
				l && ie.appendChild(l);
			} catch (e) {
				console.debug?.(e);
			}
			return;
		}
		let a = n ? [s.assets[s.currentIndex]].filter(Boolean) : Array.isArray(s.assets) ? s.assets.slice(0, 4) : [];
		for (let e of a) {
			let r = t(e, { showName: !n });
			if (r) try {
				re.appendChild(r);
			} catch (e) {
				console.debug?.(e);
			}
		}
	};
	function ft() {
		return (s.assets.length === 2 || s.compareAsset != null) && !Ne();
	}
	function ht() {
		let e = s.assets.length;
		return e >= 2 && e <= 4 || e >= 1 && s.compareAsset != null;
	}
	function gt() {
		let e = !!s?.distractionFree;
		try {
			R.style.display = e ? "none" : "";
		} catch (e) {
			console.debug?.(e);
		}
		try {
			Ee.style.display = e ? "none" : "";
		} catch (e) {
			console.debug?.(e);
		}
		try {
			t.classList.toggle("mjr-viewer-focus", e);
		} catch (e) {
			console.debug?.(e);
		}
		try {
			e && (t.style.paddingRight = "0px", t.style.paddingLeft = "0px", be.style.display = "none", Ce.style.display = "none");
		} catch (e) {
			console.debug?.(e);
		}
	}
	function _t() {
		s.zoom = 1, s.panX = 0, s.panY = 0, s.targetZoom = 1;
		try {
			s.mode !== $.AB_COMPARE && s.mode !== $.SIDE_BY_SIDE && s.compareAsset != null && (s.compareAsset = null);
		} catch (e) {
			console.debug?.(e);
		}
		let e = s.assets[s.currentIndex], t = s.mode === $.AB_COMPARE && ft(), n = s.mode === $.SIDE_BY_SIDE && ht(), r = t && s.compareAsset != null, i = n && s.compareAsset != null, a = t ? (r ? e : s.assets?.[0]) || null : n ? (i ? e : s.assets?.[0]) || null : e || null, o = t ? (r ? s.compareAsset : s.assets?.[1]) || null : n ? i ? s.compareAsset : Array.isArray(s.assets) && s.assets.length >= 2 ? s.assets[s.assets.length - 1] : null : null;
		try {
			z.textContent = a?.filename || "";
		} catch (e) {
			console.debug?.(e);
		}
		try {
			V && B && o && o !== a ? (V.style.display = "flex", oe && (oe.style.display = "flex"), B.textContent = o?.filename || "", H && se && U && (H.style.display = "flex", se.appendChild(U), U.style.justifyContent = "flex-start"), W && (W.style.justifyContent = "center", W.style.paddingLeft = "84px"), le && (le.style.flex = "0 0 auto"), me && (me.style.flex = "0 0 auto"), z && (z.style.textAlign = "left")) : V && B && (V.style.display = "none", oe && (oe.style.display = "none"), B.textContent = "", H && (H.style.display = "none"), me && U && he && (me.insertBefore(U, he), U.style.justifyContent = "center"), W && (W.style.justifyContent = "center", W.style.paddingLeft = "12px"), le && (le.style.flex = "1 1 auto"), me && (me.style.flex = ""), z && (z.style.textAlign = "center"));
		} catch (e) {
			console.debug?.(e);
		}
		s.mode === $.AB_COMPARE && ft() ? Z.textContent = "2 selected" : s.mode === $.SIDE_BY_SIDE && ht() ? Z.textContent = s.compareAsset == null ? `${s.assets.length} selected` : "2 selected" : Z.textContent = `${s.currentIndex + 1} / ${s.assets.length}`, s.mode === $.AB_COMPARE && !ft() && (s.mode = ht() ? $.SIDE_BY_SIDE : $.SINGLE), s.mode === $.SIDE_BY_SIDE && !ht() && (s.mode = $.SINGLE);
		try {
			L?.syncModeButtons?.({
				canAB: ft,
				canSide: ht
			});
		} catch (e) {
			console.debug?.(e);
		}
		K.style.display = s.mode === $.SINGLE ? "flex" : "none", q.style.display = s.mode === $.AB_COMPARE ? "block" : "none", J.style.display = s.mode === $.SIDE_BY_SIDE ? "flex" : "none";
		try {
			s.mode !== $.SINGLE && (ze(K), K.replaceChildren());
		} catch (e) {
			console.debug?.(e);
		}
		try {
			s.mode !== $.AB_COMPARE && (ze(q), q.replaceChildren());
		} catch (e) {
			console.debug?.(e);
		}
		try {
			s.mode !== $.SIDE_BY_SIDE && (ze(J), J.replaceChildren());
		} catch (e) {
			console.debug?.(e);
		}
		dt();
		let c = s.mode === $.AB_COMPARE && ft() || s.mode === $.SIDE_BY_SIDE && ht();
		try {
			De.style.display = c ? "none" : "", Oe.style.display = c ? "none" : "";
		} catch (e) {
			console.debug?.(e);
		}
		vt(), yt(s.assets, s.currentIndex), Ot();
		try {
			L?.syncToolsUIFromState?.();
		} catch (e) {
			console.debug?.(e);
		}
		try {
			gt();
		} catch (e) {
			console.debug?.(e);
		}
		try {
			It?.();
		} catch (e) {
			console.debug?.(e);
		}
		tt();
		try {
			ct();
		} catch (e) {
			console.debug?.(e);
		}
		try {
			Ke().then(() => {
				try {
					dt();
				} catch (e) {
					console.debug?.(e);
				}
			});
		} catch (e) {
			console.debug?.(e);
		}
		try {
			let e = s.mode === $.SINGLE;
			je.sync({ isSingle: e });
		} catch (e) {
			console.debug?.(e);
		}
	}
	function vt() {
		let e = s.assets[s.currentIndex];
		if (!e) return;
		let t = w(e);
		if (!t) {
			try {
				ze(K);
			} catch (e) {
				console.debug?.(e);
			}
			try {
				K.replaceChildren();
				let e = document.createElement("div");
				e.className = "mjr-viewer-media", e.style.cssText = "color:#ff9a9a; font-size:13px; padding:16px; text-align:center;", e.textContent = "Cannot open asset: missing or invalid filename/path.", K.appendChild(e);
			} catch (e) {
				console.debug?.(e);
			}
			return;
		}
		if (s.mode === $.SINGLE) {
			try {
				ze(K);
			} catch (e) {
				console.debug?.(e);
			}
			K.innerHTML = "", s._mediaW = 0, s._mediaH = 0;
			let n = P(e, t);
			K.appendChild(n);
		} else s.mode === $.AB_COMPARE ? ft() && Gt?.renderABCompareView?.({
			abView: q,
			state: s,
			currentAsset: e,
			viewUrl: t,
			buildAssetViewURL: w,
			createCompareMediaElement: I,
			destroyMediaProcessorsIn: ze
		}) : s.mode === $.SIDE_BY_SIDE && ht() && Kt?.renderSideBySideView?.({
			sideView: J,
			state: s,
			currentAsset: e,
			viewUrl: t,
			buildAssetViewURL: w,
			createMediaElement: P,
			destroyMediaProcessorsIn: ze
		});
		g(), S();
	}
	let { preloadAdjacentAssets: yt, preloadImageForAsset: bt, trackPreloadRef: St } = mt({
		buildAssetViewURL: w,
		IMAGE_PRELOAD_EXTENSIONS: l,
		state: s
	}), { destroyPlayerBar: wt, syncPlayerBar: Et } = Ct({
		state: s,
		APP_CONFIG: x,
		VIEWER_MODES: $,
		overlay: t,
		navBar: ke,
		playerBarHost: Ae,
		singleView: K,
		abView: q,
		sideView: J,
		metadataHydrator: Ie,
		isPlayableViewerKind: ue,
		collectPlayableMediaElements: pe,
		pickPrimaryPlayableMedia: ce,
		mountUnifiedMediaControls: fe,
		installFollowerVideoSync: de,
		getViewerInfo: p,
		scheduleOverlayRedraw: tt,
		viewerInfoCacheGet: We,
		viewerInfoCacheSet: Ge
	}), Ot = () => Et(), kt = x.VIEWER_MAX_PROC_PIXELS ?? 12e6, At = () => ({
		exposureEV: Number(s.exposureEV) || 0,
		gamma: Math.max(.1, Math.min(3, Number(s.gamma) || 1)),
		channel: s.channel || "rgb",
		analysisMode: s.analysisMode || "none",
		zebraThreshold: Math.max(0, Math.min(1, Number(s.zebraThreshold) || .95))
	}), jt = () => {
		let e = At();
		try {
			let n = t.querySelectorAll(".mjr-viewer-media");
			for (let t of n) try {
				let n = t?._mjrProc;
				n?.setParams && n.setParams(e);
			} catch (e) {
				console.debug?.(e);
			}
		} catch (e) {
			console.debug?.(e);
		}
		try {
			s?.mode === $.AB_COMPARE && q?._mjrDiffRequest?.();
		} catch (e) {
			console.debug?.(e);
		}
	}, Mt = (e) => {
		try {
			if (!e) return !0;
			let t = Number(e.exposureEV) || 0, n = Number(e.gamma) || 1, r = String(e.channel || "rgb"), i = String(e.analysisMode || "none");
			return Math.abs(t) < 1e-4 && Math.abs(n - 1) < 1e-4 && r === "rgb" && i === "none";
		} catch {
			return !0;
		}
	}, Nt = x.VIEWER_MAX_PROC_PIXELS_VIDEO ?? 3e6, Pt = x.VIEWER_VIDEO_GRADE_THROTTLE_FPS ?? 15;
	try {
		d = pt({
			overlay: t,
			state: s,
			mediaTransform: f,
			updateMediaNaturalSize: N,
			clampPanToBounds: h,
			applyTransform: g,
			scheduleOverlayRedraw: tt,
			getGradeParams: At,
			isDefaultGrade: Mt,
			tonemap: null,
			maxProcPixels: kt,
			maxProcPixelsVideo: Nt,
			disableWebGL: !!x.VIEWER_DISABLE_WEBGL_VIDEO,
			videoGradeThrottleFps: Pt,
			safeAddListener: F,
			safeCall: O
		});
	} catch {
		d = null;
	}
	o.push(F(De, "click", () => {
		s.currentIndex > 0 && (s.currentIndex--, _t());
	})), o.push(F(Oe, "click", () => {
		s.currentIndex < s.assets.length - 1 && (s.currentIndex++, _t());
	}));
	let Ft = null, It = () => {
		try {
			if (Ft != null) return;
			Ft = requestAnimationFrame(() => {
				Ft = null;
				try {
					jt();
				} catch (e) {
					console.debug?.(e);
				}
			});
		} catch (e) {
			console.debug?.(e);
		}
	}, Lt = () => {
		try {
			L?.syncToolsUIFromState?.();
		} catch (e) {
			console.debug?.(e);
		}
	}, Rt = (e) => {
		if (!Array.isArray(s.assets) || s.assets.length === 0) return !1;
		let t = s.currentIndex + e;
		return t < 0 || t >= s.assets.length ? !1 : (s.currentIndex = t, _t(), !0);
	}, zt = (e) => {
		if (t.style.display === "none") return;
		try {
			let t = e.target;
			if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.tagName === "SELECT" || t.isContentEditable)) return;
		} catch (e) {
			console.debug?.(e);
		}
		try {
			if (!G.contains(e.target)) return;
		} catch (e) {
			console.debug?.(e);
		}
		try {
			if (qt?.isModel3DInteractionTarget?.(e?.target)) return;
		} catch (e) {
			console.debug?.(e);
		}
		try {
			e.preventDefault(), e.stopPropagation(), e.stopImmediatePropagation?.();
		} catch (e) {
			console.debug?.(e);
		}
		let n = Number(e.deltaX) || 0, r = Number(e.deltaY) || 0;
		if (e.shiftKey && r && Rt(r > 0 ? 1 : -1) || Math.abs(n) > Math.abs(r) && Math.abs(n) > 30 && Rt(n > 0 ? 1 : -1) || !r) return;
		let i = Math.exp(-r * .0015);
		_((Number(s.zoom) || 1) * i, {
			clientX: e.clientX,
			clientY: e.clientY
		});
	}, Bt = (e, t, n, { offsetX: r = 16, offsetY: i = 16 } = {}) => {
		try {
			let a = j();
			if (!a) return;
			let o = G.getBoundingClientRect(), s = (Number(t) || 0) - o.left, c = (Number(n) || 0) - o.top, l = Number(e.offsetWidth) || 0, u = Number(e.offsetHeight) || 0, d = s + r, f = c + i;
			d = Math.max(10, Math.min(d, a.width - l - 10)), f = Math.max(10, Math.min(f, a.height - u - 10)), e.style.left = `${Math.round(d)}px`, e.style.top = `${Math.round(f)}px`;
		} catch (e) {
			console.debug?.(e);
		}
	}, Vt = Ze({
		overlay: t,
		content: G,
		state: s,
		VIEWER_MODES: $,
		getPrimaryMedia: C,
		getMediaNaturalSize: D,
		getViewportRect: j,
		positionOverlayBox: Bt,
		probeTooltip: X,
		loupeWrap: ve,
		onLoupeRedraw: Qe({
			state: s,
			loupeCanvas: ye,
			loupeWrap: ve,
			getMediaNaturalSize: D,
			positionOverlayBox: Bt
		}).redraw,
		lifecycle: i
	});
	try {
		if (!G._mjrOverlayResizeBound && "ResizeObserver" in window) {
			try {
				t._mjrResizeObserver?.disconnect?.();
			} catch (e) {
				console.debug?.(e);
			}
			let e = new ResizeObserver(() => {
				try {
					s._viewportCache = null;
				} catch (e) {
					console.debug?.(e);
				}
				tt();
			});
			try {
				e.observe(G);
			} catch (e) {
				console.debug?.(e);
			}
			t._mjrResizeObserver = e, o.push(() => {
				try {
					e.disconnect();
				} catch (e) {
					console.debug?.(e);
				}
			}), G._mjrOverlayResizeBound = !0;
		}
	} catch (e) {
		console.debug?.(e);
	}
	let Qt = Ye({
		overlay: t,
		content: G,
		singleView: K,
		state: s,
		VIEWER_MODES: $,
		computeOneToOneZoom: M,
		setZoom: _,
		scheduleOverlayRedraw: tt,
		scheduleApplyGrade: It,
		syncToolsUIFromState: Lt,
		applyDistractionFreeUI: gt,
		navigateViewerAssets: Rt,
		closeViewer: nn,
		renderBadges: dt,
		updateAssetRating: e,
		safeDispatchCustomEvent: E,
		ASSET_RATING_CHANGED_EVENT: T,
		probeTooltip: X,
		loupeWrap: ve,
		renderGenInfoPanel: ct,
		getVideoControls: () => {
			try {
				return s?._videoControlsMounted || null;
			} catch {
				return null;
			}
		},
		lifecycle: i
	}), $t = [], en = () => {
		try {
			for (let e of $t) O(e);
		} catch (e) {
			console.debug?.(e);
		}
		$t = [];
		try {
			Qt?.unbind?.();
		} catch (e) {
			console.debug?.(e);
		}
	}, tn = () => {
		en();
		try {
			$t.push(F(t, "click", (e) => {
				try {
					if (e.target !== t) return;
				} catch (e) {
					console.debug?.(e);
				}
				nn();
			}));
		} catch (e) {
			console.debug?.(e);
		}
		try {
			$t.push(F(G, "wheel", zt, {
				passive: !1,
				capture: !0
			}));
		} catch (e) {
			console.debug?.(e);
		}
		try {
			let e = null;
			$t.push(F(G, "touchstart", (t) => {
				try {
					if (t.touches?.length !== 1) return;
					let n = t.touches[0];
					e = {
						x: n.clientX,
						y: n.clientY,
						t: Date.now()
					};
				} catch (e) {
					console.debug?.(e);
				}
			}, { passive: !0 })), $t.push(F(G, "touchend", (t) => {
				try {
					if (!e) return;
					if (t.changedTouches?.length !== 1) {
						e = null;
						return;
					}
					let n = t.changedTouches[0], r = n.clientX - e.x, i = n.clientY - e.y, a = Date.now() - e.t;
					if (e = null, a > 600 || Math.abs(i) > 80) return;
					Math.abs(r) >= 60 && Rt(r < 0 ? 1 : -1);
				} catch (e) {
					console.debug?.(e);
				}
			}, { passive: !0 })), $t.push(F(G, "touchcancel", () => {
				e = null;
			}, { passive: !0 }));
		} catch (e) {
			console.debug?.(e);
		}
		try {
			$t.push(F(G, "mousemove", (e) => {
				try {
					s._lastPointerX = e.clientX, s._lastPointerY = e.clientY;
				} catch (e) {
					console.debug?.(e);
				}
			}, {
				passive: !0,
				capture: !0
			}));
		} catch (e) {
			console.debug?.(e);
		}
		try {
			Qt?.bind?.();
		} catch (e) {
			console.debug?.(e);
		}
	};
	try {
		t._mjrBadgeSyncBound ||= (o.push(F(window, T, (e) => {
			try {
				let t = e?.detail?.assetId, n = e?.detail?.rating;
				if (t == null) return;
				for (let e of s.assets || []) e?.id != null && String(e.id) === String(t) && (e.rating = n);
				try {
					Ie?.deleteCached?.(t);
				} catch (e) {
					console.debug?.(e);
				}
				dt();
			} catch (e) {
				console.debug?.(e);
			}
		}, { passive: !0 })), o.push(F(window, b, (e) => {
			try {
				let t = e?.detail?.assetId, n = e?.detail?.tags;
				if (t == null) return;
				for (let e of s.assets || []) e?.id != null && String(e.id) === String(t) && (e.tags = n);
				try {
					Ie?.deleteCached?.(t);
				} catch (e) {
					console.debug?.(e);
				}
				dt();
			} catch (e) {
				console.debug?.(e);
			}
		}, { passive: !0 })), !0);
	} catch (e) {
		console.debug?.(e);
	}
	function nn() {
		try {
			let e = s.assets?.[s.currentIndex];
			e?.id && E(v, { assetId: String(e.id) }, { warnPrefix: "[ViewerRuntime]" });
		} catch (e) {
			console.debug?.(e);
		}
		try {
			s.distractionFree = !1, gt();
		} catch (e) {
			console.debug?.(e);
		}
		try {
			Ie?.abort?.();
		} catch (e) {
			console.debug?.(e);
		}
		try {
			wt();
		} catch (e) {
			console.debug?.(e);
		}
		try {
			s._scopesVideoAbort?.abort?.();
		} catch (e) {
			console.debug?.(e);
		}
		s._scopesVideoAbort = null;
		try {
			s._panHintTimer && clearTimeout(s._panHintTimer);
		} catch (e) {
			console.debug?.(e);
		}
		s._panHintTimer = null;
		try {
			s._panHintAt = 0;
		} catch (e) {
			console.debug?.(e);
		}
		try {
			q?._mjrSyncAbort?.abort?.();
		} catch (e) {
			console.debug?.(e);
		}
		try {
			q?._mjrDiffAbort?.abort?.();
		} catch (e) {
			console.debug?.(e);
		}
		try {
			q._mjrSyncAbort = null;
		} catch (e) {
			console.debug?.(e);
		}
		try {
			q._mjrDiffAbort = null;
		} catch (e) {
			console.debug?.(e);
		}
		try {
			J?._mjrSyncAbort?.abort?.();
		} catch (e) {
			console.debug?.(e);
		}
		try {
			J._mjrSyncAbort = null;
		} catch (e) {
			console.debug?.(e);
		}
		try {
			q?._mjrSliderAbort?.abort?.();
		} catch (e) {
			console.debug?.(e);
		}
		try {
			q._mjrSliderAbort = null;
		} catch (e) {
			console.debug?.(e);
		}
		try {
			let e = t.querySelectorAll?.("video, audio");
			if (e && e.length) for (let t of e) {
				try {
					t.muted = !0;
				} catch (e) {
					console.debug?.(e);
				}
				try {
					t.pause?.();
				} catch (e) {
					console.debug?.(e);
				}
				try {
					t.currentTime = 0;
				} catch (e) {
					console.debug?.(e);
				}
				try {
					let e = t.querySelectorAll?.("source");
					if (e && e.length) for (let t of e) try {
						t.remove();
					} catch (e) {
						console.debug?.(e);
					}
				} catch (e) {
					console.debug?.(e);
				}
				try {
					t.removeAttribute?.("src");
				} catch (e) {
					console.debug?.(e);
				}
				try {
					t.load?.();
				} catch (e) {
					console.debug?.(e);
				}
			}
		} catch (e) {
			console.debug?.(e);
		}
		try {
			ze(K), K.replaceChildren();
		} catch (e) {
			console.debug?.(e);
		}
		try {
			ze(q), q.replaceChildren();
		} catch (e) {
			console.debug?.(e);
		}
		try {
			ze(J), J.replaceChildren();
		} catch (e) {
			console.debug?.(e);
		}
		try {
			s.genInfoOpen = !1;
		} catch (e) {
			console.debug?.(e);
		}
		try {
			at();
		} catch (e) {
			console.debug?.(e);
		}
		try {
			be.style.display = "none", it(Se);
		} catch (e) {
			console.debug?.(e);
		}
		try {
			Ce.style.display = "none", it(Te);
		} catch (e) {
			console.debug?.(e);
		}
		t.style.display = "none", t.style.pointerEvents = "none", en();
		try {
			document.body.style.overflow = s._prevBodyOverflow ?? "";
		} catch {
			document.body.style.overflow = "";
		}
		try {
			s._prevFocusedElement && typeof s._prevFocusedElement.focus == "function" && s._prevFocusedElement.focus(), s._prevFocusedElement = null;
		} catch (e) {
			console.debug?.(e);
		}
		let e = s?._prevHotkeyScope;
		r(e || "panel"), s._prevHotkeyScope = null;
	}
	let rn = {
		open(e, n = 0, i = null) {
			tn(), s.assets = Array.isArray(e) ? e : [e], s.currentIndex = Math.max(0, Math.min(n, s.assets.length - 1)), s.distractionFree = !1;
			try {
				je.rebuild();
			} catch (e) {
				console.debug?.(e);
			}
			s.zoom = 1, s.panX = 0, s.panY = 0, s.targetZoom = 1, s._userInteracted = !1, s._panHintAt = 0;
			try {
				s._panHintTimer && clearTimeout(s._panHintTimer);
			} catch (e) {
				console.debug?.(e);
			}
			s._panHintTimer = null, s._lastPointerX = null, s._lastPointerY = null, s._mediaW = 0, s._mediaH = 0, s.compareAsset = i, s.gridMode = 0, at(), s._probe = null;
			try {
				X.style.display = "none";
			} catch (e) {
				console.debug?.(e);
			}
			try {
				ve.style.display = "none";
			} catch (e) {
				console.debug?.(e);
			}
			t.style.display = "flex", t.style.pointerEvents = "auto";
			try {
				s._prevFocusedElement = document.activeElement;
			} catch {
				s._prevFocusedElement = null;
			}
			t.focus();
			try {
				s._prevBodyOverflow = document.body.style.overflow;
			} catch {
				s._prevBodyOverflow = "";
			}
			document.body.style.overflow = "hidden", s._prevHotkeyScope = c().scope || null, r("viewer"), _t();
			try {
				Lt();
			} catch (e) {
				console.debug?.(e);
			}
			try {
				It();
			} catch (e) {
				console.debug?.(e);
			}
			tt();
		},
		close() {
			nn();
		},
		setMode(e) {
			Object.values($).includes(e) && (s.mode = e, _t());
		},
		setCompareAsset(e) {
			s.compareAsset = e, _t();
		},
		dispose() {
			try {
				nn();
			} catch (e) {
				console.debug?.(e);
			}
			try {
				He.clear();
			} catch (e) {
				console.debug?.(e);
			}
			try {
				ze(K);
			} catch (e) {
				console.debug?.(e);
			}
			try {
				ze(q);
			} catch (e) {
				console.debug?.(e);
			}
			try {
				ze(J);
			} catch (e) {
				console.debug?.(e);
			}
			try {
				Q != null && cancelAnimationFrame(Q);
			} catch (e) {
				console.debug?.(e);
			}
			try {
				Ft != null && cancelAnimationFrame(Ft);
			} catch (e) {
				console.debug?.(e);
			}
			try {
				Vt?.dispose?.();
			} catch (e) {
				console.debug?.(e);
			}
			try {
				Qt?.dispose?.();
			} catch (e) {
				console.debug?.(e);
			}
			try {
				t._mjrResizeObserver?.disconnect?.();
			} catch (e) {
				console.debug?.(e);
			}
			try {
				t._mjrResizeObserver = null;
			} catch (e) {
				console.debug?.(e);
			}
			try {
				Ie?.dispose?.();
			} catch (e) {
				console.debug?.(e);
			}
			try {
				Fe(t);
			} catch (e) {
				console.debug?.(e);
			}
			try {
				for (let e of t._mjrViewerUnsubs || []) O(e);
			} catch (e) {
				console.debug?.(e);
			}
			try {
				t._mjrViewerUnsubs = [];
			} catch (e) {
				console.debug?.(e);
			}
			try {
				s._preloadRefs?.clear?.();
			} catch (e) {
				console.debug?.(e);
			}
			try {
				s._preloadedAssetKeys?.clear?.();
			} catch (e) {
				console.debug?.(e);
			}
			try {
				t.remove?.();
			} catch (e) {
				console.debug?.(e);
			}
		}
	};
	try {
		ne = () => rn.close();
	} catch (e) {
		console.debug?.(e);
	}
	t._mjrViewerAPI = rn;
	try {
		Pe({
			overlayEl: t,
			getCurrentAsset: () => s.assets[s.currentIndex],
			getCurrentViewUrl: (e) => w(e),
			onAssetChanged: () => {
				try {
					dt();
				} catch (e) {
					console.debug?.(e);
				}
			}
		});
	} catch (e) {
		console.debug?.(e);
	}
	return t;
}
function $t() {
	return St(Qt);
}
//#endregion
export { _e as a, W as c, ye as i, q as n, ve as o, Se as r, J as s, $t as t };
