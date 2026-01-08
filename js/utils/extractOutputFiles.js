export function extractOutputFiles(output) {
    const files = [];
    const addItems = (items) => {
        if (!Array.isArray(items)) return;
        items.forEach((item) => {
            if (!item || !item.filename) return;
            files.push({
                filename: item.filename,
                subfolder: item.subfolder || "",
                type: item.type || "output",
            });
        });
    };

    addItems(output?.images);
    addItems(output?.gifs);
    addItems(output?.videos);
    return files;
}

