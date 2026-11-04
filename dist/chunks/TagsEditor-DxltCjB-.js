import { $t as e, F as t, P as n, v as r } from "./viewerRuntimeHosts-CW2DfHq_.js";
import { m as i, n as a, t as o, wt as s } from "./events-cBMXVULQ.js";
import { Z as c } from "./viewerOpenRequest-BN2VAo8C.js";
import { A as l, C as u, E as d, G as f, J as p, K as m, L as h, N as g, R as _, T as v, U as y, V as b, Y as x, b as S, dt as C, ft as w, j as T, k as E, lt as D, rt as O, ut as k, z as A } from "./mjr-primevue-RN5COnJA.js";
// ui/vue/components/common/RatingEditor.vue?vue&type=script&setup=true&lang.ts
var j = [
	"aria-busy",
	"aria-disabled",
	"aria-label",
	"aria-valuenow",
	"tabindex"
], M = /* @__PURE__ */ g({
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
		let d = t, h = r, g = a(d.asset?.rating ?? d.modelValue), x = O(g), S = O(0), w = O(!1), k = g, A = g, M = null, N = v(() => S.value > 0 ? S.value : x.value), ee = (e) => e <= N.value ? "#FFD45A" : "#555", te = (e) => e <= N.value ? "scale(1.1)" : "scale(1)", ne = v(() => {
			let e = d.size;
			return typeof e == "number" ? `${Math.max(8, e)}px` : String(e || "").trim() || "16px";
		}), re = (e) => Math.min(100 * 2 ** Math.max(0, e - 1), 2e3), ie = (e) => new Promise((t) => setTimeout(t, e));
		function P(e) {
			if (w.value) return;
			let t = a(e);
			k = t, A = t, t !== x.value && (x.value = t);
		}
		function F(t = null) {
			x.value = k, A = k, h("update:modelValue", k), t && e(t, "error");
		}
		async function I() {
			if (w.value) return;
			w.value = !0;
			let t = Date.now();
			try {
				let r = 0;
				for (; r < 10;) {
					if (Date.now() - t > 3e4) {
						F(i("toast.ratingUpdateFailed", "Rating update failed"));
						break;
					}
					r > 0 && await ie(re(r)), r += 1;
					let l = a(A), u = typeof AbortController < "u" ? new AbortController() : null;
					M = u;
					let f = null;
					try {
						f = await n(d.asset, l, u ? { signal: u.signal } : {});
					} catch (e) {
						console.error("Failed to update rating:", e);
					}
					if (!f?.ok) {
						if (f?.code === "ABORTED" && A !== l) continue;
						F(f?.error || i("toast.ratingUpdateFailed", "Rating update failed"));
						break;
					}
					try {
						let e = f?.data?.asset_id ?? null;
						e != null && !s(d.asset.id) && (d.asset.id = e);
					} catch (e) {
						console.debug?.(e);
					}
					k = l, x.value = l;
					try {
						d.asset.rating = l;
					} catch (e) {
						console.debug?.(e);
					}
					if (h("update:modelValue", l), h("rating-change", {
						assetId: d.asset?.id,
						rating: l
					}), c(o, {
						assetId: d.asset?.id == null ? "" : String(d.asset.id),
						rating: l
					}), A === l) {
						e(i("toast.ratingSetN", { n: l }), "success", 1e3);
						break;
					}
				}
				r >= 10 && F(i("toast.ratingUpdateFailed", "Rating update failed"));
			} finally {
				M = null, w.value = !1;
			}
		}
		function L(e) {
			if (d.disabled) return;
			let t = a(e);
			A = t, x.value = t, S.value = 0, h("update:modelValue", t);
			try {
				M?.abort?.();
			} catch (e) {
				console.debug?.(e);
			}
			I();
		}
		function R(e) {
			L(e);
		}
		function z(e) {
			d.disabled || (S.value = e);
		}
		function B() {
			S.value = 0;
		}
		function V(e) {
			if (d.disabled) return;
			let t = null;
			switch (e.key) {
				case "ArrowRight":
				case "ArrowUp":
					e.preventDefault(), t = Math.min(5, x.value + 1);
					break;
				case "ArrowLeft":
				case "ArrowDown":
					e.preventDefault(), t = Math.max(0, x.value - 1);
					break;
				case "Home":
					e.preventDefault(), t = 0;
					break;
				case "End":
					e.preventDefault(), t = 5;
					break;
				default: e.key >= "0" && e.key <= "5" && (e.preventDefault(), t = parseInt(e.key, 10));
			}
			t !== null && t !== x.value && L(t);
		}
		return _(() => {
			try {
				M?.abort?.();
			} catch (e) {
				console.debug?.(e);
			}
		}), m(() => d.modelValue, (e) => {
			P(e);
		}), m(() => d.asset?.rating, (e) => {
			P(e);
		}), (e, n) => {
			let r = f("MButton");
			return b(), E("div", {
				class: "mjr-rating-editor",
				style: C({
					display: "inline-flex",
					gap: "2px",
					pointerEvents: t.disabled ? "none" : "auto",
					opacity: t.disabled ? .6 : 1
				}),
				"aria-busy": w.value,
				"aria-disabled": t.disabled,
				role: "slider",
				"aria-label": D(i)("rating.label", "Rating"),
				"aria-valuemin": 0,
				"aria-valuemax": 5,
				"aria-valuenow": x.value,
				tabindex: t.disabled ? -1 : 0,
				onKeydown: V
			}, [(b(), E(u, null, y(5, (e) => T(r, {
				key: e,
				type: "button",
				class: "mjr-rating-star",
				severity: "secondary",
				text: "",
				rounded: "",
				style: C({
					color: ee(e),
					transform: te(e),
					fontSize: ne.value,
					background: "none",
					border: "none",
					cursor: t.disabled ? "default" : "pointer",
					padding: "0",
					transition: "all 0.15s ease"
				}),
				"aria-label": D(i)("rating.setN", { n: e }),
				"aria-pressed": e <= x.value,
				disabled: t.disabled,
				onClick: (t) => R(e),
				onMouseenter: (t) => z(e),
				onMouseleave: B
			}, {
				default: p(() => [...n[0] ||= [l(" ★ ", -1)]]),
				_: 1
			}, 8, [
				"style",
				"aria-label",
				"aria-pressed",
				"disabled",
				"onClick",
				"onMouseenter"
			])), 64))], 44, j);
		};
	}
}), N = ["aria-busy"], ee = ["aria-label"], te = {
	key: 0,
	class: "mjr-tags-empty"
}, ne = { class: "mjr-tags-input-wrap" }, re = ["aria-selected", "onMouseenter"], ie = 100, P = 200, F = /* @__PURE__ */ g({
	__name: "TagsEditor",
	props: {
		asset: {},
		modelValue: {},
		disabled: { type: Boolean }
	},
	emits: ["update:modelValue", "tags-change"],
	setup(n, { emit: o }) {
		function g(e) {
			try {
				let t = String(e ?? "").trim();
				if (!t || t.length > ie) return null;
				for (let e = 0; e < t.length; e += 1) {
					let n = t.charCodeAt(e);
					if (n <= 31 || n === 127) return null;
				}
				return /[;,]/.test(t) ? null : t;
			} catch {
				return null;
			}
		}
		function C(e) {
			try {
				return String(e ?? "").replace(/[\x00-\x1f\x7f]/g, "").trim() || null;
			} catch {
				return null;
			}
		}
		function j(e) {
			let t = C(e);
			return t ? t.toLowerCase() : "";
		}
		function M(e) {
			let t = [], n = /* @__PURE__ */ new Set();
			for (let r of Array.isArray(e) ? e : []) {
				let e = C(r);
				if (!e) continue;
				let i = e.toLowerCase();
				if (!n.has(i) && (n.add(i), t.push(e), t.length >= P)) break;
			}
			return t;
		}
		function F(e) {
			if (Array.isArray(e)) return M(e);
			if (typeof e == "string") {
				let t = e.trim();
				if (!t) return [];
				try {
					let e = JSON.parse(t);
					if (Array.isArray(e)) return M(e);
				} catch {
					return M(t.split(","));
				}
			}
			return [];
		}
		function I(e, t) {
			if (!Array.isArray(e) || !Array.isArray(t) || e.length !== t.length) return !1;
			for (let n = 0; n < e.length; n += 1) if (e[n] !== t[n]) return !1;
			return !0;
		}
		let L = n, R = o, z = F(L.asset?.tags ?? L.modelValue ?? []), B = O([...z]), V = O(null), H = O(""), U = O(!1), W = O(-1), G = O(null), K = O([]), q = O(!1), ae = (e) => e?.$el || e || null, J = !1, Y = !1, X = null, Z = [...z], oe = (e) => Math.min(100 * 2 ** Math.max(0, e - 1), 2e3), se = (e) => new Promise((t) => setTimeout(t, e)), ce = () => setTimeout(() => U.value = !1, 200), Q = v(() => {
			let e = H.value.toLowerCase().trim();
			if (!e) return [];
			let t = new Set(B.value.map((e) => j(e)).filter(Boolean));
			return K.value.filter((n) => {
				let r = j(n);
				return n.toLowerCase().includes(e) && (!r || !t.has(r));
			}).slice(0, 10);
		}), $ = v(() => Q.value.length > 0);
		function le(e) {
			if (J) return;
			let t = F(e);
			Z = [...t], I(t, B.value) || (B.value = [...t]);
		}
		function ue(e) {
			let t = [...e], n = L.asset?.id == null ? "" : String(L.asset.id);
			R("update:modelValue", t), R("tags-change", {
				assetId: L.asset?.id,
				tags: t
			}), c(a, {
				assetId: n,
				tags: t
			});
		}
		async function de() {
			if (L.disabled) return;
			if (J) {
				Y = !0;
				try {
					X?.abort?.();
				} catch (e) {
					console.debug?.(e);
				}
				return;
			}
			J = !0, q.value = !0;
			let n = 0;
			for (; n < 10;) {
				n > 0 && await se(oe(n)), n += 1;
				let r = F(B.value), a = typeof AbortController < "u" ? new AbortController() : null;
				X = a;
				let o = null;
				try {
					o = await t(L.asset, r, a ? { signal: a.signal } : {});
				} catch (e) {
					console.error("Failed to update tags:", e);
				}
				if (!o?.ok) {
					if (o?.code === "ABORTED") {
						if (Y) {
							Y = !1;
							continue;
						}
						break;
					}
					let t = [...Z];
					B.value = t, R("update:modelValue", t), e(o?.error || i("toast.tagsUpdateFailed", "Failed to update tags"), "error"), J = !1, X = null, q.value = !1;
					return;
				}
				try {
					let e = o?.data?.asset_id ?? null;
					e != null && !s(L.asset.id) && (L.asset.id = e);
				} catch (e) {
					console.debug?.(e);
				}
				let c = F(Array.isArray(o?.data?.tags) ? o.data.tags : r);
				Z = [...c];
				try {
					L.asset.tags = [...c];
				} catch (e) {
					console.debug?.(e);
				}
				if (Y || (B.value = [...c]), ue(c), e(i("toast.tagsUpdated", "Tags updated"), "success", 1e3), !Y) break;
				Y = !1;
			}
			if (n >= 10) {
				let t = [...Z];
				B.value = t;
				try {
					L.asset.tags = [...t];
				} catch (e) {
					console.debug?.(e);
				}
				R("update:modelValue", t), e(i("toast.tagsUpdateFailed", "Failed to update tags"), "error");
			}
			J = !1, X = null, q.value = !1;
		}
		A(async () => {
			try {
				await h(), ae(V.value)?.focus();
			} catch (e) {
				console.debug?.(e);
			}
			try {
				let e = await r();
				e?.ok && Array.isArray(e?.data) && (K.value = M(e.data));
			} catch (e) {
				console.warn("Failed to load available tags:", e);
			}
		}), _(() => {
			try {
				X?.abort?.();
			} catch (e) {
				console.debug?.(e);
			}
		});
		function fe(t) {
			if (L.disabled) return;
			let n = g(t);
			if (!n) return;
			let r = j(n);
			r && (B.value.some((e) => j(e) === r) || (B.value.length >= P ? e(i("toast.maxTagsReached", "Maximum number of tags reached"), "warning") : (B.value = [...B.value, n], de())));
		}
		function pe(e) {
			if (L.disabled || e < 0 || e >= B.value.length) return;
			let t = [...B.value];
			t.splice(e, 1), B.value = t, de();
		}
		function me(e) {
			if (e.key === "Enter" || e.key === ",") {
				e.preventDefault();
				let t = (U.value && $.value && W.value >= 0 ? Q.value[W.value] : null) || H.value.trim();
				t && (fe(t), H.value = "", U.value = !1, W.value = -1, G.value = null);
			} else if (e.key === "Escape") U.value = !1, W.value = -1, G.value = null;
			else if (e.key === "ArrowDown") e.preventDefault(), $.value && (W.value = Math.min(W.value + 1, Q.value.length - 1));
			else if (e.key === "ArrowUp") e.preventDefault(), W.value = Math.max(W.value - 1, 0);
			else if (e.key === "Tab" && $.value) {
				e.preventDefault();
				let t = Q.value[W.value] || Q.value[0];
				t && (H.value = t);
			}
		}
		function he(e) {
			fe(e), H.value = "", U.value = !1, W.value = -1, G.value = null, ae(V.value)?.focus();
		}
		function ge(e) {
			let t = e?.value ?? G.value;
			t && he(t);
		}
		return m(() => L.modelValue, (e) => {
			le(e);
		}), m(() => L.asset?.tags, (e) => {
			le(e);
		}), (e, t) => {
			let r = f("MButton"), a = f("MInputText"), o = f("MListbox");
			return b(), E("div", {
				class: k(["mjr-tags-editor", { "is-disabled": n.disabled }]),
				"aria-busy": q.value
			}, [d("div", {
				class: "mjr-tags-display",
				role: "list",
				"aria-label": D(i)("tags.label", "Tags")
			}, [B.value.length === 0 ? (b(), E("span", te, w(D(i)("msg.noTagsYet", "No tags yet...")), 1)) : (b(!0), E(u, { key: 1 }, y(B.value, (e, a) => (b(), E("div", {
				key: e,
				class: "mjr-tag-chip",
				role: "listitem"
			}, [l(w(e) + " ", 1), T(r, {
				type: "button",
				class: "mjr-tag-chip-remove",
				severity: "secondary",
				text: "",
				rounded: "",
				"aria-label": D(i)("tags.remove", "Remove tag"),
				disabled: n.disabled,
				onClick: (e) => pe(a)
			}, {
				default: p(() => [...t[4] ||= [l(" x ", -1)]]),
				_: 1
			}, 8, [
				"aria-label",
				"disabled",
				"onClick"
			])]))), 128))], 8, ee), d("div", ne, [T(a, {
				ref_key: "inputRef",
				ref: V,
				modelValue: H.value,
				"onUpdate:modelValue": t[0] ||= (e) => H.value = e,
				type: "text",
				class: "mjr-tag-input",
				placeholder: D(i)("sidebar.addTag", "Add tag..."),
				disabled: n.disabled,
				"aria-label": D(i)("tags.addLabel", "Add tag"),
				"aria-autocomplete": $.value ? "list" : "none",
				"aria-expanded": U.value,
				"aria-haspopup": $.value ? "listbox" : void 0,
				onFocus: t[1] ||= (e) => U.value = H.value.length > 0,
				onInput: t[2] ||= (e) => U.value = H.value.length > 0,
				onKeydown: me,
				onBlur: ce
			}, null, 8, [
				"modelValue",
				"placeholder",
				"disabled",
				"aria-label",
				"aria-autocomplete",
				"aria-expanded",
				"aria-haspopup"
			]), x(T(o, {
				modelValue: G.value,
				"onUpdate:modelValue": t[3] ||= (e) => G.value = e,
				options: Q.value,
				class: "mjr-tags-dropdown",
				"scroll-height": "150px",
				"aria-label": D(i)("tags.suggestions", "Tag suggestions"),
				onChange: ge
			}, {
				option: p(({ option: e, index: t }) => [d("div", {
					class: k(["mjr-tag-suggestion", { "is-active": t === W.value }]),
					"aria-selected": t === W.value,
					onMouseenter: (e) => W.value = t
				}, w(e), 43, re)]),
				_: 1
			}, 8, [
				"modelValue",
				"options",
				"aria-label"
			]), [[S, U.value && $.value]])])], 10, N);
		};
	}
});
export { M as n, F as t };
