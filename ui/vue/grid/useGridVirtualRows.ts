import { computed, unref } from "vue";
import { measureElement, useVirtualizer } from "@tanstack/vue-virtual";

function readNumber(value: any, fallback = 0) {
    const resolved = Number(unref(value));
    return Number.isFinite(resolved) ? resolved : fallback;
}

export function buildStaticGridRows(items: unknown[] = [], columnCount = 1): unknown[][] {
    const list = Array.isArray(items) ? items : [];
    const cols = Math.max(1, Number(columnCount) || 1);
    const rows: any[] = [];
    for (let index = 0; index < list.length; index += cols) {
        rows.push({
            index: Math.floor(index / cols),
            items: list.slice(index, index + cols),
        });
    }
    return rows;
}

export function getGridRowItems(items: unknown[] = [], rowIndex = 0, columnCount = 1): unknown[] {
    const list = Array.isArray(items) ? items : [];
    const cols = Math.max(1, Number(columnCount) || 1);
    const start = Math.max(0, Number(rowIndex) || 0) * cols;
    return list.slice(start, start + cols);
}

export function useGridVirtualRows({
    scrollRef,
    items,
    rows,
    columnCount,
    estimateRowHeight,
    overscan = 8,
    enabled = true,
    measure = measureElement,
}: Record<string, any> = {}) {
    const rowCount = computed(() => {
        if (!unref(enabled)) return 0;
        const sourceRows = unref(rows);
        if (Array.isArray(sourceRows)) return sourceRows.length;
        const list = unref(items) || [];
        const cols = Math.max(1, readNumber(columnCount, 1));
        return Math.ceil((Array.isArray(list) ? list.length : 0) / cols);
    });

    const virtualizer = useVirtualizer(
        computed(() => ({
            count: rowCount.value,
            getScrollElement: () => unref(scrollRef) || null,
            estimateSize: () => Math.max(1, readNumber(estimateRowHeight, 120)),
            overscan: Math.max(0, readNumber(overscan, 8)),
            measureElement: measure,
        })),
    );

    const virtualRows = computed(() => {
        const sourceRows = unref(rows);
        if (Array.isArray(sourceRows)) {
            return virtualizer.value.getVirtualItems().map((row) => {
                const source = sourceRows[row.index] || {};
                return {
                    key: row.key,
                    index: row.index,
                    virtual: row,
                    items: Array.isArray(source?.items) ? source.items : [],
                    kind: String(source?.kind || "assets"),
                    title: String(source?.title || ""),
                    groupKey: String(source?.groupKey || ""),
                };
            });
        }
        const list = unref(items) || [];
        const cols = Math.max(1, readNumber(columnCount, 1));
        return virtualizer.value.getVirtualItems().map((row) => ({
            key: row.key,
            index: row.index,
            virtual: row,
            items: getGridRowItems(list, row.index, cols),
            kind: "assets",
            title: "",
            groupKey: "",
        }));
    });

    const totalSize = computed(() => virtualizer.value.getTotalSize());

    return {
        rowCount,
        virtualizer,
        virtualRows,
        totalSize,
        getRowItems: (index: any) => getGridRowItems(unref(items) || [], index, readNumber(columnCount, 1)),
    };
}
