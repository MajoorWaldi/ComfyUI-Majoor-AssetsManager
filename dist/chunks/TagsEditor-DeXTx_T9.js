import { N as e, Wt as t, _ as n } from "./viewerRuntimeHosts-r4nt8vZO.js";
import { m as r, n as i, vt as a } from "./events-CRutpS6F.js";
import { A as o } from "./mediaFps-DdY7KJFU.js";
import { A as s, B as c, C as l, E as u, G as d, H as ee, I as te, J as f, L as p, R as m, T as h, W as g, b as ne, ct as _, dt as v, j as y, k as b, lt as x, nt as S, q as C } from "./mjr-primevue-n1rsQYJg.js";
//#region ui/vue/components/common/TagsEditor.vue
var w = ["aria-busy"], re = ["aria-label"], ie = {
	key: 0,
	class: "mjr-tags-empty"
}, ae = { class: "mjr-tags-input-wrap" }, oe = ["aria-selected", "onMouseenter"], se = 100, T = 200, E = {
	__name: "TagsEditor",
	props: {
		asset: {
			type: Object,
			required: !0
		},
		modelValue: {
			type: [Array, String],
			default: () => []
		},
		disabled: {
			type: Boolean,
			default: !1
		}
	},
	emits: ["update:modelValue", "tags-change"],
	setup(E, { emit: ce }) {
		function D(e) {
			try {
				let t = String(e ?? "").trim();
				if (!t || t.length > se) return null;
				for (let e = 0; e < t.length; e += 1) {
					let n = t.charCodeAt(e);
					if (n <= 31 || n === 127) return null;
				}
				return /[;,]/.test(t) ? null : t;
			} catch {
				return null;
			}
		}
		function O(e) {
			try {
				return String(e ?? "").replace(/[\x00-\x1f\x7f]/g, "").trim() || null;
			} catch {
				return null;
			}
		}
		function k(e) {
			let t = O(e);
			return t ? t.toLowerCase() : "";
		}
		function A(e) {
			let t = [], n = /* @__PURE__ */ new Set();
			for (let r of Array.isArray(e) ? e : []) {
				let e = O(r);
				if (!e) continue;
				let i = e.toLowerCase();
				if (!n.has(i) && (n.add(i), t.push(e), t.length >= T)) break;
			}
			return t;
		}
		function j(e) {
			if (Array.isArray(e)) return A(e);
			if (typeof e == "string") {
				let t = e.trim();
				if (!t) return [];
				try {
					let e = JSON.parse(t);
					if (Array.isArray(e)) return A(e);
				} catch {
					return A(t.split(","));
				}
			}
			return [];
		}
		function M(e, t) {
			if (!Array.isArray(e) || !Array.isArray(t) || e.length !== t.length) return !1;
			for (let n = 0; n < e.length; n += 1) if (e[n] !== t[n]) return !1;
			return !0;
		}
		let N = E, P = ce, F = j(N.asset?.tags ?? N.modelValue ?? []), I = S([...F]), L = S(null), R = S(""), z = S(!1), B = S(-1), V = S(null), H = S([]), U = S(!1), W = (e) => e?.$el || e || null, G = !1, K = !1, q = null, J = [...F], le = (e) => Math.min(100 * 2 ** Math.max(0, e - 1), 2e3), ue = (e) => new Promise((t) => setTimeout(t, e)), de = () => setTimeout(() => z.value = !1, 200), Y = h(() => {
			let e = R.value.toLowerCase().trim();
			if (!e) return [];
			let t = new Set(I.value.map((e) => k(e)).filter(Boolean));
			return H.value.filter((n) => {
				let r = k(n);
				return n.toLowerCase().includes(e) && (!r || !t.has(r));
			}).slice(0, 10);
		}), X = h(() => Y.value.length > 0);
		function Z(e) {
			if (G) return;
			let t = j(e);
			J = [...t], M(t, I.value) || (I.value = [...t]);
		}
		function fe(e) {
			let t = [...e], n = N.asset?.id == null ? "" : String(N.asset.id);
			P("update:modelValue", t), P("tags-change", {
				assetId: N.asset?.id,
				tags: t
			}), o(i, {
				assetId: n,
				tags: t
			});
		}
		async function Q() {
			if (N.disabled) return;
			if (G) {
				K = !0;
				try {
					q?.abort?.();
				} catch (e) {
					console.debug?.(e);
				}
				return;
			}
			G = !0, U.value = !0;
			let n = 0;
			for (; n < 10;) {
				n > 0 && await ue(le(n)), n += 1;
				let i = j(I.value), o = typeof AbortController < "u" ? new AbortController() : null;
				q = o;
				let s = null;
				try {
					s = await e(N.asset, i, o ? { signal: o.signal } : {});
				} catch (e) {
					console.error("Failed to update tags:", e);
				}
				if (!s?.ok) {
					if (s?.code === "ABORTED") {
						if (K) {
							K = !1;
							continue;
						}
						break;
					}
					let e = [...J];
					I.value = e, P("update:modelValue", e), t(s?.error || r("toast.tagsUpdateFailed", "Failed to update tags"), "error"), G = !1, q = null, U.value = !1;
					return;
				}
				try {
					let e = s?.data?.asset_id ?? null;
					e != null && !a(N.asset.id) && (N.asset.id = e);
				} catch (e) {
					console.debug?.(e);
				}
				let c = j(Array.isArray(s?.data?.tags) ? s.data.tags : i);
				J = [...c];
				try {
					N.asset.tags = [...c];
				} catch (e) {
					console.debug?.(e);
				}
				if (K || (I.value = [...c]), fe(c), t(r("toast.tagsUpdated", "Tags updated"), "success", 1e3), !K) break;
				K = !1;
			}
			if (n >= 10) {
				let e = [...J];
				I.value = e;
				try {
					N.asset.tags = [...e];
				} catch (e) {
					console.debug?.(e);
				}
				P("update:modelValue", e), t(r("toast.tagsUpdateFailed", "Failed to update tags"), "error");
			}
			G = !1, q = null, U.value = !1;
		}
		m(async () => {
			try {
				await te(), W(L.value)?.focus();
			} catch (e) {
				console.debug?.(e);
			}
			try {
				let e = await n();
				e?.ok && Array.isArray(e?.data) && (H.value = A(e.data));
			} catch (e) {
				console.warn("Failed to load available tags:", e);
			}
		}), p(() => {
			try {
				q?.abort?.();
			} catch (e) {
				console.debug?.(e);
			}
		});
		function $(e) {
			if (N.disabled) return;
			let n = D(e);
			if (!n) return;
			let i = k(n);
			if (i && !I.value.some((e) => k(e) === i)) {
				if (I.value.length >= T) {
					t(r("toast.maxTagsReached", "Maximum number of tags reached"), "warning");
					return;
				}
				I.value = [...I.value, n], Q();
			}
		}
		function pe(e) {
			if (N.disabled || e < 0 || e >= I.value.length) return;
			let t = [...I.value];
			t.splice(e, 1), I.value = t, Q();
		}
		function me(e) {
			if (e.key === "Enter" || e.key === ",") {
				e.preventDefault();
				let t = (z.value && X.value && B.value >= 0 ? Y.value[B.value] : null) || R.value.trim();
				t && ($(t), R.value = "", z.value = !1, B.value = -1, V.value = null);
				return;
			}
			if (e.key === "Escape") {
				z.value = !1, B.value = -1, V.value = null;
				return;
			}
			if (e.key === "ArrowDown") {
				e.preventDefault(), X.value && (B.value = Math.min(B.value + 1, Y.value.length - 1));
				return;
			}
			if (e.key === "ArrowUp") {
				e.preventDefault(), B.value = Math.max(B.value - 1, 0);
				return;
			}
			if (e.key === "Tab" && X.value) {
				e.preventDefault();
				let t = Y.value[B.value] || Y.value[0];
				t && (R.value = t);
			}
		}
		function he(e) {
			$(e), R.value = "", z.value = !1, B.value = -1, V.value = null, W(L.value)?.focus();
		}
		function ge(e) {
			let t = e?.value ?? V.value;
			t && he(t);
		}
		return d(() => N.modelValue, (e) => {
			Z(e);
		}), d(() => N.asset?.tags, (e) => {
			Z(e);
		}), (e, t) => {
			let n = g("MButton"), i = g("MInputText"), a = g("MListbox");
			return c(), b("div", {
				class: x(["mjr-tags-editor", { "is-disabled": E.disabled }]),
				"aria-busy": U.value
			}, [u("div", {
				class: "mjr-tags-display",
				role: "list",
				"aria-label": _(r)("tags.label", "Tags")
			}, [I.value.length === 0 ? (c(), b("span", ie, v(_(r)("msg.noTagsYet", "No tags yet...")), 1)) : (c(!0), b(l, { key: 1 }, ee(I.value, (e, i) => (c(), b("div", {
				key: e,
				class: "mjr-tag-chip",
				role: "listitem"
			}, [s(v(e) + " ", 1), y(n, {
				type: "button",
				class: "mjr-tag-chip-remove",
				severity: "secondary",
				text: "",
				rounded: "",
				"aria-label": _(r)("tags.remove", "Remove tag"),
				disabled: E.disabled,
				onClick: (e) => pe(i)
			}, {
				default: C(() => [...t[4] ||= [s(" x ", -1)]]),
				_: 1
			}, 8, [
				"aria-label",
				"disabled",
				"onClick"
			])]))), 128))], 8, re), u("div", ae, [y(i, {
				ref_key: "inputRef",
				ref: L,
				modelValue: R.value,
				"onUpdate:modelValue": t[0] ||= (e) => R.value = e,
				type: "text",
				class: "mjr-tag-input",
				placeholder: _(r)("sidebar.addTag", "Add tag..."),
				disabled: E.disabled,
				"aria-label": _(r)("tags.addLabel", "Add tag"),
				"aria-autocomplete": X.value ? "list" : "none",
				"aria-expanded": z.value,
				"aria-haspopup": X.value ? "listbox" : void 0,
				onFocus: t[1] ||= (e) => z.value = R.value.length > 0,
				onInput: t[2] ||= (e) => z.value = R.value.length > 0,
				onKeydown: me,
				onBlur: de
			}, null, 8, [
				"modelValue",
				"placeholder",
				"disabled",
				"aria-label",
				"aria-autocomplete",
				"aria-expanded",
				"aria-haspopup"
			]), f(y(a, {
				modelValue: V.value,
				"onUpdate:modelValue": t[3] ||= (e) => V.value = e,
				options: Y.value,
				class: "mjr-tags-dropdown",
				"scroll-height": "150px",
				"aria-label": _(r)("tags.suggestions", "Tag suggestions"),
				onChange: ge
			}, {
				option: C(({ option: e, index: t }) => [u("div", {
					class: x(["mjr-tag-suggestion", { "is-active": t === B.value }]),
					"aria-selected": t === B.value,
					onMouseenter: (e) => B.value = t
				}, v(e), 43, oe)]),
				_: 1
			}, 8, [
				"modelValue",
				"options",
				"aria-label"
			]), [[ne, z.value && X.value]])])], 10, w);
		};
	}
};
//#endregion
export { E as t };
