import { t } from "../../../app/i18n.js";

const GITHUB_REPO_URL = "https://github.com/MajoorWaldi/ComfyUI-Majoor-AssetsManager";

export function createMessagePopoverView() {
    const messagePopover = document.createElement("div");
    messagePopover.className = "mjr-popover mjr-messages-popover";
    messagePopover.id = "mjr-messages-popover";
    messagePopover.setAttribute("role", "dialog");
    messagePopover.setAttribute("aria-label", t("label.messages", "Messages"));
    messagePopover.setAttribute("aria-hidden", "true");
    messagePopover.tabIndex = -1;
    messagePopover.style.display = "none";
    messagePopover.style.cssText = "display:none;";

    const head = document.createElement("div");
    head.className = "mjr-messages-head";

    const title = document.createElement("div");
    title.className = "mjr-messages-title";
    title.textContent = t("label.messages", "Messages");

    const actions = document.createElement("div");
    actions.className = "mjr-messages-actions";

    const starLink = document.createElement("a");
    starLink.className = "mjr-btn mjr-messages-star-link";
    starLink.href = GITHUB_REPO_URL;
    starLink.target = "_blank";
    starLink.rel = "noopener noreferrer";
    starLink.title = t("tooltip.starGithub", "Open GitHub and give a star");

    const starIcon = document.createElement("span");
    starIcon.className = "mjr-messages-star-icon";
    starIcon.textContent = "\u2605";
    starIcon.setAttribute("aria-hidden", "true");

    const starLabel = document.createElement("span");
    starLabel.className = "mjr-messages-star-label";
    starLabel.textContent = t("btn.giveStar", "Give a star");

    starLink.appendChild(starIcon);
    starLink.appendChild(starLabel);

    const markReadBtn = document.createElement("button");
    markReadBtn.type = "button";
    markReadBtn.className = "mjr-btn mjr-messages-mark-read-btn";
    markReadBtn.textContent = t("btn.markAllRead", "Mark all read");
    markReadBtn.title = t("tooltip.markMessagesRead", "Mark all messages as read");

    head.appendChild(title);
    actions.appendChild(starLink);
    actions.appendChild(markReadBtn);
    head.appendChild(actions);

    const tabs = document.createElement("div");
    tabs.className = "mjr-messages-tabs";
    tabs.setAttribute("role", "tablist");

    const messageTabBtn = document.createElement("button");
    messageTabBtn.type = "button";
    messageTabBtn.className = "mjr-messages-tab is-active";
    messageTabBtn.setAttribute("role", "tab");
    messageTabBtn.setAttribute("aria-selected", "true");
    messageTabBtn.setAttribute("aria-controls", "mjr-messages-panel");
    messageTabBtn.id = "mjr-messages-tab";
    messageTabBtn.textContent = t("label.messages", "Messages");

    const shortcutsTabBtn = document.createElement("button");
    shortcutsTabBtn.type = "button";
    shortcutsTabBtn.className = "mjr-messages-tab";
    shortcutsTabBtn.setAttribute("role", "tab");
    shortcutsTabBtn.setAttribute("aria-selected", "false");
    shortcutsTabBtn.setAttribute("aria-controls", "mjr-shortcuts-panel");
    shortcutsTabBtn.id = "mjr-shortcuts-tab";
    shortcutsTabBtn.textContent = t("msg.shortcuts.title", "Shortcut Guide");

    tabs.appendChild(messageTabBtn);
    tabs.appendChild(shortcutsTabBtn);

    const panels = document.createElement("div");
    panels.className = "mjr-messages-panels";

    const messageList = document.createElement("div");
    messageList.className = "mjr-messages-list";
    messageList.id = "mjr-messages-panel";
    messageList.setAttribute("role", "tabpanel");
    messageList.setAttribute("aria-labelledby", messageTabBtn.id);

    const emptyState = document.createElement("div");
    emptyState.className = "mjr-messages-empty";
    emptyState.textContent = t("msg.noMessages", "No messages for now.");

    const shortcutsPanel = document.createElement("div");
    shortcutsPanel.className = "mjr-messages-shortcuts-panel";
    shortcutsPanel.id = "mjr-shortcuts-panel";
    shortcutsPanel.setAttribute("role", "tabpanel");
    shortcutsPanel.setAttribute("aria-labelledby", shortcutsTabBtn.id);
    shortcutsPanel.hidden = true;

    messageList.appendChild(emptyState);
    messagePopover.appendChild(head);
    messagePopover.appendChild(tabs);
    panels.appendChild(messageList);
    panels.appendChild(shortcutsPanel);
    messagePopover.appendChild(panels);

    return {
        messagePopover,
        title,
        messageTabBtn,
        shortcutsTabBtn,
        messageList,
        shortcutsPanel,
        emptyState,
        markReadBtn,
    };
}
