import { reactive } from "vue";

export const workflowInfoState = reactive({
    open: false,
    workflow: null as any,
});

export function openWorkflowInfoDialog(workflow: any): void {
    workflowInfoState.workflow = workflow || null;
    workflowInfoState.open = true;
}

export function closeWorkflowInfoDialog(): void {
    workflowInfoState.open = false;
    workflowInfoState.workflow = null;
}
