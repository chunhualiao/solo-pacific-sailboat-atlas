import { it, expect } from "vitest";
import { Vector3 } from "three";
import {
  rigPaths,
  headTransform,
  boomTransform,
  rudderTransform,
} from "../src/kinematics";
it("keeps headsail luff attached at both ends when trimmed", () => {
  const m = headTransform("jib", 35);
  for (const p of [
    [5.8, 1.48, 0],
    [1.51, 14.42, 0],
  ])
    expect(
      new Vector3(...(p as [number, number, number]))
        .applyMatrix4(m)
        .distanceTo(new Vector3(...(p as [number, number, number]))),
    ).toBeLessThan(0.000001);
});
it("keeps sheet reeving attached to moving upper and fixed lower blocks", () => {
  const r = rigPaths(45, 30, 1, "jib", 15);
  expect(
    new Vector3(...r.mainsheet[1]).distanceTo(
      new Vector3(...boomTransform([-3.99, 2.22, -0.09], 45)),
    ),
  ).toBeLessThan(1e-12);
  expect(r.mainsheet[0]).toEqual([-3.99, 1.12, -0.09]);
});
it("rotates rudder around the stock axis instead of mesh center", () => {
  const p = [-4.23, 0.93, 0] as [number, number, number];
  expect(
    new Vector3(...p)
      .applyMatrix4(rudderTransform(25))
      .distanceTo(new Vector3(...p)),
  ).toBeLessThan(1e-6);
});
