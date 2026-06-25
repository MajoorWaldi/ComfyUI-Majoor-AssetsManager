import { N as e, Ut as t, _ as n } from "./viewerRuntimeHosts-C-9ryYS-.js";
import { _t as r, n as i, p as a } from "./events-iWiZ-Zty.js";
import { A as o } from "./mediaFps-dibNFbk4.js";
import { B as s, C as c, D as l, F as ee, G as u, H as d, I as te, K as ne, O as f, R as p, U as m, et as h, k as g, lt as _, ot as v, st as y, w as b, x, y as S } from "./mjr-primevue-DaF1IwbI.js";
//#region ui/vue/components/common/TagsEditor.vue
var C = ["aria-busy"], re = ["aria-label"], w = {
	key: 0,
	class: "mjr-tags-empty"
}, T = { class: "mjr-tags-input-wrap" }, ie = ["aria-selected", "onMouseenter"], E = 100, D = 200, O = {
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
	setup(O, { emit: ae }) {
		function oe(e) {
			try {
				let t = String(e ?? "").trim();
				if (!t || t.length > E) return null;
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
				if (!n.has(i) && (n.add(i), t.push(e), t.length >= D)) break;
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
		let N = O, P = ae, F = M(N.asset?.tags ?? N.modelValue ?? []), I = h([...F]), L = h(null), R = h(""), z = h(!1), B = h(-1), V = h(null), H = h([]), U = h(!1), W = (e) => e?.$el || e || null, G = !1, K = !1, q = null, J = [...F], ce = (e) => Math.min(100 * 2 ** Math.max(0, e - 1), 2e3), le = (e) => new Promise((t) => setTimeout(t, e)), ue = () => setTimeout(() => z.value = !1, 200), Y = c(() => {
			let e = R.value.toLowerCase().trim();
			if (!e) return [];
			let t = new Set(I.value.map((e) => A(e)).filter(Boolean));
			return H.value.filter((n) => {
				let r = A(n);
				return n.toLowerCase().includes(e) && (!r || !t.has(r));
			}).slice(0, 10);
		}), X = c(() => Y.value.length > 0);
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
					I.value = e, P("update:modelValue", e), t(s?.error || a("toast.tagsUpdateFailed", "Failed to update tags"), "error"), G = !1, q = null, U.value = !1;
					return;
				}
				try {
					let e = s?.data?.asset_id ?? null;
					e != null && !r(N.asset.id) && (N.asset.id = e);
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
				if (K || (I.value = [...c]), de(c), t(a("toast.tagsUpdated", "Tags updated"), "success", 1e3), !K) break;
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
				P("update:modelValue", e), t(a("toast.tagsUpdateFailed", "Failed to update tags"), "error");
			}
			G = !1, q = null, U.value = !1;
		}
		te(async () => {
			try {
				let e = await n();
				e?.ok && Array.isArray(e?.data) && (H.value = j(e.data));
			} catch (e) {
				console.warn("Failed to load available tags:", e);
			}
		}), ee(() => {
			try {
				q?.abort?.();
			} catch (e) {
				console.debug?.(e);
			}
		});
		function $(e) {
			if (N.disabled) return;
			let n = oe(e);
			if (!n) return;
			let r = A(n);
			if (r && !I.value.some((e) => A(e) === r)) {
				if (I.value.length >= D) {
					t(a("toast.maxTagsReached", "Maximum number of tags reached"), "warning");
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
		return m(() => N.modelValue, (e) => {
			Z(e);
		}), m(() => N.asset?.tags, (e) => {
			Z(e);
		}), (e, t) => {
			let n = d("MButton"), r = d("MInputText"), i = d("MListbox");
			return p(), l("div", {
				class: y(["mjr-tags-editor", { "is-disabled": O.disabled }]),
				"aria-busy": U.value
			}, [b("div", {
				class: "mjr-tags-display",
				role: "list",
				"aria-label": v(a)("tags.label", "Tags")
			}, [I.value.length === 0 ? (p(), l("span", w, _(v(a)("msg.noTagsYet", "No tags yet...")), 1)) : (p(!0), l(x, { key: 1 }, s(I.value, (e, r) => (p(), l("div", {
				key: e,
				class: "mjr-tag-chip",
				role: "listitem"
			}, [f(_(e) + " ", 1), g(n, {
				type: "button",
				class: "mjr-tag-chip-remove",
				severity: "secondary",
				text: "",
				rounded: "",
				"aria-label": v(a)("tags.remove", "Remove tag"),
				disabled: O.disabled,
				onClick: (e) => fe(r)
			}, {
				default: u(() => [...t[4] ||= [f(" x ", -1)]]),
				_: 1
			}, 8, [
				"aria-label",
				"disabled",
				"onClick"
			])]))), 128))], 8, re), b("div", T, [g(r, {
				ref_key: "inputRef",
				ref: L,
				modelValue: R.value,
				"onUpdate:modelValue": t[0] ||= (e) => R.value = e,
				type: "text",
				class: "mjr-tag-input",
				placeholder: v(a)("sidebar.addTag", "Add tag..."),
				disabled: O.disabled,
				"aria-label": v(a)("tags.addLabel", "Add tag"),
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
			]), ne(g(i, {
				modelValue: V.value,
				"onUpdate:modelValue": t[3] ||= (e) => V.value = e,
				options: Y.value,
				class: "mjr-tags-dropdown",
				"scroll-height": "150px",
				"aria-label": v(a)("tags.suggestions", "Tag suggestions"),
				onChange: he
			}, {
				option: u(({ option: e, index: t }) => [b("div", {
					class: y(["mjr-tag-suggestion", { "is-active": t === B.value }]),
					"aria-selected": t === B.value,
					onMouseenter: (e) => B.value = t
				}, _(e), 43, ie)]),
				_: 1
			}, 8, [
				"modelValue",
				"options",
				"aria-label"
			]), [[S, z.value && X.value]])])], 10, C);
		};
	}
};
//#endregion
export { O as t };
