export function extractOutputFiles(output: unknown): Array<{ filename: string; subfolder: string; type: string; path?: string }> {
    const files: Array<{ filename: string; subfolder: string; type: string; path?: string }> = [];
    const seen = new Set();
    const MAX_ITEMS = 500;
    const MAX_DEPTH = 4;
    const MAX_SCAN_ITEMS = 2000;
    const SUPPORTED_PATH_EXT_RE =
        /\.(png|jpe?g|webp|gif|bmp|tiff?|avif|heic|heif|apng|hdr|svg|mp4|webm|mov|mkv|avi|m4v|mp3|wav|flac|ogg|glb|gltf|obj|fbx|ply|stl)$/i;
    const visited = typeof WeakSet !== "undefined" ? new WeakSet() : null;

    const buildKey = ({ type, subfolder, filename, path }: { type?: string; subfolder?: string; filename?: string; path?: string | null | undefined }) => {
        if (path) return `path|${String(path).trim().toLowerCase()}`;
        return `${type || ""}|${subfolder || ""}|${filename || ""}`.toLowerCase();
    };

    const pushItem = (item: Record<string, unknown>) => {
        if (!item) return;
        const rawPath = (item.path || item.filepath || item.fullpath || item.fullPath || item.full_path) as
            | string
            | null
            | undefined;
        let filename = item.filename as string | null | undefined;
        if (!filename && rawPath) {
            const parts = String(rawPath).split(/[/\\\\]/);
            filename = parts[parts.length - 1];
        }
        if (!filename) return;
        filename = String(filename);
        if (!filename) return;
        const subfolder = String(item.subfolder ?? item.sub_folder ?? item.subFolder ?? "");
        const type = String(item.type ?? item.output_type ?? "output");
        const key = buildKey({ type, subfolder, filename, path: rawPath });
        if (seen.has(key)) return;
        seen.add(key);
        const entry: { filename: string; subfolder: string; type: string; path?: string } = { filename, subfolder, type };
        if (rawPath) entry.path = String(rawPath);
        files.push(entry);
    };

    const pushPathString = (value: unknown) => {
        if (typeof value !== "string") return;
        const raw = value.trim().replace(/^['"]|['"]$/g, "");
        if (!raw || !SUPPORTED_PATH_EXT_RE.test(raw)) return;
        const parts = raw.split(/[/\\\\]/);
        const filename = parts[parts.length - 1];
        if (!filename) return;
        const key = buildKey({ type: "output", subfolder: "", filename, path: raw });
        if (seen.has(key)) return;
        seen.add(key);
        files.push({ filename, subfolder: "", type: "output", path: raw });
    };

    const addItems = (items: unknown) => {
        if (typeof items === "string") {
            pushPathString(items);
            return;
        }
        if (!Array.isArray(items)) return;
        let scanned = 0;
        for (const item of items) {
            if (files.length >= MAX_ITEMS || scanned >= MAX_SCAN_ITEMS) break;
            scanned += 1;
            if (item && typeof item === "object" && "filename" in item) {
                pushItem(item);
            } else if (typeof item === "string") {
                pushPathString(item);
            } else {
                walk(item, 1);
            }
        }
    };

    const walk = (node: unknown, depth: number): void => {
        if (!node || depth > MAX_DEPTH || files.length >= MAX_ITEMS) return;
        if (typeof node !== "object" || node === null) return;
        if (visited) {
            if (visited.has(node)) return;
            visited.add(node);
        }

        if (Array.isArray(node)) {
            let scanned = 0;
            for (const item of node) {
                if (files.length >= MAX_ITEMS || scanned >= MAX_SCAN_ITEMS) break;
                scanned += 1;
                if (item && typeof item === "object" && "filename" in item) {
                    pushItem(item as Record<string, unknown>);
                } else if (typeof item === "string") {
                    pushPathString(item);
                } else {
                    walk(item, depth + 1);
                }
            }
            return;
        }

        // Not an array — cast for property access
        const n = node as Record<string, unknown>;
        // Common ComfyUI output keys
        if (n.images || n.gifs || n.videos || n.meshes || n.mesh || n.audio) {
            addItems(n.images);
            addItems(n.gifs);
            addItems(n.videos);
            addItems(n.meshes);
            addItems(n.mesh);
            addItems(n.audio);
        }

        // Known wrappers
        if (n.output) walk(n.output, depth + 1);
        if (n.outputs) walk(n.outputs, depth + 1);
        if (n.result) walk(n.result, depth + 1);
        if (n.data) walk(n.data, depth + 1);

        // Shallow scan of object values for nested outputs
        if (depth < MAX_DEPTH) {
            for (const value of Object.values(n)) {
                if (files.length >= MAX_ITEMS) break;
                if (typeof value === "string") {
                    pushPathString(value);
                    continue;
                }
                if (!value || typeof value !== "object") continue;
                const vn = value as Record<string, unknown>;
                if (
                    vn.images ||
                    vn.gifs ||
                    vn.videos ||
                    vn.meshes ||
                    vn.mesh ||
                    vn.audio
                ) {
                    addItems(vn.images);
                    addItems(vn.gifs);
                    addItems(vn.videos);
                    addItems(vn.meshes);
                    addItems(vn.mesh);
                    addItems(vn.audio);
                    continue;
                }
                walk(value, depth + 1);
            }
        }
    };

    walk(output, 0);
    return files;
}
