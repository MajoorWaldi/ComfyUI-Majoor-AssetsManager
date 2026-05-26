function unwrapCandidate(maybeInput: any) {
    let current = maybeInput;
    for (let i = 0; i < 3; i += 1) {
        if (!current || typeof current !== "object") break;
        if (!("value" in current)) break;
        const next = current.value;
        if (!next || typeof next !== "object") break;
        current = next;
    }
    return current;
}

function resolveInputElement(maybeInput: any) {
    const candidate = unwrapCandidate(maybeInput);
    if (!candidate) return null;

    const tag = String(candidate?.tagName || "").toUpperCase();
    if (tag === "INPUT" || tag === "TEXTAREA") return candidate;

    try {
        if (typeof candidate?.querySelector === "function") {
            const nested =
                candidate.querySelector("#mjr-search-input") ||
                candidate.querySelector("input.mjr-input") ||
                candidate.querySelector("input[type='text']") ||
                candidate.querySelector("textarea");
            if (nested) return nested;
        }
    } catch (e) {
        console.debug?.(e);
    }
    return null;
}

export function normalizeQuery(searchInputEl: any): string {
    const input = resolveInputElement(searchInputEl);
    const rawValue = input
        ? input.value
        : typeof searchInputEl?.value === "string"
          ? searchInputEl.value
          : "";
    const raw = String(rawValue || "").trim();
    return raw || "*";
}
