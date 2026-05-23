<script setup>
/**
 * CollectionsPopover.vue - Reactive collections menu.
 *
 * Vue owns the popover content. Visibility is still controlled by the legacy
 * popover manager (`popovers.toggle/close`) through the root element display.
 * The component watches that visibility transition and refreshes its data when
 * the menu opens.
 */
import { computed, onMounted, onUnmounted, ref } from "vue";
import { comfyPrompt, comfyConfirm } from "../../../app/dialogs.js";
import { comfyToast } from "../../../app/toast.js";
import {
    addAssetsToCollection,
    createCollection,
    deleteCollection,
    listCollections,
    vectorSearch,
    vectorStats,
    vectorSuggestCollections,
} from "../../../api/client.js";
import { buildAssetViewURL } from "../../../api/endpoints.js";
import { t } from "../../../app/i18n.js";
import { usePanelStore } from "../../../stores/usePanelStore.js";
import {
    SMART_COLLECTION_IDEAS,
    autoClusterLabel,
    extractCollectionAssetsFromRows,
    isAiEnabledFromSettings,
    normalizeCollectionName,
    resolveCollectionAssetsByIds,
} from "../../../features/collections/collectionsPopoverUtils.js";

const COLLECTIONS_CHANGED_EVENT = "mjr:collections-changed";

const panelStore = usePanelStore();
const rootRef = ref(null);

const collections = ref([]);
const collectionsLoading = ref(false);
const loadError = ref("");

const aiLoading = ref(false);
const aiEnabled = ref(true);
const vectorAvailable = ref(false);
const vectorDisabled = ref(false);

const clustersLoading = ref(false);
const clusters = ref([]);
const clustersError = ref("");

const busyActionKey = ref("");

let _refreshToken = 0;
let _visibilityObserver = null;
let _wasOpen = false;

const activeCollectionId = computed(() => String(panelStore.collectionId || "").trim());
const activeCollectionName = computed(() => String(panelStore.collectionName || "").trim());
const hasActiveCollection = computed(() => !!activeCollectionId.value);
const showAiDisabledNotice = computed(() => !aiEnabled.value || vectorDisabled.value);
const showAiSections = computed(() => aiEnabled.value && vectorAvailable.value);
const collectionScrollerHeight = computed(() => {
    const rows = Math.max(1, Math.min(collections.value.length, 6));
    return `${rows * 48}px`;
});

function isOpen() {
    const el = rootRef.value;
    return !!el && String(el.style.display || "").toLowerCase() !== "none";
}

function emitCollectionsChanged({
    collectionId = activeCollectionId.value,
    collectionName = activeCollectionName.value,
    close = true,
    reload = true,
} = {}) {
    try {
        window.dispatchEvent(
            new CustomEvent(COLLECTIONS_CHANGED_EVENT, {
                detail: {
                    collectionId: String(collectionId || ""),
                    collectionName: String(collectionName || ""),
                    close: close !== false,
                    reload: reload !== false,
                },
            }),
        );
    } catch (e) {
        console.debug?.(e);
    }
}

function viewUrlForSample(asset) {
    try {
        return buildAssetViewURL(asset) || "";
    } catch (e) {
        console.debug?.(e);
        return "";
    }
}

async function loadAiAvailability() {
    const enabled = isAiEnabledFromSettings();
    if (!enabled) {
        return {
            enabled: false,
            vectorAvailable: false,
            vectorDisabled: false,
        };
    }

    try {
        const stats = await vectorStats();
        const disabled =
            !stats?.ok &&
            (String(stats?.code || "").toUpperCase() === "SERVICE_UNAVAILABLE" ||
                /vector search is not enabled/i.test(String(stats?.error || "")));
        return {
            enabled: true,
            vectorAvailable: !!(stats?.ok && stats?.data?.total > 0),
            vectorDisabled: disabled,
        };
    } catch (e) {
        console.debug?.(e);
        return {
            enabled: true,
            vectorAvailable: false,
            vectorDisabled: false,
        };
    }
}

function mergeAssetsByFilepath(...groups) {
    const merged = [];
    const seen = new Set();
    for (const group of groups) {
        for (const asset of Array.isArray(group) ? group : []) {
            const key = String(asset?.filepath || "").trim().toLowerCase();
            if (!key || seen.has(key)) continue;
            seen.add(key);
            merged.push(asset);
        }
    }
    return merged;
}

async function refresh() {
    const token = ++_refreshToken;
    collectionsLoading.value = true;
    aiLoading.value = true;
    loadError.value = "";
    clustersError.value = "";

    try {
        const [collectionsRes, aiState] = await Promise.all([
            listCollections(),
            loadAiAvailability(),
        ]);

        if (token !== _refreshToken) return;

        if (!collectionsRes?.ok) {
            loadError.value = String(
                collectionsRes?.error || t("msg.failedLoadCollections", "Failed to load collections"),
            );
            collections.value = [];
        } else {
            collections.value = Array.isArray(collectionsRes?.data) ? collectionsRes.data : [];
        }

        aiEnabled.value = !!aiState.enabled;
        vectorAvailable.value = !!aiState.vectorAvailable;
        vectorDisabled.value = !!aiState.vectorDisabled;

        if (!vectorAvailable.value) {
            clusters.value = [];
            clustersLoading.value = false;
        }
    } catch (e) {
        if (token !== _refreshToken) return;
        console.debug?.(e);
        loadError.value = t("msg.failedLoadCollections", "Failed to load collections");
        collections.value = [];
    } finally {
        if (token === _refreshToken) {
            collectionsLoading.value = false;
            aiLoading.value = false;
        }
    }
}

function withBusyAction(key, fn) {
    return async (...args) => {
        if (busyActionKey.value) return;
        busyActionKey.value = key;
        try {
            await fn(...args);
        } finally {
            if (busyActionKey.value === key) busyActionKey.value = "";
        }
    };
}

const handleCreateCollection = withBusyAction("create", async () => {
    const rawName = await comfyPrompt(
        t("dialog.createCollection", "Create collection"),
        t("dialog.collectionPlaceholder", "Collection name"),
    );
    if (!rawName) return;

    const normalizedName = normalizeCollectionName(rawName);
    if (!normalizedName) {
        comfyToast(t("toast.invalidCollectionName", "Invalid collection name"), "error");
        return;
    }

    const response = await createCollection(normalizedName);
    if (!response?.ok) {
        comfyToast(
            response?.error || t("toast.failedCreateCollection", "Failed to create collection"),
            "error",
        );
        return;
    }

    emitCollectionsChanged({
        collectionId: String(response?.data?.id || ""),
        collectionName: String(response?.data?.name || normalizedName),
    });
});

const handleExitCollection = withBusyAction("exit", async () => {
    emitCollectionsChanged({
        collectionId: "",
        collectionName: "",
    });
});

const handleOpenCollection = withBusyAction("open", async (item) => {
    const id = String(item?.id || "");
    const name = String(item?.name || id);
    if (!id) return;

    if (id === activeCollectionId.value) {
        emitCollectionsChanged({
            collectionId: id,
            collectionName: name,
            reload: false,
        });
        return;
    }

    emitCollectionsChanged({
        collectionId: id,
        collectionName: name,
    });
});

const handleDeleteCollection = withBusyAction("delete", async (item) => {
    const id = String(item?.id || "");
    const name = String(item?.name || id);
    if (!id) return;

    const ok = await comfyConfirm(
        t("dialog.deleteCollection", 'Delete collection "{name}"?', { name }),
    );
    if (!ok) return;

    const response = await deleteCollection(id);
    if (!response?.ok) {
        comfyToast(
            response?.error || t("toast.failedDeleteCollection", "Failed to delete collection"),
            "error",
        );
        return;
    }

    if (id === activeCollectionId.value) {
        emitCollectionsChanged({
            collectionId: "",
            collectionName: "",
        });
        return;
    }

    await refresh();
});

async function createSmartCollection(idea) {
    const label = String(idea?.label || "").trim();
    if (!label) return;

    const createRes = await createCollection(label);
    if (!createRes?.ok) {
        comfyToast(
            createRes?.error ||
                t("toast.failedCreateSmartCollection", "Failed to create smart collection"),
            "error",
        );
        return;
    }

    const collectionId = String(createRes?.data?.id || "");
    if (!collectionId) return;

    const searchRes = await vectorSearch(String(idea?.query || ""), 50);
    if (searchRes?.ok && Array.isArray(searchRes?.data) && searchRes.data.length > 0) {
        const extracted = extractCollectionAssetsFromRows(searchRes.data);
        let assets = extracted.assets;
        if (extracted.missingIds.length) {
            const hydrated = await resolveCollectionAssetsByIds(extracted.missingIds);
            if (hydrated.ok && Array.isArray(hydrated.data)) {
                assets = mergeAssetsByFilepath(assets, hydrated.data);
            }
        }
        if (assets.length) {
            const addRes = await addAssetsToCollection(collectionId, assets);
            if (!addRes?.ok) {
                comfyToast(
                    addRes?.error ||
                        t(
                            "toast.failedAddAssetsToSmartCollection",
                            "Failed to add assets to smart collection",
                        ),
                    "error",
                );
                return;
            }
            const addedCount = Number(addRes?.data?.added || assets.length || 0);
            comfyToast(
                t(
                    "toast.smartCollectionCreated",
                    'Smart collection "{name}" created with {count} assets!',
                    { name: label, count: addedCount },
                ),
                "success",
                3000,
            );
        } else {
            comfyToast(
                t(
                    "toast.smartCollectionEmpty",
                    'Collection "{name}" created but no matching assets found. Index more assets first.',
                    { name: label },
                ),
                "info",
                3000,
            );
        }
    } else {
        comfyToast(
            t(
                "toast.smartCollectionEmpty",
                'Collection "{name}" created but no matching assets found. Index more assets first.',
                { name: label },
            ),
            "info",
            3000,
        );
    }

    emitCollectionsChanged({
        collectionId,
        collectionName: label,
    });
}

async function handleSmartSuggestion(idea) {
    if (!idea?.key) return;
    const key = `smart:${idea.key}`;
    if (busyActionKey.value) return;
    busyActionKey.value = key;
    try {
        await createSmartCollection(idea);
    } catch (e) {
        console.error("[Majoor] Smart collection creation failed:", e);
        comfyToast(
            t("toast.failedCreateSmartCollection", "Failed to create smart collection"),
            "error",
        );
    } finally {
        if (busyActionKey.value === key) busyActionKey.value = "";
    }
}

async function analyzeLibrary() {
    if (clustersLoading.value || busyActionKey.value) return;
    clustersLoading.value = true;
    clustersError.value = "";
    clusters.value = [];
    try {
        const response = await vectorSuggestCollections(8);
        if (!response?.ok || !Array.isArray(response?.data) || !response.data.length) {
            comfyToast(
                t("toast.noGroupsFoundIndexFirst", "No groups found. Index more assets first."),
                "info",
                3000,
            );
            return;
        }
        clusters.value = response.data.map((cluster) => ({
            ...cluster,
            _label: autoClusterLabel(cluster),
        }));
    } catch (e) {
        console.error("[Majoor] Discover groups failed:", e);
        clustersError.value = t("toast.clusterAnalysisFailed", "Cluster analysis failed");
        comfyToast(t("toast.clusterAnalysisFailed", "Cluster analysis failed"), "error");
    } finally {
        clustersLoading.value = false;
    }
}

async function createCollectionFromCluster(cluster) {
    const key = `cluster:${String(cluster?.cluster_id ?? "")}`;
    if (busyActionKey.value) return;
    busyActionKey.value = key;
    try {
        const label = String(cluster?._label || autoClusterLabel(cluster) || "").trim();
        if (!label) return;

        const createRes = await createCollection(label);
        if (!createRes?.ok) {
            comfyToast(
                createRes?.error || t("toast.failedCreateCollection", "Failed to create collection"),
                "error",
            );
            return;
        }

        const collectionId = String(createRes?.data?.id || "");
        const allIds = Array.isArray(cluster?.all_asset_ids) ? cluster.all_asset_ids : [];
        if (collectionId && allIds.length) {
            const hydrated = await resolveCollectionAssetsByIds(allIds);
            if (!hydrated.ok) {
                comfyToast(
                    hydrated.error ||
                        t("toast.failedLoadClusterAssets", "Failed to load cluster assets"),
                    "error",
                );
                return;
            }

            const addRes = await addAssetsToCollection(collectionId, hydrated.data || []);
            if (!addRes?.ok) {
                comfyToast(
                    addRes?.error ||
                        t("toast.failedAddAssetsToCollection", "Failed to add assets to collection"),
                    "error",
                );
                return;
            }

            const addedCount = Number(addRes?.data?.added || hydrated.data?.length || 0);
            comfyToast(
                t(
                    "toast.collectionCreatedWithAssets",
                    'Collection "{name}" created with {count} assets!',
                    { name: label, count: addedCount },
                ),
                "success",
                3000,
            );
        } else {
            comfyToast(
                t("toast.collectionCreatedNamed", 'Collection "{name}" created.', { name: label }),
                "success",
                2200,
            );
        }

        emitCollectionsChanged({
            collectionId,
            collectionName: label,
        });
    } catch (e) {
        console.error("[Majoor] Cluster collection creation failed:", e);
        comfyToast(t("toast.failedCreateCollection", "Failed to create collection"), "error");
    } finally {
        if (busyActionKey.value === key) busyActionKey.value = "";
    }
}

function handleVisibilityChange() {
    const open = isOpen();
    if (open && !_wasOpen) refresh().catch(() => {});
    _wasOpen = open;
}

onMounted(() => {
    handleVisibilityChange();
    if (typeof MutationObserver === "undefined" || !rootRef.value) return;
    _visibilityObserver = new MutationObserver(() => handleVisibilityChange());
    _visibilityObserver.observe(rootRef.value, {
        attributes: true,
        attributeFilter: ["style"],
    });
});

onUnmounted(() => {
    try {
        _visibilityObserver?.disconnect?.();
    } catch (e) {
        console.debug?.(e);
    }
    _visibilityObserver = null;
});

defineExpose({
    refresh,
});
</script>

<template>
    <div ref="rootRef" class="mjr-popover mjr-collections-popover" style="display: none;">
        <div class="mjr-menu mjr-collections-menu">
            <MButton
                type="button"
                class="mjr-menu-item"
                severity="secondary"
                text
                :disabled="busyActionKey !== ''"
                @click="handleCreateCollection"
            >
                <span class="mjr-menu-item-label">{{ t("ctx.createCollection", "Create collection") }}</span>
                <i class="pi pi-plus mjr-menu-item-check mjr-menu-item-check--visible" />
            </MButton>

            <MButton
                v-if="hasActiveCollection"
                type="button"
                class="mjr-menu-item"
                severity="secondary"
                text
                :disabled="busyActionKey !== ''"
                @click="handleExitCollection"
            >
                <span class="mjr-menu-item-label">{{ t("ctx.exitCollection", "Exit collection") }}</span>
                <span class="mjr-menu-item-right">
                    <span v-if="activeCollectionName" class="mjr-menu-item-hint">
                        {{ activeCollectionName }}
                    </span>
                    <i class="pi pi-times mjr-menu-item-check mjr-menu-item-check--visible" />
                </span>
            </MButton>

            <div class="mjr-menu-divider" />

            <div v-if="collectionsLoading" class="mjr-muted">
                {{ t("label.loading", "Loading...") }}
            </div>
            <div v-else-if="loadError" class="mjr-state-block is-error">
                {{ loadError }}
            </div>
            <div v-else-if="!collections.length" class="mjr-muted">
                {{ t("msg.noCollections", "No collections yet") }}
            </div>

            <MVirtualScroller
                v-else
                :items="collections"
                :item-size="48"
                :scroll-height="collectionScrollerHeight"
                :num-tolerated-items="4"
                class="mjr-collections-virtual-list"
            >
                <template #item="{ item }">
                    <div class="mjr-collection-row">
                        <MButton
                            type="button"
                            class="mjr-menu-item"
                            severity="secondary"
                            text
                            :class="{ 'is-active': activeCollectionId === String(item.id || '') }"
                            :disabled="busyActionKey !== ''"
                            @click="handleOpenCollection(item)"
                        >
                            <span class="mjr-menu-item-label">{{ item.name || item.id }}</span>
                            <span class="mjr-menu-item-right">
                                <span v-if="Number(item.count || 0)" class="mjr-menu-item-hint">
                                    {{ Number(item.count || 0) }}
                                </span>
                                <i class="pi pi-check mjr-menu-item-check" />
                            </span>
                        </MButton>

                        <MButton
                            type="button"
                            class="mjr-menu-item mjr-delete-btn"
                            severity="secondary"
                            text
                            :disabled="busyActionKey !== ''"
                            :title="t('tooltip.deleteCollection', 'Delete collection')"
                            @click.stop.prevent="handleDeleteCollection(item)"
                        >
                            <i class="pi pi-trash" />
                        </MButton>
                    </div>
                </template>
            </MVirtualScroller>

            <template v-if="!aiLoading && showAiDisabledNotice">
                <div class="mjr-menu-divider" />
                <div class="mjr-state-block">
                    {{
                        !aiEnabled
                            ? "AI Smart Collections are disabled in settings."
                            : "AI Smart Collections are disabled (enable vector search env var)."
                    }}
                </div>
            </template>

            <template v-if="!aiLoading && showAiSections">
                <div class="mjr-menu-divider" />

                <div class="mjr-section-title mjr-section-title--cyan">
                    {{ t("label.smartSuggestions", "Smart Suggestions") }}
                </div>
                <div class="mjr-section-hint">
                    {{ t("label.smartCollectionsHint", "Create collections from AI-detected themes") }}
                </div>

                <MButton
                    v-for="idea in SMART_COLLECTION_IDEAS"
                    :key="idea.key"
                    type="button"
                    class="mjr-menu-item mjr-menu-item--smart"
                    severity="secondary"
                    text
                    :disabled="busyActionKey !== ''"
                    @click="handleSmartSuggestion(idea)"
                >
                    <span class="mjr-menu-item-label mjr-menu-item-label--icon">
                        <i :class="idea.iconClass" />
                        <span>{{ idea.label }}</span>
                    </span>
                    <i class="pi pi-plus mjr-menu-item-check mjr-menu-item-check--visible" />
                </MButton>

                <div class="mjr-menu-divider" />

                <div class="mjr-section-title mjr-section-title--violet">
                    {{ t("label.discoverGroups", "Discover Groups") }}
                </div>
                <div class="mjr-section-hint">
                    {{ t("label.discoverGroupsHint", "AI clusters assets by visual similarity") }}
                </div>

                <MButton
                    type="button"
                    class="mjr-menu-item mjr-menu-item--cluster"
                    severity="secondary"
                    text
                    :disabled="clustersLoading || busyActionKey !== ''"
                    @click="analyzeLibrary"
                >
                    <span class="mjr-menu-item-label mjr-menu-item-label--icon">
                        <i class="pi pi-search" />
                        <span>
                            {{
                                clustersLoading
                                    ? t("label.analyzing", "Analyzing...")
                                    : t("label.analyzeLibrary", "Analyze library")
                            }}
                        </span>
                    </span>
                </MButton>

                <div v-if="clustersError" class="mjr-state-block is-error">
                    {{ clustersError }}
                </div>

                <div v-for="cluster in clusters" :key="cluster.cluster_id" class="mjr-cluster-row">
                    <div class="mjr-cluster-thumbs">
                        <img
                            v-for="(sample, index) in (Array.isArray(cluster.sample_assets) ? cluster.sample_assets.slice(0, 3) : [])"
                            :key="`${cluster.cluster_id}-${index}`"
                            class="mjr-cluster-thumb"
                            :src="viewUrlForSample(sample)"
                            :alt="String(sample?.filename || cluster._label || '')"
                            loading="lazy"
                        >
                    </div>

                    <div class="mjr-cluster-info">
                        <div class="mjr-cluster-name" :title="cluster._label">{{ cluster._label }}</div>
                        <div class="mjr-cluster-count">
                            {{ Number(cluster.size || 0) }} {{ t("label.assets", "assets") }}
                        </div>
                    </div>

                    <MButton
                        type="button"
                        class="mjr-cluster-create-btn"
                        severity="secondary"
                        :disabled="busyActionKey !== ''"
                        :title="t('ctx.createCollection', 'Create collection')"
                        @click="createCollectionFromCluster(cluster)"
                    >
                        {{
                            busyActionKey === `cluster:${String(cluster.cluster_id ?? '')}`
                                ? t("label.loading", "Loading...")
                                : t("label.create", "Create")
                        }}
                    </MButton>
                </div>
            </template>
        </div>
    </div>
</template>
