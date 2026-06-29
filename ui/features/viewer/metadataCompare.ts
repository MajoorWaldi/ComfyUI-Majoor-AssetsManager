import { t } from "../../app/i18n.js";
import { buildGenInfoComparison } from "../metadata/genInfoCompare.js";

function makeText(value: any): string {
    const text = String(value ?? "").trim();
    return text || "-";
}

function makeCell(value: any, changed: boolean): HTMLDivElement {
    const cell = document.createElement("div");
    cell.textContent = makeText(value);
    cell.style.cssText = [
        "min-width:0",
        "white-space:pre-wrap",
        "overflow-wrap:anywhere",
        "font-size:11px",
        "line-height:1.35",
        "color:rgba(255,255,255,0.84)",
        changed ? "background:rgba(255,193,7,0.10)" : "background:rgba(255,255,255,0.035)",
        "border:1px solid rgba(255,255,255,0.08)",
        "border-radius:6px",
        "padding:6px 7px",
    ].join(";");
    return cell;
}

export function buildMetadataComparePanel(left: any, right: any): HTMLDivElement | null {
    const rows = buildGenInfoComparison(left, right).filter((row: any) => {
        return makeText(row?.left) !== "-" || makeText(row?.right) !== "-";
    });
    if (!rows.length) return null;

    const root = document.createElement("div");
    root.style.cssText =
        "display:flex;flex-direction:column;gap:8px;margin:0 0 14px 0;padding:10px;border:1px solid rgba(144,220,220,0.22);border-radius:10px;background:rgba(90,220,220,0.06);";

    const title = document.createElement("div");
    title.textContent = t("viewer.metadataCompare", "Metadata compare");
    title.style.cssText =
        "font-size:12px;font-weight:700;color:rgba(255,255,255,0.9);letter-spacing:0.02em";
    root.appendChild(title);

    for (const row of rows.slice(0, 24)) {
        const item = document.createElement("div");
        item.style.cssText = "display:grid;grid-template-columns:minmax(74px,0.42fr) 1fr 1fr;gap:6px;align-items:start";

        const label = document.createElement("div");
        label.textContent = String(row?.label || row?.key || "").trim();
        label.style.cssText =
            "font-size:11px;font-weight:650;color:rgba(255,255,255,0.70);padding-top:6px;overflow-wrap:anywhere";
        item.appendChild(label);

        const changed = Boolean(row?.changed);
        item.appendChild(makeCell(row?.left, changed));
        item.appendChild(makeCell(row?.right, changed));
        root.appendChild(item);
    }

    return root;
}
