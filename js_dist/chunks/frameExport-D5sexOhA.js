function T({ state: n, VIEWER_MODES: L, singleView: s, abView: e, sideView: C }) {
  function j() {
    var l, h, d, f, y, o;
    try {
      if ((n == null ? void 0 : n.mode) === L.SINGLE) {
        const r = (l = s == null ? void 0 : s.querySelector) == null ? void 0 : l.call(s, "canvas.mjr-viewer-media");
        return r instanceof HTMLCanvasElement ? r : null;
      }
      if ((n == null ? void 0 : n.mode) === L.AB_COMPARE) {
        const r = String((n == null ? void 0 : n.abCompareMode) || "wipe");
        if (r === "wipe" || r === "wipeV") {
          const c = (h = e == null ? void 0 : e.querySelector) == null ? void 0 : h.call(
            e,
            'canvas.mjr-viewer-media[data-mjr-compare-role="A"]'
          ), m = (d = e == null ? void 0 : e.querySelector) == null ? void 0 : d.call(
            e,
            'canvas.mjr-viewer-media[data-mjr-compare-role="B"]'
          );
          if (c instanceof HTMLCanvasElement && m instanceof HTMLCanvasElement)
            return { a: c, b: m, mode: r };
        }
        const g = (f = e == null ? void 0 : e.querySelector) == null ? void 0 : f.call(
          e,
          'canvas.mjr-viewer-media[data-mjr-compare-role="D"]'
        );
        if (g instanceof HTMLCanvasElement) return g;
        const t = (y = e == null ? void 0 : e.querySelector) == null ? void 0 : y.call(e, "canvas.mjr-viewer-media");
        return t instanceof HTMLCanvasElement ? t : null;
      }
      if ((n == null ? void 0 : n.mode) === L.SIDE_BY_SIDE) {
        const r = (o = C == null ? void 0 : C.querySelector) == null ? void 0 : o.call(C, "canvas.mjr-viewer-media");
        return r instanceof HTMLCanvasElement ? r : null;
      }
      return null;
    } catch {
      return null;
    }
  }
  const x = (l, h = "image/png", d = 0.92) => new Promise((f) => {
    var y, o;
    try {
      if (l != null && l.toBlob) {
        l.toBlob((r) => f(r), h, d);
        return;
      }
    } catch (r) {
      (y = console.debug) == null || y.call(console, r);
    }
    try {
      const r = (o = l == null ? void 0 : l.toDataURL) == null ? void 0 : o.call(l, h, d);
      if (!r || typeof r != "string") return f(null);
      const t = r.split(",")[1] || "", c = atob(t), m = new Uint8Array(c.length);
      for (let u = 0; u < c.length; u++) m[u] = c.charCodeAt(u);
      f(new Blob([m], { type: h }));
    } catch {
      f(null);
    }
  });
  async function S({ toClipboard: l = !1 } = {}) {
    var h, d, f, y;
    try {
      const o = j();
      if (!o) return !1;
      await new Promise((t) => requestAnimationFrame(t));
      let r = null;
      if (o instanceof HTMLCanvasElement)
        r = o;
      else if (o != null && o.a && (o != null && o.b)) {
        const t = o.a, c = o.b, m = Math.max(1, Math.min(Number(t.width) || 0, Number(c.width) || 0)), u = Math.max(1, Math.min(Number(t.height) || 0, Number(c.height) || 0));
        if (!(m > 1 && u > 1)) return !1;
        const p = document.createElement("canvas");
        p.width = m, p.height = u;
        const a = p.getContext("2d");
        if (!a) return !1;
        try {
          a.drawImage(c, 0, 0, m, u);
        } catch (M) {
          (h = console.debug) == null || h.call(console, M);
        }
        const i = Math.max(0, Math.min(100, Number(n == null ? void 0 : n._abWipePercent) || 50)) / 100;
        try {
          a.save(), a.beginPath(), o.mode === "wipeV" ? a.rect(0, 0, m, u * i) : a.rect(0, 0, m * i, u), a.clip(), a.drawImage(t, 0, 0, m, u), a.restore();
        } catch (M) {
          (d = console.debug) == null || d.call(console, M);
        }
        r = p;
      }
      if (!r) return !1;
      const g = await x(r, "image/png");
      if (!g) return !1;
      if (l)
        try {
          const t = globalThis == null ? void 0 : globalThis.ClipboardItem, c = navigator == null ? void 0 : navigator.clipboard;
          return !t || !(c != null && c.write) ? !1 : (await c.write([new t({ "image/png": g })]), !0);
        } catch {
          return !1;
        }
      try {
        const t = ((f = n == null ? void 0 : n.assets) == null ? void 0 : f[n == null ? void 0 : n.currentIndex]) || null, m = `${String((t == null ? void 0 : t.filename) || "frame").replace(/[\\/:*?"<>|]+/g, "_").replace(/\.[^.]+$/, "") || "frame"}_export.png`, u = URL.createObjectURL(g), p = document.createElement("a");
        p.href = u, p.download = m, p.rel = "noopener", p.click();
        try {
          setTimeout(() => URL.revokeObjectURL(u), 2e3);
        } catch (a) {
          (y = console.debug) == null || y.call(console, a);
        }
        return !0;
      } catch {
        return !1;
      }
    } catch {
      return !1;
    }
  }
  return { exportCurrentFrame: S };
}
export {
  T as createFrameExporter
};
