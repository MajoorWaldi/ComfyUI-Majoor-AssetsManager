/**
 * Shape of the context-menu item objects passed around
 * gridContextMenuState.js / viewerContextMenuState.js and rendered by
 * GridContextMenu.vue / ViewerContextMenu.vue. Built ad-hoc by whichever
 * feature opens the menu (grid card actions, generation input thumbs,
 * collections smart-suggestions), so fields stay optional.
 */
export interface MjrContextMenuItem {
    id?: string;
    type?: "item" | "separator";
    label?: string;
    iconClass?: string;
    rightHint?: string;
    tone?: string;
    disabled?: boolean;
    closeOnSelect?: boolean;
    submenu?: MjrContextMenuItem[];
    action?: (...args: unknown[]) => unknown;
    [key: string]: unknown;
}

/** One positioned layer (main menu / submenu / tags popover) of gridContextMenuState.js / viewerContextMenuState.js. */
export interface MjrContextMenuLayer {
    open?: boolean;
    x?: number;
    y?: number;
    items?: MjrContextMenuItem[];
    title?: string;
}

/** The `.tags` layer additionally carries the asset being tagged and its change callback. */
export interface MjrTagsMenuLayer extends MjrContextMenuLayer {
    asset?: { tags?: unknown; [key: string]: unknown } | null;
    onChanged?: (tags: unknown) => void;
}
