import { Matrix4, Quaternion, Vector3 } from "three";
export type V = [number, number, number];
const matrix = (pivot: V, axis: V, degrees: number) =>
  new Matrix4()
    .makeTranslation(...pivot)
    .multiply(
      new Matrix4().makeRotationFromQuaternion(
        new Quaternion().setFromAxisAngle(
          new Vector3(...axis).normalize(),
          (degrees * Math.PI) / 180,
        ),
      ),
    )
    .multiply(new Matrix4().makeTranslation(-pivot[0], -pivot[1], -pivot[2]));
export const boomTransform = (p: V, degrees: number): V =>
  new Vector3(...p)
    .applyMatrix4(matrix([1.38, 0, 0], [0, 1, 0], degrees))
    .toArray();
export function headTransform(id: string, degrees: number) {
  const tack: V = id === "spinnaker" ? [5.1, 2.35, -2.4] : [5.8, 1.48, 0],
    head: V =
      id === "storm-jib"
        ? [3.1, 9.5, 0]
        : id === "spinnaker"
          ? [1.53, 14.5, 0]
          : [1.51, 14.42, 0];
  return matrix(
    tack,
    new Vector3(...head).sub(new Vector3(...tack)).toArray(),
    degrees,
  );
}
export const rudderTransform = (degrees: number) =>
  matrix([-4.23, 0.93, 0], [0.47, 1.83, 0], degrees);
export function rigPaths(
  main: number,
  jib: number,
  reef: number,
  headsail: string,
  rudder: number,
): Record<string, V[]> {
  const boom = (p: V) => boomTransform(p, main),
    head = (p: V) =>
      new Vector3(...p)
        .applyMatrix4(headTransform(headsail, jib))
        .toArray() as V;
  const clew: V =
    headsail === "genoa"
      ? [-1.45, 1.85, 0.12]
      : headsail === "storm-jib"
        ? [3.2, 1.82, 0.1]
        : headsail === "spinnaker"
          ? [2, 2, 2.6]
          : [1.95, 1.9, 0.08];
  const arc = (y: number, z: number, upper: boolean) =>
    Array.from({ length: 9 }, (_, i) => {
      const a = upper ? Math.PI - (i * Math.PI) / 8 : 0 - (i * Math.PI) / 8;
      const point: V = [-3.9 + 0.09 * Math.cos(a), y + 0.09 * Math.sin(a), z];
      return upper ? boom(point) : point;
    });
  const sheet: V[] = [
    [-3.99, 1.12, -0.09],
    ...arc(2.22, -0.09, true),
    ...arc(1.12, -0.09, false),
    ...arc(2.22, 0.07, true),
    ...arc(1.12, 0.07, false),
    [-3.4, 1.1, 0.6],
  ];
  const c = head(clew),
    reefClew = boom([
      reef ? 1.28 - 5.33 * (1 - reef * 0.12) : -3.4,
      reef ? 2.43 : 4.4,
      0.08,
    ]),
    sailHead = boom([1.28, 2.43 + 12.19 * (1 - reef * 0.24), 0]);
  const driveEnd = new Vector3(-4.3, 0.58, 0.38)
    .applyMatrix4(rudderTransform(rudder))
    .toArray() as V;
  return {
    mainsheet: sheet,
    vang: [[1.38, 1.45, 0], boom([-0.6, 2.35, 0])],
    preventer: [boom([-4.05, 2.35, -0.1]), [4.8, 1.1, -0.45], [-2.4, 1, -1.3]],
    "jibsheet-port": [
      c,
      [-0.4, 1.02, -1.35],
      [-2.3, 1.06, -1.12],
      [-2.6, 1.08, -0.82],
    ],
    "jibsheet-starboard": [
      c,
      [-0.4, 1.02, 1.35],
      [-2.3, 1.06, 1.12],
      [-2.6, 1.08, 0.82],
    ],
    "main-halyard": [
      sailHead,
      [1.38, 14.74, 0.1],
      [1.38, 14.9, 0.1],
      [1.49, 1.8, 0.1],
      [1.53, 1.4, 0.2],
    ],
    "reef-line": [
      boom([-4.05, 2.35, 0.08]),
      reefClew,
      boom([-4.05, 2.35, 0.13]),
      boom([1.38, 2.35, 0.13]),
      [1.38, 1.55, 0.22],
    ],
    drive: [[-4.3, 0.58, 1.15], driveEnd],
  };
}
