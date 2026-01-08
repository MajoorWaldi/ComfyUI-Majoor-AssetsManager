export function normalizeQuery(searchInputEl) {
    const raw = String(searchInputEl?.value || "").trim();
    return raw || "*";
}

