# ComfyUI Desktop Popup Workaround

**Version**: 2.4.7

Use this only if you run the official **ComfyUI Desktop / Electron** build and want the **Majoor Floating Viewer** to open in a real detachable window that can be moved to another monitor.

The Majoor plugin already tries to open a real popup first on Desktop. Some Desktop builds still block `window.open("about:blank")` in the Electron host and redirect it to the OS instead. The workaround below patches an internal packaged Desktop file, so treat it as advanced and unsupported:

- Back up the file before editing it.
- Expect the file path or method name to change between Desktop releases.
- Reapply only if a Desktop update removes the change.
- Browser-based ComfyUI does not require this patch.

Typical file to patch in an extracted Desktop app:

```text
.vite/build/main.cjs
```

Find the `#shouldOpenInPopup(url2)` method and make sure it allows `about:blank`, `127.0.0.1`, and `localhost`:

```js
  #shouldOpenInPopup(url2) {
    return url2 === "about:blank"
      || url2.startsWith("http://127.0.0.1:")
      || url2.startsWith("http://localhost:")
      || url2.startsWith("https://dreamboothy.firebaseapp.com/")
      || url2.startsWith("https://checkout.comfy.org/")
      || url2.startsWith("https://accounts.google.com/")
      || url2.startsWith("https://github.com/login/oauth/");
  }
```

Ensure the window-open handler still allows popup creation for approved URLs:

```js
    this.window.webContents.setWindowOpenHandler(({ url: url2 }) => {
      if (this.#shouldOpenInPopup(url2)) {
        return {
          action: "allow",
          overrideBrowserWindowOptions: {
            webPreferences: { preload: void 0 },
          },
        };
      }

      electron.shell.openExternal(url2);
      return { action: "deny" };
    });
```

After patching the Desktop host:

1. Repack the Desktop app archive if needed.
2. Restart ComfyUI Desktop completely.
3. Reopen Majoor Assets Manager.
4. Use the MFV pop-out button. It should now open a real detachable window that can be moved to another screen.

If your Desktop build already allows these popup URLs, no host change is required.
