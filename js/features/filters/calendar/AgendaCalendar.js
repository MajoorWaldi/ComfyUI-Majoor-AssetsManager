import { get } from "../../../api/client.js";
import { buildDateHistogramURL } from "../../../api/endpoints.js";
import { t } from "../../../app/i18n.js";

const pad2 = (n) => String(n).padStart(2, "0");

function safeParseISODate(value) {
    try {
        const s = String(value || "").trim();
        if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return null;
        const [y, m, d] = s.split("-").map((x) => Number(x));
        if (!y || !m || !d) return null;
        const dt = new Date(y, m - 1, d);
        if (Number.isNaN(dt.getTime())) return null;
        if (dt.getFullYear() !== y || dt.getMonth() !== m - 1 || dt.getDate() !== d) return null;
        return dt;
    } catch {
        return null;
    }
}

function formatISODate(dt) {
    try {
        const y = dt.getFullYear();
        const m = dt.getMonth() + 1;
        const d = dt.getDate();
        return `${y}-${pad2(m)}-${pad2(d)}`;
    } catch {
        return "";
    }
}

function formatMonthKey(dt) {
    try {
        const y = dt.getFullYear();
        const m = dt.getMonth() + 1;
        return `${y}-${pad2(m)}`;
    } catch {
        return "";
    }
}

function startOfMonth(dt) {
    try {
        return new Date(dt.getFullYear(), dt.getMonth(), 1);
    } catch {
        return new Date();
    }
}

function addMonths(dt, delta) {
    try {
        return new Date(dt.getFullYear(), dt.getMonth() + delta, 1);
    } catch {
        return new Date();
    }
}

function daysInMonth(dt) {
    try {
        return new Date(dt.getFullYear(), dt.getMonth() + 1, 0).getDate();
    } catch {
        return 31;
    }
}

function weekdayMonday0(dt) {
    try {
        // JS: 0=Sun..6=Sat => convert to Mon=0..Sun=6
        return (dt.getDay() + 6) % 7;
    } catch {
        return 0;
    }
}

function safeSetHiddenInputValue(hiddenInput, nextValue) {
    if (!hiddenInput) return;
    try {
        const prev = String(hiddenInput.value || "");
        hiddenInput.value = nextValue || "";
        if (prev !== hiddenInput.value) {
            hiddenInput.dispatchEvent?.(new Event("change", { bubbles: true }));
        }
    } catch (e) { console.debug?.(e); }
}

async function fetchHistogram({ state, monthKey }) {
    try {
        const scope = String(state?.scope || "output");
        if (scope === "collection") {
            return { ok: true, days: {} };
        }

        const url = buildDateHistogramURL({
            scope,
            customRootId: state?.customRootId || null,
            month: monthKey,
            kind: state?.kindFilter || null,
            hasWorkflow: !!state?.workflowOnly,
            minRating: Number(state?.minRating || 0) || 0
        });
        const res = await get(url);
        if (!res || !res.ok) return { ok: false, error: res?.error || "Histogram error" };
        const days = res?.data?.days && typeof res.data.days === "object" ? res.data.days : {};
        return { ok: true, days };
    } catch (e) {
        return { ok: false, error: e?.message || "Histogram error" };
    }
}

export function createAgendaCalendar({ container, hiddenInput, state, onRequestReloadGrid = null } = {}) {
    if (!container || !(container instanceof HTMLElement) || !hiddenInput) {
        return { dispose() {} };
    }

    const root = document.createElement("div");
    root.className = "mjr-agenda-calendar";

    const header = document.createElement("div");
    header.className = "mjr-agenda-header";

    const prevBtn = document.createElement("button");
    prevBtn.type = "button";
    prevBtn.className = "mjr-btn mjr-agenda-nav";
    prevBtn.textContent = "‹";

    const monthLabel = document.createElement("div");
    monthLabel.className = "mjr-agenda-month";
    monthLabel.textContent = "";

    const nextBtn = document.createElement("button");
    nextBtn.type = "button";
    nextBtn.className = "mjr-btn mjr-agenda-nav";
    nextBtn.textContent = "›";

    header.appendChild(prevBtn);
    header.appendChild(monthLabel);
    header.appendChild(nextBtn);

    const grid = document.createElement("div");
    grid.className = "mjr-agenda-grid";

    const footer = document.createElement("div");
    footer.className = "mjr-agenda-footer";

    const clearBtn = document.createElement("button");
    clearBtn.type = "button";
    clearBtn.className = "mjr-btn mjr-agenda-clear";
    clearBtn.textContent = "Clear";

    const refreshBtn = document.createElement("button");
    refreshBtn.type = "button";
    refreshBtn.className = "mjr-btn mjr-agenda-refresh";
    refreshBtn.textContent = "Refresh";

    footer.appendChild(clearBtn);
    footer.appendChild(refreshBtn);

    root.appendChild(header);
    root.appendChild(grid);
    root.appendChild(footer);
    container.appendChild(root);

    let activeMonth = startOfMonth(safeParseISODate(hiddenInput.value) || new Date());
    let daysCache = {};
    let inflight = 0;
    let disposed = false;

    const render = () => {
        if (disposed) return;
        const y = activeMonth.getFullYear();
        const m = activeMonth.getMonth();
        monthLabel.textContent = activeMonth.toLocaleString(undefined, { month: "long", year: "numeric" });

        grid.innerHTML = "";

        const weekdays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
        for (const w of weekdays) {
            const el = document.createElement("div");
            el.className = "mjr-agenda-weekday";
            el.textContent = w;
            grid.appendChild(el);
        }

        const first = new Date(y, m, 1);
        const pad = weekdayMonday0(first);
        const totalDays = daysInMonth(activeMonth);

        const selectedDate = safeParseISODate(hiddenInput.value);
        const selectedKey = selectedDate ? formatISODate(selectedDate) : "";

        for (let i = 0; i < pad; i++) {
            const blank = document.createElement("div");
            blank.className = "mjr-agenda-day mjr-agenda-day--blank";
            grid.appendChild(blank);
        }

        for (let d = 1; d <= totalDays; d++) {
            const dt = new Date(y, m, d);
            const key = formatISODate(dt);
            const count = Number(daysCache?.[key] || 0) || 0;

            const cell = document.createElement("button");
            cell.type = "button";
            cell.className = "mjr-agenda-day";
            cell.textContent = String(d);
            cell.dataset.date = key;

            if (count > 0) {
                cell.classList.add("mjr-agenda-day--has-assets");
                cell.title = `${count} asset${count === 1 ? "" : "s"}`;
            } else {
                cell.title = t("tooltip.noAssetsDay", "No assets on this day");
            }
            if (key === selectedKey) {
                cell.classList.add("mjr-agenda-day--selected");
            }

            cell.addEventListener("click", () => {
                safeSetHiddenInputValue(hiddenInput, key);
                // If the user picks a day, clear any range filter via the existing controller logic.
                // Triggering change is enough.
            });

            grid.appendChild(cell);
        }
    };

    const refresh = async () => {
        if (disposed) return;
        const monthKey = formatMonthKey(activeMonth);
        if (!monthKey) return;
        inflight += 1;
        const mine = inflight;
        const res = await fetchHistogram({ state, monthKey });
        if (disposed) return;
        if (mine !== inflight) return;

        if (res.ok) {
            daysCache = res.days || {};
        } else {
            daysCache = {};
        }
        render();
    };

    prevBtn.addEventListener("click", async () => {
        activeMonth = addMonths(activeMonth, -1);
        await refresh();
    });

    nextBtn.addEventListener("click", async () => {
        activeMonth = addMonths(activeMonth, 1);
        await refresh();
    });

    clearBtn.addEventListener("click", () => {
        safeSetHiddenInputValue(hiddenInput, "");
        try {
            onRequestReloadGrid?.();
        } catch (e) { console.debug?.(e); }
    });

    refreshBtn.addEventListener("click", async () => {
        await refresh();
    });

    hiddenInput.addEventListener("change", () => {
        const dt = safeParseISODate(hiddenInput.value);
        if (dt) {
            const monthStart = startOfMonth(dt);
            if (monthStart.getFullYear() !== activeMonth.getFullYear() || monthStart.getMonth() !== activeMonth.getMonth()) {
                activeMonth = monthStart;
            }
        }
        render();
    });

    // Initial paint + initial fetch.
    render();
    refresh();

    return {
        refresh,
        dispose() {
            disposed = true;
            try {
                root.remove();
            } catch (e) { console.debug?.(e); }
        }
    };
}

