/**
 * Vite build config — ComfyUI-Majoor-AssetsManager
 *
 * Outputs a single ES-module bundle (+ lazy chunks) into js_dist/.
 * WEB_DIRECTORY in __init__.py points to js_dist/ so ComfyUI serves the built files.
 *
 * ComfyUI's own scripts (../../scripts/app.js, ../../scripts/api.js …) are kept
 * as external imports so the browser resolves them at runtime — they are never
 * bundled into our output.  Vue and Pinia are bundled with the extension to avoid
 * any version-mismatch with whatever ComfyUI ships internally.
 */

import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { readFileSync } from "fs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const NODE_ENV_LITERAL = JSON.stringify("production");

function stripNodeEnvForBrowser() {
    return {
        name: "mjr-strip-node-env-for-browser",
        renderChunk(code) {
            if (!code.includes("process.env.NODE_ENV")) return null;
            return {
                code: code.replaceAll("process.env.NODE_ENV", NODE_ENV_LITERAL),
                map: null,
            };
        },
    };
}

function emitStaticRuntimeAssets() {
    const assets = [];
    return {
        name: "mjr-emit-static-runtime-assets",
        generateBundle() {
            for (const name of assets) {
                this.emitFile({
                    type: "asset",
                    fileName: `assets/${name}`,
                    source: readFileSync(resolve(__dirname, "js", "assets", name)),
                });
            }
        },
    };
}

export default defineConfig({
    plugins: [vue(), stripNodeEnvForBrowser(), emitStaticRuntimeAssets()],
    define: {
        "process.env.NODE_ENV": NODE_ENV_LITERAL,
    },

    build: {
        lib: {
            entry: resolve(__dirname, "js/entry.ts"),
            formats: ["es"],
            // Always emit as "entry.js" — no version-hash in the filename so
            // ComfyUI finds it by the stable name it was registered under.
            fileName: () => "entry.js",
        },

        outDir: "js_dist",
        emptyOutDir: true,
        assetsInlineLimit: 0,

        rollupOptions: {
            /**
             * Keep ComfyUI's core scripts as external.
             * `isResolved` is false when Rollup sees the raw import specifier
             * (before it tries to read the file from disk).  Marking them external
             * at this stage means the original relative string is preserved verbatim
             * in the output — the browser resolves it correctly at runtime.
             */
            external: (id, _importer, isResolved) => {
                if (!isResolved) {
                    return (
                        id.startsWith("../../scripts/") ||
                        id.startsWith("../../web/") ||
                        id.startsWith("../../../scripts/")
                    );
                }
                return false;
            },

            output: {
                format: "es",
                entryFileNames: "entry.js",
                // Lazy-loaded modules (LiveStreamTracker, NodeStreamController…)
                // become separate chunks so they don't bloat the initial load.
                chunkFileNames: "chunks/[name]-[hash].js",
                assetFileNames: "assets/[name].[ext]",
                // Keep framework and UI-library costs visible as shared chunks.
                // Full externalization stays deferred until ComfyUI host runtime
                // compatibility is verified across stable + nightly.
                manualChunks(id) {
                    if (
                        id.includes("node_modules/primevue/") ||
                        id.includes("node_modules/@primevue/") ||
                        id.includes("node_modules/@primeuix/")
                    ) {
                        return "mjr-primevue";
                    }
                    if (id.includes("node_modules/vue/") || id.includes("node_modules/pinia/")) {
                        return "mjr-vue-vendor";
                    }
                    return null;
                },
            },
        },

        // Expose source-maps in development builds for easy debugging.
        sourcemap: process.env.NODE_ENV !== "production",
    },
});
