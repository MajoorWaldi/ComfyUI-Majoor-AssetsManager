export {};

declare global {
    interface Window {
        __MJR_RUNTIME_STATUS_HIDE_TIMEOUT__?: ReturnType<typeof setTimeout> | null;
        __MJR_RUNTIME_STATUS_HIDDEN__?: boolean;
        __MJR_RUNTIME_STATUS_SETTINGS_LISTENER__?: ((event: any) => void) | null;

        __MJR_RUNTIME_STATUS_INFLIGHT__?: boolean;
        __MJR_RUNTIME_STATUS_MISS_COUNT__?: number;
        __MJR_RUNTIME_STATUS_INTERVAL__?: ReturnType<typeof setInterval> | null;
    }
}
