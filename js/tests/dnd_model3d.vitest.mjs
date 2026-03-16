import { describe, expect, it } from "vitest";

import {
  comboHasAnyModel3DValue,
  getDownloadMimeForFilename,
  isManagedPayload,
  looksLikeModel3DPath,
} from "../features/dnd/utils/video.js";
import { pickBestMediaPathWidget } from "../features/dnd/targets/node.js";

describe("3D drag and drop support", () => {
  it("treats model3d payloads as managed assets", () => {
    expect(isManagedPayload({ kind: "model3d", filename: "robot.glb" })).toBe(true);
    expect(isManagedPayload({ filename: "robot.obj" })).toBe(true);
    expect(isManagedPayload({ filename: "notes.txt" })).toBe(false);
  });

  it("recognizes 3D paths and combo values", () => {
    expect(looksLikeModel3DPath("models/robot.gltf", "gltf")).toBe(true);
    expect(
      comboHasAnyModel3DValue(
        {
          type: "combo",
          options: { values: ["cat.png", "robot.glb"] },
        },
        "glb"
      )
    ).toBe(true);
  });

  it("returns explicit 3D MIME types for drag-out downloads", () => {
    expect(getDownloadMimeForFilename("robot.glb")).toBe("model/gltf-binary");
    expect(getDownloadMimeForFilename("robot.gltf")).toBe("model/gltf+json");
    expect(getDownloadMimeForFilename("robot.obj")).toBe("model/obj");
    expect(getDownloadMimeForFilename("robot.stl")).toBe("model/stl");
  });

  it("prefers 3D-oriented widgets when dropping a model asset on a node", () => {
    const modelPath = { name: "model_path", type: "text", value: "" };
    const fileCombo = {
      name: "file",
      type: "combo",
      value: "",
      options: { values: ["robot.glb"] },
    };
    const outputPath = { name: "output_path", type: "text", value: "" };
    const node = {
      type: "Load3DModel",
      widgets: [outputPath, fileCombo, modelPath],
    };

    const picked = pickBestMediaPathWidget(node, { kind: "model3d" }, "glb");

    expect(picked).toBe(modelPath);
    expect(modelPath.__mjrModel3DPickScore).toBeGreaterThan(0);
  });
});
