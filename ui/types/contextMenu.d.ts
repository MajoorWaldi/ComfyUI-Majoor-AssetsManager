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
