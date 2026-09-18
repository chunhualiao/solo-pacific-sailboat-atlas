import { describe, it, expect } from "vitest";
import { Box3, Vector3, Mesh } from "three";
import { makeBoat, hullStations } from "../src/geometry";
import { parts } from "../src/data";
const { root, manifest } = makeBoat();
describe("geometry audit", () => {
  it("covers every physical component and preserves datum metadata", () => {
    expect(root.children.length).toBe(parts.filter((p) => !p.abstract).length);
    for (const g of root.children) {
      expect(g.userData.assembled).toEqual(manifest[g.name].position);
      expect(g.children.length).toBeGreaterThan(0);
    }
  });
  it("preserves reference beam and length within reconstruction tolerance", () => {
    const g = root.children.find((g) => g.name === "hull")!;
    const bounds = new Box3().setFromObject(g),
      size = bounds.getSize(new Vector3());
    expect(size.z).toBeCloseTo(3.35, 1);
    expect(size.x).toBeCloseTo(11.99, 1);
  });
  it("has a 9.24 m design waterline on the centerline", () => {
    const crossings: number[] = [];
    for (let i = 0; i < hullStations.length - 1; i++) {
      const a = hullStations[i],
        bb = hullStations[i + 1];
      if (a[1] * bb[1] < 0)
        crossings.push(a[0] + ((bb[0] - a[0]) * -a[1]) / (bb[1] - a[1]));
      if (a[1] === 0) crossings.push(a[0]);
    }
    expect(crossings.at(-1)! - crossings[0]).toBeCloseTo(9.24, 2);
  });
  it("packs the full exploded layout without intersecting component bounds", () => {
    const entries = Object.entries(manifest);
    for (let i = 0; i < entries.length; i++)
      for (let j = i + 1; j < entries.length; j++) {
        const [aId, a] = entries[i],
          [bId, bb] = entries[j];
        const overlap = [0, 1, 2].every(
          (k) =>
            Math.abs(a.target[k] - bb.target[k]) <
            (a.size[k] + bb.size[k]) / 2 - 0.001,
        );
        expect(overlap, `${aId} intersects ${bId}`).toBe(false);
      }
  });
  it("batches rendering without losing component picking IDs", () => {
    let meshes = 0;
    root.traverse((o) => {
      if (o instanceof Mesh) {
        meshes++;
        expect(o.userData.componentId).toBeTruthy();
        for (const v of o.geometry.attributes.position.array)
          expect(Number.isFinite(v)).toBe(true);
      }
    });
    expect(meshes).toBeLessThan(190);
  });
});
it("keeps accommodation meshes inside the reconstructed shell", () => {
  const sample = (x: number, k: number) => {
    const i = hullStations.findIndex(
      (s, j) =>
        j < hullStations.length - 1 && x >= s[0] && x <= hullStations[j + 1][0],
    );
    if (i < 0) throw new Error("Outside length");
    const a = hullStations[i],
      bb = hullStations[i + 1];
    return a[k] + ((bb[k] - a[k]) * (x - a[0])) / (bb[0] - a[0]);
  };
  root.updateMatrixWorld(true);
  for (const id of [
    "berth-port",
    "berth-starboard",
    "v-berth",
    "forward-bulkhead",
    "galley",
    "nav-station",
    "water-tank",
  ])
    root.children
      .find((g) => g.name === id)!
      .traverse((o) => {
        if (!(o instanceof Mesh)) return;
        const pos = o.geometry.attributes.position;
        for (let i = 0; i < pos.count; i++) {
          const v = new Vector3()
            .fromBufferAttribute(pos, i)
            .applyMatrix4(o.matrixWorld);
          const w = sample(v.x, 2),
            bottom = sample(v.x, 1),
            sheer = sample(v.x, 3);
          if (v.y > sheer) continue;
          expect(Math.abs(v.z), `${id}: width`).toBeLessThan(w + 0.025);
          const surface =
            bottom +
            (sheer - bottom) *
              Math.pow(1 - Math.sqrt(Math.max(0, 1 - (v.z / w) ** 2)), 1.5);
          expect(
            v.y + 0.06,
            `${id}: below hull at ${v.toArray()}`,
          ).toBeGreaterThanOrEqual(surface);
        }
      });
});
