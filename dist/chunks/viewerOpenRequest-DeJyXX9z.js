import { t as e } from "./rolldown-runtime-Dy4uBu1J.js";
import { r as t } from "./events-CwzwyUFJ.js";
import { t as n } from "./Viewer--Cuhs0TQ.js";
//#region ui/features/viewer/viewerOpenRequest.ts
var r = /* @__PURE__ */ e({ requestViewerOpen: () => o });
function i(e) {
	let t = String(e || "").trim().toLowerCase();
	return t === "ab" || t === "sidebyside" ? t : "";
}
function a(e, t) {
	let n = Array.isArray(e) ? e.filter(Boolean) : [];
	return n.length ? n : t ? [t] : [];
}
function o({ assets: e = [], asset: r = null, index: o = 0, mode: s = "" } = {}) {
	let c = a(e, r);
	if (!c.length) return !1;
	let l = Math.max(0, Math.min(Number(o) || 0, c.length - 1)), u = i(s), d = {
		assets: c,
		index: l,
		mode: u,
		handled: !1
	};
	try {
		if (window.dispatchEvent(new CustomEvent(t.OPEN_VIEWER, { detail: d })), d.handled === !0) return !0;
	} catch (e) {
		console.debug?.(e);
	}
	try {
		let e = n();
		return e.open(c, l), u && e.setMode?.(u), !0;
	} catch (e) {
		console.debug?.(e);
	}
	return !1;
}
//#endregion
export { r as n, o as t };
