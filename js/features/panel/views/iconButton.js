export function createIconButton(iconClass, title) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "mjr-icon-btn";
    btn.title = title;
    if (title) btn.setAttribute("aria-label", title);
    const i = document.createElement("i");
    i.className = `pi ${iconClass}`;
    i.setAttribute("aria-hidden", "true");
    btn.appendChild(i);
    return btn;
}
