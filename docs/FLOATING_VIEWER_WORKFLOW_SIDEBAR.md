# Floating Viewer — Intégration Workflow Sidebar & Run

> **Objectif** : Ajouter au Floating Viewer (MFV) un panneau latéral léger permettant de
> modifier les widgets des nœuds sélectionnés sur le canvas, **ainsi qu'un bouton Run**,
> le tout sans dupliquer ni concurrencer le panel « Workflow Overview » natif de ComfyUI.

---

## 1. Principe directeur — « Déléguer, ne pas dupliquer »

| Règle | Détail |
|-------|--------|
| **Lecture seule des données** | On lit `app.graph`, `app.canvas.selected_nodes` — on n'invente pas de modèle parallèle. |
| **Écriture via widget natif** | On écrit via `widget.value = x ; widget.callback?.(x)` — le moteur ComfyUI gère la propagation. |
| **Exécution via endpoint** | Le Run appelle `POST /prompt` avec le payload de `app.graphToPrompt()` — on ne réimplémente pas la queue. |
| **Aucune persistence propre** | Pas de store, pas de cache — chaque ouverture relit l'état live du graph. |

---

## 2. Architecture des modules

```
js/features/viewer/
├── FloatingViewer.js              ← existant (on touche _buildToolbar)
├── floatingViewerManager.js       ← existant (on ajoute les bindings sélection)
│
├── workflowSidebar/               ← NOUVEAU sous-module
│   ├── WorkflowSidebar.js         ← Composant principal (panneau DOM)
│   ├── NodeWidgetRenderer.js      ← Rendu des widgets d'un nœud
│   ├── widgetAdapters.js          ← Adaptateurs type → HTML input
│   └── sidebarRunButton.js        ← Bouton Run (queue prompt)
```

### 2.1 Dépendances

```
FloatingViewer
  └─► WorkflowSidebar        (créé dans _buildToolbar, injecté dans le DOM MFV)
        ├─► NodeWidgetRenderer  (instancié 1× par nœud affiché)
        │     └─► widgetAdapters  (fonctions pures, aucun état)
        └─► sidebarRunButton    (bouton autonome, appelle l'API ComfyUI)
```

Aucun de ces fichiers n'importe depuis `comfyui-frontend` directement.
Tout passe par le bridge existant : `js/app/comfyApiBridge.js`.

---

## 3. Module par module

---

### 3.1 `WorkflowSidebar.js` — Panneau latéral

**Rôle** : Conteneur glissant (slide-in) qui s'ouvre à droite du Floating Viewer.

```
┌─────────────────────────────────────────────────────┐
│  Majoor Viewer Lite              [⚙] [▶ Run] [✕]   │  ← header + toolbar
├────────────────────┬────────────────────────────────┤
│                    │  Workflow Sidebar               │
│   Contenu Viewer   │  ┌────────────────────────────┐ │
│   (image/vidéo)    │  │ KSampler              [📍] │ │
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

#### API publique

```js
class WorkflowSidebar {
  constructor({ hostEl, onClose })
  show()           // slide-in, lit la sélection courante
  hide()           // slide-out
  toggle()
  refresh()        // relit app.canvas.selected_nodes et re-render
  get isVisible()
  destroy()
}
```

#### Comment lire les nœuds sélectionnés

Le pattern existe déjà dans `NodeStreamController.js` :

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

#### Comment écouter les changements de sélection

Le pattern existe dans `LiveStreamTracker.js` :

```js
const canvas = app.canvas;
const origSelected = canvas.onNodeSelected;
const origSelChange = canvas.onSelectionChange;

canvas.onNodeSelected = function (node) {
  origSelected?.call(this, node);
  sidebar.refresh();  // ← notre hook
};

canvas.onSelectionChange = function (selectedNodes) {
  origSelChange?.call(this, selectedNodes);
  sidebar.refresh();  // ← notre hook
};
```

> **Important** : ces hooks doivent être posés/retirés proprement à l'ouverture/fermeture
> du sidebar pour ne pas fuiter. On utilise le même pattern chaîné que `LiveStreamTracker`.

---

### 3.2 `NodeWidgetRenderer.js` — Rendu d'un nœud

**Rôle** : Pour un `LGraphNode` donné, itère sur `node.widgets` et génère
un formulaire HTML correspondant.

#### Informations disponibles sur un widget ComfyUI

```js
node.widgets.forEach(widget => {
  widget.name       // "seed", "steps", "cfg", "sampler_name" …
  widget.type       // "number", "combo", "text", "toggle", "IMAGEUPLOAD" …
  widget.value      // valeur courante
  widget.options     // { min, max, step, values: [...] }  (pour combo/number)
  widget.callback   // function(value) — à appeler après écriture
});
```

#### Structure DOM générée

```html
<section class="mjr-ws-node" data-node-id="3">
  <div class="mjr-ws-node-header">
    <span class="mjr-ws-node-title">KSampler</span>
    <button class="mjr-icon-btn mjr-ws-locate" title="Locate on canvas">
      <i class="pi pi-map-marker"></i>
    </button>
  </div>
  <div class="mjr-ws-node-body">
    <!-- widgets rendus par widgetAdapters -->
  </div>
</section>
```

#### Localisation d'un nœud sur le canvas

```js
function locateNode(node) {
  const app = getComfyApp();
  const canvas = app?.canvas;
  if (!canvas || !node) return;
  // Centre la vue sur le nœud
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

### 3.3 `widgetAdapters.js` — Conversion widget → input HTML

Fichier de fonctions pures, aucun état. Chaque adaptateur retourne un `HTMLElement`.

| `widget.type` | Input HTML | Notes |
|---------------|-----------|-------|
| `"number"` | `<input type="number" min max step>` | Reprend `widget.options.{min,max,step}` |
| `"combo"` | `<select>` avec `<option>` | Reprend `widget.options.values` |
| `"text"` | `<textarea>` | Auto-resize |
| `"toggle"` | `<input type="checkbox">` | |
| `"IMAGEUPLOAD"` | *(ignoré)* | Trop complexe, on ne le gère pas |
| autre / inconnu | `<input type="text" readonly>` | Affichage seul |

#### Écriture vers un widget ComfyUI

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
  // Notifier ComfyUI que le widget a changé
  widget.callback?.(widget.value);
  // Marquer le canvas dirty pour refresh visuel
  const app = getComfyApp();
  app?.canvas?.setDirty?.(true, true);
  return true;
}
```

> Ce pattern est identique à celui déjà utilisé dans `DragDrop.js` pour le drop
> de médias sur les nœuds — on ne réinvente rien.

---

### 3.4 `sidebarRunButton.js` — Bouton Run

**Rôle** : Bouton unique qui déclenche `POST /prompt` en réutilisant l'API ComfyUI.

#### Option A — Via l'objet `app` (recommandé)

```js
import { getComfyApp } from "../../../app/comfyApiBridge.js";

async function queueCurrentPrompt() {
  const app = getComfyApp();
  if (!app) return { ok: false, error: "ComfyUI app not ready" };

  // graphToPrompt() sérialise le workflow courant en payload exécutable
  const promptData = await app.graphToPrompt();
  if (!promptData?.output) return { ok: false, error: "Empty prompt" };

  // Déclencher l'exécution
  // Méthode 1 : via app.queuePrompt (si disponible)
  if (typeof app.queuePrompt === "function") {
    const res = await app.queuePrompt(0); // 0 = insérer en fin de queue
    return { ok: true, data: res };
  }

  // Méthode 2 : via api.queuePrompt
  const api = app.api;
  if (api && typeof api.queuePrompt === "function") {
    const res = await api.queuePrompt(0, promptData);
    return { ok: true, data: res };
  }

  // Méthode 3 : fallback HTTP direct
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

#### Rendu

```html
<!-- Dans la toolbar, à côté du bouton ⚙ settings -->
<button class="mjr-icon-btn mjr-mfv-run-btn" title="Queue Prompt (Run)">
  <i class="pi pi-play"></i>
</button>
```

État visuel :
- Idle → icône `pi-play` verte
- Running → icône `pi-spin pi-spinner` + disabled
- Error → flash rouge 1s puis retour idle

---

## 4. Intégration dans FloatingViewer

### 4.1 Modification de `_buildToolbar()`

Ajouter **2 boutons** dans la toolbar existante :

```js
// Après le bouton capture/download existant :

// --- Séparateur ---
const sep2 = document.createElement("div");
sep2.className = "mjr-mfv-toolbar-sep";
bar.appendChild(sep2);

// --- Bouton Settings (ouvre/ferme le sidebar) ---
const settingsBtn = document.createElement("button");
settingsBtn.type = "button";
settingsBtn.className = "mjr-icon-btn mjr-mfv-settings-btn";
settingsBtn.title = "Node Parameters";
const settingsIcon = document.createElement("i");
settingsIcon.className = "pi pi-cog";          // ⚙ icône PrimeIcons
settingsBtn.appendChild(settingsIcon);
settingsBtn.addEventListener("click", () => this._sidebar?.toggle());
bar.appendChild(settingsBtn);

// --- Bouton Run ---
const runBtn = createRunButton();              // depuis sidebarRunButton.js
bar.appendChild(runBtn);
```

### 4.2 Modification de `render()`

```js
render() {
  const el = this._el;
  el.appendChild(this._buildHeader());
  el.appendChild(this._buildToolbar());
  el.appendChild(this._contentEl);

  // NOUVEAU : sidebar, monté une fois, caché par défaut
  this._sidebar = new WorkflowSidebar({
    hostEl: el,
    onClose: () => this._updateSettingsBtnState(false),
  });
  el.appendChild(this._sidebar.el);

  return el;
}
```

### 4.3 Hook sélection dans `floatingViewerManager.js`

```js
// Dans open() :
_bindNodeSelectionListener();

// Dans close() :
_unbindNodeSelectionListener();
```

---

## 5. CSS — Classes ajoutées

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

## 6. Événements et flux de données

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
                              │ pour chaque nœud     │
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

## 7. Ce qu'on NE fait PAS

| Interdit | Raison |
|----------|--------|
| Recréer un éditeur de nœud complet | On n'est pas un IDE — juste un panneau de réglage rapide |
| Gérer l'ajout/suppression de nœuds | C'est le canvas ComfyUI qui gère ça |
| Dupliquer le Workflow Overview | Notre sidebar est un **raccourci contextuel** (nœuds sélectionnés uniquement) |
| Intercepter la queue d'exécution | On POST et c'est tout — pas de suivi de progression propre |
| Stocker l'état des widgets | On lit/écrit le graph live — pas de copie locale |
| Ajouter des dépendances ComfyUI frontend | Tout passe par `comfyApiBridge.js` |

---

## 8. Checklist d'implémentation

- [ ] Créer `js/features/viewer/workflowSidebar/widgetAdapters.js`
- [ ] Créer `js/features/viewer/workflowSidebar/NodeWidgetRenderer.js`
- [ ] Créer `js/features/viewer/workflowSidebar/WorkflowSidebar.js`
- [ ] Créer `js/features/viewer/workflowSidebar/sidebarRunButton.js`
- [ ] Modifier `FloatingViewer.js` — ajouter bouton ⚙ + ▶ dans `_buildToolbar()`
- [ ] Modifier `FloatingViewer.js` — instancier `WorkflowSidebar` dans `render()`
- [ ] Modifier `floatingViewerManager.js` — hooks `onNodeSelected` / `onSelectionChange`
- [ ] Ajouter les classes CSS dans `theme-comfy.css`
- [ ] Tests : `workflowSidebar.vitest.mjs` (DOM/adaptateurs), `sidebarRunButton.vitest.mjs` (mock fetch)

---

## 9. Résumé visuel de la toolbar finale du MFV

```
[ Mode ][ Pin ▾]│[ Live ][ Preview ][ NodeStream ]│[ GenInfo ][ PopOut ][ Download ]│[ ⚙ Settings ][ ▶ Run ]│[ ✕ ]
                                                                                      └── NOUVEAU ──┘
```
