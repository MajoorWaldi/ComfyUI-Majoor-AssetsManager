import { A as e, B as t, G as n, J as r, K as i, W as a, X as o, Y as s, Z as c, et as l, j as u, k as d, q as f, tt as p, x as m } from "./mjr-primevue-CgcK2pj6.js";
//#region node_modules/pinia/dist/pinia.mjs
var h = typeof window < "u", g, _ = (e) => g = e, v = () => d() && e(y) || g, y = Symbol();
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
	let e = a(!0), t = e.run(() => c({})), n = [], i = [], o = r({
		install(e) {
			_(o), o._a = e, e.provide(y, o), e.config.globalProperties.$pinia = o, i.forEach((e) => n.push(e)), i = [];
		},
		use(e) {
			return this._a ? n.push(e) : i.push(e), this;
		},
		_p: n,
		_a: null,
		_e: e,
		_s: /* @__PURE__ */ new Map(),
		state: t
	});
	return o;
}
var F = () => {};
function I(e, t, r, i = F) {
	e.add(t);
	let a = () => {
		e.delete(t) && i();
	};
	return !r && n() && s(a), a;
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
		let r = t[n], a = e[n];
		b(a) && b(r) && e.hasOwnProperty(n) && !f(r) && !i(r) ? e[n] = V(a, r) : e[n] = r;
	}
	return e;
}
var H = Symbol();
function U(e) {
	return !b(e) || !Object.prototype.hasOwnProperty.call(e, H);
}
var { assign: W } = Object;
function G(e) {
	return !!(f(e) && e.effect);
}
function K(e, t, n, i) {
	let { state: a, actions: o, getters: s } = t, c = n.state.value[e], l;
	function u() {
		return c || (n.state.value[e] = a ? a() : {}), W(p(n.state.value[e]), o, Object.keys(s || {}).reduce((t, i) => (t[i] = r(m(() => {
			_(n);
			let t = n._s.get(e);
			return s[i].call(t, t);
		})), t), {}));
	}
	return l = q(e, u, t, n, i, !0), l;
}
function q(e, n, r = {}, s, d, p) {
	let m, h = W({ actions: {} }, r), g = { deep: !0 }, v, y, b = /* @__PURE__ */ new Set(), S = /* @__PURE__ */ new Set(), C = s.state.value[e];
	!p && !C && (s.state.value[e] = {}), c({});
	let w;
	function T(t) {
		let n;
		v = y = !1, typeof t == "function" ? (t(s.state.value[e]), n = {
			type: x.patchFunction,
			storeId: e,
			events: void 0
		}) : (V(s.state.value[e], t), n = {
			type: x.patchObject,
			payload: t,
			storeId: e,
			events: void 0
		});
		let r = w = Symbol();
		u().then(() => {
			w === r && (v = !0);
		}), y = !0, L(b, n, s.state.value[e]);
	}
	let E = p ? function() {
		let { state: e } = r, t = e ? e() : {};
		this.$patch((e) => {
			W(e, t);
		});
	} : F;
	function D() {
		m.stop(), b.clear(), S.clear(), s._s.delete(e);
	}
	let O = (t, n = "") => {
		if (z in t) return t[B] = n, t;
		let r = function() {
			_(s);
			let n = Array.from(arguments), i = /* @__PURE__ */ new Set(), a = /* @__PURE__ */ new Set();
			function o(e) {
				i.add(e);
			}
			function c(e) {
				a.add(e);
			}
			L(S, {
				args: n,
				name: r[B],
				store: k,
				after: o,
				onError: c
			});
			let l;
			try {
				l = t.apply(this && this.$id === e ? this : k, n);
			} catch (e) {
				throw L(a, e), e;
			}
			return l instanceof Promise ? l.then((e) => (L(i, e), e)).catch((e) => (L(a, e), Promise.reject(e))) : (L(i, l), l);
		};
		return r[z] = !0, r[B] = n, r;
	}, k = o({
		_p: s,
		$id: e,
		$onAction: I.bind(null, S),
		$patch: T,
		$reset: E,
		$subscribe(n, r = {}) {
			let i = I(b, n, r.detached, () => a()), a = m.run(() => t(() => s.state.value[e], (t) => {
				(r.flush === "sync" ? y : v) && n({
					storeId: e,
					type: x.direct,
					events: void 0
				}, t);
			}, W({}, g, r)));
			return i;
		},
		$dispose: D
	});
	s._s.set(e, k);
	let A = (s._a && s._a.runWithContext || R)(() => s._e.run(() => (m = a()).run(() => n({ action: O }))));
	for (let t in A) {
		let n = A[t];
		f(n) && !G(n) || i(n) ? p || (C && U(n) && (f(n) ? n.value = C[t] : V(n, C[t])), s.state.value[e][t] = n) : typeof n == "function" && (A[t] = O(n, t), h.actions[t] = n);
	}
	return W(k, A), W(l(k), A), Object.defineProperty(k, "$state", {
		get: () => s.state.value[e],
		set: (e) => {
			T((t) => {
				W(t, e);
			});
		}
	}), s._p.forEach((e) => {
		W(k, m.run(() => e({
			store: k,
			app: s._a,
			pinia: s,
			options: h
		})));
	}), C && p && r.hydrate && r.hydrate(k.$state, C), v = !0, y = !0, k;
}
function J(t, n, r) {
	let i, a = typeof n == "function";
	i = a ? r : n;
	function o(r, o) {
		let s = d();
		return r ||= s ? e(y, null) : null, r && _(r), r = g, r._s.has(t) || (a ? q(t, n, i, r) : K(t, i, r)), r._s.get(t);
	}
	return o.$id = t, o;
}
//#endregion
export { J as n, v as r, P as t };
