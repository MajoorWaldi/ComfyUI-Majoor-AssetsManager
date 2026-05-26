import { _ as e, i as t, r as n, v as r, y as i } from "./config-DC_DVuJE.js";
//#region ui/app/settingsStore.ts
var a = "mjrSettings", o = "mjrMinimapSettings", s = new Set([
	"POST",
	"PUT",
	"DELETE",
	"PATCH"
]), c = 2e4, l = 3e5, u = 3, d = 400, f = "/mjr/am/settings/security/bootstrap-token", p = "/mjr/am/", m = /* @__PURE__ */ new Map();
function ee(e) {
	return new Promise((t) => setTimeout(t, e));
}
function h(e) {
	return s.has(String(e || "").trim().toUpperCase());
}
function g(e) {
	try {
		let t = String(e || "").trim();
		if (!t) return "";
		if (t.startsWith("http://") || t.startsWith("https://")) {
			let e = typeof globalThis < "u" && globalThis?.location?.origin ? String(globalThis.location.origin) : "http://localhost";
			return new URL(t, e).pathname || "";
		}
		return t.split("?")[0] || "";
	} catch {
		return "";
	}
}
function _(e) {
	return g(e).startsWith(p);
}
function v(e) {
	return g(e) === f;
}
function y(e) {
	try {
		if (!e) return !1;
		let t = String(e.name || "");
		if (t === "AbortError") return !1;
		let n = String(e.message || "").toLowerCase();
		return t === "TypeError" ? n.includes("failed to fetch") || n.includes("networkerror") || n.includes("load failed") || n.includes("fetch") || n.includes("network") : n.includes("fetch") || n.includes("network") || n.includes("failed");
	} catch {
		return !1;
	}
}
function b(e = {}) {
	try {
		let t = Number(e?.timeoutMs);
		return Number.isFinite(t) ? Math.max(1e3, Math.min(l, Math.floor(t))) : c;
	} catch {
		return c;
	}
}
function te(e = {}) {
	let t = e?.signal || null;
	if (typeof AbortController > "u") return {
		signal: t || void 0,
		timeoutMs: b(e),
		cleanup: () => {}
	};
	let n = b(e), r = new AbortController(), i = null, a = () => {
		try {
			i &&= (clearTimeout(i), null);
		} catch (e) {
			console.debug?.(e);
		}
		try {
			r.abort();
		} catch (e) {
			console.debug?.(e);
		}
	};
	try {
		i = setTimeout(() => {
			try {
				r.abort();
			} catch (e) {
				console.debug?.(e);
			}
		}, n);
	} catch (e) {
		console.debug?.(e);
	}
	try {
		t && (t.aborted ? a() : t.addEventListener("abort", a, { once: !0 }));
	} catch (e) {
		console.debug?.(e);
	}
	return {
		signal: r.signal,
		timeoutMs: n,
		cleanup: () => {
			try {
				i && clearTimeout(i);
			} catch (e) {
				console.debug?.(e);
			}
			try {
				t && t.removeEventListener("abort", a);
			} catch (e) {
				console.debug?.(e);
			}
		}
	};
}
function ne(e, t, n = {}) {
	let r = String(e || "GET").trim().toUpperCase(), i = String(t || "").trim();
	return !r || !i ? "" : `${r}:${i}:timeout=${b(n)}`;
}
function re(e, t) {
	let n = String(e || "").trim();
	if (!n) return t();
	if (m.has(n)) return m.get(n);
	let r = Promise.resolve().then(() => t()).finally(() => {
		try {
			m.delete(n);
		} catch (e) {
			console.debug?.(e);
		}
	});
	return m.set(n, r), r;
}
function ie(e, t, n) {
	if (h(t)) try {
		e instanceof Headers ? e.has("X-Requested-With") || e.set("X-Requested-With", "XMLHttpRequest") : e["X-Requested-With"] ||= "XMLHttpRequest";
	} catch (e) {
		console.debug?.(e);
	}
	try {
		e instanceof Headers ? e.has("X-MJR-OBS") || e.set("X-MJR-OBS", n ? "on" : "off") : "X-MJR-OBS" in e || (e["X-MJR-OBS"] = n ? "on" : "off");
	} catch (e) {
		console.debug?.(e);
	}
}
function ae(e, t) {
	if (t) try {
		e instanceof Headers ? (e.has("X-MJR-Token") || e.set("X-MJR-Token", t), e.has("Authorization") || e.set("Authorization", `Bearer ${t}`)) : ("X-MJR-Token" in e || (e["X-MJR-Token"] = t), "Authorization" in e || (e.Authorization = `Bearer ${t}`));
	} catch (e) {
		console.debug?.(e);
	}
}
async function oe(e, t, n, r, { ensureWriteAuthToken: i, normalizeWriteAuthFailure: a, fetchAPI: o, options: s, retryCount: c }) {
	let l = e.headers.get("content-type") || "";
	if (!l.includes("application/json")) return !r && h(n) && _(t) && !v(t) && Number(e.status || 0) === 401 && await i({
		force: !0,
		allowCookieRefresh: !0
	}) ? await o(t, {
		...s,
		_authRetryDone: !0
	}, c) : {
		ok: !1,
		error: `Server returned non-JSON response (${e.status})`,
		code: "INVALID_RESPONSE",
		status: e.status,
		content_type: l,
		data: null
	};
	let u = await e.json().catch((e) => (console.debug?.("[MJR API] JSON parse error:", e), null));
	if (typeof u != "object" || !u) return {
		ok: !1,
		error: "Invalid response structure",
		code: "INVALID_RESPONSE",
		status: e.status,
		data: null
	};
	if (!("status" in u)) try {
		u.status = e.status;
	} catch (e) {
		console.debug?.(e);
	}
	return !r && h(n) && !v(t) && !u?.ok && (String(u?.code || "").toUpperCase() === "AUTH_REQUIRED" || Number(u?.status || 0) === 401) && await i({
		force: !0,
		allowCookieRefresh: !0
	}) ? await o(t, {
		...s,
		_authRetryDone: !0
	}, c) : (h(n) && _(t) && !v(t) && (u = a(u)), u);
}
function se({ readObsEnabled: e = () => !1, readAuthToken: t = () => "", ensureWriteAuthToken: n = async () => "", normalizeWriteAuthFailure: r = (e) => e, trackApiCall: i = null } = {}) {
	async function a(o, s = {}, c = 0) {
		let l = typeof performance < "u" ? performance.now() : Date.now(), f = te(s), p = null;
		try {
			let i = (s.method || "GET").toUpperCase(), l = !!s?._authRetryDone, u = typeof Headers < "u" ? new Headers(s.headers || {}) : { ...s.headers };
			ie(u, i, !!e());
			let d = t();
			if (!d && h(i) && _(o) && !v(o)) {
				try {
					await n();
				} catch (e) {
					console.debug?.(e);
				}
				d = t();
			}
			ae(u, d);
			let m = {
				...s,
				headers: u,
				signal: f.signal
			};
			try {
				delete m._authRetryDone, delete m.timeoutMs;
			} catch (e) {
				console.debug?.(e);
			}
			return p = await oe(await fetch(o, m), o, i, l, {
				ensureWriteAuthToken: n,
				normalizeWriteAuthFailure: r,
				fetchAPI: a,
				options: s,
				retryCount: c
			}), p;
		} catch (e) {
			try {
				if (String(e?.name || "") === "AbortError") return s?.signal && s.signal.aborted ? {
					ok: !1,
					error: "Aborted",
					code: "ABORTED",
					data: null
				} : {
					ok: !1,
					error: `Request timed out after ${f.timeoutMs}ms`,
					code: "TIMEOUT",
					data: null,
					timeout_ms: f.timeoutMs
				};
			} catch (e) {
				console.debug?.(e);
			}
			if (c < u && y(e)) {
				try {
					await ee(d * (c + 1));
				} catch (e) {
					console.debug?.(e);
				}
				return await a(o, s, c + 1);
			}
			return {
				ok: !1,
				error: e?.message || String(e || "Network error"),
				code: "NETWORK_ERROR",
				data: null,
				retries: c
			};
		} finally {
			try {
				let e = (typeof performance < "u" ? performance.now() : Date.now()) - l;
				typeof i == "function" ? i(e, !p?.ok) : typeof window < "u" && window.MajoorMetrics && window.MajoorMetrics.trackApiCall(e, !p?.ok);
			} catch (e) {
				console.debug?.(e);
			}
			try {
				f.cleanup?.();
			} catch (e) {
				console.debug?.(e);
			}
		}
	}
	async function o(e, t = {}) {
		return re(t?.dedupe === !1 ? "" : String(t?.dedupeKey || "").trim() || ne("GET", e, t), () => a(e, {
			...t,
			method: "GET"
		}));
	}
	async function s(e, t, n = {}) {
		return a(e, {
			...n,
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				...n.headers
			},
			body: JSON.stringify(t)
		});
	}
	return {
		fetchAPI: a,
		get: o,
		post: s
	};
}
//#endregion
//#region ui/utils/ttlCache.ts
function x({ ttlMs: e = 0, maxSize: t = 100, now: n = () => Date.now() } = {}) {
	let r = /* @__PURE__ */ new Map();
	function i() {
		try {
			let e = Number(n());
			return Number.isFinite(e) ? e : Date.now();
		} catch {
			return Date.now();
		}
	}
	function a() {
		try {
			let t = Number(typeof e == "function" ? e() : e);
			return Number.isFinite(t) ? Math.max(0, Math.floor(t)) : 0;
		} catch {
			return 0;
		}
	}
	function o() {
		try {
			let e = Number(t);
			return Number.isFinite(e) ? Math.max(1, Math.floor(e)) : 1;
		} catch {
			return 1;
		}
	}
	function s(e, t, n) {
		return e ? n > 0 ? t - Number(e.at || 0) > n : !1 : !0;
	}
	function c(e = i(), t = a()) {
		if (t > 0) for (let [n, i] of r.entries()) s(i, e, t) && r.delete(n);
	}
	function l() {
		let e = o();
		for (; r.size > e;) {
			let e = r.keys().next().value;
			if (e === void 0) break;
			r.delete(e);
		}
	}
	function u(e, t) {
		r.delete(e), r.set(e, t);
	}
	return {
		get(e) {
			let t = i(), n = a();
			c(t, n);
			let o = r.get(e);
			if (o) {
				if (s(o, t, n)) {
					r.delete(e);
					return;
				}
				return o.value;
			}
		},
		has(e) {
			return this.get(e) !== void 0;
		},
		set(e, t, n = {}) {
			let o = Number(n?.at), s = {
				value: t,
				at: Number.isFinite(o) ? o : i()
			};
			return r.has(e) ? u(e, s) : r.set(e, s), c(i(), a()), l(), t;
		},
		delete(e) {
			return r.delete(e);
		},
		clear() {
			r.clear();
		},
		prune() {
			return c(i(), a()), l(), r.size;
		},
		keys() {
			return this.prune(), Array.from(r.keys());
		},
		entries() {
			return this.prune(), Array.from(r.entries()).map(([e, t]) => [e, t.value]);
		},
		get size() {
			return this.prune(), r.size;
		}
	};
}
//#endregion
//#region ui/app/comfyApiBridge.ts
var S = null, C = null, ce = 50;
function w(e) {
	return !!e && typeof e == "object";
}
function T(e, t) {
	try {
		if (!e || typeof e != "object" && typeof e != "function") return null;
		let n = Object.getOwnPropertyDescriptor(e, t);
		return !n || !("value" in n) ? null : n.value;
	} catch {
		return null;
	}
}
function E(e) {
	return w(e) ? typeof e.fetchApi == "function" || typeof e.apiURL == "function" || w(e.settings) : !1;
}
function le(e) {
	return w(e) ? w(e.ui) || w(e.canvas) || w(e.graph) || typeof e.loadGraphData == "function" || E(e.api) : !1;
}
function ue(e) {
	return le(e) && (S = e), S;
}
function de(e) {
	return E(e) && (C = e), C;
}
function fe(e) {
	if (E(C)) return C;
	let t = w(e) ? e : D(), n = t?.api || t?.ui?.api || t?.ui?.app?.api || null;
	if (E(n)) return n;
	try {
		let e = typeof window < "u" ? T(window, "api") : null;
		if (E(e)) return e;
	} catch (e) {
		console.debug?.(e);
	}
	try {
		let e = typeof globalThis < "u" ? T(globalThis, "api") : null;
		if (E(e)) return e;
	} catch (e) {
		console.debug?.(e);
	}
	return null;
}
function D() {
	if (le(S)) return S;
	try {
		let e = typeof globalThis < "u" ? T(globalThis, "app") : null;
		if (le(e)) return e;
	} catch (e) {
		console.debug?.(e);
	}
	try {
		let e = typeof window < "u" ? T(window, "app") : null;
		if (le(e)) return e;
	} catch (e) {
		console.debug?.(e);
	}
	return null;
}
function pe(e) {
	let t = w(e) ? e : D();
	return !t || typeof t != "object" ? null : t?.ui?.settings || t?.settings || t?.ui?.api?.settings || t?.api?.settings || null;
}
function me(e, t) {
	let n = pe(e);
	if (!n) return null;
	for (let e of [
		"getSettingValue",
		"getSetting",
		"get"
	]) try {
		if (typeof n?.[e] == "function") {
			let r = n[e](t);
			if (r !== void 0) return r;
		}
	} catch {}
	try {
		let e = n?.settings || n?.values || null;
		if (e instanceof Map && e.has(t)) return e.get(t);
		if (e && typeof e == "object" && Object.hasOwn(e, t)) return e[t];
	} catch {
		return null;
	}
	return null;
}
function he(e, t, n) {
	let r = pe(e);
	if (!r) return !1;
	for (let e of [
		"setSettingValue",
		"setSetting",
		"set",
		"updateSetting"
	]) try {
		if (typeof r?.[e] == "function") return r[e](t, n), !0;
	} catch {}
	try {
		let e = r?.settings || r?.values || null;
		if (e instanceof Map) return e.set(t, n), !0;
		if (e && typeof e == "object") return e[t] = n, !0;
	} catch {
		return !1;
	}
	return !1;
}
function O(e) {
	let t = w(e) ? e : D();
	return t?.extensionManager || t?.ui?.extensionManager || null;
}
function ge(e) {
	let t = O(e);
	return w(t) && (t?.sidebarTabStore || t?.sidebarTab || t?.workspaceStore?.sidebarTab) || null;
}
function _e(e) {
	let t = O(e)?.toast || null;
	return t && typeof t.add == "function" ? t : null;
}
function ve(e) {
	let t = O(e)?.dialog || null;
	return t && (typeof t.alert == "function" || typeof t.confirm == "function" || typeof t.prompt == "function") ? t : null;
}
function ye(e, t) {
	let n = w(e) ? e : D(), r = O(n), i = ge(n), a = String(t || "").trim();
	if (!r || !a) return !1;
	let o = [
		"activateSidebarTab",
		"openSidebarTab",
		"selectSidebarTab",
		"setActiveSidebarTab",
		"showSidebarTab"
	];
	for (let e of [r, i]) if (e) for (let t of o) try {
		if (typeof e?.[t] == "function") return e[t](a), !0;
	} catch (e) {
		console.debug?.(e);
	}
	try {
		if (String(i?.activeSidebarTabId || i?.activeSidebarTab?.id || r?.activeSidebarTabId || r?.activeSidebarTab?.id || "").trim() === a) return !0;
		if (typeof i?.toggleSidebarTab == "function") return i.toggleSidebarTab(a), !0;
	} catch (e) {
		console.debug?.(e);
	}
	return !1;
}
function be(e, t) {
	let n = O(e), r = t && typeof t == "object" ? { ...t } : null;
	if (!n || !r) return !1;
	for (let e of ["registerCommand", "addCommand"]) try {
		if (typeof n?.[e] == "function") return n[e](r), !0;
	} catch (e) {
		console.debug?.(e);
	}
	return !1;
}
function xe(e, t) {
	let n = O(e), r = t && typeof t == "object" ? { ...t } : null;
	if (!n || !r) return !1;
	for (let e of ["registerKeybinding", "addKeybinding"]) try {
		if (typeof n?.[e] == "function") return n[e](r), !0;
	} catch (e) {
		console.debug?.(e);
	}
	return !1;
}
function Se(e, t) {
	try {
		let n = w(e) ? e : D(), r = n?.extensionManager || n?.ui?.extensionManager || null, i = ge(n);
		for (let e of [r, i]) if (e && typeof e.registerSidebarTab == "function") return e.registerSidebarTab(t), !0;
	} catch (e) {
		console.debug?.(e);
	}
	return !1;
}
function Ce(e) {
	return new Promise((t) => setTimeout(t, Math.max(0, Number(e) || 0)));
}
function we(e, t) {
	try {
		console.warn(`[Majoor] ${e} timed out after ${Math.max(0, Number(t) || 0)}ms`);
	} catch (e) {
		console.debug?.(e);
	}
}
async function Te({ timeoutMs: e = 4e3, intervalMs: t = ce, warnOnTimeout: n = !0, rejectOnTimeout: r = !1 } = {}) {
	let i = Date.now(), a = Math.max(0, Number(e) || 0);
	for (; Date.now() - i < a;) {
		let e = D();
		if (e && typeof e == "object") return e;
		await Ce(t);
	}
	let o = D();
	if (o && typeof o == "object") return o;
	if (n && we("waitForComfyApp", a), r) throw Error(`waitForComfyApp timeout after ${a}ms`);
	return null;
}
async function Ee({ app: e = null, timeoutMs: t = 4e3, intervalMs: n = ce, warnOnTimeout: r = !0, rejectOnTimeout: i = !1 } = {}) {
	let a = Date.now(), o = Math.max(0, Number(t) || 0);
	for (; Date.now() - a < o;) {
		let t = fe(e || D());
		if (t) return t;
		await Ce(n);
	}
	let s = fe(e || D());
	if (s) return s;
	if (r && we("waitForComfyApi", o), i) throw Error(`waitForComfyApi timeout after ${o}ms`);
	return null;
}
//#endregion
//#region ui/app/settings/SettingsStore.ts
var k = /* @__PURE__ */ new Map(), A = !1, j = null;
function De() {
	try {
		return typeof window > "u" ? null : window.localStorage || null;
	} catch {
		return null;
	}
}
function Oe(e, t, n) {
	let r = k.get(String(e || ""));
	if (!(!r || !r.size)) for (let i of Array.from(r)) try {
		i(t, n, e);
	} catch (e) {
		console.debug?.(e);
	}
}
function ke() {
	if (!A) try {
		j = (e) => {
			let t = String(e?.key || "");
			t && Oe(t, e?.newValue ?? null, e?.oldValue ?? null);
		}, window.addEventListener("storage", j), A = !0;
	} catch (e) {
		console.debug?.(e);
	}
}
var M = {
	get(e) {
		let t = De();
		if (!t) return null;
		try {
			return t.getItem(String(e || ""));
		} catch {
			return null;
		}
	},
	set(e, t) {
		let n = String(e || "");
		if (!n) return !1;
		let r = De();
		if (!r) return !1;
		let i = M.get(n);
		try {
			if (t == null) return r.removeItem(n), Oe(n, null, i), !0;
			let e = String(t);
			return r.setItem(n, e), Oe(n, e, i), !0;
		} catch {
			return !1;
		}
	},
	subscribe(e, t) {
		let n = String(e || "");
		if (!n || typeof t != "function") return () => {};
		ke();
		let r = k.get(n);
		return r || (r = /* @__PURE__ */ new Set(), k.set(n, r)), r.add(t), () => {
			try {
				let e = k.get(n);
				e?.delete(t), e && !e.size && k.delete(n);
			} catch (e) {
				console.debug?.(e);
			}
		};
	},
	getAll() {
		let e = {}, t = De();
		if (!t) return e;
		try {
			let n = Number(t.length || 0) || 0;
			for (let r = 0; r < n; r += 1) {
				let n = t.key(r);
				n && (e[n] = t.getItem(n));
			}
		} catch (e) {
			console.debug?.(e);
		}
		return e;
	},
	dispose() {
		try {
			A && j && typeof window < "u" && window.removeEventListener("storage", j);
		} catch (e) {
			console.debug?.(e);
		}
		A = !1, j = null, k.clear();
	}
}, N = "en-US", P = N, Ae = /* @__PURE__ */ new Set(), je = ["mjr_lang", "majoor.lang"], Me = "mjr_lang_follow_comfy", Ne = 500, F = /* @__PURE__ */ new Set(), I = null, Pe = new Set([
	"ar-SA",
	"fa-IR",
	"he-IL"
]), Fe = {
	fr: "fr-FR",
	"fr-fr": "fr-FR",
	fr_FR: "fr-FR",
	frfr: "fr-FR",
	en: "en-US",
	"en-us": "en-US",
	en_US: "en-US",
	enus: "en-US",
	"en-gb": "en-US",
	en_gb: "en-US",
	engb: "en-US",
	zh: "zh-CN",
	"zh-cn": "zh-CN",
	zh_CN: "zh-CN",
	zhcn: "zh-CN",
	"zh-tw": "zh-CN",
	zh_tw: "zh-CN",
	zhtw: "zh-CN",
	ja: "ja-JP",
	"ja-jp": "ja-JP",
	ja_jp: "ja-JP",
	jajp: "ja-JP",
	ko: "ko-KR",
	"ko-kr": "ko-KR",
	ko_kr: "ko-KR",
	kokr: "ko-KR",
	hi: "hi-IN",
	"hi-in": "hi-IN",
	hi_in: "hi-IN",
	hiin: "hi-IN",
	pt: "pt-PT",
	"pt-pt": "pt-PT",
	pt_pt: "pt-PT",
	ptpt: "pt-PT",
	"pt-br": "pt-PT",
	pt_br: "pt-PT",
	ptbr: "pt-PT",
	es: "es-ES",
	"es-es": "es-ES",
	es_es: "es-ES",
	eses: "es-ES",
	ru: "ru-RU",
	"ru-ru": "ru-RU",
	ru_ru: "ru-RU",
	ruru: "ru-RU",
	de: "de-DE",
	"de-de": "de-DE",
	de_de: "de-DE",
	dede: "de-DE",
	it: "it-IT",
	"it-it": "it-IT",
	it_it: "it-IT",
	itit: "it-IT",
	nl: "nl-NL",
	"nl-nl": "nl-NL",
	nl_nl: "nl-NL",
	nlnl: "nl-NL",
	pl: "pl-PL",
	"pl-pl": "pl-PL",
	pl_pl: "pl-PL",
	plpl: "pl-PL",
	tr: "tr-TR",
	"tr-tr": "tr-TR",
	tr_tr: "tr-TR",
	trtr: "tr-TR",
	vi: "vi-VN",
	"vi-vn": "vi-VN",
	vi_vn: "vi-VN",
	vivn: "vi-VN",
	cs: "cs-CZ",
	"cs-cz": "cs-CZ",
	cs_cz: "cs-CZ",
	cscz: "cs-CZ",
	fa: "fa-IR",
	"fa-ir": "fa-IR",
	fa_ir: "fa-IR",
	fair: "fa-IR",
	id: "id-ID",
	"id-id": "id-ID",
	id_id: "id-ID",
	idid: "id-ID",
	uk: "uk-UA",
	"uk-ua": "uk-UA",
	uk_ua: "uk-UA",
	ukua: "uk-UA",
	hu: "hu-HU",
	"hu-hu": "hu-HU",
	hu_hu: "hu-HU",
	huhu: "hu-HU",
	ar: "ar-SA",
	"ar-sa": "ar-SA",
	ar_sa: "ar-SA",
	arsa: "ar-SA",
	sv: "sv-SE",
	"sv-se": "sv-SE",
	sv_se: "sv-SE",
	svse: "sv-SE",
	ro: "ro-RO",
	"ro-ro": "ro-RO",
	ro_ro: "ro-RO",
	roro: "ro-RO",
	el: "el-GR",
	"el-gr": "el-GR",
	el_gr: "el-GR",
	elgr: "el-GR"
}, L = {
	"en-US": {
		"cat.grid": "Grid",
		"cat.cards": "Cards",
		"cat.badges": "Badges",
		"cat.viewer": "Viewer",
		"cat.floatingViewer": "Floating Viewer",
		"cat.scanning": "Scanning",
		"cat.advanced": "Advanced",
		"cat.security": "Security",
		"cat.remote": "Remote Access",
		"cat.search": "Search",
		"cat.feed": "Generated Feed",
		"setting.grid.minsize.name": "Majoor: Thumbnail Size (px)",
		"setting.grid.minsize.desc": "Minimum size of thumbnails in the grid. May require reopening the panel.",
		"setting.grid.cardSize.group": "Card size",
		"setting.grid.cardSize.name": "Majoor: Card Size",
		"setting.grid.cardSize.desc": "Choose a card size preset: small, medium, or large.",
		"setting.grid.cardSize.small": "Small",
		"setting.grid.cardSize.medium": "Medium",
		"setting.grid.cardSize.large": "Large",
		"setting.grid.gap.name": "Majoor: Gap (px)",
		"setting.grid.gap.desc": "Space between thumbnails.",
		"setting.sidebar.pos.name": "Majoor: Sidebar Position",
		"setting.sidebar.pos.desc": "Show details sidebar on the left or the right. Reload required.",
		"setting.siblings.hide.name": "Majoor: Hide PNG Siblings",
		"setting.siblings.hide.desc": "If a video has a corresponding .png preview, hide the .png from the grid.",
		"setting.nav.infinite.name": "Majoor: Infinite Scroll",
		"setting.nav.infinite.desc": "Automatically load more files when scrolling.",
		"setting.grid.pagesize.name": "Majoor: Grid Page Size",
		"setting.grid.pagesize.desc": "Number of assets loaded per page/request in the grid.",
		"setting.grid.videoAutoplayMode.name": "Majoor: Video Autoplay",
		"setting.grid.videoAutoplayMode.desc": "Controls video thumbnail playback in the grid. Off: static frame. Hover: play on mouse hover. Always: loop while visible.",
		"setting.grid.videoAutoplayMode.off": "Off",
		"setting.grid.videoAutoplayMode.hover": "Hover",
		"setting.grid.videoAutoplayMode.always": "Always",
		"setting.viewer.pan.name": "Majoor: Pan without Zoom",
		"setting.viewer.pan.desc": "Allow panning the image even at zoom level 1.",
		"setting.viewer.pauseExecution.name": "Majoor: Pause Main Viewer During Execution",
		"setting.viewer.pauseExecution.desc": "Pause the main viewer render processors while ComfyUI is generating to reduce competition for CPU/GPU.",
		"setting.viewer.floatingPauseExecution.name": "Majoor: Pause Floating Viewer During Execution",
		"setting.viewer.floatingPauseExecution.desc": "Pause the Floating Viewer during generation. Disable this if you want to keep live generation steps visible.",
		"setting.viewer.mfvLiveDefault.name": "Majoor: MFV Live Stream Enabled by Default",
		"setting.viewer.mfvLiveDefault.desc": "Controls whether Live Stream starts enabled when the Floating Viewer initializes or resets.",
		"setting.viewer.mfvPreviewDefault.name": "Majoor: MFV KSampler Preview Enabled by Default",
		"setting.viewer.mfvPreviewDefault.desc": "Controls whether KSampler preview starts enabled when the Floating Viewer initializes or resets.",
		"setting.viewer.mfvPreviewMethod.name": "Majoor: MFV Preview Method",
		"setting.viewer.mfvPreviewMethod.desc": "Preview mode forced by the Floating Viewer Run button. 'taesd' gives the best chance of getting previews, with latent2rgb fallback when available.",
		"setting.minimap.enabled.name": "Majoor: Enable Minimap",
		"setting.minimap.enabled.desc": "Global activation of the workflow minimap.",
		"setting.scan.startup.name": "Majoor: Auto-scan on Startup",
		"setting.scan.startup.desc": "Start a background scan as soon as ComfyUI loads.",
		"setting.watcher.name": "Majoor: File Watcher",
		"setting.watcher.desc": "Watch output and custom folders for manually added files and auto-index them in real time.",
		"setting.watcher.enabled.label": "Watcher enabled",
		"setting.watcher.debounce.name": "Majoor: Watcher debounce delay",
		"setting.watcher.debounce.desc": "Delay (ms) for batching watcher events before indexing.",
		"setting.watcher.debounce.label": "Watcher debounce (ms)",
		"setting.watcher.debounce.error": "Failed to update watcher debounce delay.",
		"setting.watcher.dedupe.name": "Majoor: Watcher dedupe window",
		"setting.watcher.dedupe.desc": "Duration (ms) a file is treated as already processed after an event.",
		"setting.watcher.dedupe.label": "Watcher dedupe window (ms)",
		"setting.watcher.dedupe.error": "Failed to update watcher dedupe window.",
		"setting.sync.rating.name": "Majoor: Sync Rating/Tags to Files",
		"setting.sync.rating.desc": "Write ratings and tags into file metadata (ExifTool).",
		"cat.badgeColors": "Badge colors",
		"setting.starColor": "Star color",
		"setting.starColor.tooltip": "Color of rating stars on thumbnails (hex, e.g. #FFD45A)",
		"setting.badgeImageColor": "Image badge color",
		"setting.badgeImageColor.tooltip": "Color for image badges: PNG, JPG, WEBP, GIF, BMP, TIF (hex)",
		"setting.badgeVideoColor": "Video badge color",
		"setting.badgeVideoColor.tooltip": "Color for video badges: MP4, WEBM, MOV, AVI, MKV (hex)",
		"setting.badgeAudioColor": "Audio badge color",
		"setting.badgeAudioColor.tooltip": "Color for audio badges: MP3, WAV, OGG, FLAC (hex)",
		"setting.badgeModel3dColor": "3D model badge color",
		"setting.badgeModel3dColor.tooltip": "Color for 3D model badges: OBJ, FBX, GLB, GLTF (hex)",
		"setting.badgeDuplicateAlertColor": "Duplicate alert badge color",
		"setting.badgeDuplicateAlertColor.tooltip": "Alert color used when duplicate extension badges are shown (e.g. PNG+).",
		"setting.obs.enabled.name": "Majoor: Enable Detailed Logs",
		"setting.obs.enabled.desc": "Enable detailed backend logs for debugging.",
		"setting.probe.mode.name": "Majoor: Metadata Backend",
		"setting.probe.mode.desc": "Choose the tool used directly to extract metadata.",
		"setting.language.name": "Majoor: Language",
		"setting.language.desc": "Choose the language for the Assets Manager interface. Reload required to fully apply.",
		"setting.search.maxResults.name": "Majoor: Search max results",
		"setting.search.maxResults.desc": "Maximum number of results returned by search endpoints.",
		"setting.ai.vector.enabled.name": "Enable AI semantic search",
		"setting.ai.vector.enabled.desc": "Enable CLIP-based semantic search. Disable to use keyword-only search.",
		"setting.sec.safe.name": "Majoor: Safe Mode",
		"setting.sec.safe.desc": "When enabled, rating/tags writes are blocked unless explicitly authorized.",
		"setting.sec.requireAuth.name": "Majoor: Require Token For All Writes",
		"setting.sec.requireAuth.desc": "Require the Majoor API token even for local loopback writes. Recommended when you want one consistent auth path everywhere.",
		"setting.sec.remoteLanPreset.name": "Majoor: Recommended Remote LAN Setup",
		"setting.sec.remoteLanPreset.desc": "One click helper for trusted home/LAN access. Majoor generates a strong token if needed, requires it for writes, and enables HTTP token transport automatically on plain-HTTP LAN sessions.",
		"setting.sec.remote.name": "Majoor: Allow Remote Full Access",
		"setting.sec.remote.desc": "Allow non-local clients to perform write operations. Disabling blocks writes unless a token is configured.",
		"setting.sec.insecureTransport.name": "Majoor: Allow HTTP Token Transport",
		"setting.sec.insecureTransport.desc": "Allow the Majoor API token over plain HTTP for trusted LAN setups. Unsafe on untrusted networks; HTTPS is preferred.",
		"setting.sec.write.name": "Majoor: Allow Write",
		"setting.sec.write.desc": "Allow writing ratings and tags.",
		"setting.sec.del.name": "Majoor: Allow Delete",
		"setting.sec.del.desc": "Allow deleting files.",
		"setting.sec.ren.name": "Majoor: Allow Rename",
		"setting.sec.ren.desc": "Allow renaming files.",
		"setting.sec.open.name": "Majoor: Allow Open in Folder",
		"setting.sec.open.desc": "Allow opening file location in OS file manager.",
		"setting.sec.reset.name": "Majoor: Allow Index Reset",
		"setting.sec.reset.desc": "Allow resetting the index cache and triggering a full rescan.",
		"setting.sec.token.name": "Majoor: API Token",
		"setting.sec.token.desc": "Store the write authorization token. Majoor inserts it in the Authorization and X-MJR-Token headers.",
		"setting.sec.token.placeholder": "Auto-generated for this browser session.",
		"setting.sec.token.placeholderConfigured": "Token configured on server ({tokenHint}). Leave blank to keep the current server token.",
		"setting.sec.token.placeholderConfiguredGeneric": "Token configured on server. Leave blank to keep the current server token.",
		"tab.output": "Output",
		"tab.input": "Input",
		"tab.all": "All",
		"tab.custom": "Custom",
		"tab.similar": "Similar",
		"manager.title": "Assets Manager",
		"manager.sidebarLabel": "Assets\nManager",
		"command.scanAssets": "Scan assets",
		"command.toggleFloatingViewer": "Toggle floating viewer",
		"command.refreshAssetsGrid": "Refresh assets grid",
		"bottomFeed.title": "Generated Feed",
		"label.floatingViewer": "Viewer",
		"bottomFeed.subtitle": "Lite output grid with recent and past generated assets",
		"bottomFeed.openManager": "Open Manager",
		"bottomFeed.refresh": "Refresh",
		"bottomFeed.loading": "Loading recent assets...",
		"bottomFeed.empty": "No generated assets yet.",
		"bottomFeed.loadFailed": "Failed to load generated assets.",
		"bottomFeed.groupTitle": "Generation group",
		"bottomFeed.groupOpen": "Show other assets from this generation",
		"btn.add": "Add",
		"btn.remove": "Remove",
		"btn.adding": "Adding...",
		"btn.removing": "Removing...",
		"btn.retry": "Retry",
		"btn.clear": "Clear",
		"btn.refresh": "Refresh",
		"btn.scan": "Scan",
		"btn.scanning": "Scanning...",
		"btn.resetIndex": "Reset index",
		"btn.resetting": "Resetting...",
		"btn.deleteDb": "Delete DB",
		"btn.deletingDb": "Deleting DB...",
		"btn.retryServices": "Retry services",
		"btn.retrying": "Retrying...",
		"btn.loadWorkflow": "Load Workflow",
		"btn.play": "Play",
		"btn.copyPrompt": "Copy Prompt",
		"btn.close": "Close",
		"btn.dbSave": "Save DB",
		"btn.dbRestore": "Restore DB",
		"btn.back": "Back",
		"btn.up": "Up",
		"btn.saving": "Saving...",
		"btn.restoring": "Restoring...",
		"btn.markAllRead": "Mark all read",
		"label.folder": "Folder",
		"label.type": "Type",
		"label.workflow": "Workflow",
		"label.rating": "Rating",
		"label.dateRange": "Date range",
		"label.agenda": "Agenda",
		"label.sort": "Sort",
		"label.scope": "Scope",
		"label.query": "Query",
		"label.only": "Only",
		"label.toastHistory": "History",
		"label.workflowType": "WF Type",
		"label.resolution": "Resolution",
		"label.fileSizeMB": "File size (MB)",
		"label.min": "Min",
		"label.max": "Max",
		"label.resolutionPx": "Resolution (px)",
		"label.compare": "Compare",
		"label.resolutionWxHpx": "Resolution WxH (px)",
		"label.resolutionMinWxH": "Min WxH (px)",
		"label.resolutionMaxWxH": "Max WxH (px)",
		"label.widthPx": "Width (px)",
		"label.heightPx": "Height (px)",
		"label.day": "Day",
		"label.collections": "Collections",
		"label.collection": "collection",
		"rating.title": "Rating: {n}",
		"rating.label": "Rating",
		"rating.setN": "Set rating to {n}",
		"tags.title": "Tags: {tags}",
		"tags.label": "Tags",
		"tags.addLabel": "Add tag",
		"tags.remove": "Remove tag",
		"tags.suggestions": "Tag suggestions",
		"label.messages": "Messages",
		"label.readMe": "Read Me",
		"label.userGuide": "User Guide",
		"label.info": "Info",
		"btn.giveStar": "Give a star",
		"label.filters": "Filters",
		"label.selectFolder": "Select folder?",
		"label.thisFolder": "this folder",
		"label.thisFile": "this file",
		"label.computer": "Computer",
		"search.placeholder": "Search assets...",
		"search.title": "Search by filename, tags, or attributes (e.g. rating:5, ext:png)",
		"search.semanticToggle": "Toggle AI semantic search (CLIP-based)",
		"search.aiSearch": "AI Search",
		"search.findSimilar": "Find Similar",
		"search.findingSimilar": "Finding similar assets...",
		"search.selectAssetForSimilar": "Select an asset first to find similar images/videos.",
		"search.findSimilarFailed": "Failed to find similar assets",
		"search.similarResults": "Similar to asset #{id} ({n} results)",
		"search.similarReference": "Reference #{id}",
		"search.similarDisabled": "AI features are disabled in settings",
		"action.copyToClipboard": "Copy to clipboard",
		"action.clickToCopy": "Click to copy",
		"tooltip.copyFieldValue": "Copy value",
		"tooltip.filterByFileType": "Filter by file type",
		"tooltip.filterWorkflowOnly": "Show only assets with embedded workflow data",
		"tooltip.filterMinRating": "Filter by minimum rating",
		"tooltip.filterByDateRange": "Filter by date range",
		"tooltip.widthPx": "Width in pixels",
		"tooltip.heightPx": "Height in pixels",
		"log.clipboardCopyFailed": "Failed to copy to clipboard",
		"tooltip.tab.all": "Browse all assets (inputs + outputs)",
		"tooltip.tab.input": "Browse input folder assets",
		"tooltip.tab.output": "Browse generated outputs",
		"tooltip.tab.custom": "Browse browser folders",
		"tooltip.tab.similar": "Browse current similar findings",
		"tooltip.browserFolders": "Browser folders",
		"tooltip.pinnedFolders": "Pinned folders",
		"tooltip.clearFilter": "Clear {label}",
		"tooltip.duplicateSuggestions": "Duplicate/similarity suggestions",
		"tooltip.closeSidebar": "Close sidebar",
		"tooltip.closeSidebarEsc": "Close sidebar (Esc)",
		"tooltip.supportKofi": "Buy Me a White Monster Drink",
		"tooltip.starGithub": "Open GitHub and give a star",
		"tooltip.sidebarTab": "Assets Manager - Browse and search your outputs",
		"tooltip.openMFV": "Open Majoor Floating Viewer",
		"tooltip.closeMFV": "Close Majoor Floating Viewer",
		"tooltip.openMessages": "Messages and updates",
		"tooltip.openMessagesUnread": "Messages ({count} unread)",
		"tooltip.markMessagesRead": "Mark all messages as read",
		"tooltip.noUnreadMessages": "No unread messages",
		"tooltip.deleteDb": "Force-delete database and rebuild from scratch",
		"tooltip.workflowMultiOutput": "Multiple outputs with different prompts",
		"tooltip.generationInputs": "Input files used in generation",
		"tooltip.videoFile": "Video file",
		"tooltip.minimapSettings": "Minimap settings",
		"tooltip.closeViewer": "Close viewer",
		"tooltip.popInViewer": "Return to floating panel",
		"tooltip.popOutViewer": "Pop out viewer to separate window",
		"tooltip.liveStreamOff": "Live Stream: OFF - click to follow final generation outputs",
		"tooltip.liveStreamOn": "Live Stream: ON - follows final generation outputs after execution",
		"tooltip.previewStreamOff": "KSampler Preview: OFF - click to stream sampler denoising frames",
		"tooltip.previewStreamOn": "KSampler Preview: ON - streams sampler denoising frames during execution",
		"tooltip.nodeStreamOff": "Node Stream: OFF - click to follow selected node previews, including ImageOps live canvases",
		"tooltip.nodeStreamOn": "Node Stream: ON - follows the selected node preview when frontend media exists",
		"tooltip.nodeParams": "Node Parameters",
		"tooltip.queuePrompt": "Queue Prompt (Run)",
		"tooltip.queueStop": "Stop Generation",
		"tooltip.captureView": "Save view as image",
		"tooltip.pendingRefresh": "Pending: metadata refresh in progress",
		"tooltip.noAssetsDay": "No assets on this day",
		"tooltip.deleteCollection": "Delete collection",
		"tooltip.viewerShortcuts": "Viewer keyboard shortcuts",
		"tooltip.singleViewMode": "Single view mode (one image)",
		"tooltip.compareOverlayMode": "A/B compare mode (overlay)",
		"tooltip.compareSideBySide": "Side-by-side comparison mode",
		"tooltip.colorChannels": "View color channels or luminance",
		"tooltip.scopesHistogram": "Show histogram/waveform scopes",
		"tooltip.gridOverlay": "Grid overlay (rule of thirds, center)",
		"tooltip.aspectRatioMask": "Aspect ratio overlay mask",
		"tooltip.compareBlendMode": "Compare blend mode",
		"tooltip.audioVisualizer": "Audio visualizer mode",
		"tooltip.exportFrame": "Save current frame as PNG",
		"tooltip.copyFrame": "Copy current frame to clipboard",
		"tooltip.resetExposure": "Reset exposure to 0",
		"tooltip.resetGamma": "Reset gamma to 1.00",
		"tooltip.resetInPoint": "Reset In point to start",
		"tooltip.resetOutPoint": "Reset Out point to end",
		"tooltip.maintenanceTools": "Database maintenance tools",
		"tooltip.resetPlayerControls": "Reset all viewer controls",
		"filter.all": "All",
		"filter.any": "Any",
		"filter.images": "Images",
		"filter.videos": "Videos",
		"filter.audio": "Audio",
		"filter.onlyWithWorkflow": "Only with workflow",
		"filter.anyRating": "Any rating",
		"filter.minStars": "{n}+ stars",
		"filter.resolutionAtLeast": "At least (>=)",
		"filter.resolutionAtMost": "At most (<=)",
		"filter.anytime": "Anytime",
		"filter.today": "Today",
		"filter.yesterday": "Yesterday",
		"filter.thisWeek": "This week",
		"filter.thisMonth": "This month",
		"filter.last7days": "Last 7 days",
		"filter.last30days": "Last 30 days",
		"group.core": "Core",
		"group.media": "Media",
		"group.time": "Time",
		"sort.newest": "Newest first",
		"sort.oldest": "Oldest first",
		"sort.nameAZ": "Name A-Z",
		"sort.nameZA": "Name Z-A",
		"sort.ratingHigh": "Rating (high)",
		"sort.ratingLow": "Rating (low)",
		"sort.sizeDesc": "Size (large)",
		"sort.sizeAsc": "Size (small)",
		"status.checking": "Checking...",
		"status.ready": "Ready",
		"status.scanning": "Scanning...",
		"status.error": "Error",
		"status.capabilities": "Capabilities",
		"status.toolStatus": "Tool status",
		"status.selectCustomFolder": "Select a custom folder first",
		"status.errorGetConfig": "Error: Failed to get config",
		"status.discoveringTools": "Capabilities: discovering tools...",
		"status.indexStatus": "Index Status",
		"status.toolStatusChecking": "Tool status: checking...",
		"status.resetIndexHint": "Reset index cache (requires allowResetIndex in settings).",
		"status.scanningHint": "This may take a while",
		"status.toolAvailable": "{tool} available",
		"status.toolUnavailable": "{tool} unavailable",
		"status.unknown": "unknown",
		"status.available": "available",
		"status.missing": "missing",
		"status.path": "Path",
		"status.pathAuto": "auto / not configured",
		"status.noAssets": "No assets indexed yet ({scope})",
		"status.clickToScan": "Click the dot to start a scan",
		"status.assetsIndexed": "{count} assets indexed ({scope})",
		"status.imagesVideos": "Images: {images}  -  Videos: {videos}",
		"status.withWorkflows": "With workflows: {workflows}  -  Generation data: {gendata}",
		"status.dbSize": "Database size: {size}",
		"status.lastScan": "Last scan: {date}",
		"status.scanStats": "Added: {added}  -  Updated: {updated}  -  Skipped: {skipped}",
		"status.watcher.enabled": "Watcher: enabled",
		"status.watcher.enabledScoped": "Watcher: enabled ({scope})",
		"status.watcher.disabled": "Watcher: disabled",
		"status.watcher.disabledScoped": "Watcher: disabled ({scope})",
		"status.apiNotFound": "Majoor API endpoints not found (404)",
		"status.apiNotFoundHint": "Backend routes are not loaded. Restart ComfyUI and check the terminal for Majoor import errors.",
		"status.errorChecking": "Error checking status",
		"status.dbCorrupted": "Database is corrupted",
		"status.dbCorruptedHint": "Use the \"Delete DB\" button below to force-delete and rebuild the index.",
		"status.retryFailed": "Retry failed",
		"status.customBrowserScanDisabled": "Scan is disabled in Browser scope",
		"status.customBrowserScanDisabledHint": "Use Outputs, Inputs, or All to run indexing scans",
		"status.dbBackupNone": "No DB backup available",
		"status.dbBackupSelectHint": "Select a DB backup to restore",
		"status.dbBackupLoading": "Loading DB backups...",
		"status.dbSaveHint": "Create a DB backup snapshot now.",
		"status.dbRestoreHint": "Restore selected DB backup and restart indexing.",
		"status.dbHealthLocked": "DB health: locked",
		"status.dbHealthOk": "DB health: ok",
		"status.dbHealthError": "DB health: error",
		"status.dbRestoreInProgress": "DB restore in progress",
		"status.enrichmentIdle": "idle",
		"status.enrichmentQueue": "Enrich queue: {count}",
		"status.maintenanceBusy": "Maintenance in progress",
		"status.scanInProgress": "Scan in progress",
		"status.scanInProgressHint": "Please wait for scan completion",
		"status.scanningScope": "Scanning scope: {scope}",
		"status.indexHealthOk": "Index health: ok",
		"status.indexHealthPartial": "Index health: partial",
		"status.indexHealthEmpty": "Index health: empty",
		"status.pending": "Pending",
		"status.toast.info": "Index status: checking",
		"status.toast.success": "Index status: ready",
		"status.toast.warning": "Index status: attention needed",
		"status.toast.error": "Index status: error",
		"status.toast.browser": "Index status: browser scope",
		"status.browserMetricsHidden": "Browser mode: global DB/index metrics hidden",
		"runtime.unavailable": "Runtime: unavailable",
		"runtime.metricsTitle": "Runtime Metrics\nDB active connections: {active}\nEnrichment queue: {enrichQ}\nWatcher pending files: {pending}",
		"runtime.metricsLine": "DB active: {active} | Enrich Q: {enrichQ} | Watcher pending: {pending}",
		"runtime.writeAuthActive": "Write auth: active {tokenHint}",
		"runtime.writeAuthMissing": "Write auth: missing in this browser {tokenHint}",
		"runtime.writeAuthRequired": "Write auth: required",
		"runtime.writeAuthNotRequired": "Write auth: not required",
		"runtime.writeAuthBlocked": "Write auth: writes blocked by server",
		"runtime.writeAuthUnknown": "Write auth: unknown",
		"scope.all": "Inputs + Outputs",
		"scope.allFull": "All (Inputs + Outputs)",
		"scope.input": "Inputs",
		"scope.output": "Outputs",
		"scope.custom": "Custom",
		"scope.customBrowser": "Browser",
		"scope.similar": "Similar",
		"tool.exiftool": "ExifTool metadata",
		"tool.exiftool.hint": "PNG/WEBP workflow data (uses ExifTool)",
		"tool.ffprobe": "FFprobe video stats",
		"tool.ffprobe.hint": "Video duration, FPS, and resolution (uses FFprobe)",
		"msg.noCollections": "No collections yet.",
		"msg.addCustomFolder": "Add a custom folder to browse.",
		"msg.noResults": "No results found.",
		"msg.loading": "Loading...",
		"msg.errorLoading": "Error loading",
		"msg.errorLoadingFolders": "Error loading folders",
		"msg.noGenerationData": "No generation data found for this file.",
		"msg.rawMetadata": "Raw metadata",
		"msg.noMessages": "No messages for now.",
		"msg.noPinnedFolders": "No pinned folders",
		"msg.noTagsYet": "No tags yet...",
		"msg.category.information": "Information",
		"msg.shortcuts.title": "Shortcut Guide",
		"msg.shortcuts.body": "All active shortcuts are grouped here by section so they stay visible inside Message Center.",
		"msg.shortcuts.intro": "Current keyboard shortcuts grouped by section for quick reference.",
		"msg.shortcuts.openGuide": "Open full guide",
		"msg.shortcuts.section.panel": "Global / Panel",
		"msg.shortcuts.section.grid": "Grid View",
		"msg.shortcuts.section.viewer": "Standard Viewer",
		"msg.shortcuts.section.mfv": "Floating Viewer",
		"msg.shortcuts.section.video": "Video Playback",
		"msg.category.release": "Release",
		"msg.whatsNew.title.dndGraphMapSettings": "New Version 2.4.8 - DnD, Graph Map & Settings",
		"msg.whatsNew.body.dndGraphMapSettings": "Version 2.4.8 released: Drag and Drop has been fixed and clarified, including canvas/node drops, staging behavior, visual feedback, and ComfyUI workflow-drop interactions. Graph Map in the Floating Viewer now lets you inspect embedded workflows without opening them on the canvas, copy nodes or attributes, and transfer node attributes to a similar selected node in the canvas. Settings access and explanations were also improved, with easier access from the panel gear icon and the Floating Viewer.",
		"msg.whatsNew.title.version246": "New Version 2.4.6",
		"msg.whatsNew.body.version246": "Version 2.4.6 released: Various bug fixes and performance & fluidity improvements. Improved concatenate support for default and custom nodes (by Forsion07). Added support helpers for Api Node and Ernie Image. Live Stream in Floating Viewer is now disabled by default. See CHANGELOG for details.",
		"msg.whatsNew.title.gridMfvToolboxUpgrade": "What's New — Grid & MFV Upgrade",
		"msg.whatsNew.body.gridMfvToolboxUpgrade": "Grid performance and fluidity have been improved. The Majoor Floating Viewer is no longer a light viewer only: it now includes advanced features such as Node Stream, Node Parameters, and direct node editing from inside the viewer. New tools were also added to the toolbox, alongside broader code corrections and cleanup.",
		"msg.tip.title.majoorImageOpsNodePack": "Do you know this node pack ?",
		"msg.tip.body.majoorImageOpsNodePack": "Discover Majoor ImageOps, a ComfyUI node pack with practical image operation nodes for your workflows.",
		"label.openNodePack": "Open Node Pack",
		"msg.tip.title.graphMapGuide": "Tip — Graph Map Guide",
		"msg.tip.body.graphMapGuide": "Graph Map now has its own documentation page with screenshots and a quick walkthrough. Open the guide to see how to read the workflow map, inspect selected nodes, and use the node detail actions.",
		"label.graphMapGuide": "Graph Map Guide",
		"msg.tip.title.mfvGuide": "Tip — MFV Guide",
		"msg.tip.body.mfvGuide": "MFV now has its own illustrated guide covering compare modes, A/B/C/D pins, streams, node parameters, run/stop, pop-out, and how Graph Map complements the viewer workflow.",
		"label.mfvGuide": "MFV Guide",
		"label.changelog": "Changelog",
		"label.settingsGuide": "Settings Guide",
		"msg.tip.title.mfvLivePreviewDefaults": "Tip — Floating Viewer Auto-Open",
		"msg.tip.body.mfvLivePreviewDefaults": "Live Stream (green button in the viewer) and KSampler Preview can be activated by default via Settings → Majoor Assets Manager › Viewer. Live Stream follows final generation outputs after execution. KSampler Preview streams denoising frames during execution. Selected-node previews are handled by Node Stream.",
		"msg.whatsNew.title.version243": "New Version 2.4.3",
		"msg.whatsNew.body.version243": "Version 2.4.3 released: Improved assets metadata parsing, Grid Compare capability in floating viewer up to 4 Assets, ping pong loop in main Viewer player, job id and stack id in DB for better assets management, stack assets generated from same workflow job with same job ID, generated feed feature, lite version of grid in bottom tab. Code refactor for maintainability and various bug fixes. See CHANGELOG for details.",
		"msg.whatsNew.title.version241": "New Version 2.4.1",
		"msg.whatsNew.body.version241": "Version 2.4.1 released: CLIP-based semantic search with AI toggle, rgthree/easy node support, shortcut guide tab, upscaler model extraction. Fixed MFV memory leaks, workflow filters, SQL placeholders. Enhanced geninfo extraction, tag handling, calendar. See CHANGELOG for details.",
		"msg.whatsNew.title.floatingViewerShortcuts": "What's New",
		"msg.whatsNew.body.floatingViewerShortcuts": "Floating Viewer keyboard shortcuts added: Open/close MFV with V, compare with C, Live Stream with L, and KSampler Preview with K. See the Shortcut Guide tab for the full list.",
		"msg.whatsNew.title.pinReference": "What's New",
		"msg.whatsNew.body.pinReference": "Floating Viewer: new Pin Reference feature. You can now pin A or B, then compare quickly with selected assets in the grid while keeping the fixed reference.",
		"msg.whatsNew.title.vectorResetKeepVectors": "Important",
		"msg.whatsNew.body.vectorResetKeepVectors": "Reset index and Delete DB now first ask whether to keep AI vectors. If you already have older indexed assets, keeping the vectors is recommended: a full reset without them can trigger a long Vector Backfill for old assets and temporarily increase RAM usage.",
		"msg.whatsNew.title.localUserGuide": "Need help?",
		"msg.whatsNew.body.localUserGuide": "Open the local User Guide directly from your Assets Manager custom_nodes folder.",
		"msg.category.development": "Development",
		"msg.development.title.vueRefactoring": "Vue 3 Refactoring",
		"msg.development.body.vueRefactoring": "Frontend modernization ongoing: Core UI components are being migrated to Vue 3 for better maintainability and compatibility with new ComfyUI frontend. This ensures long-term support and cleaner architecture.",
		"label.viewProgress": "View Progress",
		"msg.collectionAdd.added": "Added {added} item(s) to \"{name}\".",
		"msg.collectionAdd.skippedExisting": "Skipped {count} item(s): already present in the collection.",
		"msg.collectionAdd.skippedDuplicate": "Ignored {count} duplicate(s) in selection.",
		"msg.collectionAdd.noneAddedExisting": "No new items added to \"{name}\" (all exist).",
		"msg.nightlyUpdateTitle": "Nightly update available",
		"msg.nightlyUpdateDetail": "A newer nightly build is available. Download it here: https://github.com/MajoorWaldi/ComfyUI-Majoor-AssetsManager/releases/tag/nightly",
		"msg.newVersionTitle": "Majoor Assets Manager update available",
		"msg.newVersionDetail": "Version {latest} is available. You are currently using {current}.",
		"msg.dbResetNotice": "Database reset required",
		"viewer.genInfo": "Generation Info",
		"viewer.workflow": "Workflow",
		"viewer.metadata": "Metadata",
		"viewer.noWorkflow": "No workflow data",
		"viewer.noMetadata": "No metadata available",
		"viewer.copySuccess": "Copied to clipboard!",
		"viewer.copyFailed": "Failed to copy",
		"video.controls": "Video controls",
		"video.previewControls": "Video preview controls",
		"video.playPause": "Play/Pause",
		"video.playPauseSpace": "Play/Pause (Space)",
		"video.play": "Play",
		"video.pause": "Pause",
		"video.seek": "Seek",
		"video.seekThrough": "Seek through video",
		"video.dragSetIn": "Drag to set In",
		"video.dragSetOut": "Drag to set Out",
		"video.currentTimeTotal": "Current time / Total duration",
		"video.currentFrame": "Current frame number",
		"video.stepBack": "Step back",
		"video.stepForward": "Step forward",
		"video.goToIn": "Go to In",
		"video.goToOut": "Go to Out",
		"video.setInFromCurrent": "Set In from current frame",
		"video.setOutFromCurrent": "Set Out from current frame",
		"video.loopPlaybackInRange": "Loop playback in range",
		"video.pingpongPlayback": "Ping-pong playback (forward then reverse)",
		"video.loop": "Loop",
		"video.inFrame": "In frame",
		"video.outFrame": "Out frame",
		"video.frameIncrement": "Frame increment",
		"video.fpsStepping": "FPS (used for frame stepping)",
		"video.fps": "FPS",
		"video.playbackSpeed": "Playback speed",
		"video.mute": "Mute",
		"video.unmute": "Unmute",
		"video.volume": "Volume",
		"video.resetInToStart": "Reset In to start",
		"video.resetOutToEnd": "Reset Out to end",
		"video.step": "Step",
		"video.speed": "Speed",
		"video.resetPlayerControls": "Reset player controls",
		"sidebar.placeholderSelectAsset": "Select an asset to see details",
		"sidebar.details": "Details",
		"sidebar.preview": "Preview",
		"sidebar.rating": "Rating",
		"sidebar.tags": "Tags",
		"sidebar.addTag": "Add tag...",
		"sidebar.noTags": "No tags",
		"sidebar.filename": "Filename",
		"sidebar.dimensions": "Dimensions",
		"sidebar.date": "Date",
		"sidebar.size": "Size",
		"sidebar.genTime": "Generation time",
		"ctx.openViewer": "Open in viewer",
		"ctx.loadWorkflow": "Load workflow",
		"ctx.copyPath": "Copy path",
		"ctx.openInFolder": "Open in folder",
		"ctx.rename": "Rename",
		"ctx.delete": "Delete",
		"ctx.addToCollection": "Add to collection",
		"ctx.removeFromCollection": "Remove from collection",
		"ctx.newCollection": "New collection...",
		"ctx.rescanMetadata": "Rescan metadata",
		"ctx.createCollection": "Create collection...",
		"ctx.exitCollection": "Exit collection view",
		"ctx.createFolderHere": "Create folder here...",
		"ctx.renameFolder": "Rename folder...",
		"ctx.moveFolder": "Move folder...",
		"ctx.deleteFolder": "Delete folder...",
		"ctx.refreshMetadata": "Refresh metadata",
		"ctx.resetIndexFile": "Reset index (this file)",
		"ctx.openInNewTab": "Open in New Tab",
		"ctx.downloadOriginal": "Download Original",
		"ctx.download": "Download",
		"ctx.editTags": "Edit tags",
		"ctx.setRating": "Set rating",
		"ctx.resetRating": "Reset rating",
		"ctx.showMetadataPanel": "Show metadata panel",
		"ctx.unpinFolder": "Unpin folder",
		"ctx.openFolder": "Open folder",
		"ctx.pinAsBrowserRoot": "Pin as Browser Root",
		"dialog.confirm": "Confirm",
		"dialog.cancel": "Cancel",
		"dialog.yes": "Yes",
		"dialog.no": "No",
		"dialog.ok": "OK",
		"dialog.prompt": "Prompt",
		"dialog.choiceTypeNumber": "Type a number:",
		"dialog.delete.title": "Delete file?",
		"dialog.delete.msg": "Are you sure you want to delete this file? This cannot be undone.",
		"dialog.rename.title": "Rename file",
		"dialog.rename.placeholder": "New filename",
		"dialog.newCollection.title": "New collection",
		"dialog.newCollection.placeholder": "Collection name",
		"dialog.resetIndex.title": "Reset index?",
		"dialog.resetIndex.msg": "This will delete the database and rescan all files. Continue?",
		"dialog.securityWarning": "This looks like a system or very broad directory.\n\nAdding it can expose sensitive files via the viewer/custom roots feature.\n\nContinue?",
		"dialog.securityWarningTitle": "Majoor: Security Warning",
		"dialog.enterFolderPath": "Enter a folder path to add as a Custom root:",
		"dialog.customFoldersTitle": "Majoor: Custom Folders",
		"dialog.removeFolder": "Remove the custom folder \"{name}\"?",
		"dialog.deleteCollection": "Delete collection \"{name}\"?",
		"dialog.createCollection": "Create collection",
		"dialog.collectionPlaceholder": "My collection",
		"dialog.browserRootLabelOptional": "Label for new browser root (optional)",
		"dialog.newFolderName": "New folder name",
		"dialog.renameFolder": "Rename folder",
		"dialog.destinationDirectoryPath": "Destination directory path",
		"dialog.deleteFolderRecursive": "Delete folder \"{name}\" and all contents?",
		"dialog.folderLabelOptional": "Folder label (optional)",
		"dialog.unpinFolder": "Unpin folder \"{name}\"?",
		"dialog.dbRestore.confirm": "Restore selected DB backup? This will replace current DB.",
		"dialog.mergeDuplicateTags": "Merge duplicate tags?",
		"dialog.deleteExactDuplicates": "Delete exact duplicates?",
		"dialog.startDuplicateAnalysis": "Start duplicate analysis?",
		"dialog.dbDelete.confirm": "This will permanently delete the index database and rebuild it from scratch. All ratings, tags, and cached metadata will be lost.\n\nContinue?",
		"dialog.settingsSaveFailed": "Majoor: Failed to save settings (browser storage full or blocked).",
		"dialog.confirmDeleteTitle": "Majoor: Confirm delete",
		"dialog.deleteSelectedFiles": "Delete {count} selected files?",
		"dialog.deleteSingleFile": "Delete \"{label}\"?",
		"dialog.vectorsReset.title": "AI vectors",
		"dialog.vectorsReset.choice": "Also reset AI vectors?\n\nConfirm = yes, reset everything (vectors will be recalculated)\nCancel = no, keep existing vectors",
		"dialog.vectorsReset.keepQuestion": "Keep existing AI vectors?\n\nConfirm = keep vectors\nCancel = continue without vectors",
		"dialog.vectorsReset.wipeConfirm": "Reset AI vectors too?\n\nConfirm = yes, reset everything\nCancel = abort",
		"dialog.vectorsReset.singleQuestion": "Choose reset mode for {action}:\n\nYes = keep existing AI vectors\nNo = full reset (vectors will be recalculated)\nCancel = abort",
		"dialog.vectorsReset.optionKeep": "Yes - keep vectors",
		"dialog.vectorsReset.optionFull": "No - full reset",
		"dialog.vectorsReset.optionCancel": "Cancel",
		"dialog.resetIndex.confirmKeepVectors": "This will reset index data and rescan files while keeping existing AI vectors.\n\nContinue?",
		"dialog.dbDelete.keepVectorsConfirm": "This will reset index data and keep existing AI vectors. Database files will not be force-deleted.\n\nContinue?",
		"toast.scanStarted": "Scan started",
		"toast.scanComplete": "Scan complete",
		"toast.scanFailed": "Scan failed",
		"toast.resetTriggered": "Reset triggered: Reindexing all files...",
		"toast.resetStarted": "Index reset started. Files will be reindexed in the background.",
		"toast.resetFailed": "Failed to reset index",
		"toast.resetFailedCorrupt": "Reset failed – database is corrupted. Use the \"Delete DB\" button to force-delete and rebuild.",
		"toast.dbDeleteTriggered": "Deleting database and rebuilding...",
		"toast.dbDeleteSuccess": "Database deleted and rebuilt. Files are being reindexed.",
		"toast.dbDeleteFailed": "Failed to delete database",
		"toast.deleted": "File deleted",
		"toast.renamed": "File renamed",
		"toast.addedToCollection": "Added to collection",
		"toast.removedFromCollection": "Removed from collection",
		"toast.collectionCreated": "Collection created",
		"toast.permissionDenied": "Permission denied",
		"toast.tagAdded": "Tag added",
		"toast.tagRemoved": "Tag removed",
		"toast.ratingSaved": "Rating saved",
		"toast.failedAddFolder": "Failed to add custom folder",
		"toast.failedRemoveFolder": "Failed to remove custom folder",
		"toast.folderLinked": "Folder linked successfully",
		"toast.folderRemoved": "Folder removed",
		"toast.errorAddingFolder": "An error occurred while adding the custom folder",
		"toast.errorRemovingFolder": "An error occurred while removing the custom folder",
		"toast.failedCreateCollection": "Failed to create collection",
		"toast.failedDeleteCollection": "Failed to delete collection",
		"toast.languageChanged": "Language changed. Reload the page for full effect.",
		"toast.ratingUpdateFailed": "Failed to update rating",
		"toast.ratingUpdateError": "Error updating rating",
		"toast.tagsUpdateFailed": "Failed to update tags",
		"toast.watcherToggleFailed": "Failed to toggle watcher",
		"toast.noValidAssetsSelected": "No valid assets selected.",
		"toast.failedCreateCollectionDot": "Failed to create collection.",
		"toast.failedAddAssetsToCollection": "Failed to add assets to collection.",
		"toast.failedCreateSmartCollection": "Failed to create smart collection",
		"toast.failedAddAssetsToSmartCollection": "Failed to add assets to smart collection",
		"toast.noGroupsFoundIndexFirst": "No groups found. Index more assets first.",
		"toast.failedLoadClusterAssets": "Failed to load cluster assets",
		"toast.collectionCreatedWithAssets": "Collection \"{name}\" created with {count} assets!",
		"toast.collectionCreatedNamed": "Collection \"{name}\" created.",
		"toast.clusterAnalysisFailed": "Cluster analysis failed",
		"toast.removeFromCollectionFailed": "Failed to remove from collection.",
		"toast.removeFromCollectionError": "Error removing from collection: {error}",
		"toast.copyClipboardFailed": "Failed to copy to clipboard",
		"toast.metadataRefreshFailed": "Failed to refresh metadata.",
		"toast.ratingCleared": "Rating cleared",
		"toast.ratingSetN": "Rating set to {n} stars",
		"toast.tagsUpdated": "Tags updated",
		"toast.remoteLanPresetApplied": "Recommended remote LAN setup applied. This browser session is now authorized for Majoor write operations.",
		"toast.remoteLanPresetFailed": "Failed to apply the recommended remote LAN setup.",
		"toast.createFolderFailed": "Failed to create folder",
		"toast.createFolderFailedDetail": "Failed to create folder: {error}",
		"toast.renameFolderFailed": "Failed to rename folder",
		"toast.renameFolderFailedDetail": "Failed to rename folder: {error}",
		"toast.moveFolderFailed": "Failed to move folder",
		"toast.moveFolderFailedDetail": "Failed to move folder: {error}",
		"toast.deleteFolderFailed": "Failed to delete folder",
		"toast.deleteFolderFailedDetail": "Failed to delete folder: {error}",
		"toast.folderCreated": "Folder created: {name}",
		"toast.folderRenamed": "Folder renamed",
		"toast.folderMoved": "Folder moved",
		"toast.folderDeleted": "Folder deleted",
		"toast.pinFolderFailed": "Failed to pin folder",
		"toast.unpinFolderFailed": "Failed to unpin folder",
		"toast.folderPinnedAsBrowserRoot": "Folder pinned as browser root",
		"toast.folderAdded": "Folder added",
		"toast.dbSaveSuccess": "DB backup saved",
		"toast.dbSaveFailed": "Failed to save DB backup",
		"toast.dbRestoreStarted": "DB restore started",
		"toast.dbRestoreFailed": "Failed to restore DB backup",
		"toast.dbRestoreSelect": "Select a DB backup first",
		"toast.dbRestoreStopping": "Stopping running workers",
		"toast.dbRestoreResetting": "Unlocking and resetting database",
		"toast.dbRestoreReplacing": "Replacing database files",
		"toast.dbRestoreRescan": "Restarting scan",
		"toast.dbRestoreSuccess": "Database backup restored",
		"toast.nameCollisionInView": "Name collision in current view",
		"toast.fileRenamedSuccess": "File renamed successfully!",
		"toast.fileRenameFailed": "Failed to rename file.",
		"toast.fileDeletedSuccess": "File deleted successfully!",
		"toast.fileDeleteFailed": "Failed to delete file.",
		"toast.openedInFolder": "Opened in folder",
		"toast.openFolderFailed": "Failed to open folder.",
		"toast.pathCopied": "File path copied to clipboard",
		"toast.unableResolveFolderPath": "Unable to resolve folder path",
		"toast.pathCopyFailed": "Failed to copy path",
		"toast.noFilePath": "No file path available for this asset.",
		"toast.writeAuthBootstrapHelp": "Write access is blocked. Sign in to ComfyUI and retry so Majoor can bootstrap the remote session automatically, or set a Majoor API token in Settings -> Security.",
		"toast.writeAuthSignInRequired": "Write access is blocked. Sign in to ComfyUI first, then retry so Majoor can bootstrap the remote session token automatically.",
		"toast.writeAuthConfiguredTokenRequired": "Write access requires the Majoor API token already configured on the server. Open Settings -> Security -> API Token and enter the matching token.",
		"toast.writeAuthTitle": "Majoor remote write access",
		"toast.vectorBackfillStarting": "Starting vector backfill... This may take a while.",
		"toast.vectorBackfillRunning": "Vector backfill still running in background{job}.",
		"toast.vectorBackfillComplete": "Vector backfill complete! Processed: {processed}, Indexed: {indexed}, Skipped: {skipped}",
		"toast.vectorBackfillFailedGeneric": "Backfill failed",
		"toast.vectorBackfillFailedDetail": "Vector backfill failed: {error}",
		"toast.aiSearchPartiallyIndexed": "AI search index is only partially built ({indexed}/{eligible}, {percent}%). Run Vector Backfill for existing assets.",
		"toast.rescanUpdatingAiIndex": "Rescanning file + updating AI index...",
		"toast.metadataVectorUpdated": "Metadata + AI vector index updated for this asset.",
		"toast.metadataUpdatedVectorFailed": "Metadata updated. AI vector index could not be updated.",
		"toast.downloadingFile": "Downloading {filename}...",
		"toast.playbackRate": "Playback {rate}x",
		"toast.metadataRefreshed": "Metadata refreshed{suffix}",
		"toast.enrichmentComplete": "Metadata enrichment complete",
		"toast.errorRenaming": "Error renaming file: {error}",
		"toast.errorDeleting": "Error deleting file: {error}",
		"toast.tagMergeFailed": "Tag merge failed: {error}",
		"toast.deleteFailed": "Delete failed: {error}",
		"toast.analysisNotStarted": "Analysis not started: {error}",
		"toast.dupAnalysisStarted": "Duplicate analysis started",
		"toast.tagsMerged": "Tags merged",
		"toast.duplicatesDeleted": "Duplicates deleted",
		"toast.playbackVideoOnly": "Playback speed is available for video media only",
		"toast.filesDeletedSuccessN": "{n} files deleted successfully!",
		"toast.filesDeletedPartial": "{success} files deleted, {failed} failed.",
		"toast.filesDeletedShort": "{n} files deleted",
		"toast.filesDeletedShortPartial": "{success} deleted, {failed} failed",
		"toast.copiedToClipboardNamed": "{name} copied to clipboard!",
		"toast.rescanningFile": "Rescanning file",
		"toast.failedToggleWatcher": "Failed to toggle watcher",
		"toast.failedUpdateMetadataFallback": "Failed to update metadata fallback settings",
		"toast.failedSetIndexDirectory": "Failed to set index directory",
		"toast.indexDirectorySavedRestart": "Index directory saved. Restart ComfyUI to apply.",
		"toast.failedSetOutputDirectory": "Failed to set output directory",
		"toast.nativeBrowserUnavailable": "Native folder browser unavailable. Please enter path manually.",
		"summary.assets": "assets",
		"summary.folders": "folders",
		"summary.selected": "selected",
		"summary.hidden": "hidden",
		"summary.duplicates": "duplicates",
		"summary.similar": "similar",
		"hotkey.scan": "Scan (S)",
		"hotkey.search": "Search (Ctrl+F)",
		"hotkey.details": "Toggle details (D)",
		"hotkey.delete": "Delete (Del)",
		"hotkey.viewer": "Open viewer (Enter)",
		"hotkey.escape": "Close (Esc)"
	},
	"fr-FR": {
		"tab.output": "Sortie",
		"tab.input": "Entree",
		"tab.all": "Tout",
		"tab.custom": "Navigateur",
		"tab.similar": "Similaire",
		"manager.title": "Gestionnaire d'assets",
		"manager.sidebarLabel": "Assets\nManager",
		"cat.feed": "Flux genere",
		"command.scanAssets": "Scanner les assets",
		"command.toggleFloatingViewer": "Basculer le floating viewer",
		"command.refreshAssetsGrid": "Rafraichir la grille d'assets",
		"bottomFeed.title": "Flux Genere",
		"label.floatingViewer": "Viewer",
		"bottomFeed.subtitle": "Version legere de la grille output avec assets recents et anciens",
		"bottomFeed.openManager": "Ouvrir le manager",
		"bottomFeed.refresh": "Rafraichir",
		"bottomFeed.loading": "Chargement des assets recents...",
		"bottomFeed.empty": "Aucun asset genere pour le moment.",
		"bottomFeed.loadFailed": "Impossible de charger les assets generes.",
		"bottomFeed.groupTitle": "Groupe de generation",
		"bottomFeed.groupOpen": "Afficher les autres assets de cette generation",
		"scope.all": "Entrees + Sorties",
		"scope.allFull": "Tout (Entrees + Sorties)",
		"scope.input": "Entrees",
		"scope.output": "Sorties",
		"scope.custom": "Navigateur",
		"scope.customBrowser": "Navigateur",
		"scope.similar": "Similaire",
		"search.placeholder": "Rechercher des assets...",
		"search.title": "Rechercher par nom de fichier, tags ou attributs (ex. rating:5, ext:png)",
		"search.semanticToggle": "Activer/desactiver la recherche semantique IA (CLIP)",
		"search.aiSearch": "Recherche IA",
		"search.findSimilar": "Trouver similaires",
		"search.findingSimilar": "Recherche d'assets similaires...",
		"search.selectAssetForSimilar": "Selectionnez d'abord un asset pour trouver des images/videos similaires.",
		"search.findSimilarFailed": "Echec de la recherche similaire",
		"search.similarResults": "Similaires a l'asset #{id} ({n} resultats)",
		"search.similarReference": "Reference #{id}",
		"search.similarDisabled": "Les fonctionnalites IA sont desactivees dans les parametres",
		"tooltip.openMessages": "Messages et nouveautes",
		"tooltip.openMessagesUnread": "Messages ({count} non lus)",
		"tooltip.markMessagesRead": "Marquer tous les messages comme lus",
		"tooltip.previewStreamOff": "Preview KSampler : OFF - cliquer pour afficher les images de denoising pendant l'execution",
		"tooltip.previewStreamOn": "Preview KSampler : ON - affiche les images de denoising pendant l'execution",
		"tooltip.nodeStreamOff": "Node Stream : OFF - cliquer pour suivre les previews du noeud selectionne, dont les canvas live ImageOps",
		"tooltip.nodeStreamOn": "Node Stream : ON - suit la preview du noeud selectionne quand un media frontend existe",
		"tooltip.nodeParams": "Parametres du noeud",
		"tooltip.queuePrompt": "Lancer le prompt",
		"tooltip.queueStop": "Arreter la generation",
		"tooltip.noUnreadMessages": "Aucun message non lu",
		"label.toastHistory": "Historique",
		"tooltip.tab.similar": "Parcourir les trouvailles similaires courantes",
		"setting.ai.vector.enabled.name": "Activer la recherche semantique IA",
		"setting.ai.vector.enabled.desc": "Active la recherche semantique basee sur CLIP. Desactivez pour une recherche par mots-cles uniquement.",
		"setting.viewer.pauseExecution.name": "Majoor : Pause du viewer principal pendant l'execution",
		"setting.viewer.pauseExecution.desc": "Met en pause les processeurs de rendu du viewer principal pendant une generation ComfyUI pour reduire la concurrence CPU/GPU.",
		"setting.viewer.floatingPauseExecution.name": "Majoor : Pause du Floating Viewer pendant l'execution",
		"setting.viewer.floatingPauseExecution.desc": "Met en pause le Floating Viewer pendant la generation. Desactivez cette option pour garder les steps visibles en direct.",
		"setting.viewer.mfvPreviewMethod.name": "Majoor : Methode de preview MFV",
		"setting.viewer.mfvPreviewMethod.desc": "Mode de preview force par le bouton Run du Floating Viewer. 'taesd' donne la meilleure chance d'avoir un preview, avec repli sur latent2rgb quand c'est possible.",
		"runtime.unavailable": "Runtime indisponible",
		"runtime.metricsTitle": "Metriques runtime\nConnexions DB actives : {active}\nFile enrichissement : {enrichQ}\nFichiers watcher en attente : {pending}",
		"runtime.metricsLine": "DB active : {active} | File enrich. : {enrichQ} | Watcher en attente : {pending}",
		"runtime.writeAuthActive": "Auth ecriture : active {tokenHint}",
		"runtime.writeAuthMissing": "Auth ecriture : absente dans ce navigateur {tokenHint}",
		"runtime.writeAuthRequired": "Auth ecriture : requise",
		"runtime.writeAuthNotRequired": "Auth ecriture : non requise",
		"runtime.writeAuthBlocked": "Auth ecriture : ecritures bloquees par le serveur",
		"runtime.writeAuthUnknown": "Auth ecriture : inconnue",
		"status.runtimeProgress": "Progression runtime : {value}/{max}",
		"status.queueRemaining": "File restante : {count}",
		"status.executionCached": "Noeuds en cache reutilises : {count}",
		"status.activePrompt": "Prompt actif : {id}",
		"btn.dbSave": "Sauvegarder BDD",
		"btn.dbRestore": "Restaurer BDD",
		"btn.back": "Retour",
		"btn.up": "Monter",
		"btn.saving": "Sauvegarde...",
		"btn.restoring": "Restauration...",
		"btn.markAllRead": "Tout marquer lu",
		"ctx.pinAsBrowserRoot": "Epingler comme racine Browser",
		"ctx.createFolderHere": "Creer dossier ici...",
		"ctx.renameFolder": "Renommer dossier...",
		"ctx.moveFolder": "Deplacer dossier...",
		"ctx.deleteFolder": "Supprimer dossier...",
		"ctx.refreshMetadata": "Rafraichir metadonnees",
		"ctx.openFolder": "Ouvrir dossier",
		"dialog.browserRootLabelOptional": "Label pour nouvelle racine browser (optionnel)",
		"dialog.newFolderName": "Nom du nouveau dossier",
		"dialog.renameFolder": "Renommer dossier",
		"dialog.destinationDirectoryPath": "Chemin dossier destination",
		"dialog.deleteFolderRecursive": "Supprimer le dossier \"{name}\" et tout son contenu ?",
		"dialog.settingsSaveFailed": "Majoor : echec sauvegarde des parametres (stockage navigateur plein ou bloque).",
		"dialog.yes": "Oui",
		"dialog.no": "Non",
		"dialog.ok": "OK",
		"dialog.prompt": "Saisie",
		"dialog.choiceTypeNumber": "Entrez un numero :",
		"dialog.confirmDeleteTitle": "Majoor : confirmer suppression",
		"dialog.deleteSelectedFiles": "Supprimer {count} fichiers selectionnes ?",
		"dialog.deleteSingleFile": "Supprimer \"{label}\" ?",
		"dialog.vectorsReset.title": "Vecteurs IA",
		"dialog.vectorsReset.choice": "Reinitialiser aussi les vecteurs IA ?\n\nConfirmer = oui, tout reinitialiser (les vecteurs seront recalcules)\nAnnuler = non, conserver les vecteurs existants",
		"dialog.vectorsReset.keepQuestion": "Conserver les vecteurs IA existants ?\n\nConfirmer = conserver les vecteurs\nAnnuler = continuer sans vecteurs",
		"dialog.vectorsReset.wipeConfirm": "Reinitialiser aussi les vecteurs IA ?\n\nConfirmer = oui, tout reinitialiser\nAnnuler = abandonner",
		"dialog.vectorsReset.singleQuestion": "Choisissez le mode de reinitialisation pour {action} :\n\nOui = conserver les vecteurs IA existants\nNon = reinitialisation complete (les vecteurs seront recalcules)\nAnnuler = abandonner",
		"dialog.vectorsReset.optionKeep": "Oui - conserver vecteurs",
		"dialog.vectorsReset.optionFull": "Non - reinit complete",
		"dialog.vectorsReset.optionCancel": "Annuler",
		"dialog.resetIndex.confirmKeepVectors": "Cette action reinitialise l'index et relance le scan en conservant les vecteurs IA existants.\n\nContinuer ?",
		"dialog.dbDelete.keepVectorsConfirm": "Cette action reinitialise l'index et conserve les vecteurs IA existants. Les fichiers DB ne seront pas supprimes de force.\n\nContinuer ?",
		"toast.createFolderFailed": "Echec creation dossier",
		"toast.renameFolderFailed": "Echec renommage dossier",
		"toast.moveFolderFailed": "Echec deplacement dossier",
		"toast.deleteFolderFailed": "Echec suppression dossier",
		"toast.folderCreated": "Dossier cree : {name}",
		"toast.folderRenamed": "Dossier renomme",
		"toast.folderMoved": "Dossier deplace",
		"toast.folderDeleted": "Dossier supprime",
		"toast.pinFolderFailed": "Echec epinglage dossier",
		"toast.folderPinnedAsBrowserRoot": "Dossier epingle comme racine browser",
		"toast.failedCreateSmartCollection": "Echec creation collection intelligente",
		"toast.failedAddAssetsToSmartCollection": "Echec ajout des assets a la collection intelligente",
		"toast.noGroupsFoundIndexFirst": "Aucun groupe trouve. Indexez plus d'assets d'abord.",
		"toast.failedLoadClusterAssets": "Echec chargement assets du cluster",
		"toast.collectionCreatedWithAssets": "Collection \"{name}\" creee avec {count} assets !",
		"toast.collectionCreatedNamed": "Collection \"{name}\" creee.",
		"toast.clusterAnalysisFailed": "Echec analyse des clusters",
		"toast.vectorBackfillStarting": "Demarrage du vector backfill... Cela peut prendre du temps.",
		"toast.vectorBackfillRunning": "Le vector backfill continue en arriere-plan{job}.",
		"toast.vectorBackfillComplete": "Vector backfill termine ! Traites : {processed}, Indexes : {indexed}, Ignores : {skipped}",
		"toast.vectorBackfillFailedGeneric": "Echec du backfill",
		"toast.vectorBackfillFailedDetail": "Echec du vector backfill : {error}",
		"toast.aiSearchPartiallyIndexed": "L'index de recherche IA n'est que partiellement construit ({indexed}/{eligible}, {percent} %). Lancez Vector Backfill pour les assets existants.",
		"toast.rescanUpdatingAiIndex": "Rescan du fichier + mise a jour index IA...",
		"toast.metadataVectorUpdated": "Metadonnees + index vectoriel IA mis a jour pour cet asset.",
		"toast.metadataUpdatedVectorFailed": "Metadonnees mises a jour. L'index vectoriel IA n'a pas pu etre mis a jour.",
		"label.computer": "Ordinateur",
		"label.collection": "collection",
		"rating.title": "Note : {n}",
		"rating.label": "Note",
		"rating.setN": "Definir la note a {n}",
		"tags.title": "Tags : {tags}",
		"tags.label": "Tags",
		"tags.addLabel": "Ajouter un tag",
		"tags.remove": "Supprimer le tag",
		"tags.suggestions": "Suggestions de tags",
		"label.thisFile": "ce fichier",
		"label.messages": "Messages",
		"label.readMe": "Read Me",
		"label.userGuide": "Guide utilisateur",
		"label.info": "Info",
		"btn.giveStar": "Mettre une etoile",
		"label.resolutionMinWxH": "Min LxH (px)",
		"label.resolutionMaxWxH": "Max LxH (px)",
		"msg.noMessages": "Aucun message pour le moment.",
		"msg.noPinnedFolders": "Aucun dossier epingle",
		"sidebar.placeholderSelectAsset": "Selectionnez un asset pour voir les details",
		"msg.noTagsYet": "Aucun tag pour le moment...",
		"msg.category.information": "Information",
		"msg.shortcuts.title": "Guide des raccourcis",
		"msg.shortcuts.body": "Tous les raccourcis actifs sont regroupes ici par section pour rester visibles dans le Message Center.",
		"msg.shortcuts.intro": "Raccourcis clavier actuels groupes par section pour consultation rapide.",
		"msg.shortcuts.openGuide": "Ouvrir le guide complet",
		"msg.shortcuts.section.panel": "Global / Panneau",
		"msg.shortcuts.section.grid": "Vue grille",
		"msg.shortcuts.section.viewer": "Viewer standard",
		"msg.shortcuts.section.mfv": "Floating Viewer",
		"msg.shortcuts.section.video": "Lecture video",
		"msg.category.release": "Version",
		"msg.whatsNew.title.dndGraphMapSettings": "Nouvelle Version 2.4.8 - DnD, Graph Map et Parametres",
		"msg.whatsNew.body.dndGraphMapSettings": "Version 2.4.8 publiee : le Drag and Drop a ete corrige et clarifie, y compris pour le depot sur canvas/noeud, le comportement de staging, le feedback visuel et les interactions avec le workflow-drop de ComfyUI. Graph Map dans le Floating Viewer permet maintenant d'inspecter les workflows embarques sans les ouvrir sur le canvas, de copier des noeuds ou leurs attributs, et de transferer les attributs d'un noeud vers un noeud similaire selectionne sur le canvas. L'acces aux parametres et leurs explications ont aussi ete ameliores, avec un acces plus simple depuis l'icone engrenage du panneau et depuis le Floating Viewer.",
		"msg.whatsNew.title.version246": "Nouvelle Version 2.4.6",
		"msg.whatsNew.body.version246": "Version 2.4.6 publiee : divers correctifs de bugs et ameliorations de performances et fluidite. Support concatenate ameliore pour les nodes par defaut et custom (par Forsion07). Ajout des helpers pour Api Node et Ernie Image. Le Live Stream du Floating Viewer est desormais desactive par defaut. Voir CHANGELOG pour details.",
		"msg.whatsNew.title.gridMfvToolboxUpgrade": "Quoi de neuf — upgrade Grid et MFV",
		"msg.whatsNew.body.gridMfvToolboxUpgrade": "Les performances et la fluidite de la grid ont ete ameliorees. Le Majoor Floating Viewer n'est plus seulement un viewer light : il integre maintenant des fonctions avancees comme Node Stream, Node Parameters et l'edition directe des nodes depuis le viewer. De nouveaux outils ont aussi ete ajoutes dans la toolbox, avec en plus plusieurs corrections et nettoyages de code.",
		"msg.tip.title.majoorImageOpsNodePack": "Do you know this node pack ?",
		"msg.tip.body.majoorImageOpsNodePack": "Decouvrez Majoor ImageOps, un node pack ComfyUI avec des nodes pratiques pour les operations d'image dans vos workflows.",
		"label.openNodePack": "Ouvrir le node pack",
		"msg.tip.title.graphMapGuide": "Conseil — Guide Graph Map",
		"msg.tip.body.graphMapGuide": "Graph Map dispose maintenant de sa propre page de documentation avec captures d'ecran et explication rapide. Ouvrez le guide pour voir comment lire la carte du workflow, inspecter les noeuds selectionnes et utiliser les actions du panneau de detail.",
		"label.graphMapGuide": "Guide Graph Map",
		"msg.tip.title.mfvGuide": "Conseil — Guide MFV",
		"msg.tip.body.mfvGuide": "MFV dispose maintenant de son propre guide illustre avec les modes de comparaison, les pins A/B/C/D, les streams, les Node Parameters, Run/Stop, le pop-out et la facon dont Graph Map complete naturellement le workflow du viewer.",
		"label.mfvGuide": "Guide MFV",
		"label.changelog": "Changelog",
		"label.settingsGuide": "Guide des paramètres",
		"msg.tip.title.mfvLivePreviewDefaults": "Conseil — Ouverture automatique du Viewer",
		"msg.tip.body.mfvLivePreviewDefaults": "Le Live Stream (bouton vert dans le viewer) et la prévisualisation KSampler peuvent être activés par défaut via Paramètres → Majoor Assets Manager › Viewer. Lorsque le Live Stream est actif, cliquer sur un node Load Image ou la fin d'une génération ouvrira automatiquement le Floating Viewer et affichera le résultat. La prévisualisation KSampler diffuse les étapes de débruitage en direct. Les deux options peuvent être définies comme état par défaut pour que le viewer soit toujours prêt.",
		"msg.whatsNew.title.version243": "Nouvelle Version 2.4.3",
		"msg.whatsNew.body.version243": "Version 2.4.3 publiee : analyse des metadonnees des assets amelioree, capacite Grid Compare dans le floating viewer jusqu'a 4 Assets, boucle ping pong dans le Viewer principal, job id et stack id dans la BDD pour une meilleure gestion des assets, empilement des assets generes depuis le meme workflow avec le meme job ID, fonctionnalite de feed genere, version legere de la grille dans l'onglet bottom. Refactorisation du code pour la maintenabilite et divers correctifs de bugs. Voir CHANGELOG pour details.",
		"msg.whatsNew.title.version241": "Nouvelle Version 2.4.1",
		"msg.whatsNew.body.version241": "Version 2.4.1 publiee : recherche semantique CLIP avec AI toggle, support rgthree/easy node, onglet shortcut guide, extraction de modele upscaler. Correction de fuites memoire MFV, filtres workflow, SQL placeholders. Amelioration extraction geninfo, gestion tags, calendrier. Voir CHANGELOG pour details.",
		"msg.whatsNew.title.floatingViewerShortcuts": "Quoi de neuf",
		"msg.whatsNew.body.floatingViewerShortcuts": "Nouveaux raccourcis clavier pour le Floating Viewer : ouvrir/fermer le MFV avec V, comparaison avec C, Live Stream avec L, et KSampler Preview avec K. Voir l'onglet Shortcut Guide pour la liste complete.",
		"msg.whatsNew.title.pinReference": "Quoi de neuf",
		"msg.whatsNew.body.pinReference": "Floating Viewer : nouvelle fonction Pin Reference. Vous pouvez maintenant epingler A ou B, puis comparer rapidement avec les assets selectionnes dans la grille tout en gardant la reference fixe.",
		"msg.whatsNew.title.vectorResetKeepVectors": "Quoi de neuf",
		"msg.whatsNew.body.vectorResetKeepVectors": "Reset index et Delete DB demandent d'abord s'il faut conserver les vecteurs IA. Si vous avez deja des anciens assets indexes, garder les vecteurs est recommande : un reset complet sans eux peut declencher un long Vector Backfill sur les anciens assets et augmenter temporairement la consommation RAM.",
		"msg.whatsNew.title.localUserGuide": "Quoi de neuf",
		"msg.whatsNew.body.localUserGuide": "Ouvrez le Guide utilisateur local directement depuis le dossier custom_nodes d'Assets Manager.",
		"msg.category.development": "Developpement",
		"msg.development.title.vueRefactoring": "Refactorisation Vue 3",
		"msg.development.body.vueRefactoring": "Modernisation du frontend en cours : Les composants UI nucleaires sont en cours de migration vers Vue 3 pour une meilleure maintenabilite et compatibilite avec le nouveau frontend ComfyUI. Cela garantit un support a long terme et une architecture plus propre.",
		"label.viewProgress": "Voir la progression",
		"msg.collectionAdd.added": "{added} element(s) ajoute(s) a \"{name}\".",
		"msg.collectionAdd.skippedExisting": "{count} element(s) ignores : deja presents dans la collection.",
		"msg.collectionAdd.skippedDuplicate": "{count} doublon(s) ignores dans la selection.",
		"msg.collectionAdd.noneAddedExisting": "Aucun nouvel element ajoute a \"{name}\" (tous deja presents).",
		"msg.dbResetNoticeDetail": "Note de mise a jour Majoor :\n\nPour eviter les erreurs de base de donnees avec cette version, supprimez votre index existant. Cliquez sur le bouton \"Delete DB\" dans le panneau Index Status pour le reinitialiser.",
		"msg.nightlyUpdateTitle": "Nouvelle nightly disponible",
		"msg.nightlyUpdateDetail": "Une build nightly plus recente est disponible. Télécharger : https://github.com/MajoorWaldi/ComfyUI-Majoor-AssetsManager/releases/tag/nightly",
		"msg.newVersionTitle": "Mise à jour disponible",
		"msg.newVersionDetail": "La version {latest} est disponible. Version installée : {current}.",
		"tooltip.starGithub": "Ouvrir GitHub et mettre une etoile"
	}
}, Ie = Object.freeze({
	"en-US": "English",
	"fr-FR": "Français",
	"zh-CN": "Chinese (Simplified)",
	"ja-JP": "Japanese",
	"ko-KR": "Korean",
	"hi-IN": "Hindi",
	"pt-PT": "Portuguese",
	"es-ES": "Spanish",
	"ru-RU": "Russian",
	"de-DE": "German",
	"it-IT": "Italian",
	"nl-NL": "Dutch",
	"pl-PL": "Polish",
	"tr-TR": "Turkish",
	"vi-VN": "Vietnamese",
	"cs-CZ": "Czech",
	"fa-IR": "Persian",
	"id-ID": "Indonesian",
	"uk-UA": "Ukrainian",
	"hu-HU": "Hungarian",
	"ar-SA": "Arabic",
	"sv-SE": "Swedish",
	"ro-RO": "Romanian",
	"el-GR": "Greek"
});
[
	"zh-CN",
	"ja-JP",
	"ko-KR",
	"hi-IN",
	"pt-PT",
	"es-ES",
	"ru-RU",
	"de-DE",
	"it-IT",
	"nl-NL",
	"pl-PL",
	"tr-TR",
	"vi-VN",
	"cs-CZ",
	"fa-IR",
	"id-ID",
	"uk-UA",
	"hu-HU",
	"ar-SA",
	"sv-SE",
	"ro-RO",
	"el-GR"
].forEach((e) => {
	L[e] || (L[e] = {});
});
var R = !1, Le = null;
function Re(e) {
	R || (R = !0, Object.entries(e || {}).forEach(([e, t]) => {
		L[e] = {
			...L[e] || {},
			...t || {}
		};
	}), ze());
}
function ze() {
	let e = L["en-US"] || {};
	Object.keys(L).forEach((t) => {
		t !== "en-US" && (L[t] = {
			...e,
			...L[t] || {}
		});
	});
}
function Be() {
	return R ? Promise.resolve() : (Le ||= import("./i18n.generated-RSZJNkUX.js").then(({ GENERATED_TRANSLATIONS: e }) => {
		Re(e);
	}).catch((e) => {
		console.warn("[Majoor i18n] Failed to load generated translations:", e), ze();
	}), Le);
}
ze();
function z(e) {
	if (!e) return N;
	let t = String(e || "").trim(), n = t.toLowerCase();
	return Fe[n] ? Fe[n] : L[t] ? t : N;
}
function Ve() {
	try {
		for (let e of je) {
			let t = String(M.get(e) || "").trim();
			if (t) return t;
		}
	} catch (e) {
		console.debug?.(e);
	}
	return "";
}
function He(e) {
	try {
		M.set(je[0], e), M.set(je[1], e);
	} catch (e) {
		console.debug?.(e);
	}
}
function Ue() {
	try {
		let e = String(M.get(Me) || "").trim().toLowerCase();
		return e ? ![
			"0",
			"false",
			"no",
			"off"
		].includes(e) : !0;
	} catch (e) {
		console.debug?.(e);
	}
	return !0;
}
function We(e) {
	try {
		M.set(Me, e ? "1" : "0");
	} catch (e) {
		console.debug?.(e);
	}
}
function Ge(e) {
	let t = [], n = (e) => {
		if (typeof e != "string") return;
		let n = e.trim();
		n && t.push(n);
	};
	for (let t of [
		"AGL.Locale",
		"Comfy.Locale",
		"Comfy.LocaleCode",
		"ComfyUI.Locale",
		"ComfyUI.Frontend.Locale"
	]) n(me(e, t));
	return n(e?.ui?.locale), n(e?.locale), n(e?.ui?.i18n?.locale), t;
}
function Ke() {
	let e = [], t = (t) => {
		if (typeof t != "string") return;
		let n = t.trim();
		n && e.push(n);
	};
	try {
		typeof document < "u" && t(document?.documentElement?.lang);
	} catch (e) {
		console.debug?.(e);
	}
	try {
		if (typeof navigator < "u") {
			t(navigator?.language);
			let e = Array.isArray(navigator?.languages) ? navigator.languages : [];
			for (let n of e) t(n);
		}
	} catch (e) {
		console.debug?.(e);
	}
	return e;
}
function qe() {
	try {
		if (typeof document < "u" && document.documentElement) {
			let e = Pe.has(P);
			document.documentElement.dir = e ? "rtl" : "ltr";
		}
	} catch (e) {
		console.debug?.(e);
	}
}
var Je = (e) => {
	try {
		let t = Ue(), n = Ve(), r = z(n), i = () => {
			let t = Ge(e);
			for (let e of t) {
				let t = z(e);
				if (L[t]) return B(t), !0;
			}
			return !1;
		};
		if (t) {
			if (i()) return;
			if (n && L[r]) {
				B(r);
				return;
			}
			if (L[P]) return;
			B(N);
			return;
		}
		if (n && L[r]) {
			B(r);
			return;
		}
		if (i()) return;
		let a = Ke();
		for (let e of a) {
			let t = z(e);
			if (L[t]) {
				B(t);
				return;
			}
		}
		B(N);
	} catch (e) {
		console.warn("[Majoor i18n] Failed to detect language:", e), B(N);
	}
}, B = (e) => {
	L[e] || (console.warn(`[Majoor i18n] Unknown language: ${e}, falling back to ${N}`), e = N), P !== e && (P = e, He(e), qe(), e !== N && !R && Be().then(() => {
		Array.from(Ae).forEach((t) => {
			try {
				t(e);
			} catch (e) {
				console.debug?.(e);
			}
		});
	}), Array.from(Ae).forEach((t) => {
		try {
			t(e);
		} catch (e) {
			console.debug?.(e);
		}
	}));
}, Ye = (e) => {
	We(!!e);
}, Xe = (e) => {
	try {
		I &&= (clearInterval(I), null), typeof window < "u" && window.__MJR_COMFY_LANG_SYNC_TIMER__ && (clearInterval(window.__MJR_COMFY_LANG_SYNC_TIMER__), window.__MJR_COMFY_LANG_SYNC_TIMER__ = null);
	} catch (e) {
		console.debug?.(e);
	}
	I = setInterval(() => {
		try {
			if (!Ue()) return;
			let t = Ge(e);
			for (let e of t) {
				let t = z(e);
				if (L[t] && t !== P) {
					B(t);
					return;
				}
			}
		} catch (e) {
			console.debug?.(e);
		}
	}, 2e3);
	try {
		typeof window < "u" && (window.__MJR_COMFY_LANG_SYNC_TIMER__ = I);
	} catch (e) {
		console.debug?.(e);
	}
}, Ze = () => P, Qe = () => Object.keys(L).map((e) => ({
	code: e,
	name: Ie[e] || e
})), V = (e, t, n) => {
	let r = L[P] || L[N], i = L[N], a = r[e] || i[e];
	if (!a) {
		let n = `${P}:${String(e || "")}`;
		if (!F.has(n)) {
			if (F.size >= Ne) {
				let e = Math.floor(Ne * .2), t = F.values();
				for (let n = 0; n < e; n++) {
					let e = t.next().value;
					e && F.delete(e);
				}
			}
			F.add(n);
			try {
				console.warn(`[Majoor i18n] Missing translation key "${e}" for locale "${P}"`);
			} catch (e) {
				console.debug?.(e);
			}
			try {
				typeof window < "u" && typeof window.dispatchEvent == "function" && window.dispatchEvent(new CustomEvent("mjr-i18n-missing-key", { detail: {
					key: String(e || ""),
					locale: P
				} }));
			} catch (e) {
				console.debug?.(e);
			}
		}
		return typeof t == "string" ? t : e;
	}
	let o = typeof t == "object" ? t : n;
	return o && typeof o == "object" && Object.entries(o).forEach(([e, t]) => {
		a = a.replaceAll(`{${e}}`, String(t));
	}), a;
}, $e = "mjr_toast_history_v1", et = "mjr_toast_history_last_read_v1", tt = 60, nt = "mjr:toast-history-changed", H = null;
function U(e) {
	return String(e || "").trim();
}
function rt(e) {
	let t = U(e).toLowerCase();
	return t === "warn" ? "warning" : t === "danger" ? "error" : t || "info";
}
function it(e) {
	let t = Number(e);
	return Number.isFinite(t) ? t : null;
}
function at(e) {
	if (!e || typeof e != "object") return null;
	let t = Number(e.percent), n = Number.isFinite(t) ? Math.max(0, Math.min(100, Math.round(t))) : null, r = Number(e.current), i = Number(e.total), a = Number.isFinite(r) ? Math.max(0, Math.floor(r)) : null, o = Number.isFinite(i) ? Math.max(0, Math.floor(i)) : null, s = Number(e.indexed), c = Number(e.skipped), l = Number(e.errors), u = Number.isFinite(s) ? Math.max(0, Math.floor(s)) : null, d = Number.isFinite(c) ? Math.max(0, Math.floor(c)) : null, f = Number.isFinite(l) ? Math.max(0, Math.floor(l)) : null, p = U(e.label);
	return n === null && a === null && o === null && u === null && d === null && f === null && !p ? null : {
		percent: n,
		current: a,
		total: o,
		indexed: u,
		skipped: d,
		errors: f,
		label: p
	};
}
function ot(e, t, n) {
	return e && t ? `${e}: ${t}` : t || e || n || "";
}
function st(t, n = "info", r = null) {
	if (!t || typeof t != "object") return null;
	let i = U(t.title || t.summary), a = U(t.detail), o = U(t.message || ot(i, a, U(t.fallbackMessage)));
	if (!o) return null;
	let s = it(t.durationMs ?? t.duration ?? r), c = Number(t.createdAt), l = Number.isFinite(c) && c > 0 ? c : Date.now(), u = typeof t.persistent == "boolean" ? t.persistent : !(Number.isFinite(s) && (s ?? 0) > 0);
	return {
		id: U(t.id) || e(`th-${l}-`, 4),
		message: o,
		title: i,
		detail: a,
		type: rt(t.type || n),
		createdAt: l,
		durationMs: s,
		persistent: u,
		source: U(t.source),
		trackId: U(t.trackId),
		status: U(t.status),
		operation: U(t.operation),
		progress: at(t.progress),
		forceStore: !!t.forceStore,
		actionLabel: U(t.actionLabel),
		actionUrl: U(t.actionUrl)
	};
}
function W() {
	if (H === null) try {
		let e = localStorage.getItem($e), t = e ? JSON.parse(e) : [];
		H = Array.isArray(t) ? t.map((e) => {
			if (e && typeof e == "object") return st(e);
			let t = U(e);
			return t ? st({ message: t }) : null;
		}).filter(Boolean) : [];
	} catch {
		H = [];
	}
}
function ct() {
	try {
		localStorage.setItem($e, JSON.stringify(H));
	} catch {}
}
function lt() {
	try {
		window.dispatchEvent(new CustomEvent(nt));
	} catch {}
}
function ut() {
	try {
		return Number(localStorage.getItem(et)) || 0;
	} catch {
		return 0;
	}
}
function dt(e) {
	try {
		localStorage.setItem(et, String(Number(e) || 0));
	} catch {}
}
function ft(e, t, n) {
	W();
	let r = st(e && typeof e == "object" ? e : {
		message: U(e),
		type: t,
		durationMs: n
	}, t, n);
	if (!r || !r.forceStore && !r.trackId && r.type === "info" && Number.isFinite(r.durationMs) && r.durationMs != null && r.durationMs > 0 && r.durationMs < 2500) return;
	let i = String(r.trackId || "").trim();
	if (i) {
		let e = H.findIndex((e) => String(e?.trackId || "").trim() === i);
		if (e >= 0) {
			let t = H[e] || {};
			H.splice(e, 1), r.id = String(t.id || r.id || "").trim() || r.id;
		}
	}
	H.unshift(r), H.length > tt && (H = H.slice(0, tt)), ct(), lt();
}
function pt() {
	return W(), H.map((e) => ({ ...e }));
}
function mt() {
	W();
	let e = ut();
	return H.filter((t) => t.createdAt > e).length;
}
function ht() {
	dt(Date.now()), lt();
}
function gt() {
	W(), H = [], ct(), dt(Date.now()), lt();
}
//#endregion
//#region ui/app/toast.ts
function _t(e) {
	let t = String(e || "info").trim().toLowerCase();
	return t === "warn" ? "warning" : t === "danger" ? "error" : t === "success" || t === "warning" || t === "error" ? t : "info";
}
function vt(e) {
	if (typeof e == "string") return e;
	if (e && typeof e == "object") {
		let t = String(e.summary || "").trim(), n = String(e.detail || e.message || "").trim();
		if (t && n) return `${t}: ${n}`;
		if (n) return n;
		if (t) return t;
	}
	try {
		return String(e?.message || e || "").trim() || "Unknown message";
	} catch {
		return "Unknown message";
	}
}
function yt(e, t, n, r) {
	let i = r?.history && typeof r.history == "object" ? r.history : null, a = {
		persistent: !(Number.isFinite(Number(n)) && Number(n) > 0),
		source: String(i?.source || r?.source || "").trim(),
		trackId: String(i?.trackId || "").trim(),
		status: String(i?.status || "").trim(),
		operation: String(i?.operation || "").trim(),
		progress: i?.progress && typeof i.progress == "object" ? { ...i.progress } : null,
		forceStore: !!i?.forceStore,
		actionLabel: String(i?.actionLabel || "").trim(),
		actionUrl: String(i?.actionUrl || "").trim()
	};
	return e && typeof e == "object" ? (a.title = String(i?.title || e.summary || "").trim(), a.detail = String(i?.detail || e.detail || e.message || "").trim(), a.message = vt(e), a) : (a.title = String(i?.title || "").trim(), a.detail = String(i?.detail || "").trim(), a.message = vt(e), a);
}
function bt(e, t = "info", n, r) {
	try {
		let i = yt(e, t, n, r);
		i.forceStore = !0, ft(i, t, n ?? void 0);
	} catch {}
}
function xt(e) {
	switch (e) {
		case "success": return 2e3;
		case "info": return 3e3;
		case "warning": return 4e3;
		case "error": return 5e3;
		default: return 5e3;
	}
}
function St(e) {
	if (typeof e != "string") return e;
	let t = e.trim(), n = {
		"Failed to update rating": V("toast.ratingUpdateFailed", "Failed to update rating"),
		"Error updating rating": V("toast.ratingUpdateError", "Error updating rating"),
		"Rating cleared": V("toast.ratingCleared", "Rating cleared"),
		"Failed to update tags": V("toast.tagsUpdateFailed", "Failed to update tags"),
		"Tags updated": V("toast.tagsUpdated", "Tags updated"),
		"Failed to toggle watcher": V("toast.watcherToggleFailed", "Failed to toggle watcher"),
		"No valid assets selected.": V("toast.noValidAssetsSelected", "No valid assets selected."),
		"Name collision in current view": V("toast.nameCollisionInView", "Name collision in current view"),
		"Failed to create collection.": V("toast.failedCreateCollectionDot", "Failed to create collection."),
		"Failed to add assets to collection.": V("toast.failedAddAssetsToCollection", "Failed to add assets to collection."),
		"Failed to remove from collection.": V("toast.removeFromCollectionFailed", "Failed to remove from collection."),
		"Collection created": V("toast.collectionCreated", "Collection created"),
		"Added to collection": V("toast.addedToCollection", "Added to collection"),
		"Removed from collection": V("toast.removedFromCollection", "Removed from collection"),
		"File renamed successfully!": V("toast.fileRenamedSuccess", "File renamed successfully!"),
		"Failed to rename file": V("toast.fileRenameFailed", "Failed to rename file"),
		"Failed to rename file.": V("toast.fileRenameFailed", "Failed to rename file."),
		"File deleted successfully!": V("toast.fileDeletedSuccess", "File deleted successfully!"),
		"Failed to delete file.": V("toast.fileDeleteFailed", "Failed to delete file."),
		"Failed to delete file. ": V("toast.fileDeleteFailed", "Failed to delete file."),
		"File deleted": V("toast.deleted", "File deleted"),
		"File renamed": V("toast.renamed", "File renamed"),
		"Folder created": V("toast.folderCreated", "Folder created"),
		"Folder renamed": V("toast.folderRenamed", "Folder renamed"),
		"Folder moved": V("toast.folderMoved", "Folder moved"),
		"Folder deleted": V("toast.folderDeleted", "Folder deleted"),
		"Failed to create folder": V("toast.createFolderFailed", "Failed to create folder"),
		"Failed to rename folder": V("toast.renameFolderFailed", "Failed to rename folder"),
		"Failed to move folder": V("toast.moveFolderFailed", "Failed to move folder"),
		"Failed to delete folder": V("toast.deleteFolderFailed", "Failed to delete folder"),
		"Failed to pin folder": V("toast.pinFolderFailed", "Failed to pin folder"),
		"Failed to unpin folder": V("toast.unpinFolderFailed", "Failed to unpin folder"),
		"Folder pinned as browser root": V("toast.folderPinnedAsBrowserRoot", "Folder pinned as browser root"),
		"Folder added": V("toast.folderAdded", "Folder added"),
		"Folder removed": V("toast.folderRemoved", "Folder removed"),
		"Folder linked successfully": V("toast.folderLinked", "Folder linked successfully"),
		"An error occurred while adding the custom folder": V("toast.errorAddingFolder", "An error occurred while adding the custom folder"),
		"An error occurred while removing the custom folder": V("toast.errorRemovingFolder", "An error occurred while removing the custom folder"),
		"Failed to add custom folder": V("toast.failedAddFolder", "Failed to add custom folder"),
		"Failed to remove custom folder": V("toast.failedRemoveFolder", "Failed to remove custom folder"),
		"Native folder browser unavailable. Please enter path manually.": V("toast.nativeBrowserUnavailable", "Native folder browser unavailable. Please enter path manually."),
		"Opened in folder": V("toast.openedInFolder", "Opened in folder"),
		"Failed to open folder": V("toast.openFolderFailed", "Failed to open folder"),
		"Failed to open folder.": V("toast.openFolderFailed", "Failed to open folder."),
		"File path copied to clipboard": V("toast.pathCopied", "File path copied to clipboard"),
		"Failed to copy path": V("toast.pathCopyFailed", "Failed to copy path"),
		"Failed to copy to clipboard": V("toast.copyClipboardFailed", "Failed to copy to clipboard"),
		"No file path available for this asset.": V("toast.noFilePath", "No file path available for this asset."),
		"Failed to refresh metadata.": V("toast.metadataRefreshFailed", "Failed to refresh metadata."),
		"Metadata refreshed": V("toast.metadataRefreshed", "Metadata refreshed"),
		"Duplicate analysis started": V("toast.dupAnalysisStarted", "Duplicate analysis started"),
		"Tags merged": V("toast.tagsMerged", "Tags merged"),
		"Duplicates deleted": V("toast.duplicatesDeleted", "Duplicates deleted"),
		"Rescanning file...": V("toast.rescanningFile", "Rescanning file..."),
		"Metadata enrichment complete": V("toast.enrichmentComplete", "Metadata enrichment complete"),
		"Playback speed is available for video media only": V("toast.playbackVideoOnly", "Playback speed is available for video media only"),
		"DB backup saved": V("toast.dbSaveSuccess", "DB backup saved"),
		"Failed to save DB backup": V("toast.dbSaveFailed", "Failed to save DB backup"),
		"DB restore started": V("toast.dbRestoreStarted", "DB restore started"),
		"Failed to restore DB backup": V("toast.dbRestoreFailed", "Failed to restore DB backup"),
		"Select a DB backup first": V("toast.dbRestoreSelect", "Select a DB backup first"),
		"Stopping running workers": V("toast.dbRestoreStopping", "Stopping running workers"),
		"Unlocking and resetting database": V("toast.dbRestoreResetting", "Unlocking and resetting database"),
		"Recreating database": V("toast.dbRestoreReplacing", "Recreating database"),
		"Replacing database files": V("toast.dbRestoreReplacing", "Replacing database files"),
		"Restarting scan": V("toast.dbRestoreRescan", "Restarting scan"),
		"Deleting database and rebuilding...": V("toast.dbDeleteTriggered", "Deleting database and rebuilding..."),
		"Database deleted and rebuilt. Files are being reindexed.": V("toast.dbDeleteSuccess", "Database deleted and rebuilt. Files are being reindexed."),
		"Failed to delete database": V("toast.dbDeleteFailed", "Failed to delete database"),
		"Database backup restored": V("toast.dbRestoreSuccess", "Database backup restored"),
		"Index reset started. Files will be reindexed in the background.": V("toast.resetStarted", "Index reset started. Files will be reindexed in the background."),
		"Failed to reset index": V("toast.resetFailed", "Failed to reset index"),
		"Reset triggered: Reindexing all files...": V("toast.resetTriggered", "Reset triggered: Reindexing all files..."),
		"Reset failed - database is corrupted. Use the \"Delete DB\" button to force-delete and rebuild.": V("toast.resetFailedCorrupt", "Reset failed - database is corrupted. Use the \"Delete DB\" button to force-delete and rebuild."),
		"Scan started": V("toast.scanStarted", "Scan started"),
		"Scan complete": V("toast.scanComplete", "Scan complete"),
		"Scan failed": V("toast.scanFailed", "Scan failed"),
		"Permission denied": V("toast.permissionDenied", "Permission denied"),
		"Language changed. Reload the page for full effect.": V("toast.languageChanged", "Language changed. Reload the page for full effect."),
		"Tag added": V("toast.tagAdded", "Tag added"),
		"Tag removed": V("toast.tagRemoved", "Tag removed"),
		"Rating saved": V("toast.ratingSaved", "Rating saved"),
		"Failed to create collection": V("toast.failedCreateCollection", "Failed to create collection"),
		"Failed to delete collection": V("toast.failedDeleteCollection", "Failed to delete collection")
	};
	if (n[t]) return n[t];
	let r;
	if (r = t.match(/Rating set to (\d+) star(?:s)?/i), r) return V("toast.ratingSetN", "Rating set to {n} stars", { n: Number(r[1]) });
	if (r = t.match(/Downloading (.+?)\.\.\./i), r) return V("toast.downloadingFile", "Downloading {filename}...", { filename: r[1] });
	if (r = t.match(/Playback ([0-9]+(?:\.[0-9]+)?)x/i), r) return V("toast.playbackRate", "Playback {rate}x", { rate: Number(r[1]).toFixed(2) });
	if (r = t.match(/Metadata refreshed(?:\s*(.*))?/i), r) return V("toast.metadataRefreshed", "Metadata refreshed{suffix}", { suffix: r[1] ? " (" + r[1] + ")" : "" });
	if (r = t.match(/Error renaming(?: file)?:\s*(.+)/i), r) return V("toast.errorRenaming", "Error renaming file: {error}", { error: r[1] });
	if (r = t.match(/Error deleting(?: files?| file)?:\s*(.+)/i), r) return V("toast.errorDeleting", "Error deleting file: {error}", { error: r[1] });
	if (r = t.match(/Tag merge failed:\s*(.+)/i), r) return V("toast.tagMergeFailed", "Tag merge failed: {error}", { error: r[1] });
	if (r = t.match(/Delete failed:\s*(.+)/i), r) return V("toast.deleteFailed", "Delete failed: {error}", { error: r[1] });
	if (r = t.match(/Analysis not started:\s*(.+)/i), r) return V("toast.analysisNotStarted", "Analysis not started: {error}", { error: r[1] });
	if (r = t.match(/(\d+)\s+files deleted successfully!/i), r) return V("toast.filesDeletedSuccessN", "{n} files deleted successfully!", { n: Number(r[1]) });
	if (r = t.match(/(\d+)\s+files deleted,\s+(\d+)\s+failed\./i), r) return V("toast.filesDeletedPartial", "{success} files deleted, {failed} failed.", {
		success: Number(r[1]),
		failed: Number(r[2])
	});
	if (r = t.match(/(\d+)\s+files?\s+deleted/i), r) return V("toast.filesDeletedShort", "{n} files deleted", { n: Number(r[1]) });
	if (r = t.match(/(\d+)\s+deleted,\s+(\d+)\s+failed/i), r) return V("toast.filesDeletedShortPartial", "{success} deleted, {failed} failed", {
		success: Number(r[1]),
		failed: Number(r[2])
	});
	if (r = t.match(/^(.+?)\s+copied to clipboard!$/i), r) return V("toast.copiedToClipboardNamed", "{name} copied to clipboard!", { name: r[1] });
	if (r = t.match(/Folder created:\s*(.+)/i), r) return V("toast.folderCreated", "Folder created: {name}", { name: r[1] });
	if (r = t.match(/Failed to create folder:\s*(.+)/i), r) return V("toast.createFolderFailedDetail", "Failed to create folder: {error}", { error: r[1] });
	if (r = t.match(/Failed to rename folder:\s*(.+)/i), r) return V("toast.renameFolderFailedDetail", "Failed to rename folder: {error}", { error: r[1] });
	if (r = t.match(/Failed to move folder:\s*(.+)/i), r) return V("toast.moveFolderFailedDetail", "Failed to move folder: {error}", { error: r[1] });
	if (r = t.match(/Failed to delete folder:\s*(.+)/i), r) return V("toast.deleteFolderFailedDetail", "Failed to delete folder: {error}", { error: r[1] });
	if (r = t.match(/Error removing from collection:\s*(.+)/i), r) return V("toast.removeFromCollectionError", "Error removing from collection: {error}", { error: r[1] });
	if (r = t.match(/^Failed to (.+)$/i), r) {
		let e = r[1].toLowerCase(), t = {
			"add folder": V("toast.failedAddFolder", "Failed to add custom folder"),
			"remove folder": V("toast.failedRemoveFolder", "Failed to remove custom folder"),
			"create collection": V("toast.failedCreateCollection", "Failed to create collection"),
			"delete collection": V("toast.failedDeleteCollection", "Failed to delete collection")
		};
		for (let [n, r] of Object.entries(t)) if (e.includes(n)) return r;
	}
	return t;
}
function Ct(e, t = "info", n, r) {
	if (t = _t(t), e = St(e), n ??= xt(t), !r?.noHistory) try {
		ft(yt(e, t, n, r), t, n ?? void 0);
	} catch {}
	let i = !(Number.isFinite(Number(n)) && Number(n) > 0), a = D();
	try {
		let r = _e(a);
		if (r && typeof r.add == "function") {
			let a = t;
			a === "warning" && (a = "warn");
			let o = V("manager.title"), s = e;
			if (typeof e == "object" && e?.summary) o = e.summary, s = e.detail || "";
			else if (typeof e != "string") try {
				s = e.message || String(e);
			} catch (e) {
				console.debug?.(e);
			}
			let c = {
				severity: a,
				summary: o,
				detail: s
			};
			i || (c.life = n), r.add(c);
			return;
		}
	} catch (e) {
		console.debug("Majoor: extensionManager.toast failed", e);
	}
	if (a?.ui?.toast) try {
		return a.ui.toast(e, t);
	} catch (e) {
		console.debug("Native app.ui.toast failed", e);
	}
	console.warn("[Majoor Toast] Native toast API unavailable", {
		type: t,
		message: vt(e),
		duration: i ? 0 : n
	});
}
//#endregion
//#region ui/api/clientAuth.ts
var wt = 2e3, Tt = 15e3, Et = 8e3, Dt = "__mjr_write_token", G = "token", Ot = null, K = null, kt = null, q = x({
	ttlMs: wt,
	maxSize: 1
});
function At() {
	try {
		return String(sessionStorage?.getItem?.(Dt) || "").trim();
	} catch {
		return "";
	}
}
function jt(e) {
	let t = String(e || "").trim();
	try {
		return t ? sessionStorage?.setItem?.(Dt, t) : sessionStorage?.removeItem?.(Dt), !0;
	} catch {
		return !1;
	}
}
function Mt() {
	try {
		let e = localStorage?.getItem?.(a), t = e ? JSON.parse(e) : {}, n = t && typeof t == "object" ? t : {}, r = n?.data && typeof n.data == "object" ? n.data : n;
		r?.security && typeof r.security == "object" && String(r.security.apiToken || "").trim() && (r.security.apiToken = "", localStorage?.setItem?.(a, JSON.stringify(n)));
	} catch (e) {
		console.debug?.(e);
	}
}
function Nt() {
	try {
		q.delete(G);
	} catch (e) {
		console.debug?.(e);
	}
	jt(""), Mt();
}
function Pt() {
	let e = q.get(G);
	if (e !== void 0) return e;
	let t = Date.now(), n = At();
	if (n) return q.set(G, n, { at: t }), n;
	try {
		let e = localStorage?.getItem?.(a), n = e ? JSON.parse(e) : null, r = n?.data && typeof n.data == "object" ? n.data : n, i = String(r?.security?.apiToken || "").trim();
		if (i) {
			jt(i);
			try {
				let e = n && typeof n == "object" ? n : {}, t = e?.data && typeof e.data == "object" ? e.data : e;
				t?.security && typeof t.security == "object" && (t.security.apiToken = "", localStorage?.setItem?.(a, JSON.stringify(e)), window?.dispatchEvent?.(new CustomEvent("mjr-settings-changed", { detail: { key: "security.apiToken" } })));
			} catch (e) {
				console.debug?.(e);
			}
		}
		return q.set(G, i, { at: t }), i;
	} catch {
		return q.set(G, "", { at: t }), "";
	}
}
function Ft(e) {
	let t = String(e || "").trim();
	if (!t) return !1;
	try {
		q.set(G, t), K = null, jt(t), Mt();
		try {
			window?.dispatchEvent?.(new CustomEvent("mjr-settings-changed", { detail: { key: "security.apiToken" } }));
		} catch (e) {
			console.debug?.(e);
		}
		return !0;
	} catch {
		return !1;
	}
}
var It = /^[A-Za-z0-9._\-~+/]+=*$/;
function Lt(e) {
	let t = String(e || "").trim();
	return t ? It.test(t) ? Ft(t) : (console.debug?.("[MJR auth] Rejected malformed security token (invalid characters)"), !1) : !1;
}
function Rt(e = {}) {
	K = {
		code: String(e?.code || "").trim().toUpperCase(),
		error: String(e?.error || "").trim(),
		status: Number(e?.status || 0) || 0,
		at: Date.now()
	};
}
function zt() {
	let e = K;
	if (!e) return null;
	let t = Date.now() - (Number(e.at || 0) || 0);
	return t < 0 || t > Tt ? (K = null, null) : e;
}
function Bt(e) {
	let t = zt(), n = String(e?.code || "").trim().toUpperCase(), r = String(e?.error || "").trim(), i = String(t?.code || "").trim().toUpperCase(), a = String(t?.error || "").trim().toLowerCase(), o = r.toLowerCase();
	return i === "FORBIDDEN" && (a.includes("already configured") || a.includes("rotate-token")) ? V("toast.writeAuthConfiguredTokenRequired", "Write access requires the Majoor API token already configured on the server. Open Settings -> Security -> API Token and enter the matching token.") : i === "AUTH_REQUIRED" && (a.includes("sign in to comfyui") || a.includes("authenticated comfyui user")) ? V("toast.writeAuthSignInRequired", "Write access is blocked. Sign in to ComfyUI first, then retry so Majoor can bootstrap the remote session token automatically.") : i === "BOOTSTRAP_DISABLED" || i === "AUTH_REQUIRED" && a.includes("bootstrap") || n === "AUTH_REQUIRED" && o.includes("api token") ? V("toast.writeAuthBootstrapHelp", "Write access is blocked. Sign in to ComfyUI and retry so Majoor can bootstrap the remote session automatically, or set a Majoor API token in Settings -> Security.") : "";
}
function Vt(e) {
	let t = String(e || "").trim();
	if (!t) return;
	let n = Date.now(), r = kt;
	if (!(r && r.message === t && n - (Number(r.at || 0) || 0) < Et)) {
		kt = {
			message: t,
			at: n
		};
		try {
			Ct({
				summary: V("toast.writeAuthTitle", "Majoor remote write access"),
				detail: t
			}, "warning", 6500, { noHistory: !0 });
		} catch (e) {
			console.debug?.(e);
		}
	}
}
function Ht(e) {
	let t = String(e?.code || "").trim().toUpperCase(), n = String(e?.error || "").trim().toLowerCase(), r = t === "FORBIDDEN" && n.includes("write operation blocked");
	if (t !== "AUTH_REQUIRED" && !r) return e;
	let i = Bt(e);
	return i ? (Vt(i), {
		...e,
		error: i
	}) : e;
}
async function Ut() {
	try {
		let e = await fetch("/mjr/am/settings/security/bootstrap-token", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				"X-Requested-With": "XMLHttpRequest"
			},
			body: "{}"
		});
		if (!(e.headers.get("content-type") || "").includes("application/json")) return Rt({
			code: "INVALID_RESPONSE",
			error: `Bootstrap token request returned non-JSON response (${e.status})`,
			status: e.status
		}), {
			ok: !1,
			token: !1
		};
		let t = await e.json().catch((e) => (console.debug?.("[MJR auth] JSON parse error:", e), null));
		if (!t || typeof t != "object") return Rt({
			code: "INVALID_RESPONSE",
			error: "Bootstrap token response was invalid.",
			status: e.status
		}), {
			ok: !1,
			token: !1
		};
		if (!t.ok) return Rt({
			code: t?.code,
			error: t?.error,
			status: e.status
		}), {
			ok: !1,
			token: !1
		};
		let n = String(t?.data?.token || "").trim();
		return n ? {
			ok: Ft(n),
			token: !0
		} : (K = null, {
			ok: !0,
			token: !1
		});
	} catch (e) {
		return Rt({
			code: "NETWORK_ERROR",
			error: e?.message || "Bootstrap token request failed.",
			status: 0
		}), {
			ok: !1,
			token: !1
		};
	}
}
async function Wt({ force: e = !1, allowCookieRefresh: t = !1 } = {}) {
	let n = Pt();
	if (n && !e) return n;
	let r = {
		ok: !1,
		token: !1
	};
	Ot ||= (async () => {
		try {
			return await Ut();
		} finally {
			Ot = null;
		}
	})();
	try {
		r = await Ot || r;
	} catch (e) {
		console.debug?.(e);
	}
	if (e && r?.ok && !r?.token && n) Nt();
	else if (e && !r?.ok) {
		let e = zt(), t = String(e?.code || "").trim().toUpperCase();
		(!t || !["NETWORK_ERROR", "INVALID_RESPONSE"].includes(t)) && Nt();
	}
	let i = Pt();
	return !i && t && r?.ok ? !0 : i;
}
function Gt() {
	q.clear();
}
//#endregion
//#region ui/api/clientOps.ts
async function Kt(e) {
	return !e || typeof e != "string" ? {
		ok: !1,
		error: "Missing mode",
		code: "INVALID_INPUT"
	} : Q("/mjr/am/settings/probe-backend", { mode: e });
}
async function qt() {
	return Z(n.SETTINGS_METADATA_FALLBACK);
}
async function Jt({ image: e, media: t } = {}) {
	return Q(n.SETTINGS_METADATA_FALLBACK, {
		image: e,
		media: t
	});
}
async function Yt() {
	return Z(n.SETTINGS_VECTOR_SEARCH);
}
async function Xt(e = !0) {
	if (e && typeof e == "object") {
		let t = {};
		return "enabled" in e && (t.enabled = !!e.enabled), "caption_on_index" in e && (t.caption_on_index = !!e.caption_on_index), "captionOnIndex" in e && (t.caption_on_index = !!e.captionOnIndex), Q(n.SETTINGS_VECTOR_SEARCH, t);
	}
	return Q(n.SETTINGS_VECTOR_SEARCH, { enabled: !!e });
}
async function Zt() {
	return Z(n.SETTINGS_EXECUTION_GROUPING);
}
async function Qt(e = !0) {
	return Q(n.SETTINGS_EXECUTION_GROUPING, { enabled: !!e });
}
async function $t() {
	return Z(n.SETTINGS_HUGGINGFACE);
}
async function en(e = "") {
	return Q(n.SETTINGS_HUGGINGFACE, { token: String(e ?? "").trim() });
}
async function tn() {
	return Z(n.SETTINGS_AI_LOGGING);
}
async function nn(e = !1) {
	return Q(n.SETTINGS_AI_LOGGING, { enabled: !!e });
}
async function rn() {
	return Z(n.SETTINGS_ROUTE_LOGGING);
}
async function an(e = !1) {
	return Q(n.SETTINGS_ROUTE_LOGGING, { enabled: !!e });
}
async function on() {
	return Z(n.SETTINGS_STARTUP_LOGGING);
}
async function sn(e = !1) {
	return Q(n.SETTINGS_STARTUP_LOGGING, { enabled: !!e });
}
async function cn() {
	return Z(n.SETTINGS_LTXAV_RGB_FALLBACK);
}
async function ln(e = !1) {
	return Q(n.SETTINGS_LTXAV_RGB_FALLBACK, { enabled: !!e });
}
async function un() {
	return Z(n.SETTINGS_OUTPUT_DIRECTORY);
}
async function dn(e, t = {}) {
	let r = String(e ?? "").trim();
	return Q(n.SETTINGS_OUTPUT_DIRECTORY, { output_directory: r }, t);
}
async function fn() {
	return Z(n.SETTINGS_INDEX_DIRECTORY);
}
async function pn(e, t = {}) {
	let r = String(e ?? "").trim();
	return Q(n.SETTINGS_INDEX_DIRECTORY, { index_directory: r }, t);
}
async function mn() {
	return Z("/mjr/am/settings/security");
}
async function hn(e) {
	return Q("/mjr/am/settings/security", e && typeof e == "object" ? e : {});
}
async function gn() {
	let e = await Q("/mjr/am/settings/security/bootstrap-token", {});
	if (e?.ok) try {
		let t = String(e?.data?.token || "").trim();
		t && Ft(t);
	} catch (e) {
		console.debug?.(e);
	}
	return e;
}
async function _n(e) {
	if (e && typeof e == "object") {
		let t = String(e.filepath || e.path || e?.file_info?.filepath || "").trim();
		return e.id == null ? Q("/mjr/am/open-in-folder", { filepath: t }) : Q("/mjr/am/open-in-folder", { asset_id: r(e.id) });
	}
	return Q("/mjr/am/open-in-folder", { asset_id: r(e) });
}
async function vn({ op: e = "", path: t = "", name: r = "", destination: i = "", recursive: a = !0 } = {}, o = {}) {
	let s = {
		op: String(e || "").trim().toLowerCase(),
		path: String(t || "").trim()
	};
	return r != null && String(r).trim() && (s.name = String(r).trim()), i != null && String(i).trim() && (s.destination = String(i).trim()), s.op === "delete" && (s.recursive = !!a), Q(n.BROWSER_FOLDER_OP, s, o);
}
async function yn(e = {}) {
	let t = (e, t) => e == null ? t : !!e, r = String(e.scope || "output").trim().toLowerCase() || "output", i = e.customRootId ?? e.custom_root_id ?? e.rootId ?? e.root_id ?? e.customRoot ?? null, a = {
		scope: r,
		reindex: t(e.reindex, !0),
		hard_reset_db: t(e.hardResetDb ?? e.hard_reset_db ?? e.deleteDbFiles ?? e.delete_db_files ?? e.deleteDb ?? e.delete_db ?? void 0, r === "all"),
		clear_scan_journal: t(e.clearScanJournal ?? e.clear_scan_journal, !0),
		clear_metadata_cache: t(e.clearMetadataCache ?? e.clear_metadata_cache, !0),
		clear_asset_metadata: t(e.clearAssetMetadata ?? e.clear_asset_metadata, !0),
		clear_assets: t(e.clearAssets ?? e.clear_assets, !0),
		preserve_vectors: t(e.preserveVectors ?? e.preserve_vectors ?? e.keepVectors ?? e.keep_vectors, !1),
		rebuild_fts: t(e.rebuildFts ?? e.rebuild_fts, !0),
		incremental: t(e.incremental, !1),
		fast: t(e.fast, !0),
		background_metadata: t(e.backgroundMetadata ?? e.background_metadata, !0),
		maintenance_force: t(e.maintenanceForce ?? e.maintenance_force, !1)
	};
	return i && (a.custom_root_id = String(i)), Q(n.INDEX_RESET, a);
}
async function bn({ scope: e = "output", customRootId: t = "" } = {}) {
	let r = String(e || "output").trim().toLowerCase() || "output", i = String(t || "").trim(), a = { scope: r };
	return i && (a.custom_root_id = i), Q(n.WATCHER_SCOPE, a);
}
async function xn(e = {}) {
	return Z(n.WATCHER_STATUS, e);
}
async function Sn(e = !0) {
	return Q(n.WATCHER_TOGGLE, { enabled: !!e });
}
async function Cn() {
	return Z(n.WATCHER_SETTINGS);
}
async function wn(e = {}) {
	return Q(n.WATCHER_SETTINGS, e);
}
async function Tn(e = {}) {
	return Z(n.TOOLS_STATUS, e);
}
async function En(e = {}) {
	return Z(n.STATUS, e);
}
async function Dn() {
	return Q("/mjr/am/db/force-delete", {});
}
async function On(e = {}) {
	return Z(n.DB_BACKUPS, e);
}
async function kn() {
	return Q(n.DB_BACKUP_SAVE, {});
}
async function An({ name: e = "", useLatest: t = !1 } = {}) {
	let r = {};
	return e && (r.name = String(e)), t && (r.use_latest = !0), Q(n.DB_BACKUP_RESTORE, r);
}
async function jn(e = 250) {
	return Q("/mjr/am/duplicates/analyze", { limit: Math.max(10, Math.min(5e3, Number(e) || 250)) });
}
async function Mn({ scope: e = "output", customRootId: t = "", maxGroups: n = 6, maxPairs: r = 10 } = {}, i = {}) {
	let a = `/mjr/am/duplicates/alerts?scope=${encodeURIComponent(String(e || "output"))}`;
	return t && (a += `&custom_root_id=${encodeURIComponent(String(t))}`), a += `&max_groups=${encodeURIComponent(String(Math.max(1, Number(n) || 6)))}`, a += `&max_pairs=${encodeURIComponent(String(Math.max(1, Number(r) || 10)))}`, Z(a, i);
}
async function Nn(e, t = []) {
	return Q("/mjr/am/duplicates/merge-tags", {
		keep_asset_id: Number(e) || 0,
		merge_asset_ids: Array.isArray(t) ? t.map((e) => Number(e) || 0).filter((e) => e > 0) : []
	});
}
async function Pn(e) {
	let t, n;
	if (e && typeof e == "object") {
		t = r(e.id);
		let i = String(e.filepath || e.path || e?.file_info?.filepath || "").trim();
		n = t ? { asset_id: t } : { filepath: i };
	} else t = r(e), n = { asset_id: t };
	let i = await Q("/mjr/am/asset/delete", n);
	return i?.ok && t && In([t]), i;
}
async function Fn(e) {
	let t = Array.isArray(e) ? e.map((e) => r(e)).filter(Boolean) : [], n = await Q("/mjr/am/assets/delete", { ids: t });
	return n?.ok && In(t), n;
}
function In(e) {
	try {
		let t = (Array.isArray(e) ? e : [e]).map((e) => String(e || "").trim()).filter(Boolean);
		if (!t.length) return;
		window.dispatchEvent(new CustomEvent("mjr:assets-deleted", { detail: { ids: t } }));
	} catch (e) {
		console.debug?.(e);
	}
}
async function Ln(e, t) {
	let n;
	if (e && typeof e == "object") {
		n = r(e.id);
		let i = String(e.filepath || e.path || e?.file_info?.filepath || "").trim(), a = n ? await Q("/mjr/am/asset/rename", {
			asset_id: n,
			new_name: t
		}) : await Q("/mjr/am/asset/rename", {
			filepath: i,
			new_name: t
		});
		if (a?.ok && n) try {
			let e = await wr(n);
			e?.ok && e?.data && (a.data = {
				...a.data || {},
				asset: e.data
			});
		} catch (e) {
			console.debug?.(e);
		}
		return a;
	}
	n = r(e);
	let i = await Q("/mjr/am/asset/rename", {
		asset_id: n,
		new_name: t
	});
	if (i?.ok && n) try {
		let e = await wr(n);
		e?.ok && e?.data && (i.data = {
			...i.data || {},
			asset: e.data
		});
	} catch (e) {
		console.debug?.(e);
	}
	return i;
}
async function Rn() {
	let e = typeof AbortController < "u" ? new AbortController() : null, t = null;
	try {
		return e && (t = setTimeout(() => e.abort(), 1e4)), await Z("/mjr/am/collections", e ? { signal: e.signal } : {});
	} finally {
		t && clearTimeout(t);
	}
}
async function zn(e) {
	return Q("/mjr/am/collections", { name: String(e || "").trim() });
}
async function Bn(e) {
	let t = String(e || "").trim();
	return Q(`/mjr/am/collections/${encodeURIComponent(t)}/delete`, {});
}
async function Vn(e, t) {
	let n = String(e || "").trim(), r = Array.isArray(t) ? t : [];
	return Q(`/mjr/am/collections/${encodeURIComponent(n)}/add`, { assets: r });
}
async function Hn(e, t) {
	let n = String(e || "").trim(), r = Array.isArray(t) ? t : [];
	return Q(`/mjr/am/collections/${encodeURIComponent(n)}/remove`, { filepaths: r });
}
async function Un(e) {
	let t = String(e || "").trim();
	return Z(`/mjr/am/collections/${encodeURIComponent(t)}/assets`);
}
async function Wn(e, r = 20) {
	let i = String(e || "").trim();
	if (!i) return {
		ok: !1,
		error: "Empty query"
	};
	let a = r && typeof r == "object" ? r : { topK: Number(r) }, o = Math.max(1, Math.min(200, Number(a?.topK ?? 20) || 20)), s = String(a?.scope || "").trim(), c = String(a?.customRootId || "").trim(), l = `${n.VECTOR_SEARCH}?q=${encodeURIComponent(i)}&top_k=${o}`;
	return s && (l += `&scope=${encodeURIComponent(s)}`), c && (l += `&custom_root_id=${encodeURIComponent(c)}`), l = t(l, {
		subfolder: a?.subfolder ?? null,
		kind: a?.kind ?? null,
		hasWorkflow: a?.hasWorkflow ?? null,
		minRating: a?.minRating ?? null,
		minSizeMB: a?.minSizeMB ?? null,
		maxSizeMB: a?.maxSizeMB ?? null,
		minWidth: a?.minWidth ?? null,
		minHeight: a?.minHeight ?? null,
		maxWidth: a?.maxWidth ?? null,
		maxHeight: a?.maxHeight ?? null,
		workflowType: a?.workflowType ?? null,
		dateRange: a?.dateRange ?? null,
		dateExact: a?.dateExact ?? null
	}), Z(l, { timeoutMs: 12e4 });
}
async function Gn(e, t = 20) {
	let r = String(e || "").trim();
	if (!r) return {
		ok: !1,
		error: "Missing asset ID"
	};
	let i = t && typeof t == "object" ? t : { topK: Number(t) }, a = Math.max(1, Math.min(200, Number(i?.topK ?? 20) || 20)), o = String(i?.scope || "").trim(), s = String(i?.customRootId || "").trim(), c = `${n.VECTOR_SIMILAR}/${encodeURIComponent(r)}?top_k=${a}`;
	return o && (c += `&scope=${encodeURIComponent(o)}`), s && (c += `&custom_root_id=${encodeURIComponent(s)}`), Z(c, { dedupeKey: `vec:${r}:${a}:${o}:${s}` });
}
async function Kn(e) {
	let t = String(e || "").trim();
	return t ? Z(`${n.VECTOR_ALIGNMENT}/${encodeURIComponent(t)}`) : {
		ok: !1,
		error: "Missing asset ID"
	};
}
async function qn(e) {
	let t = String(e || "").trim();
	return t ? Q(`${n.VECTOR_INDEX}/${encodeURIComponent(t)}`, {}) : {
		ok: !1,
		error: "Missing asset ID"
	};
}
async function Jn() {
	return Z(n.VECTOR_STATS);
}
async function Yn(e = 64, t = {}) {
	let r = Math.max(1, Math.min(200, e)), i = typeof t?.onProgress == "function" ? t.onProgress : null, a = String(t?.scope || "").trim().toLowerCase(), o = String(t?.customRootId ?? t?.custom_root_id ?? "").trim(), s = `${n.VECTOR_BACKFILL}?batch_size=${r}&async=1`;
	a && (s += `&scope=${encodeURIComponent(a)}`), o && (s += `&custom_root_id=${encodeURIComponent(o)}`);
	let c = await Q(s, {}, { timeoutMs: 3e4 });
	if (!c?.ok) return c;
	let l = c?.data || {}, u = String(l?.status || "").toLowerCase(), d = String(l?.backfill_id || "").trim();
	try {
		i?.(l);
	} catch (e) {
		console.debug?.(e);
	}
	if (!d || ![
		"queued",
		"running",
		"pending"
	].includes(u)) return c;
	let f = Number(t?.pollIntervalMs), p = Number(t?.pollTimeoutMs), m = Number.isFinite(f) ? Math.max(500, Math.min(1e4, Math.floor(f))) : rr, h = Number.isFinite(p) ? Math.max(1e4, Math.min(ar, Math.floor(p))) : ir, g = Date.now(), _ = null;
	for (; Date.now() - g < h;) {
		await ee(m);
		let e = await Z(`${n.VECTOR_BACKFILL_STATUS}?backfill_id=${encodeURIComponent(d)}`, { timeoutMs: 3e4 });
		if (!e?.ok) {
			_ = e;
			continue;
		}
		let t = e?.data || {}, r = String(t?.status || "").toLowerCase();
		_ = e;
		try {
			i?.(t);
		} catch (e) {
			console.debug?.(e);
		}
		if (r === "succeeded") return {
			ok: !0,
			data: t?.result || {},
			code: null,
			status: 200
		};
		if (r === "failed") return {
			ok: !1,
			error: String(t?.error || "Vector backfill failed"),
			code: String(t?.code || "DB_ERROR"),
			data: t,
			status: 500
		};
	}
	let v = await Z(`${n.VECTOR_BACKFILL_STATUS}?backfill_id=${encodeURIComponent(d)}`, { timeoutMs: 3e4 }), y = v?.data || _?.data || {}, b = String(y?.status || "").toLowerCase();
	if (v?.ok && [
		"queued",
		"running",
		"pending"
	].includes(b)) {
		try {
			i?.(y);
		} catch (e) {
			console.debug?.(e);
		}
		return {
			ok: !0,
			code: "PENDING",
			status: 202,
			data: {
				...y,
				pending: !0,
				timed_out: !0,
				poll_timeout_ms: h,
				backfill_id: String(y?.backfill_id || d),
				status: b || "running"
			},
			meta: { pending: !0 }
		};
	}
	return v?.ok && b === "failed" ? {
		ok: !1,
		error: String(y?.error || "Vector backfill failed"),
		code: String(y?.code || "DB_ERROR"),
		data: y,
		status: 500
	} : {
		ok: !1,
		error: `Vector backfill polling timed out after ${h}ms`,
		code: "TIMEOUT",
		data: y || null,
		status: 408
	};
}
async function Xn(e) {
	let t = String(e || "").trim();
	return t ? Q(`${n.VECTOR_CAPTION}/${encodeURIComponent(t)}`, {}) : {
		ok: !1,
		error: "Missing asset ID"
	};
}
async function Zn(e, { topK: r = 50, scope: i = "output", customRootId: a = "", subfolder: o = null, kind: s = null, hasWorkflow: c = null, minRating: l = null, minSizeMB: u = null, maxSizeMB: d = null, minWidth: f = null, minHeight: p = null, maxWidth: m = null, maxHeight: ee = null, workflowType: h = null, dateRange: g = null, dateExact: _ = null } = {}) {
	let v = String(e || "").trim();
	if (!v) return {
		ok: !1,
		error: "Empty query"
	};
	let y = `${n.HYBRID_SEARCH}?q=${encodeURIComponent(v)}&top_k=${Math.max(1, Math.min(200, r))}&scope=${encodeURIComponent(i)}`;
	return a && (y += `&custom_root_id=${encodeURIComponent(a)}`), y = t(y, {
		subfolder: o,
		kind: s,
		hasWorkflow: c,
		minRating: l,
		minSizeMB: u,
		maxSizeMB: d,
		minWidth: f,
		minHeight: p,
		maxWidth: m,
		maxHeight: ee,
		workflowType: h,
		dateRange: g,
		dateExact: _
	}), Z(y, { timeoutMs: 12e4 });
}
async function Qn(e = 8) {
	return Q(n.VECTOR_SUGGEST_COLLECTIONS, { k: Math.max(2, Math.min(20, e)) });
}
//#endregion
//#region ui/api/client.ts
var $n = 3e4, er = "__MJR_API_CLIENT__", tr = 2e3, nr = 200, rr = 1e3, ir = 30 * 6e4, ar = 720 * 6e4, J = "settings", or = "available-tags", Y = x({
	ttlMs: tr,
	maxSize: 1
}), X = x({
	ttlMs: tr,
	maxSize: 1
}), sr = x({
	ttlMs: () => dr(),
	maxSize: 1
}), cr = new Set([
	"1",
	"true",
	"yes",
	"on"
]), lr = new Set([
	"0",
	"false",
	"no",
	"off"
]);
function ur(e, t = !1) {
	if (typeof e == "boolean") return e;
	if (typeof e == "number") return e !== 0;
	if (typeof e == "string") {
		let t = e.trim().toLowerCase();
		if (cr.has(t)) return !0;
		if (lr.has(t)) return !1;
	}
	return !!t;
}
function dr() {
	try {
		let e = localStorage?.getItem?.("mjrSettings") || "{}", t = JSON.parse(e), n = t?.cache?.tagsTTLms ?? t?.cache?.tagsTTL ?? t?.cache?.tags_ttl_ms ?? null, r = Number(n);
		return Number.isFinite(r) ? Math.max(1e3, Math.min(10 * 6e4, Math.floor(r))) : $n;
	} catch {
		return $n;
	}
}
function fr() {
	Y.clear();
}
function pr() {
	X.clear();
}
function mr() {
	sr.clear();
}
function hr(e) {
	return String(e ?? "").trim().toLowerCase() || "";
}
function gr(e) {
	let t = [], n = /* @__PURE__ */ new Set();
	for (let r of Array.isArray(e) ? e : []) {
		let e = String(r ?? "").trim();
		if (!e) continue;
		let i = hr(e);
		!i || n.has(i) || (n.add(i), t.push(e));
	}
	return t;
}
try {
	let e = typeof window < "u" ? window : null;
	e && !e[er] && (e[er] = { initialized: !0 }, e.addEventListener?.("storage", (e) => {
		try {
			e?.key === "mjrSettings" && (fr(), pr(), mr(), Gt());
		} catch (e) {
			console.debug?.(e);
		}
	}), e.addEventListener?.("mjr-settings-changed", () => {
		fr(), pr(), mr(), Gt();
	}));
} catch (e) {
	console.debug?.(e);
}
var _r = () => {
	let e = Y.get(J);
	if (e !== void 0) return e;
	let t = Date.now();
	try {
		let e = localStorage?.getItem?.(a);
		if (!e) return Y.set(J, !1, { at: t }), !1;
		let n = !!JSON.parse(e)?.observability?.enabled;
		return Y.set(J, n, { at: t }), n;
	} catch {
		return Y.set(J, !1, { at: t }), !1;
	}
}, vr = () => {
	let e = X.get(J);
	if (e !== void 0) return e;
	let t = Date.now();
	try {
		let e = localStorage?.getItem?.(a);
		if (!e) return X.set(J, !0, { at: t }), !0;
		let n = JSON.parse(e)?.ratingTagsSync?.enabled, r = n == null ? !0 : ur(n, !0);
		return X.set(J, r, { at: t }), r;
	} catch {
		return X.set(J, !0, { at: t }), !0;
	}
}, yr = se({
	readObsEnabled: _r,
	readAuthToken: Pt,
	ensureWriteAuthToken: Wt,
	normalizeWriteAuthFailure: Ht
}), br = yr.fetchAPI;
async function Z(e, t = {}) {
	return yr.get(e, t);
}
async function Q(e, t, n = {}) {
	return yr.post(e, t, n);
}
async function xr(e, t, n = {}) {
	let a = vr(), o = e && typeof e == "object" ? e : null, s = r(o ? o.id : e), c = { rating: Math.max(0, Math.min(5, Number(t) || 0)) };
	return s ? c.asset_id = s : o && (c.filepath = o.filepath || o.path || o?.file_info?.filepath || "", c.type = o.type || "output", c.root_id = i(o)), br("/mjr/am/asset/rating", {
		...n,
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			...a ? { "X-MJR-RTSYNC": "on" } : {}
		},
		body: JSON.stringify(c)
	});
}
async function Sr(e, t, n = {}) {
	let a = vr(), o = e && typeof e == "object" ? e : null, s = r(o ? o.id : e), c = { tags: Array.isArray(t) ? t : [] };
	s ? c.asset_id = s : o && (c.filepath = o.filepath || o.path || o?.file_info?.filepath || "", c.type = o.type || "output", c.root_id = i(o));
	let l = await br("/mjr/am/asset/tags", {
		...n,
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			...a ? { "X-MJR-RTSYNC": "on" } : {}
		},
		body: JSON.stringify(c)
	});
	return l?.ok && mr(), l;
}
async function Cr() {
	let e = sr.get(or);
	if (Array.isArray(e)) return {
		ok: !0,
		data: e,
		error: null,
		code: "OK",
		meta: { cached: !0 }
	};
	let t = await Z("/mjr/am/tags");
	if (t?.ok && Array.isArray(t.data)) {
		let e = gr(t.data);
		return sr.set(or, e), {
			...t,
			data: e
		};
	}
	return t;
}
async function wr(e, t = {}) {
	let n = encodeURIComponent(r(e));
	return Z(`/mjr/am/asset/${n}`, {
		...t,
		dedupeKey: t?.dedupeKey || `meta:${n}`
	});
}
async function Tr(e, t = {}) {
	let n = r(e);
	if (!n) return {
		ok: !1,
		data: null,
		error: "Missing assetId",
		code: "INVALID_INPUT"
	};
	let i = `/mjr/am/viewer/info?asset_id=${encodeURIComponent(n)}`;
	t.refresh && (i += "&refresh=1");
	let { refresh: a, ...o } = t;
	return Z(i, o);
}
async function Er(e, t = {}) {
	let n = Array.isArray(e) ? e : [], r = [];
	for (let e of n) {
		let t = Number(e);
		if (Number.isFinite(t) && (r.push(Math.trunc(t)), r.length >= nr)) break;
	}
	return r.length ? Q("/mjr/am/assets/batch", { asset_ids: r }, t) : {
		ok: !0,
		data: [],
		error: null,
		code: "OK"
	};
}
async function Dr({ type: e = "output", filename: t = "", subfolder: n = "", root_id: r = "", rootId: i = "", filepath: a = "" } = {}, o = {}) {
	let s = String(e || "output").trim().toLowerCase() || "output", c = String(t || "").trim(), l = String(n || "").trim(), u = String(r || i || "").trim(), d = String(a || "").trim();
	if (!c) return {
		ok: !1,
		data: null,
		error: "Missing filename",
		code: "INVALID_INPUT"
	};
	let f = `/mjr/am/metadata?type=${encodeURIComponent(s)}&filename=${encodeURIComponent(c)}`;
	return d && (f += `&filepath=${encodeURIComponent(d)}`), l && (f += `&subfolder=${encodeURIComponent(l)}`), u && (f += `&root_id=${encodeURIComponent(u)}`), Z(f, o);
}
async function Or({ filepath: e = "", root_id: t = "", subfolder: r = "" } = {}, i = {}) {
	try {
		if (globalThis.__mjrFolderInfoSupported === !1) return {
			ok: !1,
			data: null,
			error: "Folder info endpoint unavailable",
			code: "UNAVAILABLE"
		};
		if (globalThis.__mjrFolderInfoSupported == null) {
			let e = await Z("/mjr/am/routes");
			if (e?.ok && Array.isArray(e.data)) {
				let t = e.data.some((e) => String(e?.path || "").trim() === "/mjr/am/folder-info");
				if (globalThis.__mjrFolderInfoSupported = !!t, !t) return {
					ok: !1,
					data: null,
					error: "Folder info endpoint unavailable",
					code: "UNAVAILABLE"
				};
			} else globalThis.__mjrFolderInfoSupported = null;
		}
	} catch (e) {
		console.debug?.(e);
	}
	let a = String(e || "").trim(), o = String(t || "").trim(), s = String(r || "").trim(), c = n.FOLDER_INFO, l = [];
	a ? (l.push(`filepath=${encodeURIComponent(a)}`), l.push("browser_mode=1")) : (o && l.push(`root_id=${encodeURIComponent(o)}`), s && l.push(`subfolder=${encodeURIComponent(s)}`)), l.length && (c += `?${l.join("&")}`);
	let u = await Z(c, i);
	try {
		!u?.ok && Number(u?.status || 0) === 404 && (globalThis.__mjrFolderInfoSupported = !1);
	} catch (e) {
		console.debug?.(e);
	}
	return u;
}
//#endregion
//#region ui/app/hostAdapter.ts
var $ = null;
function kr(e, t) {
	try {
		return Se(e || $ || D(), t);
	} catch {
		return !1;
	}
}
function Ar(e, t) {
	try {
		return ye(e || $ || D(), t);
	} catch {
		return !1;
	}
}
function jr(e, t) {
	try {
		return be(e || $ || D(), t);
	} catch {
		return !1;
	}
}
function Mr(e, t) {
	try {
		return xe(e || $ || D(), t);
	} catch {
		return !1;
	}
}
function Nr() {
	return $ || D() || null;
}
function Pr(e = null) {
	try {
		return fe(e || $ || D()) || null;
	} catch {
		return null;
	}
}
async function Fr(e = {}) {
	try {
		return await Ee(e);
	} catch {
		return null;
	}
}
function Ir() {
	let e = $ || D() || null, t = e?.canvas || null, n = t?.ds || null, r = t?.canvas || t?.el || null;
	if (!t || !n || !r) return null;
	let i = Number(n?.scale), a = Number(r?.width || r?.clientWidth || 0), o = Number(r?.height || r?.clientHeight || 0);
	return !Number.isFinite(i) || i <= 0 || !(a > 0) || !(o > 0) ? null : {
		app: e,
		graphCanvas: t,
		ds: n,
		scale: i,
		width: a,
		height: o
	};
}
function Lr(e, t, n) {
	return Array.isArray(e?.offset) ? (e.offset[0] = t, e.offset[1] = n, !0) : e?.offset && typeof e.offset == "object" ? (e.offset.x = t, e.offset.y = n, !0) : !1;
}
function Rr(e, t) {
	try {
		t?.setDirty?.(!0, !0);
	} catch (e) {
		console.debug?.(e);
	}
	try {
		e?.graph?.setDirtyCanvas?.(!0, !0);
	} catch (e) {
		console.debug?.(e);
	}
}
function zr(e) {
	try {
		let t = Ir();
		if (!t || !e) return !1;
		let n = Number(e.x), r = Number(e.y);
		if (!Number.isFinite(n) || !Number.isFinite(r)) return !1;
		let i = Math.max(1, Number(globalThis?.devicePixelRatio ?? globalThis?.window?.devicePixelRatio) || 1), a = -n + t.width * .5 / (t.scale * i), o = -r + t.height * .5 / (t.scale * i);
		return !Number.isFinite(a) || !Number.isFinite(o) || !Lr(t.ds, a, o) ? !1 : (Rr(t.app, t.graphCanvas), !0);
	} catch (e) {
		return console.debug?.(e), !1;
	}
}
function Br() {
	try {
		let e = Ir();
		if (!e) return null;
		let t = e.ds?.offset, n = Number(Array.isArray(t) ? t[0] : t?.x), r = Number(Array.isArray(t) ? t[1] : t?.y);
		return !Number.isFinite(n) || !Number.isFinite(r) ? null : {
			x0: -n / e.scale,
			y0: -r / e.scale,
			x1: (e.width - n) / e.scale,
			y1: (e.height - r) / e.scale
		};
	} catch (e) {
		return console.debug?.(e), null;
	}
}
//#endregion
export { An as $, Mn as A, mt as At, on as B, M as Bt, zn as C, Jn as Ct, Dn as D, bt as Dt, Bn as E, Ct as Et, qt as F, Je as Ft, Zn as G, de as Gt, Yt as H, D as Ht, un as I, Ye as It, Nn as J, Ee as Jt, Rn as K, ue as Kt, rn as L, B as Lt, $t as M, ht as Mt, fn as N, Ze as Nt, tn as O, nt as Ot, cn as P, Qe as Pt, yn as Q, a as Qt, En as R, Xe as Rt, vn as S, Wn as St, Fn as T, Lt as Tt, Cn as U, ve as Ut, Tn as V, fe as Vt, xn as W, _e as Wt, Hn as X, x as Xt, _n as Y, Te as Yt, Ln as Z, o as Zt, Q as _, Yn as _t, Nr as a, ln as at, Vn as b, Kn as bt, kr as c, Kt as ct, wr as d, sn as dt, kn as et, Er as f, Xt as ft, Tr as g, wn as gt, Or as h, Sn as ht, Pr as i, pn as it, Zt as j, pt as jt, Un as k, gt as kt, Fr as l, an as lt, Dr as m, jn as mt, zr as n, Qt as nt, jr as o, Jt as ot, Cr as p, bn as pt, On as q, he as qt, Br as r, en as rt, Mr as s, dn as st, Ar as t, nn as tt, Z as u, hn as ut, xr as v, Gn as vt, Pn as w, Qn as wt, gn as x, qn as xt, Sr as y, Xn as yt, mn as z, V as zt };
