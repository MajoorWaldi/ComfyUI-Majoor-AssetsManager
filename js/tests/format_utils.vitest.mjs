import { describe, expect, it } from "vitest";

import { formatDate, formatDuration, formatTime } from "../utils/format.js";

describe("formatDate", () => {
    it("formate une date ISO locale au format JJ/MM", () => {
        // ISO sans timezone → interprété en heure locale
        expect(formatDate("2026-04-25T12:00:00")).toBe("25/04");
    });

    it("formate une date numérique (timestamp Unix en secondes)", () => {
        // 2026-01-01T12:00:00 UTC = 1767182400 → local date peut varier par tz,
        // on vérifie simplement que le résultat est au format XX/XX
        const result = formatDate(1767182400);
        expect(result).toMatch(/^\d{2}\/\d{2}$/);
    });

    it("formate une chaîne numérique comme un timestamp Unix", () => {
        const asNumber = formatDate(1767182400);
        const asString = formatDate("1767182400");
        expect(asString).toBe(asNumber);
    });

    it("retourne vide pour les valeurs falsy", () => {
        expect(formatDate(null)).toBe("");
        expect(formatDate(undefined)).toBe("");
        expect(formatDate("")).toBe("");
    });

    it("retourne vide pour une date invalide", () => {
        expect(formatDate("not-a-date")).toBe("");
        expect(formatDate("NaN")).toBe("");
    });
});

describe("formatTime", () => {
    it("formate une heure ISO locale au format HH:MM avec zéros padding", () => {
        expect(formatTime("2026-04-25T09:05:00")).toBe("09:05");
        expect(formatTime("2026-04-25T14:30:00")).toBe("14:30");
    });

    it("retourne vide pour les valeurs falsy ou invalides", () => {
        expect(formatTime(null)).toBe("");
        expect(formatTime("")).toBe("");
        expect(formatTime("invalid")).toBe("");
    });

    it("traite les chaînes numériques comme timestamps Unix", () => {
        const asNumber = formatTime(1767182400);
        const asString = formatTime("1767182400");
        expect(asString).toBe(asNumber);
    });
});

describe("formatDuration", () => {
    it("retourne vide pour les valeurs falsy", () => {
        expect(formatDuration(0)).toBe("");
        expect(formatDuration(null)).toBe("");
        expect(formatDuration(undefined)).toBe("");
    });

    it("formate les durées inférieures à 60 secondes", () => {
        expect(formatDuration(30)).toBe("30s");
        expect(formatDuration(1)).toBe("1s");
        expect(formatDuration(59)).toBe("59s");
    });

    it("arrondit les secondes pour les durées < 60s", () => {
        expect(formatDuration(29.7)).toBe("30s");
        expect(formatDuration(1.2)).toBe("1s");
    });

    it("formate les durées avec minutes et secondes", () => {
        expect(formatDuration(60)).toBe("1m 0s");
        expect(formatDuration(90)).toBe("1m 30s");
        expect(formatDuration(3661)).toBe("61m 1s");
    });

    it("arrondit les secondes restantes dans le format m/s", () => {
        expect(formatDuration(61.8)).toBe("1m 2s");
    });
});
