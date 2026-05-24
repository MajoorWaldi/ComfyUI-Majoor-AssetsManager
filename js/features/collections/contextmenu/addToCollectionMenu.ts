import { comfyToast } from "../../../app/toast.js";
import { t } from "../../../app/i18n.js";
import { pickRootId } from "../../../utils/ids.js";
import { openAddToCollectionMenu } from "./addToCollectionMenuState.js";

function simplifyAsset(a: any) {
    if (!a || typeof a !== "object") return null;
    const filepath = a.filepath || a.path || a?.file_info?.filepath || "";
    if (!filepath) return null;
    return {
        filepath,
        filename: a.filename || "",
        subfolder: a.subfolder || "",
        type: (a.type || "output").toLowerCase(),
        root_id: pickRootId(a),
        kind: a.kind || "",
    };
}

export async function showAddToCollectionMenu({ x, y, assets }: { x: number; y: number; assets: unknown[] }): Promise<void> {
    const selected = Array.isArray(assets) ? assets.map(simplifyAsset).filter(Boolean) : [];
    if (!selected.length) {
        comfyToast(t("toast.noValidAssetsSelected", "No valid assets selected."), "warning");
        return;
    }

    openAddToCollectionMenu({
        x: Number(x) || 0,
        y: Number(y) || 0,
        assets: selected,
    });
}
