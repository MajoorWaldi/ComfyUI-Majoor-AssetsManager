import { $ as e, F as t, G as n, I as r, P as i, Q as a, T as o, X as s, Y as c, Z as l, at as u, et as d, nt as f, ot as p, tt as m } from "./mjr-primevue-BOCpq3qH.js";
//#region node_modules/pinia/dist/pinia.mjs
var h = typeof window < "u", g, _ = (e) => g = e, v = () => i() && t(y) || g, y = Symbol();
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
	let t = c(!0), n = t.run(() => f({})), r = [], i = [], a = e({
		install(e) {
			_(a), a._a = e, e.provide(y, a), e.config.globalProperties.$pinia = a, i.forEach((e) => r.push(e)), i = [];
		},
		use(e) {
			return this._a ? r.push(e) : i.push(e), this;
		},
		_p: r,
		_a: null,
		_e: t,
		_s: /* @__PURE__ */ new Map(),
		state: n
	});
	return a;
}
var F = () => {};
function I(e, t, n, r = F) {
	e.add(t);
	let i = () => {
		e.delete(t) && r();
	};
	return !n && s() && d(i), i;
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
		let r = t[n], i = e[n];
		b(i) && b(r) && e.hasOwnProperty(n) && !a(r) && !l(r) ? e[n] = V(i, r) : e[n] = r;
	}
	return e;
}
var H = Symbol();
function U(e) {
	return !b(e) || !Object.prototype.hasOwnProperty.call(e, H);
}
var { assign: W } = Object;
function G(e) {
	return !!(a(e) && e.effect);
}
function K(t, n, r, i) {
	let { state: a, actions: s, getters: c } = n, l = r.state.value[t], u;
	function d() {
		return l || (r.state.value[t] = a ? a() : {}), W(p(r.state.value[t]), s, Object.keys(c || {}).reduce((n, i) => (n[i] = e(o(() => {
			_(r);
			let e = r._s.get(t);
			return c[i].call(e, e);
		})), n), {}));
	}
	return u = q(t, d, n, r, i, !0), u;
}
function q(e, t, i = {}, o, s, d) {
	let p, h = W({ actions: {} }, i), g = { deep: !0 }, v, y, b = /* @__PURE__ */ new Set(), S = /* @__PURE__ */ new Set(), C = o.state.value[e];
	!d && !C && (o.state.value[e] = {}), f({});
	let w;
	function T(t) {
		let n;
		v = y = !1, typeof t == "function" ? (t(o.state.value[e]), n = {
			type: x.patchFunction,
			storeId: e,
			events: void 0
		}) : (V(o.state.value[e], t), n = {
			type: x.patchObject,
			payload: t,
			storeId: e,
			events: void 0
		});
		let i = w = Symbol();
		r().then(() => {
			w === i && (v = !0);
		}), y = !0, L(b, n, o.state.value[e]);
	}
	let E = d ? function() {
		let { state: e } = i, t = e ? e() : {};
		this.$patch((e) => {
			W(e, t);
		});
	} : F;
	function D() {
		p.stop(), b.clear(), S.clear(), o._s.delete(e);
	}
	let O = (t, n = "") => {
		if (z in t) return t[B] = n, t;
		let r = function() {
			_(o);
			let n = Array.from(arguments), i = /* @__PURE__ */ new Set(), a = /* @__PURE__ */ new Set();
			function s(e) {
				i.add(e);
			}
			function c(e) {
				a.add(e);
			}
			L(S, {
				args: n,
				name: r[B],
				store: k,
				after: s,
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
	}, k = m({
		_p: o,
		$id: e,
		$onAction: I.bind(null, S),
		$patch: T,
		$reset: E,
		$subscribe(t, r = {}) {
			let i = I(b, t, r.detached, () => a()), a = p.run(() => n(() => o.state.value[e], (n) => {
				(r.flush === "sync" ? y : v) && t({
					storeId: e,
					type: x.direct,
					events: void 0
				}, n);
			}, W({}, g, r)));
			return i;
		},
		$dispose: D
	});
	o._s.set(e, k);
	let A = (o._a && o._a.runWithContext || R)(() => o._e.run(() => (p = c()).run(() => t({ action: O }))));
	for (let t in A) {
		let n = A[t];
		a(n) && !G(n) || l(n) ? d || (C && U(n) && (a(n) ? n.value = C[t] : V(n, C[t])), o.state.value[e][t] = n) : typeof n == "function" && (A[t] = O(n, t), h.actions[t] = n);
	}
	return W(k, A), W(u(k), A), Object.defineProperty(k, "$state", {
		get: () => o.state.value[e],
		set: (e) => {
			T((t) => {
				W(t, e);
			});
		}
	}), o._p.forEach((e) => {
		W(k, p.run(() => e({
			store: k,
			app: o._a,
			pinia: o,
			options: h
		})));
	}), C && d && i.hydrate && i.hydrate(k.$state, C), v = !0, y = !0, k;
}
function J(e, n, r) {
	let a, o = typeof n == "function";
	a = o ? r : n;
	function s(r, s) {
		let c = i();
		return r ||= c ? t(y, null) : null, r && _(r), r = g, r._s.has(e) || (o ? q(e, n, a, r) : K(e, a, r)), r._s.get(e);
	}
	return s.$id = e, s;
}
//#endregion
export { J as n, v as r, P as t };
