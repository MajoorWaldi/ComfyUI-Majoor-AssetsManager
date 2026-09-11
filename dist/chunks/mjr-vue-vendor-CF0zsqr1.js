import { $ as e, F as t, I as n, K as r, L as i, Q as a, T as o, X as s, Z as c, et as l, nt as u, ot as d, rt as f, st as p, tt as m } from "./mjr-primevue-C955bvXT.js";
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
	let e = s(!0), t = e.run(() => f({})), n = [], r = [], i = l({
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
	return !n && c() && m(i), i;
}
function I(e, ...t) {
	e.forEach((e) => {
		e(...t);
	});
}
var L = (e) => e(), R = Symbol(), z = Symbol();
function B(t, n) {
	t instanceof Map && n instanceof Map ? n.forEach((e, n) => t.set(n, e)) : t instanceof Set && n instanceof Set && n.forEach(t.add, t);
	for (let r in n) {
		if (!Object.hasOwn(n, r)) continue;
		let i = n[r], o = t[r];
		t[r] = b(o) && b(i) && Object.hasOwn(t, r) && !e(i) && !a(i) ? B(o, i) : i;
	}
	return t;
}
var V = Symbol();
function H(e) {
	return !e || typeof e != "object" || !Object.hasOwn(e, V);
}
var { assign: U } = Object;
function W(t) {
	return !!(e(t) && t.effect);
}
function G(e, t, n, r) {
	let { state: i, actions: a, getters: s } = t, c = n.state.value[e], u;
	function d() {
		return c || 
		/* istanbul ignore if */
		(n.state.value[e] = i ? i() : {}), U(p(n.state.value[e]), a, Object.keys(s || {}).reduce((t, r) => (t[r] = l(o(() => {
			_(n);
			let t = n._s.get(e);
			return s[r].call(t, t);
		})), t), {}));
	}
	return u = K(e, d, t, n, r, !0), u;
}
function K(t, n, o = {}, c, l, f) {
	let p, m = U({ actions: {} }, o), h = { deep: !0 }, g, v, y = /* @__PURE__ */ new Set(), b = /* @__PURE__ */ new Set(), x, S = c.state.value[t];
	!f && !S && 
	/* istanbul ignore if */
	(c.state.value[t] = {});
	let C;
	function w(e) {
		let n;
		g = v = !1, typeof e == "function" ? (e(c.state.value[t]), n = {
			type: "patch function",
			storeId: t,
			events: x
		}) : (B(c.state.value[t], e), n = {
			type: "patch object",
			payload: e,
			storeId: t,
			events: x
		});
		let r = C = Symbol();
		i().then(() => {
			C === r && (g = !0);
		}), v = !0, I(y, n, c.state.value[t]);
	}
	let T = f ? function() {
		let { state: e } = o, t = e ? e() : {};
		this.$patch((e) => {
			U(e, t);
		});
	} : P;
	function E() {
		p.stop(), y.clear(), b.clear(), c._s.delete(t);
	}
	let D = (e, n = "") => {
		if (R in e) return e[z] = n, e;
		let r = function() {
			_(c);
			let n = Array.from(arguments), i = /* @__PURE__ */ new Set(), a = /* @__PURE__ */ new Set();
			function o(e) {
				i.add(e);
			}
			function s(e) {
				a.add(e);
			}
			I(b, {
				args: n,
				name: r[z],
				store: k,
				after: o,
				onError: s
			});
			let l;
			try {
				l = e.apply(this && this.$id === t ? this : k, n);
			} catch (e) {
				throw I(a, e), e;
			}
			return l instanceof Promise ? l.then((e) => (I(i, e), e)).catch((e) => (I(a, e), Promise.reject(e))) : (I(i, l), l);
		};
		return r[R] = !0, r[z] = n, r;
	}, O = {
		_p: c,
		$id: t,
		$onAction: F.bind(null, b),
		$patch: w,
		$reset: T,
		$subscribe(e, n = {}) {
			if (y.has(e)) return P;
			let i = F(y, e, n.detached, () => a()), a = p.run(() => r(() => c.state.value[t], (r) => {
				(n.flush === "sync" ? v : g) && e({
					storeId: t,
					type: "direct",
					events: x
				}, r);
			}, U({}, h, n)));
			return i;
		},
		$dispose: E
	}, k = u(O);
	c._s.set(t, k);
	let A = (c._a && c._a.runWithContext || L)(() => c._e.run(() => (p = s()).run(() => n({ action: D }))));
	for (let n in A) {
		let r = A[n];
		e(r) && !W(r) || a(r) ? f || (S && H(r) && (e(r) ? r.value = S[n] : ((r instanceof Set || r instanceof Map) && r.clear(), B(r, S[n]))), c.state.value[t][n] = r) : typeof r == "function" && (A[n] = D(r, n), m.actions[n] = r);
	}
	return U(k, A), U(d(k), A), Object.defineProperty(k, "$state", {
		get: () => c.state.value[t],
		set: (e) => {
			w((t) => {
				U(t, e);
			});
		}
	}), c._p.forEach((e) => {
		let t = p.run(() => e({
			store: k,
			app: c._a,
			pinia: c,
			options: m
		}));
		U(k, t);
	}), S && f && o.hydrate && o.hydrate(k.$state, S), g = !0, v = !0, k;
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
