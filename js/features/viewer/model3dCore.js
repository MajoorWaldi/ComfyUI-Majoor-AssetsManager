export function visitModel3DMeshes(object, visit) {
    if (!object || typeof visit !== "function") return;
    try {
        object.traverse?.((child) => {
            if (child?.isMesh || child?.isPoints || child?.isLine) visit(child);
        });
    } catch (e) {
        console.debug?.(e);
    }
}

export function hasModel3DMeshMaterials(object) {
    let found = false;
    visitModel3DMeshes(object, (child) => {
        if (!found && child?.isMesh) found = true;
    });
    return found;
}

export function findModel3DHasSkeleton(object) {
    let found = false;
    try {
        object.traverse?.((child) => {
            if (!found && child?.isSkinnedMesh) {
                const boneCount = child.skeleton?.bones?.length ?? 0;
                if (boneCount > 0) found = true;
            }
        });
    } catch (e) {
        console.debug?.(e);
    }
    return found;
}

export function storeModel3DOriginalMaterials(object) {
    const store = new Map();
    visitModel3DMeshes(object, (child) => {
        store.set(child.uuid, child.material);
    });
    return store;
}

export function applyModel3DMaterialMode(THREE, object, mode, originalMaterials, tempMaterials) {
    visitModel3DMeshes(object, (child) => {
        try {
            if (mode === "original") {
                const orig = originalMaterials?.get(child.uuid);
                if (orig !== undefined) child.material = orig;
            } else if (mode === "normal" && child.isMesh) {
                const m = new THREE.MeshNormalMaterial({ side: THREE.DoubleSide });
                tempMaterials?.add(m);
                child.material = m;
            } else if (mode === "depth" && child.isMesh) {
                const m = new THREE.MeshDepthMaterial();
                tempMaterials?.add(m);
                child.material = m;
            } else if (mode === "wireframe" && child.isMesh) {
                const m = new THREE.MeshBasicMaterial({ color: 0x90caf9, wireframe: true });
                tempMaterials?.add(m);
                child.material = m;
            } else if (mode === "pointcloud") {
                const hasColors = !!child.geometry?.getAttribute?.("color");
                const m = new THREE.PointsMaterial({
                    size: 0.012,
                    sizeAttenuation: true,
                    vertexColors: hasColors,
                    color: hasColors ? 0xffffff : 0x90caf9,
                });
                tempMaterials?.add(m);
                child.material = m;
            }
        } catch (e) {
            console.debug?.(e);
        }
    });
}

export function disposeModel3DTempMaterials(tempMaterials) {
    if (!tempMaterials) return;
    for (const mat of tempMaterials) {
        try {
            mat?.dispose?.();
        } catch (e) {
            console.debug?.(e);
        }
    }
    tempMaterials.clear();
}

export function getModel3DAnimations(loaded, loaderType) {
    try {
        if (loaderType === "gltf" || loaderType === "fbx") {
            return Array.isArray(loaded?.animations) ? loaded.animations : [];
        }
    } catch (e) {
        console.debug?.(e);
    }
    return [];
}

export function computeModel3DObjectFrame(THREE, object) {
    const box = new THREE.Box3().setFromObject(object);
    if (box.isEmpty()) return null;
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z, 0.01);
    return { box, size, center, maxDim, radius: Math.max(maxDim * 0.72, 0.5) };
}

export function fitModel3DPerspectiveCamera(THREE, camera, controls, frame) {
    if (!frame || !camera || !controls) return;
    const fov = camera.fov * (Math.PI / 180);
    const distance = (frame.maxDim / (2 * Math.tan(fov / 2))) * 1.55;
    const dir = new THREE.Vector3(1, 0.8, 1).normalize();
    camera.position.copy(frame.center).addScaledVector(dir, distance);
    camera.near = Math.max(0.01, distance / 250);
    camera.far = Math.max(1000, distance * 60);
    camera.updateProjectionMatrix();
    controls.target.copy(frame.center);
    controls.minDistance = Math.max(0.01, distance / 25);
    controls.maxDistance = Math.max(10, distance * 12);
    controls.minZoom = 0.25;
    controls.maxZoom = 12;
    controls.update();
}

export function fitModel3DOrthographicCamera(camera, controls, frame, aspect) {
    if (!frame || !camera || !controls) return null;
    const safeAspect = Math.max(0.0001, Number(aspect) || 1);
    const frustumHeight = Math.max(frame.maxDim * 1.9, 2);
    const frustumWidth = frustumHeight * safeAspect;
    camera.left = -frustumWidth / 2;
    camera.right = frustumWidth / 2;
    camera.top = frustumHeight / 2;
    camera.bottom = -frustumHeight / 2;
    camera.near = -Math.max(1000, frame.maxDim * 40);
    camera.far = Math.max(1000, frame.maxDim * 40);
    camera.zoom = 1;
    camera.position
        .copy(frame.center)
        .add({ x: frame.radius * 2.1, y: frame.radius * 1.6, z: frame.radius * 2.1 });
    camera.updateProjectionMatrix();
    controls.target.copy(frame.center);
    controls.minZoom = 0.25;
    controls.maxZoom = 12;
    controls.minDistance = 0;
    controls.maxDistance = Math.max(10, frame.maxDim * 12);
    controls.update();
    return frustumHeight;
}

export function buildRenderableModel3DObject(THREE, loaderType, loaded) {
    if (!loaded) return null;
    if (loaderType === "gltf") return loaded.scene || null;
    if (loaderType === "obj" || loaderType === "fbx") return loaded;
    if (loaderType === "stl" || loaderType === "ply") {
        const geometry = loaded;
        if (geometry?.computeVertexNormals) {
            try {
                geometry.computeVertexNormals();
            } catch (e) {
                console.debug?.(e);
            }
        }
        const hasNormals = !!geometry?.getAttribute?.("normal");
        const hasColors = !!geometry?.getAttribute?.("color");
        if (loaderType === "ply" && !hasNormals) {
            return new THREE.Points(
                geometry,
                new THREE.PointsMaterial({
                    size: 0.02,
                    sizeAttenuation: true,
                    vertexColors: hasColors,
                    color: hasColors ? 0xffffff : 0x90caf9,
                }),
            );
        }
        return new THREE.Mesh(
            geometry,
            new THREE.MeshStandardMaterial({
                color: hasColors ? 0xffffff : 0xd8dee9,
                metalness: 0.08,
                roughness: 0.72,
                vertexColors: hasColors,
            }),
        );
    }
    return null;
}
