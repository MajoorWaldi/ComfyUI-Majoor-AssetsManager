import { $ as e, F as t, G as n, I as r, P as i, Q as a, T as o, X as s, Y as c, Z as l, at as u, et as d, nt as f, ot as p, tt as m } from "./mjr-primevue-BiC2k1jO.js";
//#region node_modules/pinia/dist/pinia.js
var h = typeof window < "u", g, _ = (e) => g = e, v = () => i() && t(y) || g, y = Symbol();
function b(e) {
	return e && typeof e == "object" && Object.prototype.toString.call(e) === "[object Object]" && typeof e.toJSON != "function";
}
var x = typeof window == "object" && window.window === window ? window : typeof self == "object" && self.self === self ? self : typeof global == "object" && global.global === global ? global : typeof globalThis == "object" ? globalThis : { HTMLElement: null };
function S(e, { autoBom: t = !1 } = {}) {
	return t && /^\s*(?:text\/\S*|application\/xml|\S*\/\S*\+xml)\s*;.*charset\s*=\s*utf-8/i.test(e.type) ? new Blob(["﻿", e], { type: e.type }) : e;
}
function C(e, t, n) {
	let r = new XMLHttpRequest();
	r.open("GET", e), r.responseType = "blob", r.onload = function() {
		O(r.response, t, n);
	}, r.onerror = function() {
		console.error("could not download file");
	}, r.send();
}
function w(e) {
	let t = new XMLHttpRequest();
	t.open("HEAD", e, !1);
	try {
		t.send();
	} catch {}
	return t.status >= 200 && t.status <= 299;
}
function T(e) {
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
var E = typeof navigator == "object" ? navigator : { userAgent: "" }, D = /Macintosh/.test(E.userAgent) && /AppleWebKit/.test(E.userAgent) && !/Safari/.test(E.userAgent), O = h ? typeof HTMLAnchorElement < "u" && "download" in HTMLAnchorElement.prototype && !D ? k : "msSaveOrOpenBlob" in E ? A : j : () => {};
function k(e, t = "download", n) {
	let r = document.createElement("a");
	r.download = t, r.rel = "noopener", typeof e == "string" ? (r.href = e, r.origin === location.origin ? T(r) : w(r.href) ? C(e, t, n) : (r.target = "_blank", T(r))) : (r.href = URL.createObjectURL(e), setTimeout(function() {
		URL.revokeObjectURL(r.href);
	}, 4e4), setTimeout(function() {
		T(r);
	}, 0));
}
function A(e, t = "download", n) {
	if (typeof e == "string") if (w(e)) C(e, t, n);
	else {
		let t = document.createElement("a");
		t.href = e, t.target = "_blank", setTimeout(function() {
			T(t);
		});
	}
	else navigator.msSaveOrOpenBlob(S(e, n), t);
}
function j(e, t, n, r) {
	if (r ||= open("", "_blank"), r && (r.document.title = r.document.body.innerText = "downloading..."), typeof e == "string") return C(e, t, n);
	let i = e.type === "application/octet-stream", a = /constructor/i.test(String(x.HTMLElement)) || "safari" in x, o = /CriOS\/[\d]+/.test(navigator.userAgent);
	if ((o || i && a || D) && typeof FileReader < "u") {
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
var { assign: M } = Object;
function N() {
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
var P = () => {};
function F(e, t, n, r = P) {
	e.add(t);
	let i = () => {
		e.delete(t) && r();
	};
	return !n && s() && d(i), i;
}
function I(e, ...t) {
	e.forEach((e) => {
		e(...t);
	});
}
var L = (e) => e(), R = Symbol(), z = Symbol();
function B(e, t) {
	e instanceof Map && t instanceof Map ? t.forEach((t, n) => e.set(n, t)) : e instanceof Set && t instanceof Set && t.forEach(e.add, e);
	for (let n in t) {
		if (!Object.hasOwn(t, n)) continue;
		let r = t[n], i = e[n];
		b(i) && b(r) && Object.hasOwn(e, n) && !a(r) && !l(r) ? e[n] = B(i, r) : e[n] = r;
	}
	return e;
}
var V = Symbol();
function H(e) {
	return !e || typeof e != "object" || !Object.hasOwn(e, V);
}
var { assign: U } = Object;
function W(e) {
	return !!(a(e) && e.effect);
}
function G(t, n, r, i) {
	let { state: a, actions: s, getters: c } = n, l = r.state.value[t], u;
	function d() {
		return l || (r.state.value[t] = a ? a() : {}), U(p(r.state.value[t]), s, Object.keys(c || {}).reduce((n, i) => (n[i] = e(o(() => {
			_(r);
			let e = r._s.get(t);
			return c[i].call(e, e);
		})), n), {}));
	}
	return u = K(t, d, n, r, i, !0), u;
}
function K(e, t, i = {}, o, s, d) {
	let f, p = U({ actions: {} }, i), h = { deep: !0 }, g, v, y = /* @__PURE__ */ new Set(), b = /* @__PURE__ */ new Set(), x = o.state.value[e];
	!d && !x && (o.state.value[e] = {});
	let S;
	function C(t) {
		let n;
		g = v = !1, typeof t == "function" ? (t(o.state.value[e]), n = {
			type: "patch function",
			storeId: e,
			events: void 0
		}) : (B(o.state.value[e], t), n = {
			type: "patch object",
			payload: t,
			storeId: e,
			events: void 0
		});
		let i = S = Symbol();
		r().then(() => {
			S === i && (g = !0);
		}), v = !0, I(y, n, o.state.value[e]);
	}
	let w = d ? function() {
		let { state: e } = i, t = e ? e() : {};
		this.$patch((e) => {
			U(e, t);
		});
	} : P;
	function T() {
		f.stop(), y.clear(), b.clear(), o._s.delete(e);
	}
	let E = (t, n = "") => {
		if (R in t) return t[z] = n, t;
		let r = function() {
			_(o);
			let n = Array.from(arguments), i = /* @__PURE__ */ new Set(), a = /* @__PURE__ */ new Set();
			function s(e) {
				i.add(e);
			}
			function c(e) {
				a.add(e);
			}
			I(b, {
				args: n,
				name: r[z],
				store: D,
				after: s,
				onError: c
			});
			let l;
			try {
				l = t.apply(this && this.$id === e ? this : D, n);
			} catch (e) {
				throw I(a, e), e;
			}
			return l instanceof Promise ? l.then((e) => (I(i, e), e)).catch((e) => (I(a, e), Promise.reject(e))) : (I(i, l), l);
		};
		return r[R] = !0, r[z] = n, r;
	}, D = m({
		_p: o,
		$id: e,
		$onAction: F.bind(null, b),
		$patch: C,
		$reset: w,
		$subscribe(t, r = {}) {
			if (y.has(t)) return P;
			let i = F(y, t, r.detached, () => a()), a = f.run(() => n(() => o.state.value[e], (n) => {
				(r.flush === "sync" ? v : g) && t({
					storeId: e,
					type: "direct",
					events: void 0
				}, n);
			}, U({}, h, r)));
			return i;
		},
		$dispose: T
	});
	o._s.set(e, D);
	let O = (o._a && o._a.runWithContext || L)(() => o._e.run(() => (f = c()).run(() => t({ action: E }))));
	for (let t in O) {
		let n = O[t];
		a(n) && !W(n) || l(n) ? d || (x && H(n) && (a(n) ? n.value = x[t] : B(n, x[t])), o.state.value[e][t] = n) : typeof n == "function" && (O[t] = E(n, t), p.actions[t] = n);
	}
	return U(D, O), U(u(D), O), Object.defineProperty(D, "$state", {
		get: () => o.state.value[e],
		set: (e) => {
			C((t) => {
				U(t, e);
			});
		}
	}), o._p.forEach((e) => {
		let t = f.run(() => e({
			store: D,
			app: o._a,
			pinia: o,
			options: p
		}));
		U(D, t);
	}), x && d && i.hydrate && i.hydrate(D.$state, x), g = !0, v = !0, D;
}
function q(e, n, r) {
	let a, o = typeof n == "function";
	a = o ? r : n;
	function s(r, s) {
		let c = i();
		return r ||= c ? t(y, null) : null, r && _(r), r = g, r._s.has(e) || (o ? K(e, n, a, r) : G(e, a, r)), r._s.get(e);
	}
	return s.$id = e, s;
}
//#endregion
export { q as n, v as r, N as t };
