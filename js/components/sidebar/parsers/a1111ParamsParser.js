export function parseA1111Parameters(text) {
    if (!text || typeof text !== "string") return null;

    const metadata = {};

    const parts = text.split(/\nNegative prompt:\s*/i);
    if (parts[0]) {
        metadata.prompt = parts[0].trim();
    }

    if (parts[1]) {
        const paramMatch = parts[1].match(/^(.*?)\n?(Steps:.*)$/s);
        if (paramMatch) {
            metadata.negative_prompt = paramMatch[1].trim();
            const params = paramMatch[2];

            const extractParam = (pattern) => {
                const match = params.match(pattern);
                return match ? match[1].trim() : null;
            };

            metadata.steps = extractParam(/Steps:\s*(\d+)/i);
            metadata.sampler = extractParam(/Sampler:\s*([^,\n]+)/i);
            metadata.cfg = extractParam(/CFG scale:\s*([\d.]+)/i);
            metadata.seed = extractParam(/Seed:\s*(\d+)/i);
            metadata.width = extractParam(/Size:\s*(\d+)x\d+/i);
            metadata.height = extractParam(/Size:\s*\d+x(\d+)/i);
            metadata.model = extractParam(/Model:\s*([^,\n]+)/i);
            metadata.denoising = extractParam(/Denoising strength:\s*([\d.]+)/i);
            metadata.clip_skip = extractParam(/Clip skip:\s*(\d+)/i);
        } else {
            metadata.negative_prompt = parts[1].trim();
        }
    }

    return Object.keys(metadata).length > 0 ? metadata : null;
}

