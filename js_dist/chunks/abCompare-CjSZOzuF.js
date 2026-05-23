//#region js/features/viewer/abCompare.js
function e({ abView: e, state: t, currentAsset: n, viewUrl: r, buildAssetViewURL: i, createCompareMediaElement: a, destroyMediaProcessorsIn: o } = {}) {
	try {
		o?.(e);
	} catch (e) {
		console.debug?.(e);
	}
	try {
		e && (e.innerHTML = "");
	} catch (e) {
		console.debug?.(e);
	}
	try {
		e?._mjrSyncAbort?.abort?.();
	} catch (e) {
		console.debug?.(e);
	}
	try {
		e?._mjrDiffAbort?.abort?.();
	} catch (e) {
		console.debug?.(e);
	}
	try {
		e?._mjrSliderAbort?.abort?.();
	} catch (e) {
		console.debug?.(e);
	}
	try {
		e._mjrDiffRequest = null;
	} catch (e) {
		console.debug?.(e);
	}
	try {
		e._mjrSliderAbort = null;
	} catch (e) {
		console.debug?.(e);
	}
	if (!e || !t || !n) return;
	let s = (e, t) => {
		try {
			let n = e?.querySelector?.(".mjr-viewer-audio-src") || e?.querySelector?.("audio");
			if (!n) return;
			let r = String(t || "").toUpperCase() === "A";
			if (n.muted = !r, !r) try {
				n.pause?.();
			} catch (e) {
				console.debug?.(e);
			}
		} catch (e) {
			console.debug?.(e);
		}
	}, c = (() => {
		try {
			let e = String(t.abCompareMode || "wipe");
			return e === "wipeH" ? "wipe" : e;
		} catch {
			return "wipe";
		}
	})(), l = c === "wipe" || c === "wipeV", u = c === "wipeV" ? "y" : "x", d = t.compareAsset || (Array.isArray(t.assets) && t.assets.length === 2 ? t.assets[1 - (t.currentIndex || 0)] : null) || n, f = (() => {
		try {
			return i?.(d);
		} catch {
			return "";
		}
	})(), p = document.createElement("div");
	p.style.cssText = "\n        position: absolute;\n        top: 0;\n        left: 0;\n        width: 100%;\n        height: 100%;\n        overflow: hidden;\n        display: flex;\n        align-items: center;\n        justify-content: center;\n    ";
	let m = a?.(d, f);
	m && p.appendChild(m);
	try {
		let e = m?.querySelector?.(".mjr-viewer-video-src") || m?.querySelector?.("video");
		e?.dataset && (e.dataset.mjrCompareRole = "B");
		let t = m?.querySelector?.(".mjr-viewer-audio-src") || m?.querySelector?.("audio");
		t?.dataset && (t.dataset.mjrCompareRole = "B");
	} catch (e) {
		console.debug?.(e);
	}
	s(m, "B");
	try {
		let e = m?.querySelector?.("canvas.mjr-viewer-media") || (m instanceof HTMLCanvasElement ? m : null);
		e?.dataset && (e.dataset.mjrCompareRole = "B");
	} catch (e) {
		console.debug?.(e);
	}
	let h = document.createElement("div");
	h.style.cssText = "\n        position: absolute;\n        top: 0;\n        left: 0;\n        width: 100%;\n        height: 100%;\n        overflow: hidden;\n        display: flex;\n        align-items: center;\n        justify-content: center;\n    ";
	let g = (() => {
		try {
			return !!window.CSS?.supports?.("clip-path: inset(0 50% 0 0)");
		} catch {
			return !1;
		}
	})(), _ = (t) => {
		try {
			let n = Math.max(0, Math.min(100, Number(t) || 0));
			if (g) {
				let e = u === "y" ? `inset(0 0 ${100 - n}% 0)` : `inset(0 ${100 - n}% 0 0)`;
				h.style.clipPath = e, h.style.webkitClipPath = e;
				return;
			}
			let r = e.getBoundingClientRect(), i = r.width || 1, a = r.height || 1;
			if (u === "y") {
				let e = Math.round(a * n / 100);
				h.style.clip = `rect(0px, ${i}px, ${e}px, 0px)`;
			} else {
				let e = Math.round(i * n / 100);
				h.style.clip = `rect(0px, ${e}px, ${a}px, 0px)`;
			}
		} catch (e) {
			console.debug?.(e);
		}
	}, v = (() => {
		if (!l) return 100;
		try {
			let e = Number(t._abWipePercent);
			if (Number.isFinite(e) && e >= 0 && e <= 100) return e;
		} catch (e) {
			console.debug?.(e);
		}
		return 50;
	})();
	_(v);
	try {
		l && (t._abWipePercent = v);
	} catch (e) {
		console.debug?.(e);
	}
	let y = a?.(n, r);
	y && h.appendChild(y);
	try {
		let e = y?.querySelector?.(".mjr-viewer-video-src") || y?.querySelector?.("video");
		e?.dataset && (e.dataset.mjrCompareRole = "A");
		let t = y?.querySelector?.(".mjr-viewer-audio-src") || y?.querySelector?.("audio");
		t?.dataset && (t.dataset.mjrCompareRole = "A");
	} catch (e) {
		console.debug?.(e);
	}
	s(y, "A");
	try {
		let e = y?.querySelector?.("canvas.mjr-viewer-media") || (y instanceof HTMLCanvasElement ? y : null);
		e?.dataset && (e.dataset.mjrCompareRole = "A");
	} catch (e) {
		console.debug?.(e);
	}
	let b = document.createElement("div");
	b.className = "mjr-ab-slider", b.style.cssText = "\n        position: absolute;\n        z-index: 10;\n        touch-action: none;\n        user-select: none;\n    ";
	let x = document.createElement("div");
	x.style.cssText = "\n        position: absolute;\n        background: white;\n        pointer-events: none;\n        box-shadow: 0 0 4px rgba(0,0,0,0.5);\n    ", b.appendChild(x);
	let S = (e) => e === "multiply" || e === "screen" || e === "add";
	try {
		if (l) {
			b.style.display = "";
			try {
				let e = y?.querySelector?.(".mjr-viewer-media") || y;
				e && (e.style.mixBlendMode = "");
			} catch (e) {
				console.debug?.(e);
			}
		} else {
			_(100), b.style.display = "none";
			try {
				h.style.opacity = "0", p.style.opacity = "0", h.style.pointerEvents = "none", p.style.pointerEvents = "none";
			} catch (e) {
				console.debug?.(e);
			}
			let t = document.createElement("div");
			t.style.cssText = "\n                position: absolute;\n                top: 0;\n                left: 0;\n                width: 100%;\n                height: 100%;\n                overflow: hidden;\n                display: flex;\n                align-items: center;\n                justify-content: center;\n            ";
			let n = document.createElement("canvas");
			n.className = "mjr-viewer-media";
			try {
				n.dataset.mjrCompareRole = "D";
			} catch (e) {
				console.debug?.(e);
			}
			n.style.cssText = "\n                max-width: 100%;\n                max-height: 100%;\n                display: block;\n            ", t.appendChild(n);
			let r = (e) => {
				try {
					return e ? e instanceof HTMLCanvasElement ? e : e.querySelector?.("canvas.mjr-viewer-media") || e.querySelector?.("canvas") || null : null;
				} catch {
					return null;
				}
			}, i = r(y), a = r(m), o = (() => {
				try {
					return n.getContext("2d", { willReadFrequently: !0 });
				} catch {
					return null;
				}
			})(), s = () => {
				try {
					let e = i?.width || 0, t = i?.height || 0, r = a?.width || 0, o = a?.height || 0, s = Math.max(1, Math.min(e || r, r || e)), c = Math.max(1, Math.min(t || o, o || t));
					return n.width !== s && (n.width = s), n.height !== c && (n.height = c), {
						w: s,
						h: c
					};
				} catch {
					return {
						w: 0,
						h: 0
					};
				}
			}, l = () => {
				if (!o) return !1;
				let { w: e, h: t } = s();
				if (!(e > 1 && t > 1)) return !1;
				let n = !1;
				try {
					o.save(), n = !0;
				} catch (e) {
					console.debug?.(e);
				}
				try {
					try {
						o.clearRect(0, 0, e, t);
					} catch (e) {
						console.debug?.(e);
					}
					let n = e * t, r = !!(y?.querySelector?.("video") || m?.querySelector?.("video")), s = (n) => {
						try {
							return o.globalCompositeOperation = "copy", o.drawImage(a, 0, 0, e, t), o.globalCompositeOperation = n, o.drawImage(i, 0, 0, e, t), o.globalCompositeOperation = "source-over", !0;
						} catch {
							return !1;
						}
					}, l = () => {
						if (r || !(n > 0 && n <= 75e4)) return s("difference");
						try {
							o.globalCompositeOperation = "copy", o.drawImage(i, 0, 0, e, t);
							let n = o.getImageData(0, 0, e, t);
							o.clearRect(0, 0, e, t), o.globalCompositeOperation = "copy", o.drawImage(a, 0, 0, e, t);
							let r = o.getImageData(0, 0, e, t), s = n.data, c = r.data;
							for (let e = 0; e < c.length; e += 4) c[e] = Math.max(0, (c[e] || 0) - (s[e] || 0)), c[e + 1] = Math.max(0, (c[e + 1] || 0) - (s[e + 1] || 0)), c[e + 2] = Math.max(0, (c[e + 2] || 0) - (s[e + 2] || 0)), c[e + 3] = 255;
							return o.putImageData(r, 0, 0), o.globalCompositeOperation = "source-over", !0;
						} catch {
							return s("difference");
						}
					};
					if (S(c)) return s(c === "add" ? "lighter" : c);
					if (c === "subtract") return l();
					let u = () => {
						if (r || !(n > 0 && n <= 1e6)) return s("difference");
						try {
							o.globalCompositeOperation = "copy", o.drawImage(i, 0, 0, e, t);
							let n = o.getImageData(0, 0, e, t);
							o.clearRect(0, 0, e, t), o.drawImage(a, 0, 0, e, t);
							let r = o.getImageData(0, 0, e, t), s = n.data, c = r.data, l = 0;
							for (let e = 0; e < s.length; e += 4) c[e] = Math.abs((s[e] || 0) - (c[e] || 0)), c[e + 1] = Math.abs((s[e + 1] || 0) - (c[e + 1] || 0)), c[e + 2] = Math.abs((s[e + 2] || 0) - (c[e + 2] || 0)), c[e + 3] = 255, c[e] > l && (l = c[e]), c[e + 1] > l && (l = c[e + 1]), c[e + 2] > l && (l = c[e + 2]);
							if (l > 0 && l < 255) {
								let e = 255 / l;
								for (let t = 0; t < c.length; t += 4) c[t] = Math.min(255, Math.round(c[t] * e)), c[t + 1] = Math.min(255, Math.round(c[t + 1] * e)), c[t + 2] = Math.min(255, Math.round(c[t + 2] * e));
							}
							return o.putImageData(r, 0, 0), o.globalCompositeOperation = "source-over", !0;
						} catch {
							return s("difference");
						}
					};
					if (c === "absdiff") return u();
					if (!s("difference")) return !1;
					if (c === "difference") try {
						if (n > 0 && n <= 1e6) {
							let n = o.getImageData(0, 0, e, t), r = n.data;
							for (let e = 0; e < r.length; e += 4) r[e] = Math.min(255, (r[e] || 0) * 4), r[e + 1] = Math.min(255, (r[e + 1] || 0) * 4), r[e + 2] = Math.min(255, (r[e + 2] || 0) * 4), r[e + 3] = 255;
							o.putImageData(n, 0, 0);
						}
					} catch (e) {
						console.debug?.(e);
					}
					return !0;
				} finally {
					if (n) try {
						o.restore();
					} catch (e) {
						console.debug?.(e);
					}
				}
			};
			try {
				e.appendChild(t);
			} catch (e) {
				console.debug?.(e);
			}
			try {
				let t = new AbortController();
				e._mjrDiffAbort = t;
				let n = 0, r = () => {
					let e = performance.now();
					return e - n < 83.33333333333333 ? !1 : (n = e, !0);
				}, o = () => {
					if (!t.signal.aborted) try {
						requestAnimationFrame(() => {
							if (!t.signal.aborted) try {
								i && a && r() && l();
							} catch (e) {
								console.debug?.(e);
							}
						});
					} catch (e) {
						console.debug?.(e);
					}
				};
				if (e._mjrDiffRequest = o, y?.querySelector?.("video") || m?.querySelector?.("video")) {
					let e = null, n = y?.querySelector?.("video") || null, s = m?.querySelector?.("video") || null, c = () => {
						try {
							let e = n ? !n.paused : !1, t = s ? !s.paused : !1;
							return e || t;
						} catch {
							return !0;
						}
					}, u = () => {
						if (!t.signal.aborted) {
							try {
								i && a && r() && l();
							} catch (e) {
								console.debug?.(e);
							}
							if (!c()) {
								e = null;
								return;
							}
							try {
								e = requestAnimationFrame(u);
							} catch {
								e = null;
							}
						}
					}, d = () => {
						if (!t.signal.aborted && e == null) try {
							e = requestAnimationFrame(u);
						} catch {
							e = null;
						}
					};
					try {
						n && (n.addEventListener("play", d, {
							signal: t.signal,
							passive: !0
						}), n.addEventListener("seeking", o, {
							signal: t.signal,
							passive: !0
						}), n.addEventListener("seeked", o, {
							signal: t.signal,
							passive: !0
						}), n.addEventListener("timeupdate", o, {
							signal: t.signal,
							passive: !0
						}));
					} catch (e) {
						console.debug?.(e);
					}
					try {
						s && (s.addEventListener("play", d, {
							signal: t.signal,
							passive: !0
						}), s.addEventListener("seeking", o, {
							signal: t.signal,
							passive: !0
						}), s.addEventListener("seeked", o, {
							signal: t.signal,
							passive: !0
						}), s.addEventListener("timeupdate", o, {
							signal: t.signal,
							passive: !0
						}));
					} catch (e) {
						console.debug?.(e);
					}
					d(), t.signal.addEventListener("abort", () => {
						try {
							e != null && cancelAnimationFrame(e);
						} catch (e) {
							console.debug?.(e);
						}
					}, { once: !0 });
				} else o();
			} catch (e) {
				console.debug?.(e);
			}
		}
	} catch (e) {
		console.debug?.(e);
	}
	let C = !1, w = null, T = (e) => {
		try {
			let n = Math.max(0, Math.min(100, e));
			_(n);
			try {
				t._abWipePercent = n;
			} catch (e) {
				console.debug?.(e);
			}
			u === "y" ? b.style.top = `${n}%` : b.style.left = `${n}%`;
		} catch (e) {
			console.debug?.(e);
		}
	}, E = (t) => {
		if (C) try {
			t.preventDefault(), t.stopPropagation(), w ||= e.getBoundingClientRect();
			let n = 50;
			n = u === "y" ? ((Number(t.clientY) || 0) - w.top) / w.height * 100 : ((Number(t.clientX) || 0) - w.left) / w.width * 100, T(n);
		} catch (e) {
			console.debug?.(e);
		}
	}, D = (e) => {
		if (C) {
			C = !1, w = null;
			try {
				b.releasePointerCapture(e.pointerId), b.style.cursor = u === "y" ? "ns-resize" : "ew-resize";
			} catch (e) {
				console.debug?.(e);
			}
		}
	};
	try {
		let t = new AbortController();
		e._mjrSliderAbort = t, b.addEventListener("pointerdown", (t) => {
			if (t.button === 0) {
				C = !0, t.preventDefault(), t.stopPropagation();
				try {
					w = e.getBoundingClientRect();
				} catch (e) {
					console.debug?.(e);
				}
				try {
					b.setPointerCapture(t.pointerId), b.style.cursor = "grabbing";
				} catch (e) {
					console.debug?.(e);
				}
				E(t);
			}
		}, {
			signal: t.signal,
			passive: !1
		}), window.addEventListener("pointermove", E, {
			signal: t.signal,
			passive: !1
		}), window.addEventListener("pointerup", D, {
			signal: t.signal,
			passive: !0
		}), window.addEventListener("pointercancel", D, {
			signal: t.signal,
			passive: !0
		});
	} catch (e) {
		console.debug?.(e);
	}
	try {
		u === "y" ? (b.style.width = "100%", b.style.height = "40px", b.style.left = "0", b.style.top = `${v}%`, b.style.transform = "translate(0, -50%)", b.style.cursor = "ns-resize", x.style.width = "100%", x.style.height = "1px", x.style.top = "50%", x.style.transform = "translate(0, -50%)") : (b.style.height = "100%", b.style.width = "40px", b.style.top = "0", b.style.left = `${v}%`, b.style.transform = "translate(-50%, 0)", b.style.cursor = "ew-resize", x.style.height = "100%", x.style.width = "1px", x.style.left = "50%", x.style.transform = "translate(-50%, 0)");
	} catch (e) {
		console.debug?.(e);
	}
	try {
		e.appendChild(p), e.appendChild(h), e.appendChild(b);
	} catch (e) {
		console.debug?.(e);
	}
}
//#endregion
export { e as renderABCompareView };
