import { ensureWindowStub } from "./helpers/vitestEnvironment.mjs";

if (typeof globalThis.window === "undefined") {
    ensureWindowStub();
}
