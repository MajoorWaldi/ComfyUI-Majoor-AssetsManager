import { ensureWindowStub } from "./helpers/vitestEnvironment.ts";

if (typeof globalThis.window === "undefined") {
    ensureWindowStub();
}
