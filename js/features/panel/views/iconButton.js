export function createIconButton(iconClass, title) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "mjr-icon-btn";
    btn.title = title;
    const i = document.createElement("i");
    i.className = `pi ${iconClass}`;
    btn.appendChild(i);
    return btn;
}

