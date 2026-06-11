<script setup>
import { computed, onBeforeUnmount, ref, watch } from "vue";
import { listWorkflows } from "../../../api/client.js";
import { t } from "../../../app/i18n.js";
import { workflowPickerState, closeWorkflowPicker } from "../../../features/workflows/workflowPickerState.js";

const query = ref("");
const loading = ref(false);
const error = ref("");
const workflows = ref([]);
const selectedPath = ref("");
let requestId = 0;

const sourceAsset = computed(() => workflowPickerState.sourceAsset || null);
const sourceWorkflow = computed(() => workflowPickerState.workflow || null);
const isAssetMode = computed(() => String(workflowPickerState.mode || "") === "asset");
const sourceName = computed(() =>
    String(
        sourceAsset.value?.filename ||
            sourceAsset.value?.display_name ||
            sourceWorkflow.value?.display_name ||
            sourceWorkflow.value?.filename ||
            sourceAsset.value?.filepath ||
            sourceWorkflow.value?.filepath ||
            "",
    ),
);

const tasks = computed(() => uniqueOption("task"));
const models = computed(() => uniqueOption("model_family"));
const runsOns = computed(() => uniqueOption("runs_on"));
const taskFilter = ref("");
const modelFilter = ref("");
const runsOnFilter = ref("");

function uniqueOption(key) {
    const seen = new Set();
    for (const workflow of workflows.value || []) {
        const value = String(workflow?.[key] || "").trim();
        if (value) seen.add(value);
    }
    return Array.from(seen).sort((a, b) => a.localeCompare(b));
}

const filteredWorkflows = computed(() => {
    const q = query.value.trim().toLowerCase();
    return (workflows.value || []).filter((workflow) => {
        if (!isAssetMode.value) {
            if (taskFilter.value && String(workflow?.task || "") !== taskFilter.value) return false;
            if (modelFilter.value && String(workflow?.model_family || "") !== modelFilter.value) return false;
            if (runsOnFilter.value && String(workflow?.runs_on || "") !== runsOnFilter.value) return false;
        }
        if (!q) return true;
        const haystack = [
            workflow?.display_name,
            workflow?.filename,
            workflow?.description,
            workflow?.task,
            workflow?.model_family,
            workflow?.provider,
            workflow?.subfolder,
            workflow?.kind,
            workflow?.filepath,
        ].join(" ").toLowerCase();
        return haystack.includes(q);
    });
});

const selectedWorkflow = computed(() =>
    (workflows.value || []).find((workflow) => String(workflow?.filepath || "") === selectedPath.value) || null,
);

function workflowTitle(workflow) {
    return String(workflow?.display_name || workflow?.name || workflow?.filename || "Workflow");
}

function workflowMeta(workflow) {
    if (isAssetMode.value) {
        return [workflow?.kind, workflow?.mtime ? new Date(Number(workflow.mtime) * 1000).toLocaleString() : ""]
            .map((value) => String(value || "").trim())
            .filter(Boolean)
            .join(" / ");
    }
    return [workflow?.task, workflow?.model_family, workflow?.runs_on, workflow?.subfolder]
        .map((value) => String(value || "").trim())
        .filter(Boolean)
        .join(" / ");
}

function workflowThumb(workflow) {
    return String(
        workflow?.thumbnail_url ||
            workflow?.animated_thumbnail_url ||
            workflow?.thumb_url ||
            workflow?.preview_url ||
            workflow?.graph_map_thumbnail_url ||
            "",
    ).trim();
}

async function refreshWorkflows() {
    const id = ++requestId;
    loading.value = true;
    error.value = "";
    try {
        if (isAssetMode.value) {
            workflows.value = Array.isArray(workflowPickerState.items)
                ? workflowPickerState.items.filter((item) => String(item?.filepath || "").trim())
                : [];
            if (!selectedPath.value && workflows.value[0]?.filepath) {
                selectedPath.value = String(workflows.value[0].filepath);
            }
            return;
        }
        const res = await listWorkflows({ q: "*", limit: 300, sort: "mtime" }, { timeoutMs: 20_000 });
        if (id !== requestId) return;
        if (!res?.ok) {
            error.value = String(res?.error || "Failed to load workflows");
            workflows.value = [];
            return;
        }
        const list = Array.isArray(res?.data?.assets)
            ? res.data.assets
            : Array.isArray(res?.data)
                ? res.data
                : [];
        workflows.value = list.filter((workflow) => String(workflow?.filepath || "").trim());
        if (!selectedPath.value && workflows.value[0]?.filepath) {
            selectedPath.value = String(workflows.value[0].filepath);
        }
    } catch (err) {
        if (id === requestId) {
            error.value = String(err?.message || err || "Failed to load workflows");
            workflows.value = [];
        }
    } finally {
        if (id === requestId) loading.value = false;
    }
}

function applySelection() {
    if (!selectedWorkflow.value) return;
    closeWorkflowPicker(selectedWorkflow.value);
}

function cancel() {
    closeWorkflowPicker(null);
}

function onKeydown(event) {
    if (event.key === "Escape") {
        event.preventDefault();
        cancel();
    }
}

watch(
    () => workflowPickerState.open,
    (open) => {
        if (!open) {
            try {
                window.removeEventListener("keydown", onKeydown);
            } catch {}
            return;
        }
        selectedPath.value = "";
        query.value = "";
        taskFilter.value = "";
        modelFilter.value = "";
        runsOnFilter.value = "";
        void refreshWorkflows();
        try {
            window.addEventListener("keydown", onKeydown);
        } catch {}
    },
);

onBeforeUnmount(() => {
    try {
        window.removeEventListener("keydown", onKeydown);
    } catch {}
});
</script>

<template>
    <Teleport to="body">
        <div
            v-if="workflowPickerState.open"
            class="mjr-workflow-picker-backdrop"
            @mousedown.self="cancel"
        >
            <section
                class="mjr-workflow-picker-dialog"
                :class="{ 'is-asset-mode': isAssetMode }"
                role="dialog"
                aria-modal="true"
            >
                <header class="mjr-workflow-picker-header">
                    <div class="mjr-workflow-picker-title">
                        <i class="pi pi-sitemap" />
                        <span>{{ workflowPickerState.title }}</span>
                    </div>
                    <button class="mjr-workflow-picker-icon-btn" type="button" @click="cancel">
                        <i class="pi pi-times" />
                    </button>
                </header>

                <div class="mjr-workflow-picker-source" v-if="sourceName">
                        <span>{{ isAssetMode ? t("tab.workflow", "Workflow") : t("dialog.workflowThumbnailSource", "Source") }}</span>
                    <strong>{{ sourceName }}</strong>
                </div>

                <div class="mjr-workflow-picker-toolbar">
                    <label class="mjr-workflow-picker-search">
                        <i class="pi pi-search" />
                        <input
                            v-model="query"
                            type="search"
                            :placeholder="t('search.workflows', 'Search workflows...')"
                        />
                    </label>
                    <select v-if="!isAssetMode" v-model="taskFilter">
                        <option value="">{{ t("filter.task", "Task") }}</option>
                        <option v-for="item in tasks" :key="item" :value="item">{{ item }}</option>
                    </select>
                    <select v-if="!isAssetMode" v-model="modelFilter">
                        <option value="">{{ t("filter.model", "Model") }}</option>
                        <option v-for="item in models" :key="item" :value="item">{{ item }}</option>
                    </select>
                    <select v-if="!isAssetMode" v-model="runsOnFilter">
                        <option value="">{{ t("filter.runsOn", "Runs on") }}</option>
                        <option v-for="item in runsOns" :key="item" :value="item">{{ item }}</option>
                    </select>
                </div>

                <div class="mjr-workflow-picker-body">
                    <div v-if="loading" class="mjr-workflow-picker-empty">
                        {{ t("status.loading", "Loading...") }}
                    </div>
                    <div v-else-if="error" class="mjr-workflow-picker-empty is-error">
                        {{ error }}
                    </div>
                    <div v-else-if="!filteredWorkflows.length" class="mjr-workflow-picker-empty">
                        {{ t("toast.noWorkflowsFound", "No workflows found.") }}
                    </div>
                    <template v-else>
                        <button
                            v-for="workflow in filteredWorkflows"
                            :key="workflow.filepath"
                            type="button"
                            class="mjr-workflow-picker-card"
                            :class="{ 'is-selected': selectedPath === String(workflow.filepath || '') }"
                            @click="selectedPath = String(workflow.filepath || '')"
                            @dblclick="applySelection"
                        >
                            <div class="mjr-workflow-picker-thumb">
                                <img
                                    v-if="workflowThumb(workflow)"
                                    :src="workflowThumb(workflow)"
                                    :alt="workflowTitle(workflow)"
                                    loading="lazy"
                                />
                                <i v-else class="pi pi-sitemap" />
                            </div>
                            <div class="mjr-workflow-picker-card-info">
                                <strong>{{ workflowTitle(workflow) }}</strong>
                                <span>{{ workflowMeta(workflow) }}</span>
                                <small>{{ workflow.filename }}</small>
                            </div>
                        </button>
                    </template>
                </div>

                <footer class="mjr-workflow-picker-footer">
                    <button type="button" class="mjr-workflow-picker-btn" @click="cancel">
                        {{ t("action.cancel", "Cancel") }}
                    </button>
                    <button
                        type="button"
                        class="mjr-workflow-picker-btn is-primary"
                        :disabled="!selectedWorkflow"
                        @click="applySelection"
                    >
                        {{ t("action.apply", "Apply") }}
                    </button>
                </footer>
            </section>
        </div>
    </Teleport>
</template>
