import { reactive } from "vue";

export const workflowPickerState = reactive({
    open: false,
    mode: "workflow",
    title: "",
    sourceAsset: null as any,
    workflow: null as any,
    items: [] as any[],
    resolve: null as (((workflow: any | null) => void) | null),
});

export function openWorkflowPicker({
    title = "Select workflow",
    sourceAsset = null,
}: { title?: string; sourceAsset?: any } = {}): Promise<any | null> {
    closeWorkflowPicker(null);
    workflowPickerState.open = true;
    workflowPickerState.mode = "workflow";
    workflowPickerState.title = String(title || "Select workflow");
    workflowPickerState.sourceAsset = sourceAsset || null;
    workflowPickerState.workflow = null;
    workflowPickerState.items = [];
    return new Promise((resolve) => {
        workflowPickerState.resolve = resolve;
    });
}

export function openWorkflowAssetPicker({
    title = "Select asset",
    workflow = null,
    items = [],
}: { title?: string; workflow?: any; items?: any[] } = {}): Promise<any | null> {
    closeWorkflowPicker(null);
    workflowPickerState.open = true;
    workflowPickerState.mode = "asset";
    workflowPickerState.title = String(title || "Select asset");
    workflowPickerState.sourceAsset = null;
    workflowPickerState.workflow = workflow || null;
    workflowPickerState.items = Array.isArray(items) ? items.filter(Boolean) : [];
    return new Promise((resolve) => {
        workflowPickerState.resolve = resolve;
    });
}

export function closeWorkflowPicker(result: any | null = null): void {
    const resolver = workflowPickerState.resolve;
    workflowPickerState.open = false;
    workflowPickerState.mode = "workflow";
    workflowPickerState.title = "";
    workflowPickerState.sourceAsset = null;
    workflowPickerState.workflow = null;
    workflowPickerState.items = [];
    workflowPickerState.resolve = null;
    if (typeof resolver === "function") {
        try {
            resolver(result || null);
        } catch (e: any) {
            console.debug?.(e);
        }
    }
}
