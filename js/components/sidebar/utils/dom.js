export function createSection(title) {
    const section = document.createElement("div");
    section.className = "mjr-sidebar-section";
    section.style.cssText = `
        background: rgba(0,0,0,0.2);
        border-radius: 8px;
        padding: 12px;
        min-width: 300px;
    `;

    const header = document.createElement("div");
    header.style.cssText = `
        font-size: 13px;
        font-weight: 600;
        color: white;
        margin-bottom: 12px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
    `;
    header.textContent = title;

    section.appendChild(header);
    return section;
}

export function createInfoBox(title, content, accentColor) {
    const box = document.createElement("div");
    box.style.cssText = `
        background: rgba(0,0,0,0.3);
        border-left: 3px solid ${accentColor};
        border-radius: 6px;
        padding: 12px;
    `;

    const header = document.createElement("div");
    header.textContent = title;
    header.style.cssText = `
        font-size: 11px;
        font-weight: 600;
        color: ${accentColor};
        text-transform: uppercase;
        letter-spacing: 0.5px;
        margin-bottom: 8px;
    `;

    const text = document.createElement("div");
    text.textContent = content;
    text.style.cssText = `
        font-size: 12px;
        color: rgba(255,255,255,0.9);
        line-height: 1.5;
        white-space: pre-wrap;
        word-break: break-word;
    `;

    box.appendChild(header);
    box.appendChild(text);
    return box;
}

export function createParametersBox(title, fields, accentColor) {
    const box = document.createElement("div");
    box.style.cssText = `
        background: rgba(0,0,0,0.3);
        border-left: 3px solid ${accentColor};
        border-radius: 6px;
        padding: 12px;
    `;

    const header = document.createElement("div");
    header.textContent = title;
    header.style.cssText = `
        font-size: 11px;
        font-weight: 600;
        color: ${accentColor};
        text-transform: uppercase;
        letter-spacing: 0.5px;
        margin-bottom: 10px;
    `;
    box.appendChild(header);

    const grid = document.createElement("div");
    grid.style.cssText = `
        display: grid;
        grid-template-columns: auto 1fr;
        gap: 8px 12px;
        align-items: start;
    `;

    fields.forEach((field) => {
        const label = document.createElement("div");
        label.textContent = field.label + ":";
        label.style.cssText = `
            font-size: 11px;
            color: rgba(255,255,255,0.6);
            font-weight: 500;
        `;

        const value = document.createElement("div");
        value.textContent = String(field.value);
        value.style.cssText = `
            font-size: 12px;
            color: rgba(255,255,255,0.95);
            word-break: break-word;
            white-space: pre-wrap;
        `;

        grid.appendChild(label);
        grid.appendChild(value);
    });

    box.appendChild(grid);
    return box;
}

export function createFieldRow(label, value, multiline = false) {
    const row = document.createElement("div");
    row.style.cssText = `
        display: flex;
        flex-direction: ${multiline ? "column" : "row"};
        gap: ${multiline ? "4px" : "8px"};
        margin-bottom: 8px;
        font-size: 12px;
    `;

    const labelEl = document.createElement("div");
    labelEl.textContent = label;
    labelEl.style.cssText = `
        color: var(--mjr-muted, rgba(255,255,255,0.65));
        ${multiline ? "" : "min-width: 100px;"}
        font-weight: 500;
    `;

    const valueEl = document.createElement("div");
    valueEl.textContent = String(value);
    valueEl.style.cssText = `
        color: white;
        ${multiline ? "white-space: pre-wrap; word-break: break-word;" : ""}
        flex: 1;
    `;

    row.appendChild(labelEl);
    row.appendChild(valueEl);

    return row;
}
