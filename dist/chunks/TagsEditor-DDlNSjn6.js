import { F as e, qt as t, v as n } from "./viewerRuntimeHosts-BbCWOXEG.js";
import { St as r, m as i, n as a } from "./events-CrhYyn_G.js";
import { A as o } from "./mediaFps-Td0vBA3X.js";
import { A as s, B as c, C as l, E as u, G as d, H as f, I as ee, J as te, L as p, R as ne, T as m, W as h, b as g, ct as _, dt as v, j as y, k as b, lt as x, nt as S, q as C } from "./mjr-primevue-n1rsQYJg.js";
//#region ui/vue/components/common/TagsEditor.vue
var w = ["aria-busy"], T = ["aria-label"], re = {
	key: 0,
	class: "mjr-tags-empty"
}, ie = { class: "mjr-tags-input-wrap" }, ae = ["aria-selected", "onMouseenter"], oe = 100, E = 200, D = {
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
	setup(D, { emit: se }) {
		function O(e) {
			try {
				let t = String(e ?? "").trim();
				if (!t || t.length > oe) return null;
				for (let e = 0; e < t.length; e += 1) {
					let n = t.charCodeAt(e);
					if (n <= 31 || n === 127) return null;
				}
				return /[;,]/.test(t) ? null : t;
			} catch {
				return null;
			}
		}
		function k(e) {
			try {
				return String(e ?? "").replace(/[\x00-\x1f\x7f]/g, "").trim() || null;
			} catch {
				return null;
			}
		}
		function A(e) {
			let t = k(e);
			return t ? t.toLowerCase() : "";
		}
		function j(e) {
			let t = [], n = /* @__PURE__ */ new Set();
			for (let r of Array.isArray(e) ? e : []) {
				let e = k(r);
				if (!e) continue;
				let i = e.toLowerCase();
				if (!n.has(i) && (n.add(i), t.push(e), t.length >= E)) break;
			}
			return t;
		}
		function M(e) {
			if (Array.isArray(e)) return j(e);
			if (typeof e == "string") {
				let t = e.trim();
				if (!t) return [];
				try {
					let e = JSON.parse(t);
					if (Array.isArray(e)) return j(e);
				} catch {
					return j(t.split(","));
				}
			}
			return [];
		}
		function ce(e, t) {
			if (!Array.isArray(e) || !Array.isArray(t) || e.length !== t.length) return !1;
			for (let n = 0; n < e.length; n += 1) if (e[n] !== t[n]) return !1;
			return !0;
		}
		let N = D, P = se, F = M(N.asset?.tags ?? N.modelValue ?? []), I = S([...F]), L = S(null), R = S(""), z = S(!1), B = S(-1), V = S(null), H = S([]), U = S(!1), W = (e) => e?.$el || e || null, G = !1, K = !1, q = null, J = [...F], le = (e) => Math.min(100 * 2 ** Math.max(0, e - 1), 2e3), ue = (e) => new Promise((t) => setTimeout(t, e)), de = () => setTimeout(() => z.value = !1, 200), Y = m(() => {
			let e = R.value.toLowerCase().trim();
			if (!e) return [];
			let t = new Set(I.value.map((e) => A(e)).filter(Boolean));
			return H.value.filter((n) => {
				let r = A(n);
				return n.toLowerCase().includes(e) && (!r || !t.has(r));
			}).slice(0, 10);
		}), X = m(() => Y.value.length > 0);
		function Z(e) {
			if (G) return;
			let t = M(e);
			J = [...t], ce(t, I.value) || (I.value = [...t]);
		}
		function fe(e) {
			let t = [...e], n = N.asset?.id == null ? "" : String(N.asset.id);
			P("update:modelValue", t), P("tags-change", {
				assetId: N.asset?.id,
				tags: t
			}), o(a, {
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
				let a = M(I.value), o = typeof AbortController < "u" ? new AbortController() : null;
				q = o;
				let s = null;
				try {
					s = await e(N.asset, a, o ? { signal: o.signal } : {});
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
					I.value = e, P("update:modelValue", e), t(s?.error || i("toast.tagsUpdateFailed", "Failed to update tags"), "error"), G = !1, q = null, U.value = !1;
					return;
				}
				try {
					let e = s?.data?.asset_id ?? null;
					e != null && !r(N.asset.id) && (N.asset.id = e);
				} catch (e) {
					console.debug?.(e);
				}
				let c = M(Array.isArray(s?.data?.tags) ? s.data.tags : a);
				J = [...c];
				try {
					N.asset.tags = [...c];
				} catch (e) {
					console.debug?.(e);
				}
				if (K || (I.value = [...c]), fe(c), t(i("toast.tagsUpdated", "Tags updated"), "success", 1e3), !K) break;
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
				P("update:modelValue", e), t(i("toast.tagsUpdateFailed", "Failed to update tags"), "error");
			}
			G = !1, q = null, U.value = !1;
		}
		ne(async () => {
			try {
				await ee(), W(L.value)?.focus();
			} catch (e) {
				console.debug?.(e);
			}
			try {
				let e = await n();
				e?.ok && Array.isArray(e?.data) && (H.value = j(e.data));
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
			let n = O(e);
			if (!n) return;
			let r = A(n);
			if (r && !I.value.some((e) => A(e) === r)) {
				if (I.value.length >= E) {
					t(i("toast.maxTagsReached", "Maximum number of tags reached"), "warning");
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
			let n = h("MButton"), r = h("MInputText"), a = h("MListbox");
			return c(), b("div", {
				class: x(["mjr-tags-editor", { "is-disabled": D.disabled }]),
				"aria-busy": U.value
			}, [u("div", {
				class: "mjr-tags-display",
				role: "list",
				"aria-label": _(i)("tags.label", "Tags")
			}, [I.value.length === 0 ? (c(), b("span", re, v(_(i)("msg.noTagsYet", "No tags yet...")), 1)) : (c(!0), b(l, { key: 1 }, f(I.value, (e, r) => (c(), b("div", {
				key: e,
				class: "mjr-tag-chip",
				role: "listitem"
			}, [s(v(e) + " ", 1), y(n, {
				type: "button",
				class: "mjr-tag-chip-remove",
				severity: "secondary",
				text: "",
				rounded: "",
				"aria-label": _(i)("tags.remove", "Remove tag"),
				disabled: D.disabled,
				onClick: (e) => pe(r)
			}, {
				default: C(() => [...t[4] ||= [s(" x ", -1)]]),
				_: 1
			}, 8, [
				"aria-label",
				"disabled",
				"onClick"
			])]))), 128))], 8, T), u("div", ie, [y(r, {
				ref_key: "inputRef",
				ref: L,
				modelValue: R.value,
				"onUpdate:modelValue": t[0] ||= (e) => R.value = e,
				type: "text",
				class: "mjr-tag-input",
				placeholder: _(i)("sidebar.addTag", "Add tag..."),
				disabled: D.disabled,
				"aria-label": _(i)("tags.addLabel", "Add tag"),
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
			]), te(y(a, {
				modelValue: V.value,
				"onUpdate:modelValue": t[3] ||= (e) => V.value = e,
				options: Y.value,
				class: "mjr-tags-dropdown",
				"scroll-height": "150px",
				"aria-label": _(i)("tags.suggestions", "Tag suggestions"),
				onChange: ge
			}, {
				option: C(({ option: e, index: t }) => [u("div", {
					class: x(["mjr-tag-suggestion", { "is-active": t === B.value }]),
					"aria-selected": t === B.value,
					onMouseenter: (e) => B.value = t
				}, v(e), 43, ae)]),
				_: 1
			}, 8, [
				"modelValue",
				"options",
				"aria-label"
			]), [[g, z.value && X.value]])])], 10, w);
		};
	}
};
//#endregion
export { D as t };
