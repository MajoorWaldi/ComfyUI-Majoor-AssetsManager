import { $ as e, C as t, H as n, J as r, K as i, M as a, N as o, Q as s, X as c, Y as l, Z as u, j as d, nt as f, q as p, rt as m } from "./mjr-primevue-CJ2E0Gsv.js";
//#region node_modules/pinia/dist/pinia.mjs
var h = typeof window < "u", g, _ = (e) => g = e, v = () => d() && a(y) || g, y = Symbol();
function b(e) {
	return e && typeof e == "object" && Object.prototype.toString.call(e) === "[object Object]" && typeof e.toJSON != "function";
}
var x;
(function(e) {
	e.direct = "direct", e.patchObject = "patch object", e.patchFunction = "patch function";
})(x ||= {});
var S = typeof window == "object" && window.window === window ? window : typeof self == "object" && self.self === self ? self : typeof global == "object" && global.global === global ? global : typeof globalThis == "object" ? globalThis : { HTMLElement: null };
function C(e, { autoBom: t = !1 } = {}) {
	return t && /^\s*(?:text\/\S*|application\/xml|\S*\/\S*\+xml)\s*;.*charset\s*=\s*utf-8/i.test(e.type) ? new Blob(["﻿", e], { type: e.type }) : e;
}
function w(e, t, n) {
	let r = new XMLHttpRequest();
	r.open("GET", e), r.responseType = "blob", r.onload = function() {
		k(r.response, t, n);
	}, r.onerror = function() {
		console.error("could not download file");
	}, r.send();
}
function T(e) {
	let t = new XMLHttpRequest();
	t.open("HEAD", e, !1);
	try {
		t.send();
	} catch {}
	return t.status >= 200 && t.status <= 299;
}
function E(e) {
	try {
		e.dispatchEvent(new MouseEvent("click"));
	} catch {
		let t = new MouseEvent("click", {
			bubbles: !0,
			cancelable: !0,
			view: window,
			detail: 0,
			screenX: 80,
			screenY: 20,
			clientX: 80,
			clientY: 20,
			ctrlKey: !1,
			altKey: !1,
			shiftKey: !1,
			metaKey: !1,
			button: 0,
			relatedTarget: null
		});
		e.dispatchEvent(t);
	}
}
var D = typeof navigator == "object" ? navigator : { userAgent: "" }, O = /Macintosh/.test(D.userAgent) && /AppleWebKit/.test(D.userAgent) && !/Safari/.test(D.userAgent), k = h ? typeof HTMLAnchorElement < "u" && "download" in HTMLAnchorElement.prototype && !O ? A : "msSaveOrOpenBlob" in D ? j : M : () => {};
function A(e, t = "download", n) {
	let r = document.createElement("a");
	r.download = t, r.rel = "noopener", typeof e == "string" ? (r.href = e, r.origin === location.origin ? E(r) : T(r.href) ? w(e, t, n) : (r.target = "_blank", E(r))) : (r.href = URL.createObjectURL(e), setTimeout(function() {
		URL.revokeObjectURL(r.href);
	}, 4e4), setTimeout(function() {
		E(r);
	}, 0));
}
function j(e, t = "download", n) {
	if (typeof e == "string") if (T(e)) w(e, t, n);
	else {
		let t = document.createElement("a");
		t.href = e, t.target = "_blank", setTimeout(function() {
			E(t);
		});
	}
	else navigator.msSaveOrOpenBlob(C(e, n), t);
}
function M(e, t, n, r) {
	if (r ||= open("", "_blank"), r && (r.document.title = r.document.body.innerText = "downloading..."), typeof e == "string") return w(e, t, n);
	let i = e.type === "application/octet-stream", a = /constructor/i.test(String(S.HTMLElement)) || "safari" in S, o = /CriOS\/[\d]+/.test(navigator.userAgent);
	if ((o || i && a || O) && typeof FileReader < "u") {
		let t = new FileReader();
		t.onloadend = function() {
			let e = t.result;
			if (typeof e != "string") throw r = null, Error("Wrong reader.result type");
			e = o ? e : e.replace(/^data:[^;]*;/, "data:attachment/file;"), r ? r.location.href = e : location.assign(e), r = null;
		}, t.readAsDataURL(e);
	} else {
		let t = URL.createObjectURL(e);
		r ? r.location.assign(t) : location.href = t, r = null, setTimeout(function() {
			URL.revokeObjectURL(t);
		}, 4e4);
	}
}
var { assign: N } = Object;
function P() {
	let t = i(!0), n = t.run(() => e({})), r = [], a = [], o = c({
		install(e) {
			_(o), o._a = e, e.provide(y, o), e.config.globalProperties.$pinia = o, a.forEach((e) => r.push(e)), a = [];
		},
		use(e) {
			return this._a ? r.push(e) : a.push(e), this;
		},
		_p: r,
		_a: null,
		_e: t,
		_s: /* @__PURE__ */ new Map(),
		state: n
	});
	return o;
}
var F = () => {};
function I(e, t, n, r = F) {
	e.add(t);
	let i = () => {
		e.delete(t) && r();
	};
	return !n && p() && u(i), i;
}
function L(e, ...t) {
	e.forEach((e) => {
		e(...t);
	});
}
var R = (e) => e(), z = Symbol(), B = Symbol();
function V(e, t) {
	e instanceof Map && t instanceof Map ? t.forEach((t, n) => e.set(n, t)) : e instanceof Set && t instanceof Set && t.forEach(e.add, e);
	for (let n in t) {
		if (!t.hasOwnProperty(n)) continue;
		if (n === "__proto__" || n === "constructor" || n === "prototype") continue;
		let i = t[n], a = e[n];
		b(a) && b(i) && e.hasOwnProperty(n) && !l(i) && !r(i) ? e[n] = V(a, i) : e[n] = i;
	}
	return e;
}
var H = Symbol();
function U(e) {
	return !b(e) || !Object.prototype.hasOwnProperty.call(e, H);
}
var { assign: W } = Object;
function G(e) {
	return !!(l(e) && e.effect);
}
function K(e, n, r, i) {
	let { state: a, actions: o, getters: s } = n, l = r.state.value[e], u;
	function d() {
		return l || (r.state.value[e] = a ? a() : {}), W(m(r.state.value[e]), o, Object.keys(s || {}).reduce((n, i) => (n[i] = c(t(() => {
			_(r);
			let t = r._s.get(e);
			return s[i].call(t, t);
		})), n), {}));
	}
	return u = q(e, d, n, r, i, !0), u;
}
function q(t, a, c = {}, u, d, p) {
	let m, h = W({ actions: {} }, c), g = { deep: !0 }, v, y, b = /* @__PURE__ */ new Set(), S = /* @__PURE__ */ new Set(), C = u.state.value[t];
	!p && !C && (u.state.value[t] = {}), e({});
	let w;
	function T(e) {
		let n;
		v = y = !1, typeof e == "function" ? (e(u.state.value[t]), n = {
			type: x.patchFunction,
			storeId: t,
			events: void 0
		}) : (V(u.state.value[t], e), n = {
			type: x.patchObject,
			payload: e,
			storeId: t,
			events: void 0
		});
		let r = w = Symbol();
		o().then(() => {
			w === r && (v = !0);
		}), y = !0, L(b, n, u.state.value[t]);
	}
	let E = p ? function() {
		let { state: e } = c, t = e ? e() : {};
		this.$patch((e) => {
			W(e, t);
		});
	} : F;
	function D() {
		m.stop(), b.clear(), S.clear(), u._s.delete(t);
	}
	let O = (e, n = "") => {
		if (z in e) return e[B] = n, e;
		let r = function() {
			_(u);
			let n = Array.from(arguments), i = /* @__PURE__ */ new Set(), a = /* @__PURE__ */ new Set();
			function o(e) {
				i.add(e);
			}
			function s(e) {
				a.add(e);
			}
			L(S, {
				args: n,
				name: r[B],
				store: k,
				after: o,
				onError: s
			});
			let c;
			try {
				c = e.apply(this && this.$id === t ? this : k, n);
			} catch (e) {
				throw L(a, e), e;
			}
			return c instanceof Promise ? c.then((e) => (L(i, e), e)).catch((e) => (L(a, e), Promise.reject(e))) : (L(i, c), c);
		};
		return r[z] = !0, r[B] = n, r;
	}, k = s({
		_p: u,
		$id: t,
		$onAction: I.bind(null, S),
		$patch: T,
		$reset: E,
		$subscribe(e, r = {}) {
			let i = I(b, e, r.detached, () => a()), a = m.run(() => n(() => u.state.value[t], (n) => {
				(r.flush === "sync" ? y : v) && e({
					storeId: t,
					type: x.direct,
					events: void 0
				}, n);
			}, W({}, g, r)));
			return i;
		},
		$dispose: D
	});
	u._s.set(t, k);
	let A = (u._a && u._a.runWithContext || R)(() => u._e.run(() => (m = i()).run(() => a({ action: O }))));
	for (let e in A) {
		let n = A[e];
		l(n) && !G(n) || r(n) ? p || (C && U(n) && (l(n) ? n.value = C[e] : V(n, C[e])), u.state.value[t][e] = n) : typeof n == "function" && (A[e] = O(n, e), h.actions[e] = n);
	}
	return W(k, A), W(f(k), A), Object.defineProperty(k, "$state", {
		get: () => u.state.value[t],
		set: (e) => {
			T((t) => {
				W(t, e);
			});
		}
	}), u._p.forEach((e) => {
		W(k, m.run(() => e({
			store: k,
			app: u._a,
			pinia: u,
			options: h
		})));
	}), C && p && c.hydrate && c.hydrate(k.$state, C), v = !0, y = !0, k;
}
function J(e, t, n) {
	let r, i = typeof t == "function";
	r = i ? n : t;
	function o(n, o) {
		let s = d();
		return n ||= s ? a(y, null) : null, n && _(n), n = g, n._s.has(e) || (i ? q(e, t, r, n) : K(e, r, n)), n._s.get(e);
	}
	return o.$id = e, o;
}
//#endregion
export { J as n, v as r, P as t };
