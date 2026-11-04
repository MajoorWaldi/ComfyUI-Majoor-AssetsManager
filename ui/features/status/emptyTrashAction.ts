/**
 * Empty-trash action flow for the Status panel.
 *
 * Kept free of DOM and module imports so the whole confirm → POST → toast
 * flow is unit-testable in a plain Node environment: every dependency is
 * injected. The Status panel wires real implementations; tests wire fakes.
 */

export interface EmptyTrashDeps {
    getStatus: () => Promise<any>;
    empty: () => Promise<any>;
    confirm: (message: string, title: string) => Promise<boolean> | boolean;
    toast: (message: string, level: string, duration?: number, options?: any) => void;
    formatBytes: (bytes: number) => string;
    translate: (key: string, fallback: string, params?: Record<string, any>) => string;
}

export type EmptyTrashOutcome = "empty" | "removed" | "cancelled" | "unsupported" | "error";

function _translateDefault(
    deps: EmptyTrashDeps,
    key: string,
    fallback: string,
    params?: Record<string, any>,
) {
    try {
        return deps.translate(key, fallback, params);
    } catch {
        return fallback;
    }
}

export async function runEmptyTrashAction(deps: EmptyTrashDeps): Promise<EmptyTrashOutcome> {
    const t = (key: string, fallback: string, params?: Record<string, any>) =>
        _translateDefault(deps, key, fallback, params);

    let status: any = null;
    try {
        status = await deps.getStatus();
    } catch (error: any) {
        deps.toast(
            String(
                error?.message || error || t("toast.trashStatusFailed", "Failed to check trash"),
            ),
            "error",
            4500,
        );
        return "error";
    }
    if (!status?.ok) {
        deps.toast(
            String(status?.error || t("toast.trashStatusFailed", "Failed to check trash")),
            "error",
            4500,
        );
        return "error";
    }

    const data = status?.data || {};
    if (data?.supported === false) {
        deps.toast(
            t("toast.trashUnsupported", "Trash is not supported on this platform"),
            "info",
            3000,
        );
        return "unsupported";
    }

    const count = Number(data?.count) || 0;
    if (!count) {
        deps.toast(t("toast.trashIsEmpty", "Trash is empty"), "info", 2200);
        return "empty";
    }

    const size = Number(data?.bytes) || 0;
    const message = t(
        "dialog.emptyTrash.confirm",
        "Permanently delete {count} trashed files ({size}) that came from Majoor's folders? This cannot be undone.",
        { count, size: deps.formatBytes(size) },
    );
    let confirmed = false;
    try {
        confirmed = !!(await deps.confirm(message, t("dialog.emptyTrash.title", "Empty trash?")));
    } catch {
        confirmed = false;
    }
    if (!confirmed) return "cancelled";

    let result: any = null;
    try {
        result = await deps.empty();
    } catch (error: any) {
        deps.toast(
            String(error?.message || error || t("toast.trashEmptyFailed", "Failed to empty trash")),
            "error",
            4500,
        );
        return "error";
    }
    if (!result?.ok) {
        deps.toast(
            String(result?.error || t("toast.trashEmptyFailed", "Failed to empty trash")),
            "error",
            4500,
        );
        return "error";
    }

    const removed = Number(result?.data?.removed) || 0;
    const failed = Array.isArray(result?.data?.failed) ? result.data.failed : [];
    const skippedDirs = Number(result?.data?.skipped_dirs) || 0;
    deps.toast(
        t("toast.trashRemoved", "{count} files removed ({size})", {
            count: removed,
            size: deps.formatBytes(Number(result?.data?.bytes) || 0),
        }),
        "success",
        3200,
    );
    if (failed.length) {
        deps.toast(
            t("toast.trashFailures", "{count} entries could not be removed", {
                count: failed.length,
            }),
            "warning",
            4500,
        );
    }
    if (skippedDirs > 0) {
        deps.toast(
            t("toast.trashSkippedDirs", "{count} directories in the trash were not removed", {
                count: skippedDirs,
            }),
            "warning",
            4500,
        );
    }
    return "removed";
}
