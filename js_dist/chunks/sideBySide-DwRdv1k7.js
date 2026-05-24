import { i as e } from "./model3dRenderer--4-_MRw_.js";
import { i as t, o as n } from "./geninfoParser-C813c2pt.js";
//#region js/features/viewer/sideBySide.ts
function r(e) {
	if (!e) return null;
	try {
		let r = e.geninfo ? { geninfo: e.geninfo } : e.metadata || e.metadata_raw || e, i = t(r) || null;
		if (i && typeof i == "object") {
			let t = {
				prompt: n(i.prompt) || (r?.prompt ? n(String(r.prompt)) : "") || "",
				seed: i.seed == null ? "" : String(i.seed),
				sampler: i.sampler ? String(i.sampler) : "",
				scheduler: i.scheduler ? String(i.scheduler) : "",
				cfg: i.cfg == null ? "" : String(i.cfg),
				step: i.steps == null ? "" : String(i.steps),
				genTime: ""
			}, a = e.generation_time_ms ?? r?.generation_time_ms ?? 0;
			return a && Number.isFinite(Number(a)) && a > 0 && a < 864e5 && (t.genTime = (Number(a) / 1e3).toFixed(1) + "s"), t;
		}
	} catch {}
	let r = e.meta || e.metadata || e.parsed_meta || e, i = e.generation_time_ms ?? r?.generation_time_ms ?? 0;
	return {
		prompt: n(r?.prompt || r?.text || ""),
		seed: r?.seed == null ? r?.noise_seed == null ? "" : String(r.noise_seed) : String(r.seed),
		sampler: r?.sampler || r?.sampler_name || "",
		scheduler: r?.scheduler || "",
		cfg: r?.cfg == null ? r?.cfg_scale == null ? "" : String(r.cfg_scale) : String(r.cfg),
		step: r?.steps == null ? "" : String(r.steps),
		genTime: i && Number.isFinite(Number(i)) && i > 0 && i < 864e5 ? (Number(i) / 1e3).toFixed(1) + "s" : ""
	};
}
function i(e, t) {
	let n = r(e);
	if (!n) return null;
	let { prompt: i, seed: a, sampler: o, scheduler: s, cfg: c, step: l, genTime: u } = n, d = [
		a ? `Seed: ${a}` : "",
		c ? `CFG: ${c}` : "",
		o ? `Sampler: ${o}` : "",
		s ? `Sched: ${s}` : "",
		l ? `Steps: ${l}` : "",
		u ? `Gen: ${u}` : ""
	].filter(Boolean).join(" Â· ");
	if (!i && !d) return null;
	let f = document.createElement("div");
	f.style.cssText = [
		"position:absolute",
		"left:6px",
		"right:6px",
		"bottom:6px",
		"background:rgba(0,0,0,0.68)",
		"color:#fff",
		"padding:5px 8px",
		"border-radius:6px",
		"font-size:10px",
		"line-height:1.4",
		"max-height:38%",
		"overflow:hidden",
		"word-break:break-word",
		"backdrop-filter:blur(4px)",
		"-webkit-backdrop-filter:blur(4px)",
		"border:1px solid rgba(255,255,255,0.12)",
		"box-shadow:0 2px 6px rgba(0,0,0,0.45)",
		"pointer-events:none",
		"z-index:2",
		"box-sizing:border-box"
	].join(";");
	let p = i.length > 160 ? i.slice(0, 160) + "â€¦" : i, m = document.createElement("div");
	m.style.cssText = `display:flex;align-items:baseline;gap:5px;flex-wrap:wrap;margin-bottom:${d ? "3" : "0"}px;`;
	let h = document.createElement("span");
	if (h.style.cssText = "background:rgba(255,255,255,0.2);border-radius:3px;padding:0 4px;font-weight:700;font-size:9px;letter-spacing:0.06em;flex-shrink:0;", h.textContent = t, m.appendChild(h), i) {
		let e = document.createElement("span"), t = document.createElement("span");
		t.style.cssText = "color:#7ec8ff;font-weight:600;", t.textContent = "Prompt:", e.appendChild(t), e.appendChild(document.createTextNode(" " + p)), m.appendChild(e);
	}
	if (f.appendChild(m), d) {
		let e = document.createElement("div");
		e.style.cssText = "color:rgba(255,255,255,0.65);font-size:9px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;", e.textContent = d, f.appendChild(e);
	}
	return f;
}
function a(e, t) {
	let n = 0, r = () => {
		n++;
		let i = e?.querySelector?.(".mjr-model3d-host"), a = t?.querySelector?.(".mjr-model3d-host"), o = i?._mjr3D?.controls, s = a?._mjr3D?.controls;
		if (!o || !s) {
			n < 60 && setTimeout(r, 50);
			return;
		}
		let c = !1, l = () => {
			if (!c) {
				c = !0;
				try {
					let e = i._mjr3D.camera, t = a._mjr3D.camera;
					e && t && (t.position.copy(e.position), t.quaternion.copy(e.quaternion), e.zoom !== void 0 && (t.zoom = e.zoom), t.updateProjectionMatrix()), s.target.copy(o.target), s.update();
				} catch (e) {
					console.debug?.(e);
				}
				c = !1;
			}
		}, u = () => {
			if (!c) {
				c = !0;
				try {
					let e = i._mjr3D.camera, t = a._mjr3D.camera;
					e && t && (e.position.copy(t.position), e.quaternion.copy(t.quaternion), t.zoom !== void 0 && (e.zoom = t.zoom), e.updateProjectionMatrix()), o.target.copy(s.target), o.update();
				} catch (e) {
					console.debug?.(e);
				}
				c = !1;
			}
		};
		o.addEventListener("change", l), s.addEventListener("change", u);
		try {
			let t = e.parentElement;
			t && (t._mjr3DSyncCleanup = () => {
				try {
					o.removeEventListener("change", l);
				} catch {}
				try {
					s.removeEventListener("change", u);
				} catch {}
			});
		} catch (e) {
			console.debug?.(e);
		}
	};
	setTimeout(r, 50);
}
function o(e) {
	let t = 0, n = () => {
		t++;
		let r = Array.from(e?.querySelectorAll?.(".mjr-model3d-host") || []).filter((e) => e._mjr3D?.controls);
		if (r.length < 2) {
			t < 60 && setTimeout(n, 50);
			return;
		}
		let i = !1, a = [];
		for (let e = 0; e < r.length; e++) {
			let t = r[e], n = () => {
				if (!i) {
					i = !0;
					try {
						let n = t._mjr3D.camera, i = t._mjr3D.controls;
						for (let t = 0; t < r.length; t++) {
							if (t === e) continue;
							let a = r[t], o = a._mjr3D.camera, s = a._mjr3D.controls;
							!o || !s || (o.position.copy(n.position), o.quaternion.copy(n.quaternion), n.zoom !== void 0 && (o.zoom = n.zoom), o.updateProjectionMatrix(), s.target.copy(i.target), s.update());
						}
					} catch (e) {
						console.debug?.(e);
					}
					i = !1;
				}
			};
			t._mjr3D.controls.addEventListener("change", n), a.push(() => {
				try {
					t._mjr3D?.controls?.removeEventListener?.("change", n);
				} catch {}
			});
		}
		e._mjr3DSyncCleanup = () => {
			for (let e of a) e();
		};
	};
	setTimeout(n, 50);
}
function s({ sideView: t, state: n, currentAsset: r, viewUrl: s, buildAssetViewURL: c, createMediaElement: l, destroyMediaProcessorsIn: u } = {}) {
	try {
		t?._mjr3DSyncCleanup?.();
	} catch (e) {
		console.debug?.(e);
	}
	try {
		t && (t._mjr3DSyncCleanup = null);
	} catch (e) {
		console.debug?.(e);
	}
	try {
		u?.(t);
	} catch (e) {
		console.debug?.(e);
	}
	try {
		t && (t.innerHTML = "");
	} catch (e) {
		console.debug?.(e);
	}
	if (!t || !n || !r) return;
	let d = (e, t) => {
		try {
			let n = e?.querySelector?.(".mjr-viewer-video-src") || e?.querySelector?.("video"), r = e?.querySelector?.(".mjr-viewer-audio-src") || e?.querySelector?.("audio");
			if (n?.dataset && (n.dataset.mjrCompareRole = t), r?.dataset && (r.dataset.mjrCompareRole = t), r) {
				let e = String(t || "").toUpperCase() === "A";
				if (r.muted = !e, !e) try {
					r.pause?.();
				} catch (e) {
					console.debug?.(e);
				}
			}
		} catch (e) {
			console.debug?.(e);
		}
	}, f = Array.isArray(n.assets) ? n.assets.slice(0, 4) : [], p = f.length, m = !!n.compareAsset;
	if (p > 2 && !m) {
		try {
			t.style.display = "grid", t.style.gridTemplateColumns = "1fr 1fr", t.style.gridTemplateRows = "1fr 1fr", t.style.gap = "2px", t.style.padding = "2px";
		} catch (e) {
			console.debug?.(e);
		}
		let n = [
			"A",
			"B",
			"C",
			"D"
		];
		for (let e = 0; e < 4; e++) {
			let r = document.createElement("div");
			r.style.cssText = "\n                position: relative;\n                display: flex;\n                align-items: center;\n                justify-content: center;\n                background: rgba(255,255,255,0.05);\n                overflow: hidden;\n            ";
			let a = f[e];
			if (a) {
				let t = "";
				try {
					t = c?.(a) || "";
				} catch (e) {
					console.debug?.(e);
				}
				try {
					let i = l?.(a, t);
					i && r.appendChild(i), d(i, n[e]);
				} catch (e) {
					console.debug?.(e);
				}
				try {
					let t = i(a, n[e]);
					t && r.appendChild(t);
				} catch (e) {
					console.debug?.(e);
				}
			} else {
				let t = document.createElement("div");
				t.style.cssText = "position:absolute;top:6px;left:6px;background:rgba(255,255,255,0.12);border-radius:3px;padding:1px 6px;font-size:9px;font-weight:700;color:rgba(255,255,255,0.4);letter-spacing:0.06em;", t.textContent = n[e], r.appendChild(t);
			}
			try {
				t.appendChild(r);
			} catch (e) {
				console.debug?.(e);
			}
		}
		f.some((t) => t && e(t)) && o(t);
		return;
	}
	let h = n.compareAsset || (Array.isArray(n.assets) && n.assets.length === 2 ? n.assets[1 - (n.currentIndex || 0)] : null) || r, g = (() => {
		try {
			return c?.(h);
		} catch {
			return "";
		}
	})(), _ = document.createElement("div");
	_.style.cssText = "\n        flex: 1;\n        display: flex;\n        align-items: center;\n        justify-content: center;\n        background: rgba(255,255,255,0.05);\n        overflow: hidden;\n    ";
	let v = l?.(r, s);
	v && _.appendChild(v);
	let y = document.createElement("div");
	y.style.cssText = "\n        flex: 1;\n        display: flex;\n        align-items: center;\n        justify-content: center;\n        background: rgba(255,255,255,0.05);\n        overflow: hidden;\n    ";
	let b = l?.(h, g);
	b && y.appendChild(b);
	try {
		t.style.display = "flex", t.style.flexDirection = "row", t.style.gap = "2px", t.style.padding = "0";
	} catch (e) {
		console.debug?.(e);
	}
	try {
		t.appendChild(_), t.appendChild(y);
	} catch (e) {
		console.debug?.(e);
	}
	d(v, "A"), d(b, "B"), e(r) && e(h) && a(_, y);
}
//#endregion
export { s as renderSideBySideView };
