export function formatFileSize(bytes: number | null | undefined): string {
    if (!bytes) return "Unknown";
    const kb = bytes / 1024;
    if (kb < 1024) return `${kb.toFixed(1)} KB`;
    const mb = kb / 1024;
    if (mb < 1024) return `${mb.toFixed(1)} MB`;
    const gb = mb / 1024;
    return `${gb.toFixed(2)} GB`;
}

export function formatShortDate(timestamp: number | string | null | undefined): string {
    if (!timestamp) return "";
    const d = new Date(Number(timestamp) * 1000);
    if (Number.isNaN(d.getTime())) return "";
    const pad = (n: any) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
