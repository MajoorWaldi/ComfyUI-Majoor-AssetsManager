import { APP_CONFIG } from "../app/config.js";
import { comfyConfirm } from "../app/dialogs.js";
import { t } from "../app/i18n.js";

export async function confirmDeletion(count, label) {
    if (!APP_CONFIG.DELETE_CONFIRMATION) return true;
    const message =
        count > 1
            ? t("dialog.deleteSelectedFiles", "Delete {count} selected files?", { count })
            : t("dialog.deleteSingleFile", 'Delete "{label}"?', {
                  label: String(label || t("label.thisFile", "this file")),
              });
    return comfyConfirm(message, t("dialog.confirmDeleteTitle", "Majoor: Confirm delete"));
}
