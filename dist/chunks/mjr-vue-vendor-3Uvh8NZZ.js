import { $ as e, C as t, J as n, M as r, N as i, P as a, Q as o, U as s, X as c, Y as l, Z as u, et as d, it as f, q as p, rt as m } from "./mjr-primevue-BP853pmn.js";
//#region node_modules/pinia/dist/pinia.mjs
var h = typeof window < "u", g, _ = (e) => g = e, v = () => r() && i(y) || g, y = Symbol();
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
	let e = p(!0), t = e.run(() => d({})), n = [], r = [], i = u({
		install(e) {
			_(i), i._a = e, e.provide(y, i), e.config.globalProperties.$pinia = i, r.forEach((e) => n.push(e)), r = [];
		},
		use(e) {
			return this._a ? n.push(e) : r.push(e), this;
		},
		_p: n,
		_a: null,
		_e: e,
		_s: /* @__PURE__ */ new Map(),
		state: t
	});
	return i;
}
var F = () => {};
function I(e, t, r, i = F) {
	e.add(t);
	let a = () => {
		e.delete(t) && i();
	};
	return !r && n() && o(a), a;
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
		b(i) && b(r) && e.hasOwnProperty(n) && !c(r) && !l(r) ? e[n] = V(i, r) : e[n] = r;
	}
	return e;
}
var H = Symbol();
function U(e) {
	return !b(e) || !Object.prototype.hasOwnProperty.call(e, H);
}
var { assign: W } = Object;
function G(e) {
	return !!(c(e) && e.effect);
}
function K(e, n, r, i) {
	let { state: a, actions: o, getters: s } = n, c = r.state.value[e], l;
	function d() {
		return c || (r.state.value[e] = a ? a() : {}), W(f(r.state.value[e]), o, Object.keys(s || {}).reduce((n, i) => (n[i] = u(t(() => {
			_(r);
			let t = r._s.get(e);
			return s[i].call(t, t);
		})), n), {}));
	}
	return l = q(e, d, n, r, i, !0), l;
}
function q(t, n, r = {}, i, o, u) {
	let f, h = W({ actions: {} }, r), g = { deep: !0 }, v, y, b = /* @__PURE__ */ new Set(), S = /* @__PURE__ */ new Set(), C = i.state.value[t];
	!u && !C && (i.state.value[t] = {}), d({});
	let w;
	function T(e) {
		let n;
		v = y = !1, typeof e == "function" ? (e(i.state.value[t]), n = {
			type: x.patchFunction,
			storeId: t,
			events: void 0
		}) : (V(i.state.value[t], e), n = {
			type: x.patchObject,
			payload: e,
			storeId: t,
			events: void 0
		});
		let r = w = Symbol();
		a().then(() => {
			w === r && (v = !0);
		}), y = !0, L(b, n, i.state.value[t]);
	}
	let E = u ? function() {
		let { state: e } = r, t = e ? e() : {};
		this.$patch((e) => {
			W(e, t);
		});
	} : F;
	function D() {
		f.stop(), b.clear(), S.clear(), i._s.delete(t);
	}
	let O = (e, n = "") => {
		if (z in e) return e[B] = n, e;
		let r = function() {
			_(i);
			let n = Array.from(arguments), a = /* @__PURE__ */ new Set(), o = /* @__PURE__ */ new Set();
			function s(e) {
				a.add(e);
			}
			function c(e) {
				o.add(e);
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
				l = e.apply(this && this.$id === t ? this : k, n);
			} catch (e) {
				throw L(o, e), e;
			}
			return l instanceof Promise ? l.then((e) => (L(a, e), e)).catch((e) => (L(o, e), Promise.reject(e))) : (L(a, l), l);
		};
		return r[z] = !0, r[B] = n, r;
	}, k = e({
		_p: i,
		$id: t,
		$onAction: I.bind(null, S),
		$patch: T,
		$reset: E,
		$subscribe(e, n = {}) {
			let r = I(b, e, n.detached, () => a()), a = f.run(() => s(() => i.state.value[t], (r) => {
				(n.flush === "sync" ? y : v) && e({
					storeId: t,
					type: x.direct,
					events: void 0
				}, r);
			}, W({}, g, n)));
			return r;
		},
		$dispose: D
	});
	i._s.set(t, k);
	let A = (i._a && i._a.runWithContext || R)(() => i._e.run(() => (f = p()).run(() => n({ action: O }))));
	for (let e in A) {
		let n = A[e];
		c(n) && !G(n) || l(n) ? u || (C && U(n) && (c(n) ? n.value = C[e] : V(n, C[e])), i.state.value[t][e] = n) : typeof n == "function" && (A[e] = O(n, e), h.actions[e] = n);
	}
	return W(k, A), W(m(k), A), Object.defineProperty(k, "$state", {
		get: () => i.state.value[t],
		set: (e) => {
			T((t) => {
				W(t, e);
			});
		}
	}), i._p.forEach((e) => {
		W(k, f.run(() => e({
			store: k,
			app: i._a,
			pinia: i,
			options: h
		})));
	}), C && u && r.hydrate && r.hydrate(k.$state, C), v = !0, y = !0, k;
}
function J(e, t, n) {
	let a, o = typeof t == "function";
	a = o ? n : t;
	function s(n, s) {
		let c = r();
		return n ||= c ? i(y, null) : null, n && _(n), n = g, n._s.has(e) || (o ? q(e, t, a, n) : K(e, a, n)), n._s.get(e);
	}
	return s.$id = e, s;
}
//#endregion
export { J as n, v as r, P as t };
