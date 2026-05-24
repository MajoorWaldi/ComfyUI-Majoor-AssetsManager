//#region js/features/viewer/frameExport.ts
function e({ state: e, VIEWER_MODES: t, singleView: n, abView: r, sideView: i }) {
	function a() {
		try {
			if (e?.mode === t.SINGLE) {
				let e = n?.querySelector?.("canvas.mjr-viewer-media");
				return e instanceof HTMLCanvasElement ? e : null;
			}
			if (e?.mode === t.AB_COMPARE) {
				let t = String(e?.abCompareMode || "wipe");
				if (t === "wipe" || t === "wipeV") {
					let e = r?.querySelector?.("canvas.mjr-viewer-media[data-mjr-compare-role=\"A\"]"), n = r?.querySelector?.("canvas.mjr-viewer-media[data-mjr-compare-role=\"B\"]");
					if (e instanceof HTMLCanvasElement && n instanceof HTMLCanvasElement) return {
						a: e,
						b: n,
						mode: t
					};
				}
				let n = r?.querySelector?.("canvas.mjr-viewer-media[data-mjr-compare-role=\"D\"]");
				if (n instanceof HTMLCanvasElement) return n;
				let i = r?.querySelector?.("canvas.mjr-viewer-media");
				return i instanceof HTMLCanvasElement ? i : null;
			}
			if (e?.mode === t.SIDE_BY_SIDE) {
				let e = i?.querySelector?.("canvas.mjr-viewer-media");
				return e instanceof HTMLCanvasElement ? e : null;
			}
			return null;
		} catch {
			return null;
		}
	}
	let o = (e, t = "image/png", n = .92) => new Promise((r) => {
		try {
			if (e?.toBlob) {
				e.toBlob((e) => r(e), t, n);
				return;
			}
		} catch (e) {
			console.debug?.(e);
		}
		try {
			let i = e?.toDataURL?.(t, n);
			if (!i || typeof i != "string") return r(null);
			let a = i.split(",")[1] || "", o = atob(a), s = new Uint8Array(o.length);
			for (let e = 0; e < o.length; e++) s[e] = o.charCodeAt(e);
			r(new Blob([s], { type: t }));
		} catch {
			r(null);
		}
	});
	async function s({ toClipboard: t = !1 } = {}) {
		try {
			let n = a();
			if (!n) return !1;
			await new Promise((e) => requestAnimationFrame(e));
			let r = null;
			if (n instanceof HTMLCanvasElement) r = n;
			else if (n?.a && n?.b) {
				let t = n.a, i = n.b, a = Math.max(1, Math.min(Number(t.width) || 0, Number(i.width) || 0)), o = Math.max(1, Math.min(Number(t.height) || 0, Number(i.height) || 0));
				if (!(a > 1 && o > 1)) return !1;
				let s = document.createElement("canvas");
				s.width = a, s.height = o;
				let c = s.getContext("2d");
				if (!c) return !1;
				try {
					c.drawImage(i, 0, 0, a, o);
				} catch (e) {
					console.debug?.(e);
				}
				let l = Math.max(0, Math.min(100, Number(e?._abWipePercent) || 50)) / 100;
				try {
					c.save(), c.beginPath(), n.mode === "wipeV" ? c.rect(0, 0, a, o * l) : c.rect(0, 0, a * l, o), c.clip(), c.drawImage(t, 0, 0, a, o), c.restore();
				} catch (e) {
					console.debug?.(e);
				}
				r = s;
			}
			if (!r) return !1;
			let i = await o(r, "image/png");
			if (!i) return !1;
			if (t) try {
				let e = globalThis?.ClipboardItem, t = navigator?.clipboard;
				return !e || !t?.write ? !1 : (await t.write([new e({ "image/png": i })]), !0);
			} catch {
				return !1;
			}
			try {
				let t = e?.assets?.[e?.currentIndex] || null, n = `${String(t?.filename || "frame").replace(/[\\/:*?"<>|]+/g, "_").replace(/\.[^.]+$/, "") || "frame"}_export.png`, r = URL.createObjectURL(i), a = document.createElement("a");
				a.href = r, a.download = n, a.rel = "noopener", a.click();
				try {
					setTimeout(() => URL.revokeObjectURL(r), 2e3);
				} catch (e) {
					console.debug?.(e);
				}
				return !0;
			} catch {
				return !1;
			}
		} catch {
			return !1;
		}
	}
	return { exportCurrentFrame: s };
}
//#endregion
export { e as createFrameExporter };
