import { api } from "../../../../scripts/api.js";
import { SMART_FILTERS } from "../am_filters.js";
import { createInitialState } from "../am_state.js";

export function initManagerState() {
  const state = createInitialState();
  state.visibleStart = 0;
  state.visibleEnd = 50;
  return state;
}

export async function populateCollectionsOptions(state, selectEl) {
  if (!selectEl) return;
  selectEl.innerHTML = '<option value="">(All Files)</option>';

  const smartGroup = document.createElement("optgroup");
  smartGroup.label = "Smart Views";
  Object.entries(SMART_FILTERS).forEach(([key, def]) => {
    const opt = new Option(def.label, key);
    if (state.activeCollection === key) opt.selected = true;
    smartGroup.appendChild(opt);
  });
  selectEl.appendChild(smartGroup);

  const manualGroup = document.createElement("optgroup");
  manualGroup.label = "Collections";
  try {
    const res = await api.fetchApi("/mjr/collections/list");
    const data = await res.json();
    (data.collections || []).forEach((name) => {
      const opt = new Option(name, name);
      if (state.activeCollection === name) opt.selected = true;
      manualGroup.appendChild(opt);
    });
  } catch (e) {
    console.error(e);
  }
  selectEl.appendChild(manualGroup);
}
