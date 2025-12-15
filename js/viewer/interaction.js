export function setupViewerInteractions({
  el,
  kind,
  mediaWrap,
  zoomHud,
  mjrViewerState,
  applyCheckerboardBg,
  mjrSettings,
}) {
  const allowZoom = kind === "image";
  let scale = 1;
  const originX = 50;
  const originY = 50;
  let offsetX = 0;
  let offsetY = 0;
  let resetZoomPan = () => {};

  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
  const calcFitScale = () => {
    const wrapRect = mediaWrap.getBoundingClientRect();
    const wrapW = wrapRect.width || mediaWrap.clientWidth || 1;
    const wrapH = wrapRect.height || mediaWrap.clientHeight || 1;
    const mediaW = el.videoWidth || el.naturalWidth || el.clientWidth || wrapW;
    const mediaH = el.videoHeight || el.naturalHeight || el.clientHeight || wrapH;
    if (!mediaW || !mediaH) return 1;
    const ratio = Math.min(wrapW / mediaW, wrapH / mediaH);
    return Math.max(0.01, Math.min(10, ratio || 1));
  };

  if (allowZoom) el.style.transformOrigin = `${originX}% ${originY}%`;
  else {
    zoomHud.style.display = "none";
    el.style.transform = "none";
    el.style.cursor = "default";
  }

  const applyTransform = () => {
    if (!allowZoom) return;
    if (scale <= 1) {
      offsetX = 0;
      offsetY = 0;
    }
    el.style.transform = `translate(${offsetX}px, ${offsetY}px) scale(${scale})`;
    el.style.cursor = scale > 1 ? "grab" : "default";
    zoomHud.textContent = `${Math.round(scale * 100)}%`;
  };

  if (allowZoom) {
    resetZoomPan = () => {
      scale = calcFitScale();
      offsetX = 0;
      offsetY = 0;
      applyTransform();
    };
    mjrViewerState.resetView = resetZoomPan;
    const fitOnReady = () => resetZoomPan();
    el.addEventListener?.("load", fitOnReady);
    el.addEventListener?.("loadedmetadata", fitOnReady);

    mediaWrap.addEventListener(
      "wheel",
      (ev) => {
        ev.preventDefault();
        const delta = ev.deltaY;
        const factor = delta > 0 ? 0.9 : 1.1;
        const rect = mediaWrap.getBoundingClientRect();
        const px = ev.clientX - rect.left;
        const py = ev.clientY - rect.top;
        const prevScale = scale;
        const newScale = clamp(scale * factor, 0.25, 10);

        const dx = (px - rect.width / 2 - offsetX) / prevScale;
        const dy = (py - rect.height / 2 - offsetY) / prevScale;
        offsetX = px - rect.width / 2 - newScale * dx;
        offsetY = py - rect.height / 2 - newScale * dy;

        scale = newScale;
        applyTransform();
      },
      { passive: false }
    );

    let dragging = false;
    let dragStartX = 0;
    let dragStartY = 0;
    let dragOrigX = 0;
    let dragOrigY = 0;

    const onPointerMove = (ev) => {
      if (!dragging) return;
      const dx = ev.clientX - dragStartX;
      const dy = ev.clientY - dragStartY;
      offsetX = dragOrigX + dx;
      offsetY = dragOrigY + dy;
      applyTransform();
    };
    const stopDrag = () => {
      if (!dragging) return;
      dragging = false;
      el.style.cursor = scale > 1 ? "grab" : "default";
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", stopDrag);
      window.removeEventListener("pointercancel", stopDrag);
    };

    mediaWrap.addEventListener("pointerdown", (ev) => {
      if (ev.button !== 0) return;
      if (scale <= 1) return;
      ev.preventDefault();
      try {
        mediaWrap.setPointerCapture(ev.pointerId);
      } catch (_) {}
      dragging = true;
      dragStartX = ev.clientX;
      dragStartY = ev.clientY;
      dragOrigX = offsetX;
      dragOrigY = offsetY;
      el.style.cursor = "grabbing";
      window.addEventListener("pointermove", onPointerMove);
      window.addEventListener("pointerup", stopDrag);
      window.addEventListener("pointercancel", stopDrag);
    });

    mediaWrap.addEventListener("dblclick", resetZoomPan);
  }

  // Hint overlay for controls
  const hint = document.createElement("div");
  Object.assign(hint.style, {
    position: "absolute",
    top: "12px",
    left: "50%",
    transform: "translateX(-50%)",
    padding: "6px 10px",
    borderRadius: "8px",
    background: "rgba(0,0,0,0.55)",
    color: "#f0f0f0",
    fontSize: "12px",
    fontWeight: "600",
    letterSpacing: "0.3px",
    pointerEvents: "none",
    zIndex: "10",
    border: "1px solid rgba(255,255,255,0.08)",
    boxShadow: "0 2px 8px rgba(0,0,0,0.35)",
    textAlign: "center",
    whiteSpace: "nowrap",
  });
  hint.textContent = "Scroll: Zoom  •  Drag: Pan  •  F: Fit/Reset";
  mediaWrap.appendChild(hint);
  hint.style.transition = "opacity 0.3s ease";
  let hideTimer = setTimeout(() => {
    hint.style.opacity = "0";
  }, 5000);
  const topBandPx = 80;
  const scheduleHide = (delay = 1500) => {
    if (hideTimer) clearTimeout(hideTimer);
    hideTimer = setTimeout(() => {
      hint.style.opacity = "0";
    }, delay);
  };
  const onMove = (ev) => {
    const rect = mediaWrap.getBoundingClientRect();
    const nearTop = ev.clientY >= rect.top && ev.clientY <= rect.top + topBandPx;
    if (nearTop) {
      if (hideTimer) {
        clearTimeout(hideTimer);
        hideTimer = null;
      }
      hint.style.opacity = "1";
    } else if (!hideTimer) {
      scheduleHide(700);
    }
  };

  mediaWrap.addEventListener("mousemove", onMove);
  mediaWrap.addEventListener("mouseenter", onMove);
  mediaWrap.addEventListener("mouseleave", () => scheduleHide(700));
  requestAnimationFrame(() => resetZoomPan());

  const cleanup = () => {
    try { mediaWrap.removeEventListener("mousemove", onMove); } catch (_) {}
    try { mediaWrap.removeEventListener("mouseenter", onMove); } catch (_) {}
    try { mediaWrap.removeEventListener("mouseleave", () => scheduleHide(700)); } catch (_) {}
  };

  return { resetZoomPan, cleanup };
}
