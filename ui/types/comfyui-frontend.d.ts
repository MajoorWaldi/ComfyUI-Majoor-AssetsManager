import type { LGraph, LGraphCanvas } from "@comfyorg/litegraph";

type MajoorSettingCategory = [string, ...string[]] | string[];

interface MajoorSettingDefinition {
    id: string;
    name?: string;
    tooltip?: string;
    category?: MajoorSettingCategory;
    type?: string;
    defaultValue?: unknown;
    experimental?: boolean;
    deprecated?: boolean;
    disabled?: boolean | (() => boolean);
    options?: unknown;
    onChange?: (value: unknown, oldValue?: unknown) => void | Promise<void>;
}

interface MajoorExtensionToast {
    add(message: unknown): void;
    addAlert?(message: string): void;
}

interface MajoorExtensionDialog {
    alert?(payload: string | { title?: string; message?: string }): Promise<void> | void;
    confirm?(payload: string | { title?: string; message?: string }): Promise<boolean> | boolean;
    prompt?(
        payload:
            | string
            | {
                  title?: string;
                  message?: string;
                  defaultValue?: string;
              },
    ): Promise<string | null | undefined> | string | null | undefined;
}

interface MajoorSidebarController {
    activeSidebarTabId?: string;
    activeSidebarTab?: { id?: string };
    registerSidebarTab?(tab: unknown): void;
    activateSidebarTab?(id: string): void;
    openSidebarTab?(id: string): void;
    selectSidebarTab?(id: string): void;
    setActiveSidebarTab?(id: string): void;
    showSidebarTab?(id: string): void;
    toggleSidebarTab?(id: string): void;
}

interface MajoorBottomPanelController {
    registerBottomPanelTab?(tab: unknown): void;
}

interface MajoorExtensionManager {
    toast?: MajoorExtensionToast;
    dialog?: MajoorExtensionDialog;
    settings?: unknown;
    setting?: {
        get?(id: string): unknown;
        set?(id: string, value: unknown): void | Promise<void>;
    };
    sidebarTab?: MajoorSidebarController;
    sidebarTabStore?: MajoorSidebarController;
    workspaceStore?: {
        sidebarTab?: MajoorSidebarController;
    };
    bottomPanel?: MajoorBottomPanelController;
    bottomPanelStore?: MajoorBottomPanelController;
    registerSidebarTab?(tab: unknown): void;
    registerBottomPanelTab?(tab: unknown): void;
    registerCommand?(command: unknown): void;
    addCommand?(command: unknown): void;
    registerKeybinding?(keybinding: unknown): void;
    addKeybinding?(keybinding: unknown): void;
    activateSidebarTab?(id: string): void;
    openSidebarTab?(id: string): void;
    selectSidebarTab?(id: string): void;
    setActiveSidebarTab?(id: string): void;
    showSidebarTab?(id: string): void;
    activeSidebarTabId?: string;
    activeSidebarTab?: { id?: string };
}

interface MajoorComfyApi {
    fetchApi?(route: string, options?: RequestInit): Promise<Response>;
    apiURL?(route: string): string;
    settings?: unknown;
}

interface MajoorComfyApp {
    api?: MajoorComfyApi;
    ui?: {
        api?: MajoorComfyApi;
        app?: MajoorComfyApp;
        extensionManager?: MajoorExtensionManager;
        settings?: unknown;
        dialog?: { show(message: unknown): void; element?: HTMLElement };
        $el?: (tag: string, props?: Record<string, unknown>, children?: unknown) => HTMLElement;
        ComfyDialog?: new () => {
            element: HTMLElement;
            show(content: unknown): void;
            close(): void;
        };
    };
    canvas?: LGraphCanvas | unknown;
    graph?: LGraph | unknown;
    extensionManager?: MajoorExtensionManager;
    settings?: unknown;
    loadGraphData?(data: unknown): unknown;
}

declare global {
    interface Window {
        app?: MajoorComfyApp;
        api?: MajoorComfyApi;
        LiteGraph?: unknown;
        LGraphNode?: unknown;
        MajoorAssetsManager?: unknown;
        MajoorMetrics?: unknown;
        __MJR_EXECUTION_RUNTIME__?: unknown;
        __MJR_COMFY_LANG_SYNC_TIMER__?: ReturnType<typeof setInterval> | null;
        __MJR_RUNTIME_STATUS_INFLIGHT__?: boolean;
        __MJR_RUNTIME_STATUS_INTERVAL__?: ReturnType<typeof setInterval> | null;
        __MJR_RUNTIME_STATUS_MISS_COUNT__?: number;
        _mjrSettingsSaveFailAt?: number;
    }
}

declare module "*.vue" {
    import type { DefineComponent } from "vue";

    const component: DefineComponent<Record<string, unknown>, Record<string, unknown>, unknown>;
    export default component;
}
