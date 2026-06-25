import { N as e, Wt as t, _ as n } from "./viewerRuntimeHosts-D9mwOMoh.js";
import { m as r, n as i, vt as a } from "./events-DE87d50y.js";
import { A as o } from "./mediaFps-CPzBm2U7.js";
import { A as s, B as c, C as ee, E as l, G as u, H as te, J as d, L as f, R as p, T as m, W as h, b as ne, ct as g, dt as _, j as v, k as y, lt as b, nt as x, q as S } from "./mjr-primevue-BABDj8Il.js";
//#region ui/vue/components/common/TagsEditor.vue
var re = ["aria-busy"], ie = ["aria-label"], C = {
	key: 0,
	class: "mjr-tags-empty"
}, w = { class: "mjr-tags-input-wrap" }, T = ["aria-selected", "onMouseenter"], ae = 100, E = 200, D = {
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
	setup(D, { emit: oe }) {
		function O(e) {
			try {
				let t = String(e ?? "").trim();
				if (!t || t.length > ae) return null;
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
		function se(e, t) {
			if (!Array.isArray(e) || !Array.isArray(t) || e.length !== t.length) return !1;
			for (let n = 0; n < e.length; n += 1) if (e[n] !== t[n]) return !1;
			return !0;
		}
		let N = D, P = oe, F = M(N.asset?.tags ?? N.modelValue ?? []), I = x([...F]), L = x(null), R = x(""), z = x(!1), B = x(-1), V = x(null), H = x([]), U = x(!1), W = (e) => e?.$el || e || null, G = !1, K = !1, q = null, J = [...F], ce = (e) => Math.min(100 * 2 ** Math.max(0, e - 1), 2e3), le = (e) => new Promise((t) => setTimeout(t, e)), ue = () => setTimeout(() => z.value = !1, 200), Y = m(() => {
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
			J = [...t], se(t, I.value) || (I.value = [...t]);
		}
		function de(e) {
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
				n > 0 && await le(ce(n)), n += 1;
				let i = M(I.value), o = typeof AbortController < "u" ? new AbortController() : null;
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
				let c = M(Array.isArray(s?.data?.tags) ? s.data.tags : i);
				J = [...c];
				try {
					N.asset.tags = [...c];
				} catch (e) {
					console.debug?.(e);
				}
				if (K || (I.value = [...c]), de(c), t(r("toast.tagsUpdated", "Tags updated"), "success", 1e3), !K) break;
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
		p(async () => {
			try {
				let e = await n();
				e?.ok && Array.isArray(e?.data) && (H.value = j(e.data));
			} catch (e) {
				console.warn("Failed to load available tags:", e);
			}
		}), f(() => {
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
			let i = A(n);
			if (i && !I.value.some((e) => A(e) === i)) {
				if (I.value.length >= E) {
					t(r("toast.maxTagsReached", "Maximum number of tags reached"), "warning");
					return;
				}
				I.value = [...I.value, n], Q();
			}
		}
		function fe(e) {
			if (N.disabled || e < 0 || e >= I.value.length) return;
			let t = [...I.value];
			t.splice(e, 1), I.value = t, Q();
		}
		function pe(e) {
			if (e.key === "Enter" || e.key === ",") {
				e.preventDefault();
				let t = R.value.trim();
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
		function me(e) {
			$(e), R.value = "", z.value = !1, B.value = -1, V.value = null, W(L.value)?.focus();
		}
		function he(e) {
			let t = e?.value ?? V.value;
			t && me(t);
		}
		return u(() => N.modelValue, (e) => {
			Z(e);
		}), u(() => N.asset?.tags, (e) => {
			Z(e);
		}), (e, t) => {
			let n = h("MButton"), i = h("MInputText"), a = h("MListbox");
			return c(), y("div", {
				class: b(["mjr-tags-editor", { "is-disabled": D.disabled }]),
				"aria-busy": U.value
			}, [l("div", {
				class: "mjr-tags-display",
				role: "list",
				"aria-label": g(r)("tags.label", "Tags")
			}, [I.value.length === 0 ? (c(), y("span", C, _(g(r)("msg.noTagsYet", "No tags yet...")), 1)) : (c(!0), y(ee, { key: 1 }, te(I.value, (e, i) => (c(), y("div", {
				key: e,
				class: "mjr-tag-chip",
				role: "listitem"
			}, [s(_(e) + " ", 1), v(n, {
				type: "button",
				class: "mjr-tag-chip-remove",
				severity: "secondary",
				text: "",
				rounded: "",
				"aria-label": g(r)("tags.remove", "Remove tag"),
				disabled: D.disabled,
				onClick: (e) => fe(i)
			}, {
				default: S(() => [...t[4] ||= [s(" x ", -1)]]),
				_: 1
			}, 8, [
				"aria-label",
				"disabled",
				"onClick"
			])]))), 128))], 8, ie), l("div", w, [v(i, {
				ref_key: "inputRef",
				ref: L,
				modelValue: R.value,
				"onUpdate:modelValue": t[0] ||= (e) => R.value = e,
				type: "text",
				class: "mjr-tag-input",
				placeholder: g(r)("sidebar.addTag", "Add tag..."),
				disabled: D.disabled,
				"aria-label": g(r)("tags.addLabel", "Add tag"),
				"aria-autocomplete": X.value ? "list" : "none",
				"aria-expanded": z.value,
				"aria-haspopup": X.value ? "listbox" : void 0,
				onFocus: t[1] ||= (e) => z.value = R.value.length > 0,
				onInput: t[2] ||= (e) => z.value = R.value.length > 0,
				onKeydown: pe,
				onBlur: ue
			}, null, 8, [
				"modelValue",
				"placeholder",
				"disabled",
				"aria-label",
				"aria-autocomplete",
				"aria-expanded",
				"aria-haspopup"
			]), d(v(a, {
				modelValue: V.value,
				"onUpdate:modelValue": t[3] ||= (e) => V.value = e,
				options: Y.value,
				class: "mjr-tags-dropdown",
				"scroll-height": "150px",
				"aria-label": g(r)("tags.suggestions", "Tag suggestions"),
				onChange: he
			}, {
				option: S(({ option: e, index: t }) => [l("div", {
					class: b(["mjr-tag-suggestion", { "is-active": t === B.value }]),
					"aria-selected": t === B.value,
					onMouseenter: (e) => B.value = t
				}, _(e), 43, T)]),
				_: 1
			}, 8, [
				"modelValue",
				"options",
				"aria-label"
			]), [[ne, z.value && X.value]])])], 10, re);
		};
	}
};
//#endregion
export { D as t };
