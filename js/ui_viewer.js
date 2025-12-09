import {
  applyStyles,
  BADGE_STYLES,
  buildViewUrl,
  CARD_STYLES,
  createEl,
  getBaseName,
  mjrAttachHoverFeedback,
  mjrCardBasePx,
  mjrSettings,
  mjrShowToast,
  mjrGlobalState,
} from "./ui_settings.js";

export const mjrViewerState = { overlay: null, frame: null };
export const mjrViewerNav = { prev: null, next: null };
let mjrViewerEscBound = false;
export let mjrViewerIsAB = false;
let mjrViewerRatingEl = null;
let mjrCurrentList = [];
let mjrCurrentIndex = 0;

export function mjrUpdateNavVisibility() {
  const display = mjrViewerIsAB || !mjrSettings.viewer.navEnabled ? "none" : "inline-flex";
  if (mjrViewerNav.prev) mjrViewerNav.prev.style.display = display;
  if (mjrViewerNav.next) mjrViewerNav.next.style.display = display;
}

export function mjrStepVideos(delta = 1 / 30) {
  if (!mjrViewerState.overlay || mjrViewerState.overlay.style.display === "none") return false;
  const vids = mjrViewerState.overlay.querySelectorAll("video");
  if (!vids.length) return false;
  const step = delta;
  vids.forEach((v) => {
    try {
      v.pause();
      const dur = isFinite(v.duration) ? v.duration : Infinity;
      const next = Math.max(0, Math.min(dur, (v.currentTime || 0) + step));
      v.currentTime = next;
    } catch (_) {}
  });
  return true;
}

export function mjrEnsureViewerOverlay() {
  if (mjrViewerState.overlay) return mjrViewerState.overlay;

  const overlay = document.createElement("div");
  overlay.className = "mjr-fm-viewer-overlay";
  Object.assign(overlay.style, {
    position: "fixed",
    inset: "0",
    background: "rgba(0,0,0,0.9)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: "9999",
    padding: "12px",
  });

  const frame = document.createElement("div");
  frame.className = "mjr-fm-viewer-frame";
  Object.assign(frame.style, {
    position: "relative",
    display: "flex",
    gap: "16px",
    width: "100%",
    height: "100%",
    maxWidth: "100%",
    maxHeight: "100%",
    aspectRatio: "1 / 1",
    alignItems: "center",
    justifyContent: "center",
    margin: "auto",
  });

  const closeBtn = document.createElement("button");
  closeBtn.textContent = "X";
  Object.assign(closeBtn.style, {
    position: "absolute",
    top: "12px",
    right: "12px",
    fontSize: "18px",
    border: "1px solid #555",
    background: "#000000cc",
    color: "#fff",
    cursor: "pointer",
    width: "36px",
    height: "36px",
    borderRadius: "50%",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    lineHeight: "1",
    zIndex: "2",
  });
  closeBtn.addEventListener("click", () => mjrCloseViewer());

  const container = document.createElement("div");
  Object.assign(container.style, {
    position: "relative",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    width: "min(90vw, 90vh)",
    height: "min(90vw, 90vh)",
    maxWidth: "92vw",
    maxHeight: "92vh",
    aspectRatio: "1 / 1",
    margin: "0 auto",
    overflow: "hidden",
    boxSizing: "border-box",
  });
  container.appendChild(frame);
  container.appendChild(closeBtn);

  overlay.appendChild(container);

  overlay.addEventListener("click", (ev) => {
    if (ev.target === overlay) {
      mjrCloseViewer();
    }
  });

  mjrViewerState.overlay = overlay;
  mjrViewerState.frame = frame;
  document.body.appendChild(overlay);
  // Navigation buttons (overlay-level)
  if (!mjrViewerNav.prev) {
    const prevBtn = document.createElement("button");
    prevBtn.textContent = "◀";
    Object.assign(prevBtn.style, {
      position: "absolute",
      left: "12px",
      top: "50%",
      transform: "translateY(-50%)",
      background: "#000000aa",
      border: "1px solid #555",
      color: "#fff",
      borderRadius: "50%",
      width: "36px",
      height: "36px",
      cursor: "pointer",
      zIndex: "10000",
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
    });
    prevBtn.addEventListener("click", () => mjrViewerPrev());
    overlay.appendChild(prevBtn);
    mjrViewerNav.prev = prevBtn;
  }
  if (!mjrViewerNav.next) {
    const nextBtn = document.createElement("button");
    nextBtn.textContent = "▶";
    Object.assign(nextBtn.style, {
      position: "absolute",
      right: "12px",
      top: "50%",
      transform: "translateY(-50%)",
      background: "#000000aa",
      border: "1px solid #555",
      color: "#fff",
      borderRadius: "50%",
      width: "36px",
      height: "36px",
      cursor: "pointer",
      zIndex: "10000",
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
    });
    nextBtn.addEventListener("click", () => mjrViewerNext());
    overlay.appendChild(nextBtn);
    mjrViewerNav.next = nextBtn;
  }

  if (!mjrViewerEscBound) {
    window.addEventListener("keydown", (ev) => {
      const isViewerOpen =
        mjrViewerState.overlay && mjrViewerState.overlay.style.display !== "none";
      const navEnabled =
        isViewerOpen && !mjrViewerIsAB && mjrSettings.viewer.navEnabled;
      const inInput =
        ev.target &&
        (ev.target.tagName === "INPUT" ||
          ev.target.tagName === "TEXTAREA" ||
          ev.target.isContentEditable);
      const navKeys = ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", " ", "Spacebar"];
      if (isViewerOpen && !inInput && navKeys.includes(ev.key)) {
        ev.preventDefault();
        ev.stopPropagation();
      }
      let handled = false;
      if ((ev.key === "Escape" || ev.key === " ") && isViewerOpen) {
        mjrCloseViewer();
        handled = true;
      } else if (ev.key === "ArrowLeft" && navEnabled) {
        mjrViewerPrev();
        handled = true;
      } else if (ev.key === "ArrowRight" && navEnabled) {
        mjrViewerNext();
        handled = true;
      } else if (ev.key === "ArrowUp" && isViewerOpen && mjrSettings.hotkeys.frameStep) {
        if (mjrStepVideos(1 / 30)) handled = true;
      } else if (ev.key === "ArrowDown" && isViewerOpen && mjrSettings.hotkeys.frameStep) {
        if (mjrStepVideos(-1 / 30)) handled = true;
      } else if (navEnabled && !inInput && mjrSettings.viewer.ratingHotkeys) {
        let num = null;
        if (/^[0-5]$/.test(ev.key)) {
          num = Number(ev.key);
        } else if (ev.code && ev.code.startsWith("Numpad")) {
          const k = ev.key && /^[0-9]$/.test(ev.key) ? Number(ev.key) : null;
          if (k !== null && k <= 5) num = k;
        }
        if (num !== null) {
          mjrSetViewerRating(num);
          handled = true;
        }
      }
      if (handled) {
        ev.preventDefault();
        ev.stopPropagation();
      }
    }, { capture: true });
    mjrViewerEscBound = true;
  }
  mjrUpdateNavVisibility();
  return overlay;
}

export function mjrCloseViewer() {
  if (!mjrViewerState.overlay) return;
  mjrViewerState.overlay.style.display = "none";
  if (mjrViewerState.frame) {
    mjrViewerState.frame.innerHTML = "";
  }
  mjrViewerIsAB = false;
  mjrViewerRatingEl = null;
  mjrUpdateNavVisibility();
}

export function mjrCreateMediaElement(file) {
  const rawName = file.name || file.filename || "";
  const ext = (file.ext || getExt(rawName) || "").toLowerCase();
  const src = file.url || buildViewUrl(file);

  let el;
  let kind = "other";

  const cleanExt = ext.startsWith(".") ? ext.slice(1) : ext;
  const imgExts = ["png", "jpg", "jpeg", "webp", "gif"];
  const vidExts = ["mp4", "webm", "mov", "mkv"];
  const audExts = ["wav", "mp3", "flac", "ogg", "m4a", "aac"];

  if (imgExts.includes(cleanExt)) {
    el = document.createElement("img");
    el.src = src;
    Object.assign(el.style, {
      maxWidth: "100%",
      maxHeight: "100%",
      objectFit: "contain",
    });
    kind = "image";
  } else if (vidExts.includes(cleanExt)) {
    el = document.createElement("video");
    el.src = src;
    el.autoplay = !!mjrSettings.viewer.autoplayVideos;
    el.loop = !!mjrSettings.viewer.loopVideos;
    el.muted = !!mjrSettings.viewer.muteVideos;
    el.controls = true;
    Object.assign(el.style, {
      maxWidth: "100%",
      maxHeight: "100%",
      objectFit: "contain",
    });
    kind = "video";
  } else if (audExts.includes(cleanExt)) {
    el = document.createElement("audio");
    el.src = src;
    el.controls = true;
    el.style.width = "100%";
    kind = "audio";
  } else {
    el = document.createElement("div");
    el.textContent = "No inline preview for this file type.";
    el.style.color = "#888";
  }

  return { el, kind };
}

export function mjrGetRating(file) {
  return (
    Number(
      file.rating ??
        (file.meta && file.meta.rating) ??
        (file.metadata && file.metadata.rating)
    ) || 0
  );
}

export function mjrCreateViewerPane(file) {
  const pane = document.createElement("div");
  Object.assign(pane.style, {
    flex: "1 1 0",
    display: "flex",
    flexDirection: "column",
    background: "#111",
    borderRadius: "10px",
    overflow: "hidden",
    border: "1px solid #444",
    minWidth: "0",
  });

  const mediaWrap = document.createElement("div");
  Object.assign(mediaWrap.style, {
    flex: "1 1 auto",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#000",
    minHeight: "0",
    height: "100%",
    width: "100%",
    position: "relative",
    overflow: "hidden",
    userSelect: "none",
    touchAction: "none",
  });

  const zoomHud = document.createElement("div");
  Object.assign(zoomHud.style, {
    position: "absolute",
    right: "10px",
    bottom: "10px",
    padding: "4px 8px",
    borderRadius: "6px",
    background: "rgba(0,0,0,0.65)",
    color: "#f0f0f0",
    fontSize: "12px",
    fontWeight: "600",
    letterSpacing: "0.5px",
    pointerEvents: "none",
    zIndex: "10",
    border: "1px solid rgba(255,255,255,0.1)",
    boxShadow: "0 2px 8px rgba(0,0,0,0.4)",
  });
  zoomHud.textContent = "100%";
  mediaWrap.appendChild(zoomHud);
  // Toggleable checkerboard for transparency
  const checkerEnabled = !!mjrSettings.viewer.useCheckerboard;
  if (checkerEnabled) {
    mediaWrap.style.background =
      "repeating-conic-gradient(#eee 0 25%, #ccc 0 50%) 50%/20px 20px";
  }

  const infoBar = document.createElement("div");
  Object.assign(infoBar.style, {
    padding: "6px 10px",
    fontSize: "12px",
    color: "#ccc",
    borderTop: "1px solid #333",
    whiteSpace: "nowrap",
    textOverflow: "ellipsis",
    overflow: "hidden",
  });
  infoBar.textContent = file.name || file.filename || "(unnamed)";

  const { el } = mjrCreateMediaElement(file);

  // Zoom / dezoom with wheel
  let scale = 1;
  const originX = 50;
  const originY = 50;
  let offsetX = 0;
  let offsetY = 0;
  el.style.transformOrigin = `${originX}% ${originY}%`;

  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
  const applyTransform = () => {
    // Recentre offsets when zoom is reset
    if (scale <= 1) {
      offsetX = 0;
      offsetY = 0;
    }
    el.style.transform = `translate(${offsetX}px, ${offsetY}px) scale(${scale})`;
    el.style.cursor = scale > 1 ? "grab" : "default";
    zoomHud.textContent = `${Math.round(scale * 100)}%`;
  };

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
      const newScale = clamp(scale * factor, 0.25, 5);

      // Keep the point under cursor stable while zooming
      const dx = (px - rect.width / 2 - offsetX) / prevScale;
      const dy = (py - rect.height / 2 - offsetY) / prevScale;
      offsetX = px - rect.width / 2 - newScale * dx;
      offsetY = py - rect.height / 2 - newScale * dy;

      scale = newScale;
      applyTransform();
    },
    { passive: false }
  );

  // Pan while zoomed
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

  // Reset zoom on double click
  mediaWrap.addEventListener("dblclick", () => {
    scale = 1;
    offsetX = 0;
    offsetY = 0;
    applyTransform();
  });

  mediaWrap.appendChild(el);
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
  hint.textContent = "Scroll: Zoom  •  Drag: Pan  •  Double-click: Reset";
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
  pane.appendChild(mediaWrap);
  pane.appendChild(infoBar);
  return pane;
}

export function mjrOpenABViewer(fileA, fileB) {
  mjrEnsureViewerOverlay();
  mjrViewerState.overlay.style.display = "flex";
  mjrViewerIsAB = true;
  mjrViewerRatingEl = null;
  mjrUpdateNavVisibility();
  const frame = mjrViewerState.frame;
  frame.innerHTML = "";

  // Layout unique pour A/B : on force un seul panneau
  Object.assign(frame.style, {
    display: "flex",
    maxWidth: "95vw",
    maxHeight: "95vh",
  });

  const container = document.createElement("div");
  Object.assign(container.style, {
    position: "relative",
    width: "min(90vw, 1600px)",
    height: "min(80vh, 900px)",
    background: "#000",
    borderRadius: "10px",
    overflow: "hidden",
    border: "1px solid #444",
    userSelect: "none",
    touchAction: "none",
    cursor: "col-resize",
  });

  const baseWrap = document.createElement("div");
  Object.assign(baseWrap.style, {
    position: "absolute",
    inset: "0",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    width: "100%",
    height: "100%",
    touchAction: "none",
    userSelect: "none",
  });

  const topWrap = document.createElement("div");
  Object.assign(topWrap.style, {
    position: "absolute",
    inset: "0",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    width: "100%",
    height: "100%",
    touchAction: "none",
    userSelect: "none",
  });

  const { el: baseMedia, kind: kindA } = mjrCreateMediaElement(fileA);
  const { el: topMedia, kind: kindB } = mjrCreateMediaElement(fileB);

  Object.assign(baseMedia.style, {
    maxWidth: "100%",
    maxHeight: "100%",
    objectFit: "contain",
  });
  Object.assign(topMedia.style, {
    maxWidth: "100%",
    maxHeight: "100%",
    objectFit: "contain",
  });

  // Reuse zoom/pan controls for both panes
  function enableZoomPan(mediaEl, wrap, shared) {
    const state = shared || {
      scale: 1,
      offsetX: 0,
      offsetY: 0,
      entries: [],
    };
    const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
    const applyAll = () => {
      if (state.scale <= 1) {
        state.offsetX = 0;
        state.offsetY = 0;
      }
      for (const entry of state.entries) {
        entry.media.style.transform = `translate(${state.offsetX}px, ${state.offsetY}px) scale(${state.scale})`;
        entry.media.style.transformOrigin = "50% 50%";
        entry.media.style.cursor = state.scale > 1 ? "grab" : "default";
        if (entry.hud) {
          entry.hud.textContent = `${Math.round(state.scale * 100)}%`;
        }
      }
    };

    const zoomHud = document.createElement("div");
    Object.assign(zoomHud.style, {
      position: "absolute",
      right: "10px",
      bottom: "10px",
      padding: "4px 8px",
      borderRadius: "6px",
      background: "rgba(0,0,0,0.65)",
      color: "#f0f0f0",
      fontSize: "12px",
      fontWeight: "600",
      letterSpacing: "0.5px",
      pointerEvents: "none",
      zIndex: "5",
      border: "1px solid rgba(255,255,255,0.1)",
      boxShadow: "0 2px 8px rgba(0,0,0,0.4)",
    });
    zoomHud.textContent = "100%";
    wrap.appendChild(zoomHud);

    state.entries.push({ media: mediaEl, hud: zoomHud });

    wrap.addEventListener(
      "wheel",
      (ev) => {
        ev.preventDefault();
        const delta = ev.deltaY;
        const factor = delta > 0 ? 0.9 : 1.1;
        const rect = wrap.getBoundingClientRect();
        const px = ev.clientX - rect.left;
        const py = ev.clientY - rect.top;
        const prevScale = state.scale;
        const newScale = clamp(state.scale * factor, 0.25, 5);
        const dx = (px - rect.width / 2 - state.offsetX) / prevScale;
        const dy = (py - rect.height / 2 - state.offsetY) / prevScale;
        state.offsetX = px - rect.width / 2 - newScale * dx;
        state.offsetY = py - rect.height / 2 - newScale * dy;
        state.scale = newScale;
        applyAll();
      },
      { passive: false }
    );

    let dragging = false;
    let dragStartX = 0;
    let dragStartY = 0;
    let dragOrigX = 0;
    let dragOrigY = 0;
    const onMove = (ev) => {
      if (!dragging) return;
      state.offsetX = dragOrigX + (ev.clientX - dragStartX);
      state.offsetY = dragOrigY + (ev.clientY - dragStartY);
      applyAll();
    };
    const stopDrag = () => {
      if (!dragging) return;
      dragging = false;
      mediaEl.style.cursor = state.scale > 1 ? "grab" : "default";
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", stopDrag);
      window.removeEventListener("pointercancel", stopDrag);
    };

    wrap.addEventListener("pointerdown", (ev) => {
      if (ev.button !== 0) return;
      if (state.scale <= 1) return;
      ev.preventDefault();
      try {
        wrap.setPointerCapture(ev.pointerId);
      } catch (_) {}
      dragging = true;
      dragStartX = ev.clientX;
      dragStartY = ev.clientY;
      dragOrigX = state.offsetX;
      dragOrigY = state.offsetY;
      mediaEl.style.cursor = "grabbing";
      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", stopDrag);
      window.addEventListener("pointercancel", stopDrag);
    });

    wrap.addEventListener("dblclick", () => {
      state.scale = 1;
      state.offsetX = 0;
      state.offsetY = 0;
      applyAll();
    });

    applyAll();
    return state;
  }

  baseWrap.appendChild(baseMedia);
  topWrap.appendChild(topMedia);

  // Enable zoom/pan on both
  const sharedZoom = { scale: 1, offsetX: 0, offsetY: 0, entries: [] };
  enableZoomPan(baseMedia, baseWrap, sharedZoom);
  enableZoomPan(topMedia, topWrap, sharedZoom);

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
  hint.textContent = "Scroll: Zoom  •  Left-drag: Pan  •  Right-drag: Split";
  container.appendChild(hint);
  hint.style.transition = "opacity 0.3s ease";
  let hintTimer = setTimeout(() => {
    hint.style.opacity = "0";
  }, 5000);
  const topBandPx = 80;
  const scheduleHintHide = (delay = 1500) => {
    if (hintTimer) clearTimeout(hintTimer);
    hintTimer = setTimeout(() => {
      hint.style.opacity = "0";
    }, delay);
  };
  const onHoverMove = (ev) => {
    const rect = container.getBoundingClientRect();
    const nearTop = ev.clientY >= rect.top && ev.clientY <= rect.top + topBandPx;
    if (nearTop) {
      if (hintTimer) {
        clearTimeout(hintTimer);
        hintTimer = null;
      }
      hint.style.opacity = "1";
    } else if (!hintTimer) {
      scheduleHintHide(700);
    }
  };
  container.addEventListener("mousemove", onHoverMove);
  container.addEventListener("mouseenter", onHoverMove);
  container.addEventListener("mouseleave", () => scheduleHintHide(700));

  const handle = document.createElement("div");
  Object.assign(handle.style, {
    position: "absolute",
    top: "0",
    bottom: "0",
    left: "50%",
    width: "2px",
    background: "#ffffffaa",
    pointerEvents: "none",
    zIndex: "5",
  });
  handle.textContent = "↔";
  handle.style.color = "#fff";
  handle.style.fontSize = "14px";
  handle.style.display = "flex";
  handle.style.alignItems = "center";
  handle.style.justifyContent = "center";
  handle.style.transform = "translateX(-50%)";

  // Labels A / B
  const labelA = document.createElement("div");
  labelA.textContent = fileA.name || fileA.filename || "A";
  Object.assign(labelA.style, {
    position: "absolute",
    left: "10px",
    bottom: "10px",
    padding: "2px 6px",
    fontSize: "11px",
    borderRadius: "4px",
    background: "#000000aa",
    color: "#fff",
    maxWidth: "45%",
    whiteSpace: "nowrap",
    textOverflow: "ellipsis",
    overflow: "hidden",
  });

  const labelB = document.createElement("div");
  labelB.textContent = fileB.name || fileB.filename || "B";
  Object.assign(labelB.style, {
    position: "absolute",
    right: "10px",
    bottom: "10px",
    padding: "2px 6px",
    fontSize: "11px",
    borderRadius: "4px",
    background: "#000000aa",
    color: "#fff",
    maxWidth: "45%",
    whiteSpace: "nowrap",
    textOverflow: "ellipsis",
    overflow: "hidden",
    textAlign: "right",
  });

  const updateSplit = (val) => {
    const pct = Math.max(0, Math.min(100, Number(val) || 0));
    topWrap.style.clipPath = `inset(0 ${100 - pct}% 0 0)`;
    handle.style.left = pct + "%";
  };

  // Drag direct sur la ligne
  container.addEventListener("pointerdown", (ev) => {
    // Left click should not control the split (reserved for pan in zoom mode)
    const isRightClick = ev.button === 2 || ev.buttons === 2;
    if (!isRightClick) return;
    ev.preventDefault();
    const rect = container.getBoundingClientRect();
    const x = ev.clientX - rect.left;
    const pct = (x / rect.width) * 100;
    updateSplit(pct);
    try {
      container.setPointerCapture(ev.pointerId);
    } catch (_) {}

    const move = (e) => {
      const rx = e.clientX - rect.left;
      const p = (rx / rect.width) * 100;
      updateSplit(p);
    };
    const up = () => {
      container.releasePointerCapture?.(ev.pointerId);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
    };
    window.addEventListener("pointermove", move, { passive: false });
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
  });

  // position initiale
  updateSplit(50);

  container.appendChild(baseWrap);
  container.appendChild(topWrap);
  container.appendChild(handle);
  container.appendChild(labelA);
  container.appendChild(labelB);

  // Warn if not image/video
  if (!["image", "video"].includes(kindA) || !["image", "video"].includes(kindB)) {
    const warn = document.createElement("div");
    warn.textContent = "A/B is optimized for images / videos. Other types may not display as expected.";
    Object.assign(warn.style, {
      position: "absolute",
      top: "10px",
      left: "50%",
      transform: "translateX(-50%)",
      padding: "4px 8px",
      fontSize: "11px",
      borderRadius: "4px",
      background: "#000000aa",
      color: "#ffdf7a",
    });
    container.appendChild(warn);
  }

  frame.appendChild(container);
}

export function mjrOpenViewerForFiles(files, listContext = null) {
  if (!files || !files.length) return;

  const baseList = listContext && listContext.length ? listContext : files;
  mjrCurrentList = baseList.slice();

  const target = files[0];
  const idx = mjrCurrentList.indexOf(target);
  mjrCurrentIndex = idx >= 0 ? idx : 0;

  const clamped = files.length >= 2 ? [files[0], files[1]] : [files[0]];

  if (clamped.length === 2) {
    mjrOpenABViewer(clamped[0], clamped[1]);
    return;
  }

  mjrRenderSingleCurrent();
}

export function mjrRenderSingleCurrent() {
  if (!mjrCurrentList.length) return;
  const file = mjrCurrentList[mjrCurrentIndex];
  if (!file) return;
  mjrViewerIsAB = false;
  mjrUpdateNavVisibility();

  mjrEnsureViewerOverlay();
  mjrViewerState.overlay.style.display = "flex";
  if (mjrViewerState.frame) {
    Object.assign(mjrViewerState.frame.style, {
      width: "100%",
      height: "100%",
      alignItems: "stretch",
      justifyContent: "center",
    });
  }
  mjrViewerState.frame.innerHTML = "";

  const pane = mjrCreateViewerPane(file);
  mjrViewerState.frame.appendChild(pane);
  if (mjrViewerState.frame.firstChild) {
    Object.assign(mjrViewerState.frame.firstChild.style, {
      flex: "1 1 auto",
      width: "100%",
      height: "100%",
    });
  }

  // Rating overlay in viewer
  if (mjrSettings.viewer.showRatingHUD) {
    const currentRating = Math.max(0, Math.min(5, mjrGetRating(file)));
    const mediaWrap = pane.firstChild;
    if (mediaWrap && mediaWrap.appendChild) {
      const badge = document.createElement("div");
      Object.assign(badge.style, {
        position: "absolute",
        top: "8px",
        left: "8px",
        padding: "6px 10px",
        borderRadius: "8px",
        background: "rgba(0,0,0,0.6)",
        color: "#ffd45a",
        fontWeight: "700",
        letterSpacing: "2px",
        fontSize: "20px",
        pointerEvents: "none",
      });
      badge.dataset.mjrViewerRating = "1";
      mediaWrap.appendChild(badge);
      mjrViewerRatingEl = badge;
      mjrUpdateViewerRatingDisplay(currentRating);
    }
  } else {
    mjrViewerRatingEl = null;
  }
}

export function mjrViewerPrev() {
  if (!mjrCurrentList.length || mjrViewerIsAB) return;
  mjrCurrentIndex = (mjrCurrentIndex - 1 + mjrCurrentList.length) % mjrCurrentList.length;
  mjrRenderSingleCurrent();
}

export function mjrViewerNext() {
  if (!mjrCurrentList.length || mjrViewerIsAB) return;
  mjrCurrentIndex = (mjrCurrentIndex + 1) % mjrCurrentList.length;
  mjrRenderSingleCurrent();
}

export function mjrUpdateViewerRatingDisplay(rating) {
  if (!mjrViewerRatingEl) return;
  const r = Math.max(0, Math.min(5, Number(rating) || 0));
  mjrViewerRatingEl.textContent = "";
  for (let i = 1; i <= 5; i++) {
    const span = document.createElement("span");
    const filled = i <= r;
    span.textContent = filled ? "★" : "☆";
    span.style.color = filled ? "#ffd45a" : "#777";
    span.style.marginRight = i < 5 ? "2px" : "0";
    mjrViewerRatingEl.appendChild(span);
  }
}

  async function mjrSetViewerRating(rating) {
    if (mjrViewerIsAB) return;
    if (!mjrCurrentList.length) return;
    const file = mjrCurrentList[mjrCurrentIndex];
    if (!file) return;
  const r = Math.max(0, Math.min(5, Number(rating) || 0));
  file.rating = r;
  mjrUpdateViewerRatingDisplay(r);

  // Persist using the first available instance from global state
  const firstInst = mjrGlobalState.instances.values().next().value;
  if (firstInst && typeof firstInst.updateFileMetadata === "function") {
    try {
      await firstInst.updateFileMetadata(file, "Rating updated");
    } catch (err) {
      console.warn("[Majoor.FileManager] viewer rating persist failed", err);
    }
  }
}

