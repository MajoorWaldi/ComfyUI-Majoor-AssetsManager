/**
 * Mount the Studio player inside imperative hosts (the floating viewer).
 *
 * The floating viewer is DOM-driven; it expects a `.mjr-mfv-player-host`
 * element carrying a `_mjrMediaControlsHandle` with `togglePlay`,
 * `stepFrames` and `destroy` (keyboard forwarding and teardown), and reads
 * the inner <video>/<audio> to remember mute / speed between assets. This
 * keeps that contract while rendering the Studio player.
 */

import { h } from "vue";

import { createMjrApp } from "../../../vue/createVueApp.js";
import StudioPlayer from "../../../vue/components/viewer/studio/StudioPlayer.vue";

export interface StudioPlayerHostOptions {
    src: string;
    kind: "video" | "audio";
    filename?: string;
    fps?: number | null;
    frameCount?: number | null;
    initialMuted?: boolean;
    initialRate?: number;
    compact?: boolean;
}

export interface StudioPlayerHandle {
    togglePlay(): void;
    stepFrames(delta: number): void;
    destroy(): void;
}

export function mountStudioPlayerHost(options: StudioPlayerHostOptions): HTMLElement | null {
    if (!options?.src || (options.kind !== "video" && options.kind !== "audio")) return null;
    const host = document.createElement("div");
    host.className = "mjr-mfv-player-host mjr-mfv-player-host--studio";
    host.tabIndex = -1;
    host.addEventListener("pointerdown", (event: Event) => {
        const target = event.target as HTMLElement | null;
        if (target?.closest?.("button, input, textarea, select, a, [contenteditable='true']"))
            return;
        host.focus?.({ preventScroll: true });
    });

    let exposed: any = null;
    const { app } = createMjrApp({
        render: () =>
            h(StudioPlayer, {
                ref: (instance: any) => {
                    exposed = instance;
                },
                src: options.src,
                kind: options.kind,
                filename: options.filename,
                fps: options.fps ?? null,
                frameCount: options.frameCount ?? null,
                initialMuted: !!options.initialMuted,
                initialRate: options.initialRate,
                compact: options.compact !== false,
            }),
    });
    app.mount(host);

    let destroyed = false;
    const handle: StudioPlayerHandle = {
        togglePlay: () => exposed?.togglePlay?.(),
        stepFrames: (delta: number) => exposed?.stepFrame?.(delta),
        destroy: () => {
            if (destroyed) return;
            destroyed = true;
            try {
                exposed?.release?.();
            } catch (e) {
                console.debug?.(e);
            }
            try {
                app.unmount();
            } catch (e) {
                console.debug?.(e);
            }
        },
    };
    (host as any)._mjrMediaControlsHandle = handle;
    return host;
}
