import { B as e, L as t, R as n, T as r, X as i, at as a, dt as o, et as s, it as c, nt as l, ot as u, rt as d, st as f, tt as p, ut as m } from "./mjr-primevue-Kjm8dCPS.js";
//#region node_modules/pinia/dist/pinia.js
var h = typeof window < "u", g, _ = (e) => g = e, v = () => t() && n(y) || g, y = Symbol();
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
	if (typeof e == "string") {
		if (w(e)) C(e, t, n);
		else {
			let t = document.createElement("a");
			t.href = e, t.target = "_blank", setTimeout(function() {
				T(t);
			});
		}
	} else navigator.msSaveOrOpenBlob(S(e, n), t);
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
	let e = s(!0), t = e.run(() => f({})), n = [], r = [], i = c({
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
var P = () => {};
function F(e, t, n, r = P) {
	e.add(t);
	let i = () => {
		e.delete(t) && r();
	};
	return !n && p() && a(i), i;
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
		e[n] = b(i) && b(r) && Object.hasOwn(e, n) && !d(r) && !l(r) ? B(i, r) : r;
	}
	return e;
}
var V = Symbol();
function H(e) {
	return !e || typeof e != "object" || !Object.hasOwn(e, V);
}
var { assign: U } = Object;
function W(e) {
	return !!(d(e) && e.effect);
}
function G(e, t, n, i) {
	let { state: a, actions: s, getters: l } = t, u = n.state.value[e], d;
	function f() {
		return u || 
		/* istanbul ignore if */
		(n.state.value[e] = a ? a() : {}), U(o(n.state.value[e]), s, Object.keys(l || {}).reduce((t, i) => (t[i] = c(r(() => {
			_(n);
			let t = n._s.get(e);
			return l[i].call(t, t);
		})), t), {}));
	}
	return d = K(e, f, t, n, i, !0), d;
}
function K(t, n, r = {}, a, o, c) {
	let f, p = U({ actions: {} }, r), h = { deep: !0 }, g, v, y = /* @__PURE__ */ new Set(), b = /* @__PURE__ */ new Set(), x, S = a.state.value[t];
	!c && !S && 
	/* istanbul ignore if */
	(a.state.value[t] = {});
	let C;
	function w(n) {
		let r;
		g = v = !1, typeof n == "function" ? (n(a.state.value[t]), r = {
			type: "patch function",
			storeId: t,
			events: x
		}) : (B(a.state.value[t], n), r = {
			type: "patch object",
			payload: n,
			storeId: t,
			events: x
		});
		let i = C = Symbol();
		e().then(() => {
			C === i && (g = !0);
		}), v = !0, I(y, r, a.state.value[t]);
	}
	let T = c ? function() {
		let { state: e } = r, t = e ? e() : {};
		this.$patch((e) => {
			U(e, t);
		});
	} : P;
	function E() {
		f.stop(), y.clear(), b.clear(), a._s.delete(t);
	}
	let D = (e, n = "") => {
		if (R in e) return e[z] = n, e;
		let r = function() {
			_(a);
			let n = Array.from(arguments), i = /* @__PURE__ */ new Set(), o = /* @__PURE__ */ new Set();
			function s(e) {
				i.add(e);
			}
			function c(e) {
				o.add(e);
			}
			I(b, {
				args: n,
				name: r[z],
				store: k,
				after: s,
				onError: c
			});
			let l;
			try {
				l = e.apply(this && this.$id === t ? this : k, n);
			} catch (e) {
				throw I(o, e), e;
			}
			return l instanceof Promise ? l.then((e) => (I(i, e), e)).catch((e) => (I(o, e), Promise.reject(e))) : (I(i, l), l);
		};
		return r[R] = !0, r[z] = n, r;
	}, O = {
		_p: a,
		$id: t,
		$onAction: F.bind(null, b),
		$patch: w,
		$reset: T,
		$subscribe(e, n = {}) {
			if (y.has(e)) return P;
			let r = F(y, e, n.detached, () => o()), o = f.run(() => i(() => a.state.value[t], (r) => {
				(n.flush === "sync" ? v : g) && e({
					storeId: t,
					type: "direct",
					events: x
				}, r);
			}, U({}, h, n)));
			return r;
		},
		$dispose: E
	}, k = u(O);
	a._s.set(t, k);
	let A = (a._a && a._a.runWithContext || L)(() => a._e.run(() => (f = s()).run(() => n({ action: D }))));
	for (let e in A) {
		let n = A[e];
		d(n) && !W(n) || l(n) ? c || (S && H(n) && (d(n) ? n.value = S[e] : ((n instanceof Set || n instanceof Map) && n.clear(), B(n, S[e]))), a.state.value[t][e] = n) : typeof n == "function" && (A[e] = D(n, e), p.actions[e] = n);
	}
	return U(k, A), U(m(k), A), Object.defineProperty(k, "$state", {
		get: () => a.state.value[t],
		set: (e) => {
			w((t) => {
				U(t, e);
			});
		}
	}), a._p.forEach((e) => {
		let t = f.run(() => e({
			store: k,
			app: a._a,
			pinia: a,
			options: p
		}));
		U(k, t);
	}), S && c && r.hydrate && r.hydrate(k.$state, S), g = !0, v = !0, k;
}
function q(e, r, i) {
	let a, o = typeof r == "function";
	a = o ? i : r;
	function s(i, s) {
		let c = t();
		return i ||= c ? n(y, null) : null, i && _(i), i = g, i._s.has(e) || (o ? K(e, r, a, i) : G(e, a, i)), i._s.get(e);
	}
	return s.$id = e, s;
}
//#endregion
export { q as n, v as r, N as t };
