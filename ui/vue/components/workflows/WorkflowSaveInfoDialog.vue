<script setup lang="ts">
import { computed, reactive, watch } from "vue";
import { t } from "../../../app/i18n.js";
import {
    closeWorkflowSaveInfoDialog,
    workflowSaveInfoState,
} from "../../../features/workflows/workflowSaveInfoState.js";

const form = reactive({
    name: "",
    task: "",
    model_family: "",
    provider: "",
    runs_on: "",
    notes: "",
});

const initial = computed(() => workflowSaveInfoState.initial || {});
const title = computed(() => t("dialog.saveWorkflowWithInfo", "Save workflow"));
const subtitle = computed(() =>
    t(
        "dialog.workflowInfoAutoFallback",
        "Leave fields empty to use automatic workflow detection.",
    ),
);

watch(
    () => workflowSaveInfoState.open,
    (open) => {
        if (!open) return;
        const item = initial.value || {};
        form.name = String(item.name || item.workflow?.name || item.workflow?.title || "workflow").trim();
        form.task = String(item.task || "");
        form.model_family = String(item.model_family || "");
        form.provider = String(item.provider || "");
        form.runs_on = String(item.runs_on || "");
        form.notes = String(item.notes || "");
    },
);

function requestClose() {
    closeWorkflowSaveInfoDialog(null);
}

function apply() {
    const name = String(form.name || "").trim();
    if (!name) return;
    closeWorkflowSaveInfoDialog({
        name,
        task: String(form.task || "").trim(),
        model_family: String(form.model_family || "").trim(),
        provider: String(form.provider || "").trim(),
        runs_on: String(form.runs_on || "").trim(),
        notes: String(form.notes || "").trim(),
    });
}
</script>

<template>
    <Teleport to="body">
        <div
            v-if="workflowSaveInfoState.open"
            class="mjr-workflow-picker-backdrop"
            @click.self="requestClose"
        >
            <section class="mjr-workflow-picker-dialog mjr-workflow-info-dialog">
                <header class="mjr-workflow-picker-header">
                    <div>
                        <div class="mjr-workflow-picker-title">
                            {{ title }}
                        </div>
                        <div class="mjr-workflow-picker-subtitle">
                            {{ subtitle }}
                        </div>
                    </div>
                    <MButton
                        type="button"
                        class="mjr-workflow-picker-close"
                        @click="requestClose"
                    >
                        <i class="pi pi-times" />
                    </MButton>
                </header>
                <div class="mjr-workflow-info-form">
                    <label class="is-wide">
                        <span>{{ t("dialog.workflowSaveName", "Workflow name") }}</span>
                        <MInputText v-model="form.name" type="text" placeholder="workflow" @keydown.enter.prevent="apply" />
                    </label>
                    <label>
                        <span>Task</span>
                        <MInputText v-model="form.task" type="text" placeholder="Auto" />
                    </label>
                    <label>
                        <span>Model family</span>
                        <MInputText v-model="form.model_family" type="text" placeholder="Auto" />
                    </label>
                    <label>
                        <span>Provider</span>
                        <MInputText v-model="form.provider" type="text" placeholder="Auto" />
                    </label>
                    <label>
                        <span>Runs on</span>
                        <MSelect
                            v-model="form.runs_on"
                            :options="[
                                { label: 'Auto', value: '' },
                                { label: 'local', value: 'local' },
                                { label: 'api', value: 'api' },
                                { label: 'cloud', value: 'cloud' },
                            ]"
                            option-label="label"
                            option-value="value"
                            placeholder="Auto"
                        />
                    </label>
                    <label class="is-wide">
                        <span>Notes</span>
                        <MTextarea
                            v-model="form.notes"
                            rows="5"
                            placeholder="Notes displayed on workflow hover"
                        />
                    </label>
                </div>
                <footer class="mjr-workflow-picker-footer">
                    <MButton type="button" class="mjr-workflow-picker-secondary" @click="requestClose">
                        {{ t("btn.cancel", "Cancel") }}
                    </MButton>
                    <MButton
                        type="button"
                        class="mjr-workflow-picker-primary"
                        :disabled="!String(form.name || '').trim()"
                        @click="apply"
                    >
                        {{ t("btn.save", "Save") }}
                    </MButton>
                </footer>
            </section>
        </div>
    </Teleport>
</template>
