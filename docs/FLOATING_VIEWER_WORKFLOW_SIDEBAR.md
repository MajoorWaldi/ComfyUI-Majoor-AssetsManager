# Floating Viewer — Workflow Sidebar & Run Implementation

> **Purpose**: The Floating Viewer (MFV) includes a lightweight sidebar panel that allows
> modifying widgets of selected nodes on the canvas, **plus a Run button**,
> without duplicating or competing with ComfyUI's native "Workflow Overview" panel.

---

## 1. Design Principles — "Delegate, Don't Duplicate"

| Rule | Detail |
|-------|--------|
| **Read-only data access** | Reads `app.graph`, `app.canvas.selected_nodes` — no parallel model invented. |
| **Write via native widget** | Writes via `widget.value = x ; widget.callback?.(x)` — ComfyUI engine handles propagation. |
| **Execution via endpoint** | Run calls `POST /prompt` with payload from `app.graphToPrompt()` — queue is not reimplemented. |
| **No own persistence** | No store, no cache — each opening reads live graph state. |

---

## 2. Module Architecture

```
js/features/viewer/
├── FloatingViewer.js              ← existing (modified _buildToolbar)
├── floatingViewerManager.js       ← existing (added selection bindings)
│
├── workflowSidebar/               ← NEW submodule
│   ├── WorkflowSidebar.js         ← Main component (DOM panel)
│   ├── NodeWidgetRenderer.js      ← Renders node widgets
│   ├── widgetAdapters.js          ← Type → HTML input adapters
│   └── sidebarRunButton.js        ← Run button (queue prompt)
```

### 2.1 Dependencies

```
FloatingViewer
  └─► WorkflowSidebar        (created in _buildToolbar, injected into MFV DOM)
        ├─► NodeWidgetRenderer  (instantiated 1× per displayed node)
        │     └─► widgetAdapters  (pure functions, no state)
        └─► sidebarRunButton    (autonomous button, calls ComfyUI API)
```

None of these files import from `comfyui-frontend` directly.
Everything goes through the existing bridge: `js/app/comfyApiBridge.js`.

---

## 3. Module by Module

---

### 3.1 `WorkflowSidebar.js` — Sidebar Panel

**Role**: Sliding container (slide-in) that opens on the right side of the Floating Viewer.

```
┌─────────────────────────────────────────────────────┐
│  Majoor Floating Viewer         [⚙] [▶ Run] [✕]   │  ← header + toolbar
├────────────────────┬────────────────────────────────┤
│                    │  Workflow Sidebar               │
│   Viewer Content   │  ┌────────────────────────────┐ │
│   (image/video)    │  │ KSampler              [📍] │ │
│                    │  │  seed   [156680208700286]   │ │
│                    │  │  steps  [20]                │ │
│                    │  │  cfg    [8.0]               │ │
│                    │  │  sampler [euler ▾]          │ │
│                    │  │  scheduler [normal ▾]       │ │
│                    │  │  denoise [1.00]             │ │
│                    │  ├────────────────────────────┤ │
│                    │  │ CLIP Text Encode       [📍] │ │
│                    │  │  text  [beautiful sce...]   │ │
│                    │  └────────────────────────────┘ │
└────────────────────┴────────────────────────────────┘
```

#### Public API

```js
class WorkflowSidebar {
  constructor({ hostEl, onClose })
  show()           // slide-in, reads current selection
  hide()           // slide-out
  toggle()
  refresh()        // re-reads app.canvas.selected_nodes and re-renders
  get isVisible()
  destroy()
}
```

#### How to read selected nodes

The pattern already exists in `NodeStreamController.js`:

```js
import { getComfyApp } from "../../../app/comfyApiBridge.js";

function getSelectedNodes() {
  const app = getComfyApp();
  const selected = app?.canvas?.selected_nodes
                ?? app?.canvas?.selectedNodes
                ?? null;
  if (!selected) return [];
  if (Array.isArray(selected)) return selected.filter(Boolean);
  if (selected instanceof Map) return Array.from(selected.values());
  if (typeof selected === "object") return Object.values(selected);
  return [];
}
```

#### How to listen to selection changes

The pattern exists in `LiveStreamTracker.js`:

```js
const canvas = app.canvas;
const origSelected = canvas.onNodeSelected;
const origSelChange = canvas.onSelectionChange;

canvas.onNodeSelected = function (node) {
  origSelected?.call(this, node);
  sidebar.refresh();  // ← our hook
};

canvas.onSelectionChange = function (selectedNodes) {
  origSelChange?.call(this, selectedNodes);
  sidebar.refresh();  // ← our hook
};
```

> **Important**: These hooks must be properly attached/detached when opening/closing
> the sidebar to avoid leaks. We use the same chained pattern as `LiveStreamTracker`.

---

### 3.2 `NodeWidgetRenderer.js` — Node Rendering

**Role**: For a given `LGraphNode`, iterates over `node.widgets` and generates
a corresponding HTML form.

#### Information available on a ComfyUI widget

```js
node.widgets.forEach(widget => {
  widget.name       // "seed", "steps", "cfg", "sampler_name" …
  widget.type       // "number", "combo", "text", "toggle", "IMAGEUPLOAD" …
  widget.value      // current value
  widget.options     // { min, max, step, values: [...] }  (for combo/number)
  widget.callback   // function(value) — to call after write
});
```

#### Generated DOM structure

```html
<section class="mjr-ws-node" data-node-id="3">
  <div class="mjr-ws-node-header">
    <span class="mjr-ws-node-title">KSampler</span>
    <button class="mjr-icon-btn mjr-ws-locate" title="Locate on canvas">
      <i class="pi pi-map-marker"></i>
    </button>
  </div>
  <div class="mjr-ws-node-body">
    <!-- widgets rendered by widgetAdapters -->
  </div>
</section>
```

#### Locating a node on the canvas

```js
function locateNode(node) {
  const app = getComfyApp();
  const canvas = app?.canvas;
  if (!canvas || !node) return;
  // Center view on node
  canvas.centerOnNode?.(node);
  // Fallback LiteGraph
  if (!canvas.centerOnNode && canvas.ds) {
    canvas.ds.offset[0] = -node.pos[0] - node.size[0] / 2 + canvas.canvas.width / 2;
    canvas.ds.offset[1] = -node.pos[1] - node.size[1] / 2 + canvas.canvas.height / 2;
    canvas.setDirty(true, true);
  }
}
```

---

### 3.3 `widgetAdapters.js` — Widget → HTML Input Conversion

File of pure functions, no state. Each adapter returns an `HTMLElement`.

| `widget.type` | HTML Input | Notes |
|---------------|-----------|-------|
| `"number"` | `<input type="number" min max step>` | Uses `widget.options.{min,max,step}` |
| `"combo"` | `<select>` with `<option>` | Uses `widget.options.values` |
| `"text"` | `<textarea>` | Auto-resize |
| `"toggle"` | `<input type="checkbox">` | |
| `"IMAGEUPLOAD"` | *(ignored)* | Too complex, not handled |
| other / unknown | `<input type="text" readonly>` | Display only |

#### Writing to a ComfyUI widget

```js
function writeWidgetValue(widget, newValue) {
  if (widget.type === "number") {
    const n = Number(newValue);
    if (Number.isNaN(n)) return false;
    const { min = -Infinity, max = Infinity } = widget.options ?? {};
    widget.value = Math.min(max, Math.max(min, n));
  } else {
    widget.value = newValue;
  }
  // Notify ComfyUI that widget changed
  widget.callback?.(widget.value);
  // Mark canvas dirty for visual refresh
  const app = getComfyApp();
  app?.canvas?.setDirty?.(true, true);
  return true;
}
```

> This pattern is identical to the one already used in `DragDrop.js` for dropping
> media on nodes — nothing is reinvented.

---

### 3.4 `sidebarRunButton.js` — Run Button

**Role**: Single button that triggers `POST /prompt` using ComfyUI API.

#### Option A — Via `app` object (recommended)

```js
import { getComfyApp } from "../../../app/comfyApiBridge.js";

async function queueCurrentPrompt() {
  const app = getComfyApp();
  if (!app) return { ok: false, error: "ComfyUI app not ready" };

  // graphToPrompt() serializes current workflow into executable payload
  const promptData = await app.graphToPrompt();
  if (!promptData?.output) return { ok: false, error: "Empty prompt" };

  // Trigger execution
  // Method 1: via app.queuePrompt (if available)
  if (typeof app.queuePrompt === "function") {
    const res = await app.queuePrompt(0); // 0 = insert at end of queue
    return { ok: true, data: res };
  }

  // Method 2: via api.queuePrompt
  const api = app.api;
  if (api && typeof api.queuePrompt === "function") {
    const res = await api.queuePrompt(0, promptData);
    return { ok: true, data: res };
  }

  // Method 3: direct HTTP fallback
  const resp = await fetch("/prompt", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      prompt: promptData.output,
      extra_data: { extra_pnginfo: { workflow: promptData.workflow } },
    }),
  });
  return { ok: resp.ok, data: await resp.json() };
}
```

#### Rendering

```html
<!-- In toolbar, next to ⚙ settings button -->
<button class="mjr-icon-btn mjr-mfv-run-btn" title="Queue Prompt (Run)">
  <i class="pi pi-play"></i>
</button>
```

Visual state:
- Idle → green `pi-play` icon
- Running → `pi-spin pi-spinner` icon + disabled
- Error → red flash 1s then back to idle

---

## 4. Integration in FloatingViewer

### 4.1 Modification of `_buildToolbar()`

Add **2 buttons** to existing toolbar:

```js
// After existing capture/download button:

// --- Separator ---
const sep2 = document.createElement("div");
sep2.className = "mjr-mfv-toolbar-sep";
bar.appendChild(sep2);

// --- Settings Button (opens/closes sidebar) ---
const settingsBtn = document.createElement("button");
settingsBtn.type = "button";
settingsBtn.className = "mjr-icon-btn mjr-mfv-settings-btn";
settingsBtn.title = "Node Parameters";
const settingsIcon = document.createElement("i");
settingsIcon.className = "pi pi-cog";          // ⚙ PrimeIcons icon
settingsBtn.appendChild(settingsIcon);
settingsBtn.addEventListener("click", () => this._sidebar?.toggle());
bar.appendChild(settingsBtn);

// --- Run Button ---
const runBtn = createRunButton();              // from sidebarRunButton.js
bar.appendChild(runBtn);
```

### 4.2 Modification of `render()`

```js
render() {
  const el = this._el;
  el.appendChild(this._buildHeader());
  el.appendChild(this._buildToolbar());
  el.appendChild(this._contentEl);

  // NEW: sidebar, mounted once, hidden by default
  this._sidebar = new WorkflowSidebar({
    hostEl: el,
    onClose: () => this._updateSettingsBtnState(false),
  });
  el.appendChild(this._sidebar.el);

  return el;
}
```

### 4.3 Selection Hook in `floatingViewerManager.js`

```js
// In open():
_bindNodeSelectionListener();

// In close():
_unbindNodeSelectionListener();
```

---

## 5. CSS — Added Classes

```css
/* ── Sidebar container ── */
.mjr-ws-sidebar {
  position: absolute;
  top: 0;
  right: 0;
  width: 280px;
  height: 100%;
  background: var(--comfy-menu-bg, #1a1a1a);
  border-left: 1px solid var(--border-color, #333);
  overflow-y: auto;
  transform: translateX(100%);
  transition: transform 0.2s ease;
  z-index: 1;
}
.mjr-ws-sidebar.open {
  transform: translateX(0);
}

/* ── Node sections ── */
.mjr-ws-node { padding: 8px 12px; border-bottom: 1px solid var(--border-color, #333); }
.mjr-ws-node-header { display: flex; align-items: center; justify-content: space-between; }
.mjr-ws-node-title { font-weight: 600; font-size: 13px; color: var(--input-text, #ddd); }
.mjr-ws-node-body { display: flex; flex-direction: column; gap: 6px; padding-top: 6px; }

/* ── Widget rows ── */
.mjr-ws-widget-row { display: flex; align-items: center; gap: 8px; }
.mjr-ws-widget-label { flex: 0 0 90px; font-size: 12px; color: var(--descrip-text, #999); }
.mjr-ws-widget-input { flex: 1; }
.mjr-ws-widget-input input,
.mjr-ws-widget-input select,
.mjr-ws-widget-input textarea {
  width: 100%;
  background: var(--comfy-input-bg, #222);
  color: var(--input-text, #ddd);
  border: 1px solid var(--border-color, #444);
  border-radius: 4px;
  padding: 4px 6px;
  font-size: 12px;
}

/* ── Run button ── */
.mjr-mfv-run-btn i { color: #4caf50; }
.mjr-mfv-run-btn.running i { color: var(--descrip-text, #999); }
.mjr-mfv-run-btn.error i { color: #f44336; }

/* ── Settings button active state ── */
.mjr-mfv-settings-btn.active i { color: var(--p-primary-color, #4fc3f7); }
```

---

## 6. Events and Data Flow

```
┌─────────────┐     click ⚙      ┌───────────────────┐
│  Toolbar     │ ───────────────► │  WorkflowSidebar  │
│  settingsBtn │                  │  .toggle()        │
└─────────────┘                  └────────┬──────────┘
                                          │ show()
                                          ▼
                              ┌──────────────────────┐
                              │ getSelectedNodes()   │
                              │ (comfyApiBridge)     │
                              └──────────┬───────────┘
                                         │
                              ┌──────────▼───────────┐
                              │ NodeWidgetRenderer   │
                              │ for each node        │
                              │   → widgetAdapters   │
                              └──────────┬───────────┘
                                         │ user edits input
                                         ▼
                              ┌──────────────────────┐
                              │ writeWidgetValue()   │
                              │ widget.value = x     │
                              │ widget.callback(x)   │
                              │ canvas.setDirty()    │
                              └──────────────────────┘

┌─────────────┐    click ▶      ┌───────────────────┐
│  Toolbar     │ ──────────────►│ queueCurrentPrompt│
│  runBtn      │                │ app.graphToPrompt()│
│              │                │ POST /prompt       │
└─────────────┘                └───────────────────┘
```

---

## 7. What We Do NOT Do

| Prohibited | Reason |
|----------|--------|
| Recreate a full node editor | We're not an IDE — just a quick adjustment panel |
| Handle node add/delete | ComfyUI canvas manages that |
| Duplicate Workflow Overview | Our sidebar is a **contextual shortcut** (selected nodes only) |
| Intercept execution queue | We POST and that's it — no own progress tracking |
| Store widget state | We read/write live graph — no local copy |
| Add ComfyUI frontend dependencies | Everything goes through `comfyApiBridge.js` |

---

## 8. Implementation Checklist

- [x] Create `js/features/viewer/workflowSidebar/widgetAdapters.js`
- [x] Create `js/features/viewer/workflowSidebar/NodeWidgetRenderer.js`
- [x] Create `js/features/viewer/workflowSidebar/WorkflowSidebar.js`
- [x] Create `js/features/viewer/workflowSidebar/sidebarRunButton.js`
- [x] Modify `FloatingViewer.js` — add ⚙ + ▶ buttons in `_buildToolbar()`
- [x] Modify `FloatingViewer.js` — instantiate `WorkflowSidebar` in `render()`
- [x] Modify `floatingViewerManager.js` — `onNodeSelected` / `onSelectionChange` hooks
- [x] Add CSS classes in `theme-comfy.css`
- [x] Tests: `workflowSidebar.vitest.mjs` (DOM/adapters), `sidebarRunButton.vitest.mjs` (mock fetch)

**Status**: ✅ **Complete** — All items implemented and tested.

---

## 9. Final MFV Toolbar Visual Summary

```
[ Mode ][ Pin ▾]│[ Live ][ Preview ][ NodeStream ]│[ GenInfo ][ PopOut ][ Download ]│[ ⚙ Settings ][ ▶ Run ]│[ ✕ ]
                                                                                      └── NEW ──┘
```

---

## 10. Sidebar Position Setting

Users can customize sidebar placement via Settings:
- **Right** (default) — sidebar slides in from right
- **Left** — sidebar slides in from left
- **Bottom** — sidebar slides up from bottom

The setting applies immediately without reload and persists across sessions.
