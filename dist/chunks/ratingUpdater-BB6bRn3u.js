import { M as e, Wt as t, d as n } from "./viewerRuntimeHosts-D9mwOMoh.js";
import { m as r, o as i, yt as a } from "./events-DE87d50y.js";
import { O as o } from "./mediaFps-CPzBm2U7.js";
import { tt as s } from "./mjr-primevue-BABDj8Il.js";
//#region ui/utils/filenames.ts
var c = new Set([
	"CON",
	"PRN",
	"AUX",
	"NUL",
	"COM1",
	"COM2",
	"COM3",
	"COM4",
	"COM5",
	"COM6",
	"COM7",
	"COM8",
	"COM9",
	"LPT1",
	"LPT2",
	"LPT3",
	"LPT4",
	"LPT5",
	"LPT6",
	"LPT7",
	"LPT8",
	"LPT9"
]), l = 255;
function u(e) {
	try {
		let t = String(e ?? "").trim();
		if (!t) return {
			valid: !1,
			reason: "Filename cannot be empty"
		};
		if (t.length > l) return {
			valid: !1,
			reason: `Filename is too long (max ${l} characters)`
		};
		if (t.includes("/") || t.includes("\\")) return {
			valid: !1,
			reason: "Filename cannot contain path separators"
		};
		if (t.includes("\0")) return {
			valid: !1,
			reason: "Filename cannot contain null bytes"
		};
		for (let e of t) if (e.charCodeAt(0) < 32) return {
			valid: !1,
			reason: "Filename cannot contain control characters"
		};
		if (t.startsWith(".") || t.startsWith(" ")) return {
			valid: !1,
			reason: "Filename cannot start with a dot or space"
		};
		if (t.endsWith(".") || t.endsWith(" ")) return {
			valid: !1,
			reason: "Filename cannot end with a dot or space"
		};
		let n = t.split(".")[0].toUpperCase();
		return c.has(n) ? {
			valid: !1,
			reason: "Filename uses a reserved Windows name"
		} : {
			valid: !0,
			reason: ""
		};
	} catch (e) {
		return {
			valid: !1,
			reason: String(e || "Invalid filename")
		};
	}
}
function d(e) {
	try {
		return String(e ?? "").trim();
	} catch {
		return "";
	}
}
function f(e) {
	let t = d(e);
	if (!t) return {
		stem: "",
		ext: ""
	};
	let n = t.lastIndexOf(".");
	return n <= 0 || n === t.length - 1 ? {
		stem: t,
		ext: ""
	} : {
		stem: t.slice(0, n),
		ext: t.slice(n)
	};
}
function p(e, t) {
	let n = d(e);
	if (!n) return "";
	let r = f(t);
	return !f(n).ext && r.ext ? `${n}${r.ext}` : n;
}
//#endregion
//#region ui/utils/deleteGuard.ts
async function m(e, t) {
	return i.DELETE_CONFIRMATION ? !!await o(e > 1 ? r("dialog.deleteSelectedFiles", "Delete {count} selected files?", { count: e }) : r("dialog.deleteSingleFile", "Delete \"{label}\"?", { label: String(t || r("label.thisFile", "this file")) }), r("dialog.confirmDeleteTitle", "Majoor: Confirm delete")) : !0;
}
//#endregion
//#region ui/features/collections/contextmenu/addToCollectionMenuState.ts
var h = s({
	open: !1,
	x: 0,
	y: 0,
	assets: []
});
function g() {
	try {
		window.dispatchEvent(new CustomEvent("mjr-close-all-menus"));
	} catch (e) {
		console.debug?.(e);
	}
}
function _({ x: e = 0, y: t = 0, assets: n = [] } = {}) {
	g(), h.open = Array.isArray(n) && n.length > 0, h.x = Number(e) || 0, h.y = Number(t) || 0, h.assets = Array.isArray(n) ? [...n] : [];
}
function v() {
	h.open = !1, h.x = 0, h.y = 0, h.assets = [];
}
//#endregion
//#region ui/features/collections/contextmenu/addToCollectionMenu.ts
function y(e) {
	if (!e || typeof e != "object") return null;
	let t = e.filepath || e.path || e?.file_info?.filepath || "";
	return t ? {
		filepath: t,
		filename: e.filename || "",
		subfolder: e.subfolder || "",
		type: (e.type || "output").toLowerCase(),
		root_id: a(e),
		kind: e.kind || ""
	} : null;
}
async function b({ x: e, y: n, assets: i }) {
	let a = Array.isArray(i) ? i.map(y).filter(Boolean) : [];
	if (!a.length) {
		t(r("toast.noValidAssetsSelected", "No valid assets selected."), "warning");
		return;
	}
	_({
		x: Number(e) || 0,
		y: Number(n) || 0,
		assets: a
	});
}
//#endregion
//#region ui/features/contextmenu/ratingUpdater.ts
var x = 350, S = /* @__PURE__ */ new Map();
function C(e) {
	let t = S.get(e);
	if (t) {
		try {
			clearTimeout(t.timer);
		} catch (e) {
			console.debug?.(e);
		}
		try {
			t.controller?.abort?.();
		} catch (e) {
			console.debug?.(e);
		}
		S.delete(e);
	}
}
function w(e) {
	e && C(String(e));
}
function T() {
	for (let e of Array.from(S.keys())) w(e);
}
function E(r, i, { onSuccess: a, onFailure: o, successMessage: s = null, errorMessage: c = null, warnPrefix: l = "[RatingUpdater]" } = {}) {
	if (!r) return;
	w(r);
	let u = new AbortController(), d = setTimeout(async () => {
		S.delete(String(r));
		try {
			let n = await e(r, i, { signal: u.signal });
			if (!n?.ok) {
				t(n?.error || c || "Failed to update rating", "error"), o?.(n);
				return;
			}
			s && t(s, "success", 1500), a?.(n);
		} catch (e) {
			n(e, l, { showToast: !0 }), o?.(e);
		}
	}, x);
	S.set(String(r), {
		timer: d,
		controller: u
	});
}
//#endregion
export { v as a, u as c, h as i, E as n, m as o, b as r, p as s, T as t };
