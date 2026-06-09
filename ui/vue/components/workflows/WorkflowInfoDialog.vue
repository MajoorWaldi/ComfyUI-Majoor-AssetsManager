<script setup>
import { computed, reactive, watch } from "vue";
import { setWorkflowInfo } from "../../../api/client.js";
import { t } from "../../../app/i18n.js";
import { comfyToast } from "../../../app/toast.js";
import { closeWorkflowInfoDialog, workflowInfoState } from "../../../features/workflows/workflowInfoState.js";

const form = reactive({
    task: "",
    model_family: "",
    provider: "",
    runs_on: "",
    notes: "",
});

const workflow = computed(() => workflowInfoState.workflow || null);
const title = computed(() => String(workflow.value?.display_name || workflow.value?.filename || "Workflow"));

watch(
    () => workflowInfoState.open,
    (open) => {
        if (!open) return;
        const item = workflow.value || {};
        form.task = String(item.user_task || item.task || "");
        form.model_family = String(item.user_model_family || item.model_family || "");
        form.provider = String(item.user_provider || item.provider || "");
        form.runs_on = String(item.user_runs_on || item.runs_on || "");
        form.notes = String(item.notes || "");
    },
);

function requestClose() {
    closeWorkflowInfoDialog();
}

async function apply() {
    const filepath = String(workflow.value?.filepath || "").trim();
    if (!filepath) {
        comfyToast(t("toast.workflowMissingPath", "Workflow file path is missing."), "error");
        return;
    }
    const result = await setWorkflowInfo({ filepath, ...form }, { timeoutMs: 20_000 });
    if (!result?.ok) {
        comfyToast(result?.error || t("toast.workflowSaveFailed", "Failed to save workflow."), "error");
        return;
    }
    comfyToast(t("toast.workflowUpdated", "Workflow updated"), "success", 1800);
    window?.dispatchEvent?.(new CustomEvent("mjr:reload-grid", { detail: { reason: "workflow-info" } }));
    requestClose();
}
</script>

<template>
    <Teleport to="body">
        <div
            v-if="workflowInfoState.open"
            class="mjr-workflow-picker-backdrop"
            @click.self="requestClose"
        >
            <section class="mjr-workflow-picker-dialog mjr-workflow-info-dialog">
                <header class="mjr-workflow-picker-header">
                    <div>
                        <div class="mjr-workflow-picker-title">
                            {{ t("ctx.editWorkflowInfo", "Edit infos") }}
                        </div>
                        <div class="mjr-workflow-picker-subtitle">
                            {{ title }}
                        </div>
                    </div>
                    <button
                        type="button"
                        class="mjr-workflow-picker-close"
                        @click="requestClose"
                    >
                        <i class="pi pi-times" />
                    </button>
                </header>
                <div class="mjr-workflow-info-form">
                    <label>
                        <span>Task</span>
                        <input v-model="form.task" type="text" placeholder="I2V, I2I, T2V, Image Edit..." />
                    </label>
                    <label>
                        <span>Model family</span>
                        <input v-model="form.model_family" type="text" placeholder="Flux, Qwen, Wan..." />
                    </label>
                    <label>
                        <span>Provider</span>
                        <input v-model="form.provider" type="text" placeholder="Google, ByteDance, local..." />
                    </label>
                    <label>
                        <span>Runs on</span>
                        <select v-model="form.runs_on">
                            <option value="">Auto</option>
                            <option value="local">local</option>
                            <option value="api">api</option>
                            <option value="cloud">cloud</option>
                        </select>
                    </label>
                    <label class="is-wide">
                        <span>Notes</span>
                        <textarea v-model="form.notes" rows="5" placeholder="Notes displayed on workflow hover"></textarea>
                    </label>
                </div>
                <footer class="mjr-workflow-picker-footer">
                    <button type="button" class="mjr-workflow-picker-secondary" @click="requestClose">
                        {{ t("btn.cancel", "Cancel") }}
                    </button>
                    <button type="button" class="mjr-workflow-picker-primary" @click="apply">
                        {{ t("btn.apply", "Apply") }}
                    </button>
                </footer>
            </section>
        </div>
    </Teleport>
</template>
