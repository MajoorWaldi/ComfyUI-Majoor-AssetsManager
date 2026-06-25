import { m as e } from "./events-DE87d50y.js";
import { c as t, n, o as r, s as i } from "./mediaFps-CPzBm2U7.js";
import { n as a, t as o } from "./state-DPiaUMw1.js";
//#region ui/utils/dom.ts
function s(e, t) {
	if (!t) return null;
	try {
		if (!e) return null;
		if (e instanceof Element && typeof e.closest == "function") return e.closest(t);
		let n = e?.parentElement;
		if (n && typeof n.closest == "function") return n.closest(t);
	} catch (e) {
		console.debug?.(e);
	}
	return null;
}
function c(e) {
	let t = String(e ?? "");
	try {
		if (typeof CSS?.escape == "function") return CSS.escape(t);
	} catch (e) {
		console.debug?.(e);
	}
	return t.replace(/([!"#$%&'()*+,./:;<=>?@[\\\]^`{|}~])/g, "\\$1");
}
async function l(e) {
	try {
		return navigator?.clipboard?.writeText ? (await navigator.clipboard.writeText(String(e ?? "")), !0) : !1;
	} catch {
		return !1;
	}
}
//#endregion
//#region ui/utils/tooltipShortcuts.ts
function u(e, t) {
	let n = String(e || "").trim(), r = String(t || "").trim();
	if (!r) return n;
	if (!n) return r;
	if (r.length === 1) {
		let e = r.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
		if (RegExp(`\\(${e}\\)|\\b${e}\\b`, "i").test(n)) return n;
	} else if (n.toLowerCase().includes(r.toLowerCase())) return n;
	return `${n} (${r})`;
}
function ee(e, t, n, { setAriaLabel: r = !0, ariaLabel: i = null } = {}) {
	if (!e) return "";
	let a = u(t, n);
	if (e.title = a, r) {
		let r = i ?? t;
		e.setAttribute("aria-label", u(r, n));
	}
	return a;
}
//#endregion
//#region ui/components/VideoControls.ts
var te = 400, ne = 1e3, re = 220, ie = .001;
function ae(e, t) {
	let n = Number(e), r = Math.max(1, Number(t) || 1);
	if (!Number.isFinite(n) || n <= 0) return 1;
	let i = n / r, a = 10 ** Math.floor(Math.log10(Math.max(i, .001))), o = i / a;
	return Math.max(.001, (o <= 1 ? 1 : o <= 2 ? 2 : o <= 5 ? 5 : 10) * a);
}
function oe(e, t, n) {
	try {
		if (e?.aborted) return r;
		let i = setTimeout(() => {
			try {
				if (e?.aborted) return;
				n?.();
			} catch (e) {
				console.debug?.(e);
			}
		}, Math.max(0, Math.floor(Number(t) || 0))), a = () => {
			try {
				clearTimeout(i);
			} catch (e) {
				console.debug?.(e);
			}
		};
		try {
			e?.addEventListener?.("abort", a, { once: !0 });
		} catch (e) {
			console.debug?.(e);
		}
		return () => {
			try {
				clearTimeout(i);
			} catch (e) {
				console.debug?.(e);
			}
			try {
				e?.removeEventListener?.("abort", a);
			} catch (e) {
				console.debug?.(e);
			}
		};
	} catch {
		return r;
	}
}
function d(e) {
	let t = Math.floor(Number(e) || 0);
	return t < 10 ? `0${t}` : String(t);
}
function f(e) {
	let t = Number(e);
	if (!Number.isFinite(t) || t < 0) return "0:00";
	let n = Math.floor(t), r = Math.floor(n / 3600), i = Math.floor(n % 3600 / 60), a = n % 60;
	return r > 0 ? `${r}:${d(i)}:${d(a)}` : `${i}:${d(a)}`;
}
function p(e, t, n) {
	let r = document.createElement("button");
	r.type = "button", r.className = `mjr-video-btn ${e || ""}`.trim(), n && (r.title = n);
	try {
		r.setAttribute("aria-label", n || t || "Button");
	} catch (e) {
		console.debug?.(e);
	}
	return r.textContent = t, r;
}
function se(e, t, n, r) {
	let i = document.createElement("button");
	i.type = "button", i.className = `mjr-video-btn ${e || ""}`.trim(), n && (i.title = n);
	try {
		i.setAttribute("aria-label", r || n || "Button");
	} catch (e) {
		console.debug?.(e);
	}
	let a = document.createElement("span");
	return a.className = `pi ${t || ""}`.trim(), a.setAttribute("aria-hidden", "true"), i.appendChild(a), {
		btn: i,
		icon: a
	};
}
function ce(e, { min: t, max: n, step: r, value: i, title: a, ariaLabel: o, widthPx: s } = {}) {
	let c = document.createElement("input");
	return c.type = "number", c.className = `mjr-video-num ${e || ""}`.trim(), a && (c.title = a), o && c.setAttribute("aria-label", o), t != null && (c.min = String(t)), n != null && (c.max = String(n)), r != null && (c.step = String(r)), i != null && (c.value = String(i)), s != null && (c.style.width = `${s}px`), c;
}
function le(e) {
	try {
		return e?.variant === "preview" ? "preview" : e?.variant === "viewerbar" ? "viewerbar" : "viewer";
	} catch {
		return "viewer";
	}
}
function ue(e) {
	try {
		let t = Number(e?.initialFps);
		return Number.isFinite(t) && t > 0 ? t : null;
	} catch {
		return null;
	}
}
function de(e, t) {
	let n = Number(e), r = Number(t);
	return Number.isFinite(n) && Number.isFinite(r) && Math.abs(n - r) <= ie;
}
function fe(n, r) {
	let a = [];
	try {
		n.controls = !1, n.loop = !0, n.muted = !0, n.playsInline = !0, n.autoplay = !0;
	} catch (e) {
		console.debug?.(e);
	}
	let o = document.createElement("div");
	o.className = "mjr-video-controls mjr-video-controls--preview";
	try {
		o.setAttribute("role", "group"), o.setAttribute("aria-label", e("video.previewControls", "Video preview controls"));
	} catch (e) {
		console.debug?.(e);
	}
	let s = document.createElement("button");
	s.type = "button", s.className = "mjr-video-preview-btn", s.title = e("video.playPause", "Play/Pause");
	try {
		s.setAttribute("aria-label", e("video.playPause", "Play/Pause"));
	} catch (e) {
		console.debug?.(e);
	}
	let c = document.createElement("span");
	c.className = "pi pi-play";
	try {
		c.setAttribute("aria-hidden", "true");
	} catch (e) {
		console.debug?.(e);
	}
	s.appendChild(c), o.appendChild(s);
	let l = () => {
		try {
			c.className = `pi ${n?.paused ? "pi-play" : "pi-pause"}`;
		} catch (e) {
			console.debug?.(e);
		}
	}, u = () => {
		try {
			let e = n.play?.();
			e && typeof e.catch == "function" && e.catch(() => {});
		} catch (e) {
			console.debug?.(e);
		}
	}, ee = (e) => {
		try {
			e?.stopPropagation?.();
		} catch (e) {
			console.debug?.(e);
		}
		try {
			n.paused ? u() : n.pause?.();
		} catch (e) {
			console.debug?.(e);
		}
		l();
	};
	try {
		r.appendChild(o);
	} catch (e) {
		console.debug?.(e);
	}
	try {
		u();
	} catch (e) {
		console.debug?.(e);
	}
	a.push(i(n, "loadedmetadata", () => u(), { passive: !0 })), a.push(i(n, "canplay", () => u(), { passive: !0 })), a.push(i(s, "click", ee)), a.push(i(n, "play", l, { passive: !0 })), a.push(i(n, "pause", l, { passive: !0 })), a.push(i(n, "ended", () => u(), { passive: !0 }));
	try {
		l();
	} catch (e) {
		console.debug?.(e);
	}
	return {
		controlsEl: o,
		destroy: () => {
			try {
				for (let e of a) t(() => e?.());
			} catch (e) {
				console.debug?.(e);
			}
			try {
				o.remove?.();
			} catch (e) {
				console.debug?.(e);
			}
		}
	};
}
function pe(s, c = {}) {
	try {
		let l = le(c), u = String(c?.mediaKind || "video").toLowerCase() === "audio", ee = l === "viewerbar", ie = l !== "preview", d = ie, pe = ue(c), m = c?.hostEl || s?.parentElement;
		if (!s || !m) return {
			controlsEl: null,
			destroy: r
		};
		if (l === "preview") return fe(s, m);
		try {
			s.loop = !1;
		} catch (e) {
			console.debug?.(e);
		}
		t(() => m.classList?.add("mjr-video-host")), t(() => s.classList?.add("mjr-video-el")), t(() => {
			window.getComputedStyle?.(m)?.position === "static" && (m.style.position = "relative");
		});
		let h = document.createElement("div");
		h.className = `mjr-video-controls mjr-video-controls--${l}`, ee && h.classList.add("mjr-video-controls--modern"), u && h.classList.add("mjr-video-controls--audio"), h.dataset.mjrLayout = "regular", h.setAttribute("role", "group"), h.setAttribute("aria-label", u ? e("video.audioControls", "Audio controls") : e("video.controls", "Video controls"));
		let g = document.createElement("div");
		g.className = "mjr-video-row mjr-video-row--top";
		let me = document.createElement("div");
		me.className = "mjr-video-row mjr-video-row--bottom", h.appendChild(g), h.appendChild(me);
		let _ = document.createElement("div");
		_.className = "mjr-video-seek-wrap";
		let v = document.createElement("input");
		v.className = "mjr-video-range mjr-video-range--seek", v.type = "range", v.min = "0", v.max = String(ne), v.step = "1", v.value = "0", v.setAttribute("aria-label", e("video.seek", "Seek")), v.title = u ? e("video.seekThroughAudio", "Seek through audio") : e("video.seekThrough", "Seek through video");
		let y = document.createElement("div");
		y.className = "mjr-video-seek-overlay";
		let b = null, x = null, S = null, C = null;
		d && (b = document.createElement("div"), b.className = "mjr-video-seek-zones", x = document.createElement("div"), x.className = "mjr-video-seek-zone mjr-video-seek-zone--leftTrim", S = document.createElement("div"), S.className = "mjr-video-seek-zone mjr-video-seek-zone--selected", C = document.createElement("div"), C.className = "mjr-video-seek-zone mjr-video-seek-zone--rightTrim", b.appendChild(x), b.appendChild(S), b.appendChild(C));
		let w = document.createElement("div");
		w.className = "mjr-video-seek-ticks";
		let T = document.createElement("div");
		T.className = "mjr-video-seek-labels";
		let he = document.createElement("div");
		he.className = "mjr-video-seek-mark mjr-video-seek-mark--in";
		let ge = document.createElement("div");
		ge.className = "mjr-video-seek-mark mjr-video-seek-mark--out";
		let _e = document.createElement("div");
		_e.className = "mjr-video-seek-playhead";
		let E = document.createElement("div");
		E.className = "mjr-video-seek-playhead-label", y.appendChild(w), y.appendChild(T), y.appendChild(_e), y.appendChild(E);
		let D = document.createElement("div");
		D.className = "mjr-video-seek-handle mjr-video-seek-handle--in", D.title = e("video.dragSetIn", "Drag to set In"), D.setAttribute("aria-label", e("video.dragSetIn", "Drag to set In"));
		let O = document.createElement("div");
		O.className = "mjr-video-seek-handle mjr-video-seek-handle--out", O.title = e("video.dragSetOut", "Drag to set Out"), O.setAttribute("aria-label", e("video.dragSetOut", "Drag to set Out")), _.appendChild(v), b && _.appendChild(b), _.appendChild(y), d && (_.appendChild(he), _.appendChild(ge), _.appendChild(D), _.appendChild(O));
		let ve = document.createElement("span");
		ve.className = "mjr-video-time", ve.textContent = "0:00 / 0:00", ve.title = e("video.currentTimeTotal", "Current time / Total duration");
		let k = document.createElement("span");
		k.className = "mjr-video-range-count", k.textContent = "";
		try {
			k.style.display = "none";
		} catch (e) {
			console.debug?.(e);
		}
		let ye = document.createElement("div");
		ye.className = "mjr-video-timegroup", ye.appendChild(ve), d && ye.appendChild(k);
		let A = document.createElement("span");
		A.className = "mjr-video-frame", A.textContent = "F: 0", A.title = e("video.currentFrame", "Current frame number");
		let be = p("mjr-video-btn--play", e("btn.play", "Play"), e("video.playPauseSpace", "Play/Pause (Space)")), xe = p("mjr-video-btn--step", "<", e("video.stepBack", "Step back")), Se = p("mjr-video-btn--step", ">", e("video.stepForward", "Step forward")), Ce = p("mjr-video-btn--jump mjr-video-btn--in", "|<", e("video.goToIn", "Go to In")), we = p("mjr-video-btn--jump mjr-video-btn--out", ">|", e("video.goToOut", "Go to Out")), Te = p("mjr-video-btn--mark mjr-video-btn--in", "I", e("video.setInFromCurrent", "Set In from current frame")), Ee = p("mjr-video-btn--mark mjr-video-btn--out", "O", e("video.setOutFromCurrent", "Set Out from current frame")), De = se("mjr-video-btn--toggle", "pi-refresh", e("video.loopPlaybackInRange", "Loop playback in range"), e("video.loop", "Loop")), Oe = De.btn, ke = ce("mjr-video-num--in", {
			min: 0,
			step: 1,
			value: 0,
			title: e("video.inFrame", "In frame"),
			ariaLabel: e("video.inFrame", "In frame"),
			widthPx: 72
		}), Ae = ce("mjr-video-num--out", {
			min: 0,
			step: 1,
			value: 0,
			title: e("video.outFrame", "Out frame"),
			ariaLabel: e("video.outFrame", "Out frame"),
			widthPx: 72
		}), je = ce("mjr-video-num--step", {
			min: 1,
			step: 1,
			value: 1,
			title: e("video.frameIncrement", "Frame increment"),
			ariaLabel: e("video.frameIncrement", "Frame increment"),
			widthPx: 56
		}), j = ce("mjr-video-num--fps", {
			min: 1,
			step: .001,
			value: n(pe || 30),
			title: e("video.fpsStepping", "FPS (used for frame stepping)"),
			ariaLabel: e("video.fps", "FPS"),
			widthPx: 56
		}), M = document.createElement("select");
		M.className = "mjr-video-num mjr-video-num--speed", M.title = e("video.playbackSpeed", "Playback speed"), M.setAttribute("aria-label", e("video.playbackSpeed", "Playback speed")), M.style.width = "74px";
		for (let e of [
			.25,
			.5,
			.75,
			1,
			1.25,
			1.5,
			2
		]) {
			let t = document.createElement("option");
			t.value = String(e), t.textContent = `${e}x`, M.appendChild(t);
		}
		let Me = se("mjr-video-btn--mute", "pi-volume-up", e("video.mute", "Mute"), e("video.mute", "Mute")), N = Me.btn, P = document.createElement("div");
		P.className = "mjr-video-volume-wrap", P.style.cssText = "display:none; align-items:center; position:relative;";
		let F = null;
		F = document.createElement("input"), F.className = "mjr-video-range mjr-video-range--volume", F.type = "range", F.min = "0", F.max = "1", F.step = "0.02", F.value = String(a(Number(s.volume) || 0)), F.setAttribute("aria-label", e("video.volume", "Volume")), F.title = e("video.volume", "Volume");
		try {
			F.style.width = "120px";
		} catch (e) {
			console.debug?.(e);
		}
		P.appendChild(F);
		let Ne = document.createElement("div");
		Ne.className = "mjr-video-group mjr-video-group--in";
		let Pe = document.createElement("span");
		Pe.textContent = "In", Pe.title = e("video.resetInToStart", "Reset In to start"), Pe.style.cssText = "cursor:pointer; user-select:none;", d && (Ne.appendChild(Pe), Ne.appendChild(ke));
		let Fe = document.createElement("div");
		Fe.className = "mjr-video-group mjr-video-group--out";
		let Ie = document.createElement("span");
		Ie.textContent = "Out", Ie.title = e("video.resetOutToEnd", "Reset Out to end"), Ie.style.cssText = "cursor:pointer; user-select:none;", d && (Fe.appendChild(Ie), Fe.appendChild(Ae));
		let I = document.createElement("div");
		I.className = "mjr-video-group mjr-video-group--adjust-left", d && (I.appendChild(Te), u || (I.appendChild(document.createTextNode(e("video.step", "Step"))), I.appendChild(je), I.appendChild(document.createTextNode(e("video.fps", "FPS"))), I.appendChild(j)), I.appendChild(A));
		let Le = document.createElement("div");
		Le.className = "mjr-video-group mjr-video-group--adjust-right", d && (Le.appendChild(ye), Le.appendChild(Oe));
		let Re = document.createElement("div");
		Re.className = "mjr-video-group mjr-video-group--speed", Re.appendChild(document.createTextNode(e("video.speed", "Speed"))), Re.appendChild(M);
		let ze = document.createElement("div");
		ze.className = "mjr-video-bottom mjr-video-bottom--left";
		let L = document.createElement("div");
		L.className = "mjr-video-transport";
		let R = document.createElement("div");
		if (R.className = "mjr-video-bottom mjr-video-bottom--right", L.appendChild(Ce), u || L.appendChild(xe), L.appendChild(be), u || L.appendChild(Se), L.appendChild(we), d && ze.appendChild(I), d && R.appendChild(Le), R.appendChild(Re), R.appendChild(N), d && R.appendChild(Ee), F && R.appendChild(P), ee) {
			let e = document.createElement("div");
			e.className = "mjr-video-bar-timeline", d && e.appendChild(Ne), e.appendChild(_), d && e.appendChild(Fe);
			let t = document.createElement("div");
			t.className = "mjr-video-bar-actions";
			let n = document.createElement("div");
			n.className = "mjr-video-bar-side mjr-video-bar-side--left", d && n.appendChild(I);
			let r = document.createElement("div");
			r.className = "mjr-video-bar-center", r.appendChild(L);
			let i = document.createElement("div");
			i.className = "mjr-video-bar-side mjr-video-bar-side--right", d && i.appendChild(Le), i.appendChild(Re), i.appendChild(N), d && i.appendChild(Ee), F && i.appendChild(P), t.appendChild(n), t.appendChild(r), t.appendChild(i), h.replaceChildren(e, t);
		} else d && g.appendChild(A), d && g.appendChild(Ne), g.appendChild(_), d && g.appendChild(Fe), g.appendChild(ye), me.appendChild(ze), me.appendChild(L), me.appendChild(R);
		let z = (e) => {
			try {
				e.stopPropagation?.();
			} catch (e) {
				console.debug?.(e);
			}
		}, B = (e) => {
			try {
				e.preventDefault?.();
			} catch (e) {
				console.debug?.(e);
			}
			z(e);
		}, V = [], Be = (() => {
			try {
				return new AbortController();
			} catch {
				return {
					signal: {
						aborted: !1,
						addEventListener: r,
						removeEventListener: r
					},
					abort: r
				};
			}
		})();
		V.push(() => {
			try {
				Be.abort();
			} catch (e) {
				console.debug?.(e);
			}
		});
		let Ve = () => {
			try {
				let e = Number(m?.clientWidth) || Number(h?.clientWidth) || 0, t = "regular";
				e > 0 && e < 560 ? t = "stacked" : e > 0 && e < 860 && (t = "compact"), h.dataset.mjrLayout = t;
			} catch (e) {
				console.debug?.(e);
			}
		};
		Ve();
		try {
			if (typeof ResizeObserver == "function" && m) {
				let e = typeof requestAnimationFrame == "function" ? requestAnimationFrame : null, t = typeof cancelAnimationFrame == "function" ? cancelAnimationFrame : null, n = 0, r = new ResizeObserver(e ? () => {
					n ||= e(() => {
						n = 0, Ve();
					});
				} : () => Ve());
				r.observe(m), V.push(() => {
					try {
						n && t && t(n), r.disconnect();
					} catch (e) {
						console.debug?.(e);
					}
				});
			}
		} catch (e) {
			console.debug?.(e);
		}
		V.push(i(h, "pointerdown", z)), V.push(i(h, "dblclick", B, { capture: !0 })), V.push(i(h, "wheel", B, {
			capture: !0,
			passive: !1
		})), V.push(i(window, "dblclick", (e) => {
			try {
				h.contains?.(e?.target) && B(e);
			} catch (e) {
				console.debug?.(e);
			}
		}, { capture: !0 })), V.push(i(window, "wheel", (e) => {
			try {
				h.contains?.(e?.target) && B(e);
			} catch (e) {
				console.debug?.(e);
			}
		}, {
			capture: !0,
			passive: !1
		}));
		let H = {
			outFrame: null,
			frameCount: null,
			loop: d,
			pingpong: !1,
			once: !1,
			playbackRate: Math.max(.25, Math.min(2, Number(c?.initialPlaybackRate) || 1)),
			_seeking: !1,
			_ppReverse: !1,
			_ppRafId: null,
			_userInteracted: !1
		};
		H.nativeFps = pe ? n(pe, 30) : null, H.fps = H.nativeFps || n(j.value, 30);
		let He = () => {
			let e = Number(H.nativeFps), t = Number(H.fps);
			return Number.isFinite(e) && e > 0 && !de(t, e);
		}, Ue = (t = !1) => {
			try {
				if (!j || u) return;
				let r = Number(H.nativeFps), i = He(), a = e("video.fpsStepping", "FPS (used for frame stepping)");
				j.classList.toggle("is-overridden", i), Number.isFinite(r) && r > 0 ? (j.dataset.defaultFps = String(r), j.title = `${a} - Source FPS: ${r}`, i && (j.title += " - Modified")) : (delete j.dataset.defaultFps, j.title = a), t && !j.matches?.(":focus") && (j.value = String(n(H.fps, H.nativeFps || 30)));
			} catch (e) {
				console.debug?.(e);
			}
		};
		Ue(!0);
		let We = () => {
			if (!H._userInteracted) {
				H._userInteracted = !0;
				try {
					s.muted && (s.muted = !1, ot?.());
				} catch (e) {
					console.debug?.(e);
				}
			}
		}, Ge = null, Ke = () => {
			if (d) try {
				A.classList.add("is-step");
				try {
					Ge?.();
				} catch (e) {
					console.debug?.(e);
				}
				Ge = oe(Be.signal, re, () => {
					try {
						A.classList.remove("is-step");
					} catch (e) {
						console.debug?.(e);
					}
				});
			} catch (e) {
				console.debug?.(e);
			}
		};
		V.push(() => {
			try {
				Ge?.();
			} catch (e) {
				console.debug?.(e);
			}
			Ge = null;
			try {
				A?.classList?.remove?.("is-step");
			} catch (e) {
				console.debug?.(e);
			}
		});
		let qe = (e, t) => {
			try {
				if (!e) return;
				t ? e.classList.add("is-on") : e.classList.remove("is-on");
			} catch (e) {
				console.debug?.(e);
			}
		}, Je = (e) => {
			try {
				let t = Number(e);
				if (!Number.isFinite(t) || t <= 0) return H.playbackRate;
				let n = Math.max(.25, Math.min(2, Math.round(t * 100) / 100));
				H.playbackRate = n;
				try {
					s.playbackRate = n;
				} catch (e) {
					console.debug?.(e);
				}
				try {
					M.matches?.(":focus") || (M.value = String(n));
				} catch (e) {
					console.debug?.(e);
				}
				return n;
			} catch {
				return H.playbackRate;
			}
		}, Ye = () => {
			try {
				qe(Oe, !!(H.loop || H.pingpong));
				try {
					De?.icon && (H.pingpong ? (De.icon.className = "pi pi-sort-alt", Oe.title = e("video.pingpongPlayback", "Ping-pong playback (forward then reverse)")) : (De.icon.className = "pi pi-refresh", Oe.title = e("video.loopPlaybackInRange", "Loop playback in range")));
				} catch (e) {
					console.debug?.(e);
				}
			} catch (e) {
				console.debug?.(e);
			}
		}, U = () => {
			try {
				let e = Number(H.frameCount);
				if (Number.isFinite(e) && e > 0) return Math.max(1, Math.floor(e));
				let t = Number(s?.duration), r = n(H.fps, 30);
				return !Number.isFinite(t) || t <= 0 ? 0 : Math.max(0, Math.floor(t * r));
			} catch {
				return 0;
			}
		}, W = (e = null) => {
			try {
				let t = e ?? s?.currentTime, r = Number(t), i = n(H.fps, 30);
				return !Number.isFinite(r) || r < 0 ? 0 : Math.max(0, Math.floor(r * i + 1e-6));
			} catch {
				return 0;
			}
		}, Xe = (e) => {
			let t = n(H.fps, 30);
			return Math.max(0, Number(e) || 0) / t;
		}, G = () => {
			try {
				let e = U();
				if (e <= 0) return;
				let t = H.inFrame == null ? 0 : o(H.inFrame, 0, e), n = H.outFrame == null ? e : o(H.outFrame, 0, e);
				n < t ? (H.inFrame = n, H.outFrame = t) : (H.inFrame = t, H.outFrame = n);
			} catch (e) {
				console.debug?.(e);
			}
		}, K = () => {
			try {
				let e = U();
				return {
					inF: H.inFrame == null ? 0 : o(H.inFrame, 0, e),
					outF: H.outFrame == null ? e : o(H.outFrame, 0, e),
					maxF: e
				};
			} catch {
				return {
					inF: 0,
					outF: 0,
					maxF: 0
				};
			}
		}, Ze = () => {
			try {
				if (!d || u) return ne;
				let e = U();
				if (Number.isFinite(e) && e > ne) return Math.max(ne, Math.floor(e));
			} catch (e) {
				console.debug?.(e);
			}
			return ne;
		}, Qe = () => {
			try {
				v.max = String(Ze());
			} catch (e) {
				console.debug?.(e);
			}
		}, q = () => {
			try {
				be.textContent = !s?.paused || H._ppReverse ? e("video.pause", "Pause") : e("video.play", "Play");
			} catch (e) {
				console.debug?.(e);
			}
		}, $e = () => {
			try {
				let t = !!s?.muted || (Number(s?.volume) || 0) <= .001;
				try {
					Me.icon.className = `pi ${t ? "pi-volume-off" : "pi-volume-up"}`;
				} catch (e) {
					console.debug?.(e);
				}
				let n = t ? e("video.unmute", "Unmute") : e("video.mute", "Mute");
				N.title = n, N.setAttribute("aria-label", n);
			} catch (e) {
				console.debug?.(e);
			}
		}, J = (e = null) => {
			try {
				let t = Number(s?.duration), r = e ?? s?.currentTime, i = Number(r), o = Number.isFinite(t) && t > 0;
				if (ve.textContent = `${f(i)} / ${o ? f(t) : "0:00"}`, v.disabled = !o, o) {
					let e = a((i || 0) / t);
					Qe();
					let n = Math.round(e * Ze());
					!Number.isNaN(n) && !H._seeking && !v.matches?.(":active") && (v.value = String(n));
					try {
						_e.style.left = `${e * 100}%`;
					} catch (e) {
						console.debug?.(e);
					}
				} else {
					v.value = "0";
					try {
						_e.style.left = "0%";
					} catch (e) {
						console.debug?.(e);
					}
				}
				let c = d ? U() : 0, l = d ? W(i) : 0;
				if (ie) {
					d && (A.textContent = u ? `T: ${f(i)} / ${f(t)}` : `F: ${l} / ${c}`);
					try {
						if (Number.isFinite(t) && t > 0) {
							let e = a((i || 0) / t);
							E.style.left = `${e * 100}%`, E.textContent = u ? f(i) : String(l), E.style.display = "";
						} else E.style.display = "none";
					} catch (e) {
						console.debug?.(e);
					}
				}
				if (d) {
					ke.matches?.(":focus") || (ke.value = String(H.inFrame ?? 0)), Ae.matches?.(":focus") || (Ae.value = String(H.outFrame ?? c));
					try {
						let { inF: e, outF: t, maxF: r } = K(), i = e <= 0 && t >= r, a = Math.max(0, Math.floor(t) - Math.floor(e) + 1);
						!i && r > 0 ? (k.textContent = u ? `R: ${f(a / n(H.fps, 30))}` : `R: ${a}f`, k.style.display = "") : k.style.display = "none";
					} catch (e) {
						console.debug?.(e);
					}
				}
			} catch (e) {
				console.debug?.(e);
			}
		}, et = () => {
			if (!(!ie || !u)) try {
				let e = Number(s?.duration);
				if (!Number.isFinite(e) || e <= 0) {
					w.style.backgroundImage = "", T.replaceChildren();
					try {
						T.dataset.mjrLabelKey = "";
					} catch (e) {
						console.debug?.(e);
					}
					return;
				}
				let t = ae(e, 80), n = ae(e, 8), r = t / e * 100, i = n / e * 100;
				if (Number.isFinite(r) && r > .02) {
					let e = `repeating-linear-gradient(to right, rgba(255,255,255,0.16) 0, rgba(255,255,255,0.16) 1px, transparent 1px, transparent ${r}%)`, t = `repeating-linear-gradient(to right, rgba(255,255,255,0.3) 0, rgba(255,255,255,0.3) 1px, transparent 1px, transparent ${i}%)`;
					w.style.backgroundImage = `${t}, ${e}`;
				} else w.style.backgroundImage = "";
				let o = `audio|${Math.round(e * 1e3)}|${Math.round(n * 1e3)}`;
				if (T?.dataset?.mjrLabelKey === o) return;
				T.dataset.mjrLabelKey = o, T.replaceChildren();
				let c = (t) => {
					let n = document.createElement("span");
					n.className = "mjr-video-seek-label";
					let r = Math.max(0, Math.min(e, Number(t) || 0));
					return n.style.left = `${a(r / e) * 100}%`, n.textContent = f(r), n;
				};
				T.appendChild(c(0));
				for (let t = n; t < e; t += n) T.appendChild(c(t));
				T.appendChild(c(e));
			} catch (e) {
				console.debug?.(e);
			}
		}, Y = () => {
			if (!d) {
				et();
				return;
			}
			try {
				let { inF: e, outF: t, maxF: n } = K();
				if (!Number.isFinite(n) || n <= 0) return;
				let r = a(e / n) * 100, i = a(t / n) * 100, o = e <= 0 && t >= n;
				try {
					v.style.background = "";
				} catch (e) {
					console.debug?.(e);
				}
				try {
					let e = a(r / 100) * 100, t = a(i / 100) * 100, n = Math.min(e, t), s = Math.max(e, t);
					if (b && x && S && C) {
						x.style.left = "0%", x.style.width = `${n}%`, S.style.left = `${n}%`, S.style.width = `${Math.max(0, s - n)}%`, C.style.left = `${s}%`, C.style.width = `${Math.max(0, 100 - s)}%`;
						try {
							b.classList.toggle("is-trimmed", !o), b.classList.toggle("is-fullrange", o);
						} catch (e) {
							console.debug?.(e);
						}
					}
				} catch (e) {
					console.debug?.(e);
				}
				try {
					he.style.left = `${r}%`, ge.style.left = `${i}%`;
				} catch (e) {
					console.debug?.(e);
				}
				try {
					D.style.left = `${r}%`, O.style.left = `${i}%`;
				} catch (e) {
					console.debug?.(e);
				}
				if (u) {
					et();
					return;
				}
				try {
					let e = Math.max(1, Math.floor(n / te)), t = Math.max(e, Math.floor(Number(H.step) || 1)), r = t / n * 100, i = r * 10;
					if (Number.isFinite(r) && r > .02) {
						let e = `repeating-linear-gradient(to right, rgba(255,255,255,0.16) 0, rgba(255,255,255,0.16) 1px, transparent 1px, transparent ${r}%)`, t = `repeating-linear-gradient(to right, rgba(255,255,255,0.28) 0, rgba(255,255,255,0.28) 1px, transparent 1px, transparent ${i}%)`;
						w.style.backgroundImage = `${t}, ${e}`;
					} else w.style.backgroundImage = "";
					(() => {
						try {
							let e = `${n}|${t}`;
							if (T?.dataset?.mjrLabelKey === e) return;
							T.dataset.mjrLabelKey = e;
						} catch (e) {
							console.debug?.(e);
						}
						try {
							T.replaceChildren();
						} catch (e) {
							console.debug?.(e);
						}
						let e = Math.max(1, t * 10);
						try {
							for (; e > 0 && Math.ceil(n / e) > 22;) e *= 2;
						} catch (e) {
							console.debug?.(e);
						}
						let r = (e) => {
							let t = document.createElement("span");
							t.className = "mjr-video-seek-label";
							let r = a(e / n) * 100;
							return t.style.left = `${r}%`, t.textContent = String(Math.floor(e)), t;
						};
						try {
							T.appendChild(r(0));
						} catch (e) {
							console.debug?.(e);
						}
						for (let t = e; t < n; t += e) try {
							T.appendChild(r(t));
						} catch (e) {
							console.debug?.(e);
						}
						try {
							T.appendChild(r(n));
						} catch (e) {
							console.debug?.(e);
						}
					})();
				} catch (e) {
					console.debug?.(e);
				}
			} catch (e) {
				console.debug?.(e);
			}
		}, X = ({ prefer: e = null } = {}) => {
			if (d) try {
				G();
				let { inF: t, outF: n } = K(), r = W();
				e === "in" ? Z(t) : e === "out" ? r > n && Z(n) : r < t ? Z(t) : r > n && Z(n);
			} catch (e) {
				console.debug?.(e);
			}
		}, tt = () => {
			try {
				H.inFrame = 0, G(), J(), Y(), X({ prefer: "in" });
			} catch (e) {
				console.debug?.(e);
			}
		}, nt = () => {
			try {
				let { maxF: e } = K();
				H.outFrame = Math.max(0, Number(e) || 0), G(), J(), Y(), X({ prefer: "out" });
			} catch (e) {
				console.debug?.(e);
			}
		}, rt = () => {
			try {
				H._ppRafId != null && (cancelAnimationFrame(H._ppRafId), H._ppRafId = null);
			} catch (e) {
				console.debug?.(e);
			}
		};
		V.push(rt);
		let it = () => {
			try {
				rt(), H._ppReverse = !0, s.pause?.(), q();
				let e = 1e3 / (n(H.fps, 30) * Math.max(.25, Number(H.playbackRate) || 1)), t = performance.now(), r = (n) => {
					try {
						if (!H._ppReverse || !H.pingpong) {
							H._ppReverse = !1, q();
							return;
						}
						let i = n - t;
						if (i >= e) {
							t = n - i % e;
							let { inF: r } = K(), a = W();
							if (a <= r) {
								H._ppReverse = !1, Z(r);
								let e = s.play?.();
								e && typeof e.catch == "function" && e.catch(() => {}), q(), J();
								return;
							}
							Z(a - Math.max(1, Math.floor(Number(H.step) || 1))), J();
						}
						H._ppRafId = requestAnimationFrame(r);
					} catch (e) {
						console.debug?.(e), H._ppReverse = !1, q();
					}
				};
				H._ppRafId = requestAnimationFrame(r);
			} catch (e) {
				console.debug?.(e), H._ppReverse = !1;
			}
		}, at = () => {
			try {
				let e = U();
				H.inFrame = 0, H.outFrame = e > 0 ? e : null, H.step = 1, H.loop = !!d, H.pingpong = !1, H._ppReverse = !1, rt(), H.once = !1, Je(1);
				try {
					je.value = "1";
				} catch (e) {
					console.debug?.(e);
				}
				try {
					M.matches?.(":focus") || (M.value = "1");
				} catch (e) {
					console.debug?.(e);
				}
				G(), Ye(), J(), Y(), X({ prefer: "in" });
			} catch (e) {
				console.debug?.(e);
			}
		}, ot = () => {
			try {
				let e = a(Number(s?.volume) || 0);
				try {
					F && !F.matches?.(":active") && (F.value = String(e));
				} catch (e) {
					console.debug?.(e);
				}
				$e();
			} catch (e) {
				console.debug?.(e);
			}
		}, Z = (e) => {
			try {
				let { maxF: t } = K();
				s.currentTime = Xe(o(e, 0, t > 0 ? t : Infinity));
			} catch (e) {
				console.debug?.(e);
			}
			J();
		}, st = (e) => {
			We();
			try {
				let t = Math.max(1, Math.floor(Number(H.step) || 1)), { inF: n, outF: r } = K(), i = W() + e * t;
				H.loop ? (i < n && (i = r), i > r && (i = n)) : i = o(i, n, r);
				try {
					s.pause?.();
				} catch (e) {
					console.debug?.(e);
				}
				Z(i), Ke();
			} catch (e) {
				console.debug?.(e);
			}
		}, ct = () => {
			if (d) try {
				G();
				let { inF: e, outF: t } = K(), n = W();
				(n < e || n > t) && Z(e);
			} catch (e) {
				console.debug?.(e);
			}
		}, lt = () => {
			We();
			try {
				if (H._ppReverse) {
					H._ppReverse = !1, rt(), q();
					return;
				}
				if (s.paused) {
					ct();
					let e = s.play?.();
					e && typeof e.catch == "function" && e.catch(() => {});
				} else s.pause?.();
			} catch (e) {
				console.debug?.(e);
			}
			q();
		};
		V.push(i(s, "click", (e) => {
			try {
				if (e?.target !== s) return;
			} catch (e) {
				console.debug?.(e);
			}
			lt();
		})), V.push(i(be, "click", (e) => {
			z(e), lt();
		})), V.push(i(xe, "click", (e) => {
			z(e), st(-1);
		})), V.push(i(Se, "click", (e) => {
			z(e), st(1);
		})), V.push(i(Ce, "click", (e) => {
			z(e);
			let { inF: t } = K();
			Z(t), Ke();
		})), V.push(i(we, "click", (e) => {
			z(e);
			let { outF: t } = K();
			Z(t), Ke();
		}));
		let ut = (e) => {
			try {
				let t = Number(s?.duration);
				if (!Number.isFinite(t) || t <= 0) return !1;
				let n = _.getBoundingClientRect?.(), r = Number(n?.width) || 0;
				if (!(r > 0)) return !1;
				let i = a(o((Number(e) || 0) - Number(n.left || 0), 0, r) / r), c = i * t;
				return s.currentTime = c, Qe(), v.value = String(Math.round(i * Ze())), J(c), !0;
			} catch (e) {
				return console.debug?.(e), !1;
			}
		}, Q = {
			active: !1,
			pointerId: null,
			ac: null
		}, dt = (e = null) => {
			if (Q.active) {
				e && B(e), Q.active = !1, H._seeking = !1;
				try {
					_.releasePointerCapture?.(Q.pointerId);
				} catch (e) {
					console.debug?.(e);
				}
				Q.pointerId = null;
				try {
					Q.ac?.abort?.();
				} catch (e) {
					console.debug?.(e);
				}
				Q.ac = null, J();
			}
		}, ft = (e) => {
			Q.active && (B(e), ut(e.clientX));
		};
		if (V.push(() => dt()), V.push(i(_, "pointerdown", (e) => {
			try {
				if (e?.button != null && e.button !== 0 || e?.target?.closest?.(".mjr-video-seek-handle, .mjr-video-seek-mark")) return;
			} catch (e) {
				console.debug?.(e);
			}
			B(e), We(), H._seeking = !0, Q.active = !0, Q.pointerId = e?.pointerId ?? null, ut(e?.clientX);
			try {
				_.setPointerCapture?.(Q.pointerId);
			} catch (e) {
				console.debug?.(e);
			}
			try {
				Q.ac?.abort?.();
			} catch (e) {
				console.debug?.(e);
			}
			try {
				let e = new AbortController();
				Q.ac = e, window.addEventListener("pointermove", ft, {
					passive: !1,
					capture: !0,
					signal: e.signal
				}), window.addEventListener("pointerup", dt, {
					passive: !1,
					capture: !0,
					signal: e.signal
				}), window.addEventListener("pointercancel", dt, {
					passive: !1,
					capture: !0,
					signal: e.signal
				}), window.addEventListener("blur", dt, { signal: e.signal });
			} catch (e) {
				console.debug?.(e);
			}
		}, { passive: !1 })), V.push(i(v, "pointerdown", () => {
			H._seeking = !0;
		})), V.push(i(v, "pointerup", () => {
			Q.active || (H._seeking = !1);
		})), V.push(i(v, "pointercancel", () => {
			Q.active || (H._seeking = !1);
		})), V.push(i(v, "input", (e) => {
			z(e), We();
			try {
				let e = Number(s?.duration);
				if (!Number.isFinite(e) || e <= 0) return;
				let t = Number(v.value);
				s.currentTime = a((Number.isFinite(t) ? t : 0) / Ze()) * e;
			} catch (e) {
				console.debug?.(e);
			}
			J();
		})), d) {
			V.push(i(Te, "click", (e) => {
				z(e), H.inFrame = W(), G(), J(), Y(), X({ prefer: "in" });
			})), V.push(i(Ee, "click", (e) => {
				z(e), H.outFrame = W(), G(), J(), Y(), X({ prefer: "out" });
			})), V.push(i(ke, "change", (e) => {
				z(e);
				try {
					let e = Number(ke.value);
					H.inFrame = Number.isFinite(e) ? Math.max(0, Math.floor(e)) : null, G();
				} catch (e) {
					console.debug?.(e);
				}
				J(), Y(), X({ prefer: "in" });
			})), V.push(i(Ae, "change", (e) => {
				z(e);
				try {
					let e = Number(Ae.value);
					H.outFrame = Number.isFinite(e) ? Math.max(0, Math.floor(e)) : null, G();
				} catch (e) {
					console.debug?.(e);
				}
				J(), Y(), X({ prefer: "out" });
			})), V.push(i(je, "change", (e) => {
				z(e);
				try {
					H.step = Math.max(1, Math.floor(Number(je.value) || 1)), je.value = String(H.step);
				} catch (e) {
					console.debug?.(e);
				}
			})), V.push(i(j, "change", (e) => {
				z(e);
				try {
					H.fps = n(j.value, 30), j.value = String(H.fps), Ue(!1), G();
				} catch (e) {
					console.debug?.(e);
				}
				J(), Y();
			})), V.push(i(Oe, "click", (e) => {
				z(e), !H.loop && !H.pingpong ? (H.loop = !0, H.pingpong = !1) : H.loop && !H.pingpong ? (H.loop = !1, H.pingpong = !0) : (H.loop = !1, H.pingpong = !1), (H.loop || H.pingpong) && (H.once = !1), H.pingpong || (H._ppReverse = !1, rt()), Ye();
			})), V.push(i(Pe, "click", (e) => {
				z(e), tt();
			})), V.push(i(Ie, "click", (e) => {
				z(e), nt();
			})), V.push(i(k, "click", (e) => {
				z(e), at();
			}));
			try {
				k.title = e("video.resetPlayerControls", "Reset player controls"), k.style.cursor = "pointer", k.style.userSelect = "none";
			} catch (e) {
				console.debug?.(e);
			}
		}
		V.push(i(N, "click", (e) => {
			z(e);
			try {
				s.muted = !s.muted, P && (P.style.display = s.muted ? "none" : "inline-flex");
			} catch (e) {
				console.debug?.(e);
			}
			ot();
		})), V.push(i(N, "contextmenu", (e) => {
			B(e);
			try {
				if (!P) return;
				let e = P.style.display !== "none";
				P.style.display = e ? "none" : "inline-flex";
			} catch (e) {
				console.debug?.(e);
			}
			ot();
		})), V.push(i(window, "pointerdown", (e) => {
			try {
				if (!P || P.style.display === "none" || N.contains?.(e?.target) || P.contains?.(e?.target)) return;
				P.style.display = "none";
			} catch (e) {
				console.debug?.(e);
			}
		}, { capture: !0 })), F && V.push(i(F, "input", (e) => {
			z(e);
			try {
				let e = a(Number(F.value) || 0);
				s.volume = e, e > .001 && (s.muted = !1);
			} catch (e) {
				console.debug?.(e);
			}
			ot();
		})), V.push(i(M, "change", (e) => {
			z(e);
			try {
				Je(Number(M.value) || 1);
			} catch (e) {
				console.debug?.(e);
			}
		})), V.push(i(s, "ratechange", () => {
			try {
				Je(Number(s.playbackRate) || H.playbackRate || 1);
			} catch (e) {
				console.debug?.(e);
			}
		}));
		let pt = () => {
			if (d) try {
				if (H._seeking || s?.paused) return;
				let { inF: e, outF: t, maxF: n } = K();
				if (n <= 0 || e <= 0 && t >= n && !H.loop && !H.pingpong && !H.once || H._ppReverse) return;
				let r = W();
				if (r >= t - Math.max(1, Math.floor(Number(H.step) || 1))) if (H.pingpong) {
					it();
					return;
				} else if (H.loop) {
					Z(e);
					try {
						let e = s.play?.();
						e && typeof e.catch == "function" && e.catch(() => {});
					} catch (e) {
						console.debug?.(e);
					}
				} else if (H.once) {
					try {
						s.pause?.();
					} catch (e) {
						console.debug?.(e);
					}
					Z(t);
				} else {
					try {
						s.pause?.();
					} catch (e) {
						console.debug?.(e);
					}
					Z(t);
				}
				else r < e && Z(e);
			} catch (e) {
				console.debug?.(e);
			}
		}, $ = {
			rafId: null,
			rvfcId: null
		}, mt = () => {
			try {
				$.rvfcId != null && typeof s?.cancelVideoFrameCallback == "function" && s.cancelVideoFrameCallback($.rvfcId);
			} catch (e) {
				console.debug?.(e);
			}
			$.rvfcId = null;
			try {
				$.rafId != null && typeof cancelAnimationFrame == "function" && cancelAnimationFrame($.rafId);
			} catch (e) {
				console.debug?.(e);
			}
			$.rafId = null;
		}, ht = (e = 0, n = null) => {
			$.rafId = null, $.rvfcId = null;
			try {
				t(J, n?.mediaTime), t(pt);
			} catch (e) {
				console.debug?.(e);
			}
			if (!(!(H._ppReverse || !s?.paused) || Be.signal?.aborted)) {
				try {
					if (typeof s?.requestVideoFrameCallback == "function" && !H._ppReverse) {
						$.rvfcId = s.requestVideoFrameCallback(ht);
						return;
					}
				} catch (e) {
					console.debug?.(e);
				}
				try {
					typeof requestAnimationFrame == "function" && ($.rafId = requestAnimationFrame((e) => {
						ht(e, { mediaTime: Number(s?.currentTime) || 0 });
					}));
				} catch (e) {
					console.debug?.(e);
				}
			}
		}, gt = () => {
			mt(), !(!(H._ppReverse || !s?.paused) || Be.signal?.aborted) && ht(0, { mediaTime: Number(s?.currentTime) || 0 });
		};
		V.push(mt), V.push(i(s, "play", () => {
			t(q), gt();
		}));
		for (let e of ["pause", "ended"]) V.push(i(s, e, () => {
			mt(), t(q), t(J);
		}));
		for (let e of [
			"timeupdate",
			"loadedmetadata",
			"durationchange",
			"seeked"
		]) V.push(i(s, e, () => t(J)));
		V.push(i(s, "timeupdate", pt)), V.push(i(s, "ended", () => {
			if (d) try {
				let { inF: e, outF: t, maxF: n } = K(), r = e <= 0 && t >= n;
				if (H.pingpong && !H._ppReverse) {
					it();
					return;
				}
				if (!H.loop && !r) return;
				Z(e);
				try {
					let e = s.play?.();
					e && typeof e.catch == "function" && e.catch(() => {});
				} catch (e) {
					console.debug?.(e);
				}
			} catch (e) {
				console.debug?.(e);
			}
		}, { passive: !0 })), ie && (V.push(i(s, "loadedmetadata", () => {
			if (!d) {
				Y();
				return;
			}
			try {
				let e = U();
				e > 0 && H.inFrame == null && H.outFrame == null && (H.inFrame = 0, H.outFrame = e, G());
			} catch (e) {
				console.debug?.(e);
			}
			Y();
		})), V.push(i(s, "durationchange", () => t(Y)))), d && V.push(i(s, "mjr:frameStep", () => {
			t(Ke);
		}));
		for (let e of ["volumechange"]) V.push(i(s, e, () => t(ot)));
		try {
			H.fps = n(j.value, H.nativeFps || 30), Ue(!0), H.step = Math.max(1, Math.floor(Number(je.value) || 1)), G(), Ye(), Je(H.playbackRate);
		} catch (e) {
			console.debug?.(e);
		}
		t(q), t(J), t(Y), t(ot);
		try {
			(!s?.paused || H._ppReverse) && gt();
		} catch (e) {
			console.debug?.(e);
		}
		let _t = (e = {}) => {
			let t = 0, r = !1;
			try {
				t = Math.max(0, U()), r = t > 0 && H.outFrame != null && H.outFrame >= t - 1;
			} catch (e) {
				console.debug?.(e);
			}
			try {
				let t = Number(e?.fps);
				if (Number.isFinite(t) && t > 0) {
					if (String(e?.fpsSource || e?.source || "") === "rvfc" && Number(H.nativeFps) > 0) return;
					let r = He();
					H.nativeFps = n(t, H.nativeFps || 30), r || (H.fps = H.nativeFps);
					try {
						Ue(!0);
					} catch (e) {
						console.debug?.(e);
					}
				}
			} catch (e) {
				console.debug?.(e);
			}
			try {
				let t = Number(e?.frameCount);
				H.frameCount = Number.isFinite(t) && t > 0 ? Math.floor(t) : null;
			} catch {
				H.frameCount = null;
			}
			try {
				let e = Math.max(0, U());
				r && e > t + .5 && (H.outFrame = null), G(), Ye(), J(), Y();
			} catch (e) {
				console.debug?.(e);
			}
		};
		try {
			if (d) {
				let e = Number(c?.initialFps), t = Number(c?.initialFrameCount);
				(Number.isFinite(e) || Number.isFinite(t)) && _t({
					fps: e,
					frameCount: t
				});
			}
		} catch (e) {
			console.debug?.(e);
		}
		if (d) {
			let e = {
				active: !1,
				which: null,
				pointerId: null,
				ac: null,
				captureEl: null
			}, t = (e) => {
				try {
					let t = _.getBoundingClientRect(), n = o((Number(e) || 0) - t.left, 0, t.width || 1), r = t.width > 0 ? n / t.width : 0, { maxF: i } = K();
					return o(Math.round(r * i), 0, i);
				} catch {
					return 0;
				}
			}, n = (n, i) => {
				B(n);
				try {
					e.ac?.abort?.();
				} catch (e) {
					console.debug?.(e);
				}
				e.ac = null, e.active = !0, e.which = i, e.pointerId = n.pointerId;
				try {
					e.captureEl = n.currentTarget || null;
				} catch {
					e.captureEl = null;
				}
				try {
					e.captureEl?.setPointerCapture?.(n.pointerId);
				} catch (e) {
					console.debug?.(e);
				}
				try {
					_.setPointerCapture?.(n.pointerId);
				} catch (e) {
					console.debug?.(e);
				}
				try {
					let t = new AbortController();
					e.ac = t, window.addEventListener("pointermove", r, {
						passive: !1,
						capture: !0,
						signal: t.signal
					}), window.addEventListener("pointerup", a, {
						passive: !1,
						capture: !0,
						signal: t.signal
					}), window.addEventListener("pointercancel", a, {
						passive: !1,
						capture: !0,
						signal: t.signal
					});
				} catch (e) {
					console.debug?.(e);
				}
				let o = t(n.clientX);
				i === "in" ? H.inFrame = o : H.outFrame = o, G(), J(), Y(), X({ prefer: i });
			}, r = (n) => {
				if (!e.active) return;
				B(n);
				let r = t(n.clientX);
				e.which === "in" ? H.inFrame = r : H.outFrame = r, G(), J(), Y();
			}, a = (t) => {
				if (e.active) {
					B(t), e.active = !1;
					try {
						_.releasePointerCapture?.(e.pointerId);
					} catch (e) {
						console.debug?.(e);
					}
					try {
						e.captureEl?.releasePointerCapture?.(e.pointerId);
					} catch (e) {
						console.debug?.(e);
					}
					e.captureEl = null, e.pointerId = null;
					try {
						X({ prefer: e.which });
					} catch (e) {
						console.debug?.(e);
					}
					try {
						e.ac?.abort?.();
					} catch (e) {
						console.debug?.(e);
					}
					e.ac = null;
				}
			};
			V.push(i(D, "pointerdown", (e) => n(e, "in"), { passive: !1 })), V.push(i(O, "pointerdown", (e) => n(e, "out"), { passive: !1 })), V.push(i(he, "pointerdown", (e) => n(e, "in"), { passive: !1 })), V.push(i(ge, "pointerdown", (e) => n(e, "out"), { passive: !1 })), V.push(i(_, "pointermove", r, { passive: !1 })), V.push(i(_, "pointerup", a, { passive: !1 })), V.push(i(_, "pointercancel", a, { passive: !1 }));
		}
		return t(() => m.appendChild(h)), {
			controlsEl: h,
			setMediaInfo: _t,
			setPlaybackRate: (e) => {
				try {
					return Je(e);
				} catch {
					return H.playbackRate || 1;
				}
			},
			getPlaybackRate: () => {
				try {
					return Number(H.playbackRate) || 1;
				} catch {
					return 1;
				}
			},
			adjustPlaybackRate: (e) => {
				try {
					let t = Number(e);
					return Number.isFinite(t) ? Je((Number(H.playbackRate) || 1) + t) : H.playbackRate || 1;
				} catch {
					return H.playbackRate || 1;
				}
			},
			togglePlay: () => {
				try {
					return lt(), !0;
				} catch {
					return !1;
				}
			},
			stepFrames: (e) => {
				try {
					return st(e), !0;
				} catch {
					return !1;
				}
			},
			setInPoint: () => {
				if (!d) return !1;
				try {
					return H.inFrame = W(), G(), J(), Y(), X({ prefer: "in" }), !0;
				} catch {
					return !1;
				}
			},
			setOutPoint: () => {
				if (!d) return !1;
				try {
					return H.outFrame = W(), G(), J(), Y(), X({ prefer: "out" }), !0;
				} catch {
					return !1;
				}
			},
			goToIn: () => {
				if (!d) return !1;
				try {
					let { inF: e } = K();
					return Z(e), Ke(), !0;
				} catch {
					return !1;
				}
			},
			goToOut: () => {
				if (!d) return !1;
				try {
					let { outF: e } = K();
					return Z(e), Ke(), !0;
				} catch {
					return !1;
				}
			},
			destroy: () => {
				for (let e of V) t(e);
				t(() => h.remove());
			}
		};
	} catch {
		return {
			controlsEl: null,
			destroy: r
		};
	}
}
//#endregion
export { s as a, l as i, u as n, c as o, ee as r, pe as t };
