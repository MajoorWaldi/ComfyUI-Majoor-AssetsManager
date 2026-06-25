import { i as e, o as t } from "./geninfoParser-5vKgjqjD.js";
import { c as n } from "./mediaPlayer-BG5M2Nwd.js";
//#region ui/features/viewer/sideBySide.ts
function r(n) {
	if (!n) return null;
	try {
		let r = n.geninfo ? { geninfo: n.geninfo } : n.metadata || n.metadata_raw || n, i = e(r) || null;
		if (i && typeof i == "object") {
			let e = {
				prompt: t(i.prompt) || (r?.prompt ? t(String(r.prompt)) : "") || "",
				seed: i.seed == null ? "" : String(i.seed),
				sampler: i.sampler ? String(i.sampler) : "",
				scheduler: i.scheduler ? String(i.scheduler) : "",
				cfg: i.cfg == null ? "" : String(i.cfg),
				step: i.steps == null ? "" : String(i.steps),
				genTime: ""
			}, a = n.generation_time_ms ?? r?.generation_time_ms ?? 0;
			return a && Number.isFinite(Number(a)) && a > 0 && a < 864e5 && (e.genTime = (Number(a) / 1e3).toFixed(1) + "s"), e;
		}
	} catch {}
	let r = n.meta || n.metadata || n.parsed_meta || n, i = n.generation_time_ms ?? r?.generation_time_ms ?? 0;
	return {
		prompt: t(r?.prompt || r?.text || ""),
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
	].filter(Boolean).join("  -  ");
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
	let p = i.length > 160 ? i.slice(0, 160) + "..." : i, m = document.createElement("div");
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
function s({ sideView: e, state: t, currentAsset: r, viewUrl: s, buildAssetViewURL: c, createMediaElement: l, destroyMediaProcessorsIn: u } = {}) {
	try {
		e?._mjr3DSyncCleanup?.();
	} catch (e) {
		console.debug?.(e);
	}
	try {
		e && (e._mjr3DSyncCleanup = null);
	} catch (e) {
		console.debug?.(e);
	}
	try {
		u?.(e);
	} catch (e) {
		console.debug?.(e);
	}
	try {
		e && (e.innerHTML = "");
	} catch (e) {
		console.debug?.(e);
	}
	if (!e || !t || !r) return;
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
	}, f = Array.isArray(t.assets) ? t.assets.slice(0, 4) : [], p = f.length, m = !!t.compareAsset;
	if (p > 2 && !m) {
		try {
			e.style.display = "grid", e.style.gridTemplateColumns = "1fr 1fr", e.style.gridTemplateRows = "1fr 1fr", e.style.gap = "2px", e.style.padding = "2px";
		} catch (e) {
			console.debug?.(e);
		}
		let t = [
			"A",
			"B",
			"C",
			"D"
		];
		for (let n = 0; n < 4; n++) {
			let r = document.createElement("div");
			r.style.cssText = "\n                position: relative;\n                display: flex;\n                align-items: center;\n                justify-content: center;\n                background: rgba(255,255,255,0.05);\n                overflow: hidden;\n            ";
			let a = f[n];
			if (a) {
				let e = "";
				try {
					e = c?.(a) || "";
				} catch (e) {
					console.debug?.(e);
				}
				try {
					let i = l?.(a, e);
					i && r.appendChild(i), d(i, t[n]);
				} catch (e) {
					console.debug?.(e);
				}
				try {
					let e = i(a, t[n]);
					e && r.appendChild(e);
				} catch (e) {
					console.debug?.(e);
				}
			} else {
				let e = document.createElement("div");
				e.style.cssText = "position:absolute;top:6px;left:6px;background:rgba(255,255,255,0.12);border-radius:3px;padding:1px 6px;font-size:9px;font-weight:700;color:rgba(255,255,255,0.4);letter-spacing:0.06em;", e.textContent = t[n], r.appendChild(e);
			}
			try {
				e.appendChild(r);
			} catch (e) {
				console.debug?.(e);
			}
		}
		f.some((e) => e && n(e)) && o(e);
		return;
	}
	let h = t.compareAsset || (Array.isArray(t.assets) && t.assets.length === 2 ? t.assets[1 - (t.currentIndex || 0)] : null) || r, g = (() => {
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
		e.style.display = "flex", e.style.flexDirection = "row", e.style.gap = "2px", e.style.padding = "0";
	} catch (e) {
		console.debug?.(e);
	}
	try {
		e.appendChild(_), e.appendChild(y);
	} catch (e) {
		console.debug?.(e);
	}
	d(v, "A"), d(b, "B"), n(r) && n(h) && a(_, y);
}
//#endregion
export { s as renderSideBySideView };
