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

// Local semantic mode state (synced with settings, not persisted)
const semanticMode = ref(false);
const semanticEnabled = ref(true);

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
        if (!searchInputRef.value) return;
        searchInputRef.value.dataset.mjrSemanticMode = semanticMode.value ? "1" : "0";
    } catch (e) {
        console.debug?.(e);
    }
};

const emitSearchChange = (payload = {}) => {
    emit("search-change", {
        query: searchInputRef.value?.value || "",
        semantic: semanticMode.value,
        ...payload,
    });
};

// Toggle semantic mode
const toggleSemanticMode = () => {
    if (!semanticEnabled.value) return;
    semanticMode.value = !semanticMode.value;
    syncSemanticDataset();
    try {
        searchInputRef.value?.dispatchEvent?.(new Event("input", { bubbles: true }));
    } catch (e) {
        console.debug?.(e);
    }
    emitSearchChange({ semantic: semanticMode.value });
};

// Handle search input
const handleSearchInput = async (e) => {
    const value = e.target.value || "";
    panelStore.searchQuery = value;
    syncSemanticDataset();
    emitSearchChange({ query: value });
    await handleAutocomplete();
};

// Autocomplete handler
const handleAutocomplete = debounce(async () => {
    const val = (searchInputRef.value?.value || "").trim();
    // Skip autocomplete in semantic mode or for attribute searches
    if (semanticMode.value || val.length < 2 || val.includes(":")) return;

    try {
        const res = await get("/mjr/am/autocomplete", { q: val, limit: 10 });
        if (res && res.ok && Array.isArray(res.data)) {
            dataListRef.value.innerHTML = "";
            res.data.forEach((term) => {
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
        if (searchInputRef.value && searchInputRef.value.value !== newVal) {
            searchInputRef.value.value = newVal;
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

onMounted(() => {
    try {
        if (searchInputRef.value) {
            searchInputRef.value.value = panelStore.searchQuery || "";
        }
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
        return searchInputRef.value;
    },
    get similarBtn() {
        return similarBtnRef.value;
    },
    get semanticBtn() {
        return semanticBtnRef.value;
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
            <input
                ref="searchInputRef"
                type="text"
                id="mjr-search-input"
                class="mjr-input"
                :placeholder="searchPlaceholder"
                :title="searchTitle"
                :list="dataListId"
                @input="handleSearchInput"
            />
            <datalist ref="dataListRef" :id="dataListId" />
        </div>
        <div class="mjr-am-search-tools">
            <div class="mjr-popover-anchor">
                <button
                    ref="semanticBtnRef"
                    type="button"
                    class="mjr-icon-btn mjr-ai-control"
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
                </button>
            </div>
            <div class="mjr-popover-anchor">
                <button
                    ref="similarBtnRef"
                    type="button"
                    class="mjr-icon-btn mjr-ai-control"
                    :title="t('search.findSimilar', 'Find Similar')"
                    @click="handleSimilarSearch"
                >
                    <i class="pi pi-clone"></i>
                </button>
            </div>
            <!-- Anchor slots for filter, sort, collections, pinned folders buttons -->
            <slot name="filter-anchor" />
            <slot name="sort-anchor" />
            <slot name="collections-anchor" />
            <slot name="pinned-folders-anchor" />
        </div>
    </div>
</template>

