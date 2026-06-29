import { r as e } from "./events-BpkKbGZs.js";
import { t } from "./Viewer-BG31OAT8.js";
//#region ui/features/viewer/viewerOpenRequest.ts
function n(e) {
	let t = String(e || "").trim().toLowerCase();
	return t === "ab" || t === "sidebyside" ? t : "";
}
function r(e, t) {
	let n = Array.isArray(e) ? e.filter(Boolean) : [];
	return n.length ? n : t ? [t] : [];
}
function i({ assets: i = [], asset: a = null, index: o = 0, mode: s = "" } = {}) {
	let c = r(i, a);
	if (!c.length) return !1;
	let l = Math.max(0, Math.min(Number(o) || 0, c.length - 1)), u = n(s), d = {
		assets: c,
		index: l,
		mode: u,
		handled: !1
	};
	try {
		if (window.dispatchEvent(new CustomEvent(e.OPEN_VIEWER, { detail: d })), d.handled === !0) return !0;
	} catch (e) {
		console.debug?.(e);
	}
	try {
		let e = t();
		return e.open(c, l), u && e.setMode?.(u), !0;
	} catch (e) {
		console.debug?.(e);
	}
	return !1;
}
//#endregion
export { i as requestViewerOpen };
