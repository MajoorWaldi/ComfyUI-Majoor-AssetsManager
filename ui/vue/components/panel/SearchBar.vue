<script setup>
/**
 * SearchBar.vue — Reactive search bar component for the assets manager.
 *
 * Phase 2.4+: This component replaces the DOM-based search input section with a
 * fully reactive Vue template. It binds to usePanelStore for search query state.
 *
 * The component creates the search input, semantic toggle, and similar search
 * button. Anchor buttons (filter, sort, collections, pinned folders) are passed
 * as slots from the parent to maintain proper popover positioning.
 */
import { ref, computed, watch, onMounted } from "vue";
import { usePanelStore } from "../../../stores/usePanelStore.js";
import { get } from "../../../api/client.js";
import { ENDPOINTS } from "../../../api/endpoints.js";
import { metadataSearchAliases, normalizeMetadataSearchPrefix } from "../../../features/metadata/metadataSectionCatalog.js";
import { debounce } from "../../../utils/debounce.js";
import { t } from "../../../app/i18n.js";
import { appendTooltipHint } from "../../../utils/tooltipShortcuts.js";
import { createUniqueId } from "../../../utils/ids.js";

const SEARCH_TOOLTIP_HINT = "Ctrl/Cmd+F, Ctrl/Cmd+K, Ctrl/Cmd+H";

const props = defineProps({
    /** Callback when similar search is triggered */
    onSimilarSearch: { type: Function, default: null },
});

const emit = defineEmits(["similar", "search-change"]);

const panelStore = usePanelStore();
const searchSectionRef = ref(null);
const searchInputRef = ref(null);
const dataListRef = ref(null);
const similarBtnRef = ref(null);
const semanticBtnRef = ref(null);
const dataListId = createUniqueId("mjr-search-autocomplete-", 8);
const METADATA_SEARCH_MODE = "AND";

const resolveDomElement = (value) => value?.$el || value || null;
const getSearchInputEl = () => resolveDomElement(searchInputRef.value);

// Local semantic mode state (synced with settings, not persisted)
const semanticMode = ref(false);
const semanticEnabled = ref(true);
const metadataMode = ref(METADATA_SEARCH_MODE);
let metadataKeysCache = null;
let metadataKeysPromise = null;

// Computed placeholder based on semantic mode
const searchPlaceholder = computed(() => {
    return semanticMode.value
        ? t("search.semanticPlaceholder", "Describe what you're looking for...")
        : t("search.placeholder", "Search assets...");
});

// Computed title based on semantic mode
const searchTitle = computed(() => {
    return semanticMode.value
        ? appendTooltipHint(
              t(
                  "search.semanticTitle",
                  "AI semantic search — describe your image in natural language",
              ),
              SEARCH_TOOLTIP_HINT,
          )
        : appendTooltipHint(
              t(
                  "search.title",
                  "Search by filename, tags, or attributes (e.g. rating:5, ext:png)",
              ),
              SEARCH_TOOLTIP_HINT,
          );
});

// Computed semantic button style
const semanticBtnStyle = computed(() => {
    if (semanticMode.value) {
        return {
            background: "rgba(0, 188, 212, 0.2)",
            borderColor: "rgba(0, 188, 212, 0.6)",
            color: "#00BCD4",
            boxShadow: "0 0 6px rgba(0, 188, 212, 0.3)",
        };
    }
    return {
        background: "transparent",
        borderColor: "rgba(0, 188, 212, 0.25)",
        color: "rgba(0, 188, 212, 0.5)",
        boxShadow: "none",
    };
});

const syncSemanticDataset = () => {
    try {
        const input = getSearchInputEl();
        if (!input) return;
        input.dataset.mjrSemanticMode = semanticMode.value ? "1" : "0";
        input.dataset.mjrMetadataMode = metadataMode.value;
    } catch (e) {
        console.debug?.(e);
    }
};

const emitSearchChange = (payload = {}) => {
    emit("search-change", {
        query: getSearchInputEl()?.value || "",
        semantic: semanticMode.value,
        metadataMode: metadataMode.value,
        ...payload,
    });
};

// Toggle semantic mode
const toggleSemanticMode = () => {
    if (!semanticEnabled.value) return;
    semanticMode.value = !semanticMode.value;
    syncSemanticDataset();
    try {
        getSearchInputEl()?.dispatchEvent?.(new Event("input", { bubbles: true }));
    } catch (e) {
        console.debug?.(e);
    }
    emitSearchChange({ semantic: semanticMode.value });
};

// Handle search input
const handleSearchInput = async (e) => {
    const value = e.target.value || "";
    panelStore.searchQuery = value;
    panelStore.metadataSearchMode = METADATA_SEARCH_MODE;
    syncSemanticDataset();
    emitSearchChange({ query: value });
    await handleAutocomplete();
};

const getLastSearchToken = (value) => {
    const parts = String(value || "").split(/\s+/);
    return parts[parts.length - 1] || "";
};

async function loadMetadataKeys() {
    if (metadataKeysCache) return metadataKeysCache;
    if (!metadataKeysPromise) {
        metadataKeysPromise = get(ENDPOINTS.METADATA_KEYS, { limit: 600 }).then((res) => {
            const data = res?.data || {};
            metadataKeysCache = data;
            return data;
        });
    }
    return metadataKeysPromise;
}

function replaceLastSearchToken(value, replacement) {
    const text = String(value || "");
    const match = text.match(/^(.*?)(\S*)$/);
    const prefix = match ? match[1] : "";
    return `${prefix}${replacement}`.trimStart();
}

function buildMetadataSuggestions(value, metadataKeys) {
    const token = getLastSearchToken(value);
    const normalizedToken = token.replace(/^-/, "");
    const aliases = metadataSearchAliases();
    if (!normalizedToken.includes(":")) {
        const lower = normalizedToken.toLowerCase();
        return Object.keys(aliases)
            .filter((alias) => alias.startsWith(lower))
            .slice(0, 12)
            .map((alias) => replaceLastSearchToken(value, `${token.startsWith("-") ? "-" : ""}${alias}:`));
    }
    const [rawPrefix, rawNeedle = ""] = normalizedToken.split(/:(.*)/s);
    const prefix = normalizeMetadataSearchPrefix(rawPrefix);
    if (!prefix) return [];
    const needle = rawNeedle.toLowerCase();
    const keys = Array.isArray(metadataKeys?.keys) ? metadataKeys.keys : [];
    const workflowNodes = metadataKeys?.workflow_nodes || {};
    const source = [
        ...keys,
        ...Object.keys(workflowNodes).flatMap((node) =>
            (workflowNodes[node] || []).map((field) => `workflow_nodes.${node}.${field}`),
        ),
    ];
    return source
        .filter((item) => String(item || "").toLowerCase().includes(needle))
        .slice(0, 16)
        .map((item) => replaceLastSearchToken(value, `${token.startsWith("-") ? "-" : ""}${rawPrefix}:${item}`));
}

// Autocomplete handler
const handleAutocomplete = debounce(async () => {
    const val = (getSearchInputEl()?.value || "").trim();
    if (semanticMode.value || val.length < 1) return;

    try {
        const suggestions = [];
        const metadataKeys = await loadMetadataKeys();
        suggestions.push(...buildMetadataSuggestions(val, metadataKeys));
        if (!val.includes(":") && val.length >= 2) {
            const res = await get("/mjr/am/autocomplete", { q: val, limit: 10 });
            if (res && res.ok && Array.isArray(res.data)) suggestions.push(...res.data);
        }
        if (dataListRef.value) {
            dataListRef.value.innerHTML = "";
            [...new Set(suggestions)].slice(0, 18).forEach((term) => {
                const opt = document.createElement("option");
                opt.value = term;
                dataListRef.value.appendChild(opt);
            });
        }
    } catch {
        // Ignore autocomplete errors
    }
}, 300);

// Handle similar search
const handleSimilarSearch = () => {
    emit("similar");
    props.onSimilarSearch?.();
};

// Watch for external changes to search query
watch(
    () => panelStore.searchQuery,
    (newVal) => {
        const input = getSearchInputEl();
        if (input && input.value !== newVal) {
            input.value = newVal;
        }
    },
);

watch(semanticEnabled, (enabled) => {
    if (!enabled && semanticMode.value) {
        semanticMode.value = false;
    }
    syncSemanticDataset();
});

watch(semanticMode, () => {
    syncSemanticDataset();
});

watch(
    () => panelStore.metadataSearchMode,
    (newVal) => {
        if (String(newVal || "").toUpperCase() !== METADATA_SEARCH_MODE) {
            panelStore.metadataSearchMode = METADATA_SEARCH_MODE;
        }
        if (metadataMode.value !== METADATA_SEARCH_MODE) metadataMode.value = METADATA_SEARCH_MODE;
        syncSemanticDataset();
    },
);

onMounted(() => {
    try {
        const input = getSearchInputEl();
        if (input) {
            input.value = panelStore.searchQuery || "";
        }
        panelStore.metadataSearchMode = METADATA_SEARCH_MODE;
    } catch (e) {
        console.debug?.(e);
    }
    syncSemanticDataset();
});

// Expose elements for backwards compatibility with controller wiring
defineExpose({
    get searchSection() {
        return searchSectionRef.value;
    },
    get searchInputEl() {
        return getSearchInputEl();
    },
    get similarBtn() {
        return resolveDomElement(similarBtnRef.value);
    },
    get semanticBtn() {
        return resolveDomElement(semanticBtnRef.value);
    },
    setSemanticEnabled: (enabled) => {
        semanticEnabled.value = !!enabled;
        syncSemanticDataset();
    },
});
</script>

<template>
    <div ref="searchSectionRef" class="mjr-am-search">
        <div class="mjr-am-search-pill">
            <span class="mjr-am-search-icon">
                <i class="pi pi-search"></i>
            </span>
            <MInputText
                ref="searchInputRef"
                id="mjr-search-input"
                class="mjr-input"
                type="text"
                :placeholder="searchPlaceholder"
                :title="searchTitle"
                :list="dataListId"
                @input="handleSearchInput"
            />
            <datalist ref="dataListRef" :id="dataListId" />
        </div>
        <div class="mjr-am-search-tools">
            <div class="mjr-popover-anchor">
                <MButton
                    ref="semanticBtnRef"
                    type="button"
                    class="mjr-icon-btn mjr-ai-control"
                    severity="secondary"
                    text
                    rounded
                    :disabled="!semanticEnabled"
                    :aria-disabled="!semanticEnabled"
                    :title="
                        semanticEnabled
                            ? t('search.semanticToggle', 'Toggle AI semantic search (CLIP-based)')
                            : t('search.semanticDisabled', 'AI semantic search is disabled in settings')
                    "
                    :style="semanticBtnStyle"
                    @click="toggleSemanticMode"
                >
                    <i class="pi pi-sparkles"></i>
                </MButton>
            </div>
            <div class="mjr-popover-anchor">
                <MButton
                    ref="similarBtnRef"
                    type="button"
                    class="mjr-icon-btn mjr-ai-control"
                    severity="secondary"
                    text
                    rounded
                    :title="t('search.findSimilar', 'Find Similar')"
                    @click="handleSimilarSearch"
                >
                    <i class="pi pi-search"></i>
                </MButton>
            </div>
            <!-- Anchor slots for filter, sort, collections, pinned folders buttons -->
            <slot name="filter-anchor" />
            <slot name="sort-anchor" />
            <slot name="collections-anchor" />
            <slot name="pinned-folders-anchor" />
        </div>
    </div>
</template>
