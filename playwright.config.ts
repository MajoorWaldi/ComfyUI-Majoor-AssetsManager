import { defineConfig, devices } from "@playwright/test";

const port = Number(process.env.COMFYUI_PORT || 8188);
const host = process.env.COMFYUI_HOST || "127.0.0.1";
const baseURL = process.env.COMFYUI_BASE_URL || `http://${host}:${port}`;
const comfyMain = process.env.COMFYUI_MAIN || "../../main.py";
const skipWebServer = process.env.COMFYUI_SKIP_WEBSERVER === "1";

export default defineConfig({
    testDir: "./browser_tests",
    timeout: 60_000,
    expect: { timeout: 10_000 },
    fullyParallel: false,
    reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : "list",
    use: {
        baseURL,
        trace: "retain-on-failure",
        screenshot: "only-on-failure",
        video: "retain-on-failure",
    },
    projects: [
        {
            name: "chromium",
            use: { ...devices["Desktop Chrome"] },
        },
    ],
    webServer: skipWebServer
        ? undefined
        : {
              command: `python "${comfyMain}" --listen ${host} --port ${port}`,
              url: baseURL,
              reuseExistingServer: !process.env.CI,
              timeout: 120_000,
          },
});
