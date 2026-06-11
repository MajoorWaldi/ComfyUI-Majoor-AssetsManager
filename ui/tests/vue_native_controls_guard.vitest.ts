import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = dirname(fileURLToPath(import.meta.url));
const VUE_DIR = join(ROOT, "../vue");
const NATIVE_CONTROL_RE = /<(button|input|select|textarea)\b/i;

// Ratchet allowlist: pre-existing violations awaiting a dedicated UI
// modernization pass. Do NOT add new entries — migrate to the shared UI
// components instead. Remove entries here as files get migrated.
const ALLOWLIST = new Set([
    "../vue/components/grid/AssetCardInner.vue",
    "../vue/components/grid/VirtualAssetGridHost.vue",
    "../vue/components/panel/HeaderSection.vue",
    "../vue/components/panel/sidebar/SidebarWorkflowSection.vue",
    "../vue/components/workflows/WorkflowInfoDialog.vue",
    "../vue/components/workflows/WorkflowPickerDialog.vue",
]);

function collectVueFiles(dir) {
    const files = [];
    for (const entry of readdirSync(dir)) {
        const fullPath = join(dir, entry);
        const stat = statSync(fullPath);
        if (stat.isDirectory()) {
            files.push(...collectVueFiles(fullPath));
        } else if (entry.endsWith(".vue")) {
            files.push(fullPath);
        }
    }
    return files;
}

describe("Vue UI modernization guard", () => {
    it("keeps native form controls out of Vue SFC templates", () => {
        const violations = collectVueFiles(VUE_DIR)
            .map((file) => {
                const relPath = relative(ROOT, file).replaceAll("\\", "/");
                if (ALLOWLIST.has(relPath)) return null;
                const source = readFileSync(file, "utf8");
                const match = source.match(NATIVE_CONTROL_RE);
                return match ? `${relPath}: native <${match[1]}>` : null;
            })
            .filter(Boolean);

        expect(violations).toEqual([]);
    });

    it("keeps the allowlist free of stale entries", () => {
        const stale = [...ALLOWLIST].filter((relPath) => {
            const fullPath = join(ROOT, relPath);
            try {
                const source = readFileSync(fullPath, "utf8");
                return !NATIVE_CONTROL_RE.test(source);
            } catch {
                return true;
            }
        });

        expect(stale).toEqual([]);
    });
});
