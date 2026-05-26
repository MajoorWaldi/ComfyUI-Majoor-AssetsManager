import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = dirname(fileURLToPath(import.meta.url));
const VUE_DIR = join(ROOT, "../vue");
const NATIVE_CONTROL_RE = /<(button|input|select|textarea)\b/i;

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
                const source = readFileSync(file, "utf8");
                const match = source.match(NATIVE_CONTROL_RE);
                return match
                    ? `${relative(ROOT, file).replaceAll("\\", "/")}: native <${match[1]}>`
                    : null;
            })
            .filter(Boolean);

        expect(violations).toEqual([]);
    });
});
