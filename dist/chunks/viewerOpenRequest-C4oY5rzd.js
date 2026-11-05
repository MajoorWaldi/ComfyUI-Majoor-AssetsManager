import { t as e } from "./rolldown-runtime-Dy4uBu1J.js";
import { r as t } from "./events-CKNQKBLk.js";
//#region ui/features/viewer/viewerOpenRequest.ts
var n = /* @__PURE__ */ e({ requestViewerOpen: () => a });
function r(e) {
	let t = String(e || "").trim().toLowerCase();
	return t === "ab" || t === "sidebyside" ? t : "";
}
function i(e, t) {
	let n = Array.isArray(e) ? e.filter(Boolean) : [];
	return n.length ? n : t ? [t] : [];
}
function a({ assets: e = [], asset: n = null, index: a = 0, mode: o = "" } = {}) {
	let s = i(e, n);
	if (!s.length) return !1;
	let c = {
		assets: s,
		index: Math.max(0, Math.min(Number(a) || 0, s.length - 1)),
		mode: r(o),
		handled: !1
	};
	try {
		window.dispatchEvent(new CustomEvent(t.OPEN_VIEWER, { detail: c }));
	} catch (e) {
		console.debug?.(e);
	}
	return c.handled === !0;
}
//#endregion
export { n, a as t };
