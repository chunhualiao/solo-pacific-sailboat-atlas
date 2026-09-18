import { writeFileSync, mkdirSync } from "node:fs";
import { GLTFExporter } from "three/addons/exporters/GLTFExporter.js";
import { makeBoat } from "../src/geometry";
class Reader {
  result: unknown;
  onloadend: (() => void) | null = null;
  async readAsArrayBuffer(blob: Blob) {
    this.result = await blob.arrayBuffer();
    this.onloadend?.();
  }
  async readAsDataURL(blob: Blob) {
    this.result =
      "data:application/octet-stream;base64," +
      Buffer.from(await blob.arrayBuffer()).toString("base64");
    this.onloadend?.();
  }
}
Object.assign(globalThis, { FileReader: Reader });
const { root, manifest } = makeBoat();
const binary = await new GLTFExporter().parseAsync(root, { binary: true });
mkdirSync("public/models", { recursive: true });
writeFileSync("public/models/cal40.glb", Buffer.from(binary as ArrayBuffer));
writeFileSync("src/manifest.json", JSON.stringify(manifest));
console.log(
  new Date().toLocaleString("en-US", { timeZone: "America/Los_Angeles" }),
  Object.keys(manifest).length,
  "components, GLB bytes:",
  (binary as ArrayBuffer).byteLength,
);
