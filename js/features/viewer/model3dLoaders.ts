const _VENDOR_BASE = "/mjr/am/vendor/three";

let _threeDepsPromise: any = null;

export function createModel3DLoaderInstance(deps: any, loaderType: string, manager: any): any {
    switch (loaderType) {
        case "gltf":
            return new deps.GLTFLoader(manager);
        case "obj":
            return new deps.OBJLoader(manager);
        case "fbx":
            return new deps.FBXLoader(manager);
        case "stl":
            return new deps.STLLoader(manager);
        case "ply":
            return new deps.PLYLoader(manager);
        default:
            return null;
    }
}

export function loadModel3DContent(loader: any, loaderType: string, url: string): Promise<unknown> {
    void loaderType;
    return new Promise((resolve: any, reject: any) => {
        if (!loader || !url) {
            reject(new Error("Missing loader or URL"));
            return;
        }
        if (typeof loader.loadAsync === "function") {
            loader.loadAsync(url).then(resolve).catch(reject);
            return;
        }
        loader.load(url, resolve, undefined, reject);
    });
}

export function loadModel3DThreeDeps(): Promise<Record<string, any>> {
    if (_threeDepsPromise) return _threeDepsPromise;
    _threeDepsPromise = Promise.all([
        import(/* @vite-ignore */ `${_VENDOR_BASE}/three.module.js`),
        import(/* @vite-ignore */ `${_VENDOR_BASE}/addons/controls/OrbitControls.js`),
        import(/* @vite-ignore */ `${_VENDOR_BASE}/addons/loaders/GLTFLoader.js`),
        import(/* @vite-ignore */ `${_VENDOR_BASE}/addons/loaders/FBXLoader.js`),
        import(/* @vite-ignore */ `${_VENDOR_BASE}/addons/loaders/OBJLoader.js`),
        import(/* @vite-ignore */ `${_VENDOR_BASE}/addons/loaders/MTLLoader.js`),
        import(/* @vite-ignore */ `${_VENDOR_BASE}/addons/loaders/STLLoader.js`),
        import(/* @vite-ignore */ `${_VENDOR_BASE}/addons/loaders/PLYLoader.js`),
    ]).then(([THREE, controls, gltf, fbx, obj, mtl, stl, ply]) => ({
        THREE,
        OrbitControls: controls.OrbitControls,
        GLTFLoader: gltf.GLTFLoader,
        FBXLoader: fbx.FBXLoader,
        OBJLoader: obj.OBJLoader,
        MTLLoader: mtl.MTLLoader,
        STLLoader: stl.STLLoader,
        PLYLoader: ply.PLYLoader,
    }));
    return _threeDepsPromise;
}
