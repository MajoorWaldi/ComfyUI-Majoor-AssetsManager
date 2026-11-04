import { $t as e, F as t, P as n, v as r } from "./viewerRuntimeHosts-XPTU8ZhU.js";
import { m as i, n as a, t as o, wt as s } from "./events-CttACGx4.js";
import { Z as c } from "./viewerOpenRequest-CZXk8yvU.js";
import { $ as l, B as u, C as d, E as f, H as p, J as m, K as h, M as g, P as _, Q as v, T as y, V as ee, W as b, X as x, b as S, gt as C, ht as w, j as T, k as E, mt as D, pt as O, st as k } from "./mjr-primevue-C07IsEdU.js";
// ui/vue/components/common/RatingEditor.vue?vue&type=script&setup=true&lang.ts
var A = [
	"aria-busy",
	"aria-disabled",
	"aria-label",
	"aria-valuenow",
	"tabindex"
], j = /* @__PURE__ */ _({
	__name: "RatingEditor",
	props: {
		asset: {},
		modelValue: {},
		disabled: { type: Boolean },
		size: {}
	},
	emits: ["update:modelValue", "rating-change"],
	setup(t, { emit: r }) {
		function a(e) {
			return Math.max(0, Math.min(5, Number(e) || 0));
		}
		let l = t, u = r, f = a(l.asset?.rating ?? l.modelValue), p = k(f), _ = k(0), S = k(!1), C = f, D = f, j = null, M = y(() => _.value > 0 ? _.value : p.value), te = (e) => e <= M.value ? "#FFD45A" : "#555", ne = (e) => e <= M.value ? "scale(1.1)" : "scale(1)", re = y(() => {
			let e = l.size;
			return typeof e == "number" ? `${Math.max(8, e)}px` : String(e || "").trim() || "16px";
		}), ie = (e) => Math.min(100 * 2 ** Math.max(0, e - 1), 2e3), ae = (e) => new Promise((t) => setTimeout(t, e));
		function N(e) {
			if (S.value) return;
			let t = a(e);
			C = t, D = t, t !== p.value && (p.value = t);
		}
		function P(t = null) {
			p.value = C, D = C, u("update:modelValue", C), t && e(t, "error");
		}
		async function oe() {
			if (S.value) return;
			S.value = !0;
			let t = Date.now();
			try {
				let r = 0;
				for (; r < 10;) {
					if (Date.now() - t > 3e4) {
						P(i("toast.ratingUpdateFailed", "Rating update failed"));
						break;
					}
					r > 0 && await ae(ie(r)), r += 1;
					let d = a(D), f = typeof AbortController < "u" ? new AbortController() : null;
					j = f;
					let m = null;
					try {
						m = await n(l.asset, d, f ? { signal: f.signal } : {});
					} catch (e) {
						console.error("Failed to update rating:", e);
					}
					if (!m?.ok) {
						if (m?.code === "ABORTED" && D !== d) continue;
						P(m?.error || i("toast.ratingUpdateFailed", "Rating update failed"));
						break;
					}
					try {
						let e = m?.data?.asset_id ?? null;
						e != null && !s(l.asset.id) && (l.asset.id = e);
					} catch (e) {
						console.debug?.(e);
					}
					C = d, p.value = d;
					try {
						l.asset.rating = d;
					} catch (e) {
						console.debug?.(e);
					}
					if (u("update:modelValue", d), u("rating-change", {
						assetId: l.asset?.id,
						rating: d
					}), c(o, {
						assetId: l.asset?.id == null ? "" : String(l.asset.id),
						rating: d
					}), D === d) {
						e(i("toast.ratingSetN", { n: d }), "success", 1e3);
						break;
					}
				}
				r >= 10 && P(i("toast.ratingUpdateFailed", "Rating update failed"));
			} finally {
				j = null, S.value = !1;
			}
		}
		function F(e) {
			if (l.disabled) return;
			let t = a(e);
			D = t, p.value = t, _.value = 0, u("update:modelValue", t);
			try {
				j?.abort?.();
			} catch (e) {
				console.debug?.(e);
			}
			oe();
		}
		function I(e) {
			F(e);
		}
		function L(e) {
			l.disabled || (_.value = e);
		}
		function R() {
			_.value = 0;
		}
		function z(e) {
			if (l.disabled) return;
			let t = null;
			switch (e.key) {
				case "ArrowRight":
				case "ArrowUp":
					e.preventDefault(), t = Math.min(5, p.value + 1);
					break;
				case "ArrowLeft":
				case "ArrowDown":
					e.preventDefault(), t = Math.max(0, p.value - 1);
					break;
				case "Home":
					e.preventDefault(), t = 0;
					break;
				case "End":
					e.preventDefault(), t = 5;
					break;
				default: e.key >= "0" && e.key <= "5" && (e.preventDefault(), t = parseInt(e.key, 10));
			}
			t !== null && t !== p.value && F(t);
		}
		return ee(() => {
			try {
				j?.abort?.();
			} catch (e) {
				console.debug?.(e);
			}
		}), x(() => l.modelValue, (e) => {
			N(e);
		}), x(() => l.asset?.rating, (e) => {
			N(e);
		}), (e, n) => {
			let r = m("MButton");
			return b(), E("div", {
				class: "mjr-rating-editor",
				style: w({
					display: "inline-flex",
					gap: "2px",
					pointerEvents: t.disabled ? "none" : "auto",
					opacity: t.disabled ? .6 : 1
				}),
				"aria-busy": S.value,
				"aria-disabled": t.disabled,
				role: "slider",
				"aria-label": O(i)("rating.label", "Rating"),
				"aria-valuemin": 0,
				"aria-valuemax": 5,
				"aria-valuenow": p.value,
				tabindex: t.disabled ? -1 : 0,
				onKeydown: z
			}, [(b(), E(d, null, h(5, (e) => g(r, {
				key: e,
				type: "button",
				class: "mjr-rating-star",
				severity: "secondary",
				text: "",
				rounded: "",
				style: w({
					color: te(e),
					transform: ne(e),
					fontSize: re.value,
					background: "none",
					border: "none",
					cursor: t.disabled ? "default" : "pointer",
					padding: "0",
					transition: "all 0.15s ease"
				}),
				"aria-label": O(i)("rating.setN", { n: e }),
				"aria-pressed": e <= p.value,
				disabled: t.disabled,
				onClick: (t) => I(e),
				onMouseenter: (t) => L(e),
				onMouseleave: R
			}, {
				default: v(() => [...n[0] ||= [T(" ★ ", -1)]]),
				_: 1
			}, 8, [
				"style",
				"aria-label",
				"aria-pressed",
				"disabled",
				"onClick",
				"onMouseenter"
			])), 64))], 44, A);
		};
	}
}), M = ["aria-busy"], te = ["aria-label"], ne = {
	key: 0,
	class: "mjr-tags-empty"
}, re = { class: "mjr-tags-input-wrap" }, ie = ["aria-selected", "onMouseenter"], ae = 100, N = 200, P = /* @__PURE__ */ _({
	__name: "TagsEditor",
	props: {
		asset: {},
		modelValue: { default: void 0 },
		disabled: {
			type: Boolean,
			default: !1
		},
		autofocus: {
			type: Boolean,
			default: !0
		}
	},
	emits: ["update:modelValue", "tags-change"],
	setup(n, { emit: o }) {
		function _(e) {
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
		function w(e) {
			try {
				return String(e ?? "").replace(/[\x00-\x1f\x7f]/g, "").trim() || null;
			} catch {
				return null;
			}
		}
		function A(e) {
			let t = w(e);
			return t ? t.toLowerCase() : "";
		}
		function j(e) {
			let t = [], n = /* @__PURE__ */ new Set();
			for (let r of Array.isArray(e) ? e : []) {
				let e = w(r);
				if (!e) continue;
				let i = e.toLowerCase();
				if (!n.has(i) && (n.add(i), t.push(e), t.length >= N)) break;
			}
			return t;
		}
		function P(e) {
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
		function oe(e, t) {
			if (!Array.isArray(e) || !Array.isArray(t) || e.length !== t.length) return !1;
			for (let n = 0; n < e.length; n += 1) if (e[n] !== t[n]) return !1;
			return !0;
		}
		let F = n, I = o, L = P(F.asset?.tags ?? F.modelValue ?? []), R = k([...L]), z = k(null), B = k(""), V = k(!1), H = k(-1), U = k(null), W = k([]), G = k(!1), K = (e) => e?.$el || e || null, q = !1, J = !1, Y = null, X = [...L], se = (e) => Math.min(100 * 2 ** Math.max(0, e - 1), 2e3), ce = (e) => new Promise((t) => setTimeout(t, e)), le = () => setTimeout(() => V.value = !1, 200), Z = y(() => {
			let e = B.value.toLowerCase().trim();
			if (!e) return [];
			let t = new Set(R.value.map((e) => A(e)).filter(Boolean));
			return W.value.filter((n) => {
				let r = A(n);
				return n.toLowerCase().includes(e) && (!r || !t.has(r));
			}).slice(0, 10);
		}), Q = y(() => Z.value.length > 0);
		function ue(e) {
			if (q) return;
			let t = P(e);
			X = [...t], oe(t, R.value) || (R.value = [...t]);
		}
		function de(e) {
			let t = [...e], n = F.asset?.id == null ? "" : String(F.asset.id);
			I("update:modelValue", t), I("tags-change", {
				assetId: F.asset?.id,
				tags: t
			}), c(a, {
				assetId: n,
				tags: t
			});
		}
		async function fe() {
			if (F.disabled) return;
			if (q) {
				J = !0;
				try {
					Y?.abort?.();
				} catch (e) {
					console.debug?.(e);
				}
				return;
			}
			q = !0, G.value = !0;
			let n = 0;
			for (; n < 10;) {
				n > 0 && await ce(se(n)), n += 1;
				let r = P(R.value), a = typeof AbortController < "u" ? new AbortController() : null;
				Y = a;
				let o = null;
				try {
					o = await t(F.asset, r, a ? { signal: a.signal } : {});
				} catch (e) {
					console.error("Failed to update tags:", e);
				}
				if (!o?.ok) {
					if (o?.code === "ABORTED") {
						if (J) {
							J = !1;
							continue;
						}
						break;
					}
					let t = [...X];
					R.value = t, I("update:modelValue", t), e(o?.error || i("toast.tagsUpdateFailed", "Failed to update tags"), "error"), q = !1, Y = null, G.value = !1;
					return;
				}
				try {
					let e = o?.data?.asset_id ?? null;
					e != null && !s(F.asset.id) && (F.asset.id = e);
				} catch (e) {
					console.debug?.(e);
				}
				let c = P(Array.isArray(o?.data?.tags) ? o.data.tags : r);
				X = [...c];
				try {
					F.asset.tags = [...c];
				} catch (e) {
					console.debug?.(e);
				}
				if (J || (R.value = [...c]), de(c), e(i("toast.tagsUpdated", "Tags updated"), "success", 1e3), !J) break;
				J = !1;
			}
			if (n >= 10) {
				let t = [...X];
				R.value = t;
				try {
					F.asset.tags = [...t];
				} catch (e) {
					console.debug?.(e);
				}
				I("update:modelValue", t), e(i("toast.tagsUpdateFailed", "Failed to update tags"), "error");
			}
			q = !1, Y = null, G.value = !1;
		}
		p(async () => {
			try {
				await u(), F.autofocus && K(z.value)?.focus();
			} catch (e) {
				console.debug?.(e);
			}
			try {
				let e = await r();
				e?.ok && Array.isArray(e?.data) && (W.value = j(e.data));
			} catch (e) {
				console.warn("Failed to load available tags:", e);
			}
		}), ee(() => {
			try {
				Y?.abort?.();
			} catch (e) {
				console.debug?.(e);
			}
		});
		function $(t) {
			if (F.disabled) return;
			let n = _(t);
			if (!n) return;
			let r = A(n);
			r && (R.value.some((e) => A(e) === r) || (R.value.length >= N ? e(i("toast.maxTagsReached", "Maximum number of tags reached"), "warning") : (R.value = [...R.value, n], fe())));
		}
		function pe(e) {
			if (F.disabled || e < 0 || e >= R.value.length) return;
			let t = [...R.value];
			t.splice(e, 1), R.value = t, fe();
		}
		function me(e) {
			if (e.key === "Enter" || e.key === ",") {
				e.preventDefault();
				let t = (V.value && Q.value && H.value >= 0 ? Z.value[H.value] : null) || B.value.trim();
				t && ($(t), B.value = "", V.value = !1, H.value = -1, U.value = null);
			} else if (e.key === "Escape") V.value = !1, H.value = -1, U.value = null;
			else if (e.key === "ArrowDown") e.preventDefault(), Q.value && (H.value = Math.min(H.value + 1, Z.value.length - 1));
			else if (e.key === "ArrowUp") e.preventDefault(), H.value = Math.max(H.value - 1, 0);
			else if (e.key === "Tab" && Q.value) {
				e.preventDefault();
				let t = Z.value[H.value] || Z.value[0];
				t && (B.value = t);
			}
		}
		function he(e) {
			$(e), B.value = "", V.value = !1, H.value = -1, U.value = null, K(z.value)?.focus();
		}
		function ge(e) {
			let t = e?.value ?? U.value;
			t && he(t);
		}
		return x(() => F.modelValue, (e) => {
			ue(e);
		}), x(() => F.asset?.tags, (e) => {
			ue(e);
		}), (e, t) => {
			let r = m("MButton"), a = m("MInputText"), o = m("MListbox");
			return b(), E("div", {
				class: D(["mjr-tags-editor", { "is-disabled": n.disabled }]),
				"aria-busy": G.value
			}, [f("div", {
				class: "mjr-tags-display",
				role: "list",
				"aria-label": O(i)("tags.label", "Tags")
			}, [R.value.length === 0 ? (b(), E("span", ne, C(O(i)("msg.noTagsYet", "No tags yet...")), 1)) : (b(!0), E(d, { key: 1 }, h(R.value, (e, a) => (b(), E("div", {
				key: e,
				class: "mjr-tag-chip",
				role: "listitem"
			}, [T(C(e) + " ", 1), g(r, {
				type: "button",
				class: "mjr-tag-chip-remove",
				severity: "secondary",
				text: "",
				rounded: "",
				"aria-label": O(i)("tags.remove", "Remove tag"),
				disabled: n.disabled,
				onClick: (e) => pe(a)
			}, {
				default: v(() => [...t[4] ||= [T(" x ", -1)]]),
				_: 1
			}, 8, [
				"aria-label",
				"disabled",
				"onClick"
			])]))), 128))], 8, te), f("div", re, [g(a, {
				ref_key: "inputRef",
				ref: z,
				modelValue: B.value,
				"onUpdate:modelValue": t[0] ||= (e) => B.value = e,
				type: "text",
				class: "mjr-tag-input",
				placeholder: O(i)("sidebar.addTag", "Add tag..."),
				disabled: n.disabled,
				"aria-label": O(i)("tags.addLabel", "Add tag"),
				"aria-autocomplete": Q.value ? "list" : "none",
				"aria-expanded": V.value,
				"aria-haspopup": Q.value ? "listbox" : void 0,
				onFocus: t[1] ||= (e) => V.value = B.value.length > 0,
				onInput: t[2] ||= (e) => V.value = B.value.length > 0,
				onKeydown: me,
				onBlur: le
			}, null, 8, [
				"modelValue",
				"placeholder",
				"disabled",
				"aria-label",
				"aria-autocomplete",
				"aria-expanded",
				"aria-haspopup"
			]), l(g(o, {
				modelValue: U.value,
				"onUpdate:modelValue": t[3] ||= (e) => U.value = e,
				options: Z.value,
				class: "mjr-tags-dropdown",
				"scroll-height": "150px",
				"aria-label": O(i)("tags.suggestions", "Tag suggestions"),
				onChange: ge
			}, {
				option: v(({ option: e, index: t }) => [f("div", {
					class: D(["mjr-tag-suggestion", { "is-active": t === H.value }]),
					"aria-selected": t === H.value,
					onMouseenter: (e) => H.value = t
				}, C(e), 43, ie)]),
				_: 1
			}, 8, [
				"modelValue",
				"options",
				"aria-label"
			]), [[S, V.value && Q.value]])])], 10, M);
		};
	}
});
export { j as n, P as t };
