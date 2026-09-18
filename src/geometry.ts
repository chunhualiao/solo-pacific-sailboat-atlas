import * as T from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { rigPaths } from "./kinematics";
import { parts, systems } from "./data";
export const hullStations = [
  [-5.995, 0.48, 0.68, 0.9],
  [-5, 0, 0.92, 0.86],
  [-4, -0.22, 1.18, 0.83],
  [-3, -0.4, 1.43, 0.81],
  [-2, -0.52, 1.59, 0.81],
  [-1, -0.61, 1.665, 0.82],
  [0, -0.64, 1.675, 0.85],
  [1, -0.58, 1.62, 0.9],
  [2, -0.42, 1.46, 0.96],
  [3, -0.18, 1.19, 1.03],
  [4, -0.1, 0.84, 1.1],
  [5, 0.3166666667, 0.44, 1.19],
  [5.995, 1.28, 0.012, 1.28],
];
export const palette = {
  ivory: "#eeede5",
  hull: "#ecefe9",
  metal: "#9daeb2",
  teak: "#9d7550",
  dark: "#263d47",
  rope: "#baa26f",
  sail: "#f6f0d9",
  red: "#b96b50",
  blue: "#547988",
};
function material(color: string, metalness = 0) {
  return new T.MeshStandardMaterial({
    color,
    roughness: metalness ? 0.36 : 0.7,
    metalness,
    side: T.DoubleSide,
  });
}
export function makeBoat() {
  const root = new T.Group();
  root.name = "Cal40";
  const groups: Record<string, T.Group> = {};
  for (const p of parts.filter((p) => !p.abstract)) {
    const g = new T.Group();
    g.name = p.id;
    g.userData = { componentId: p.id, system: p.system };
    groups[p.id] = g;
    root.add(g);
  }
  const mesh = (
    id: string,
    geo: T.BufferGeometry,
    color: string,
    position = [0, 0, 0],
    rotation = [0, 0, 0],
    metal = 0,
  ) => {
    const m = new T.Mesh(geo, material(color, metal));
    m.position.set(...(position as [number, number, number]));
    m.rotation.set(...(rotation as [number, number, number]));
    m.userData.componentId = id;
    groups[id].add(m);
    return m;
  };
  const box = (
    id: string,
    pos: number[],
    size: number[],
    color = palette.ivory,
  ) =>
    mesh(
      id,
      new T.BoxGeometry(...(size as [number, number, number])),
      color,
      pos,
    );
  const tube = (
    id: string,
    points: number[][],
    radius = 0.018,
    color = palette.rope,
    smooth = false,
  ) => {
    const vectors = points.map(
      (p) => new T.Vector3(...(p as [number, number, number])),
    );
    const path = smooth
      ? new T.CatmullRomCurve3(vectors)
      : new T.CurvePath<T.Vector3>();
    if (!smooth)
      for (let i = 1; i < vectors.length; i++)
        (path as T.CurvePath<T.Vector3>).add(
          new T.LineCurve3(vectors[i - 1], vectors[i]),
        );
    return mesh(
      id,
      new T.TubeGeometry(
        path,
        Math.max(12, points.length * 10),
        radius,
        6,
        false,
      ),
      color,
    );
  };
  const cyl = (
    id: string,
    pos: number[],
    r: number,
    h: number,
    color = palette.metal,
    rotation = [0, 0, 0],
  ) => mesh(id, new T.CylinderGeometry(r, r, h, 16), color, pos, rotation, 0.5);
  const profile = (
    id: string,
    coords: number[][],
    width: number,
    color: string,
  ) => {
    const s = new T.Shape();
    coords.forEach(([x, y], i) => (i ? s.lineTo(x, y) : s.moveTo(x, y)));
    s.closePath();
    return mesh(
      id,
      new T.ExtrudeGeometry(s, {
        depth: width,
        bevelEnabled: true,
        bevelSegments: 2,
        steps: 1,
        bevelSize: 0.025,
        bevelThickness: 0.025,
      }),
      color,
      [0, 0, -width / 2],
    );
  };
  // Hull sections follow the inspected original profile; offsets remain explicitly approximate.
  const v: number[] = [],
    ix: number[] = [],
    colors: number[] = [];
  const N = 72,
    M = 32;

  // Piecewise interpolation avoids spline overshoot of the verified beam/length bounds.
  const station = (x: number, k: number) => {
    const i = Math.min(
      hullStations.length - 2,
      Math.max(
        0,
        hullStations.findIndex(
          (s, j) =>
            j < hullStations.length - 1 &&
            x >= s[0] &&
            x <= hullStations[j + 1][0],
        ),
      ),
    );
    const a = hullStations[i],
      b = hullStations[i + 1],
      f = (x - a[0]) / (b[0] - a[0]);
    return a[k] + (b[k] - a[k]) * f;
  };

  for (let i = 0; i <= N; i++) {
    const x = -5.995 + (11.99 * i) / N;
    for (let j = 0; j <= M; j++) {
      const a = -Math.PI / 2 + (Math.PI * j) / M;
      const y =
        station(x, 1) +
        (station(x, 3) - station(x, 1)) * Math.pow(1 - Math.cos(a), 1.5);
      v.push(x, y, station(x, 2) * Math.sin(a));
      const c = new T.Color(
        y < 0.04 ? "#487985" : y < 0.13 ? "#b59a60" : palette.hull,
      );
      colors.push(c.r, c.g, c.b);
      if (i < N && j < M) {
        const n = i * (M + 1) + j;
        ix.push(n, n + M + 1, n + 1, n + 1, n + M + 1, n + M + 2);
      }
    }
  }
  const hg = new T.BufferGeometry();
  hg.setAttribute("position", new T.Float32BufferAttribute(v, 3));
  hg.setAttribute("color", new T.Float32BufferAttribute(colors, 3));
  hg.setIndex(ix);
  hg.computeVertexNormals();
  const hm = mesh("hull", hg, "#ffffff");
  (hm.material as T.MeshStandardMaterial).vertexColors = true;
  // Close the stern transom, leaving deck opening separate.
  profile(
    "hull",
    [
      [-0.68, 0.9],
      [0.68, 0.9],
      [0.45, 0.53],
      [-0.45, 0.53],
    ],
    0.04,
    palette.hull,
  ).rotation.y = Math.PI / 2;
  const transom = groups.hull.children[1];
  transom.position.x = -5.98;
  const deckShape = new T.Shape();
  hullStations.forEach((s, i) =>
    i ? deckShape.lineTo(s[0], s[2]) : deckShape.moveTo(s[0], s[2]),
  );
  [...hullStations].reverse().forEach((s) => deckShape.lineTo(s[0], -s[2]));
  deckShape.closePath();
  const hole = (x1: number, x2: number, z1: number, z2: number) => {
    const h = new T.Path();
    h.moveTo(x1, z1);
    h.lineTo(x1, z2);
    h.lineTo(x2, z2);
    h.lineTo(x2, z1);
    h.closePath();
    deckShape.holes.push(h);
  };
  hole(-4.2, -1.9, -0.53, 0.53);
  hole(-1.65, 2.7, -0.88, 0.88);
  const dg = new T.ExtrudeGeometry(deckShape, {
    depth: 0.065,
    bevelEnabled: false,
  });
  dg.rotateX(Math.PI / 2);
  const dp = dg.attributes.position;
  for (let i = 0; i < dp.count; i++) {
    const x = dp.getX(i),
      z = dp.getZ(i);
    dp.setY(
      i,
      dp.getY(i) +
        station(x, 3) -
        0.89 +
        0.035 * Math.max(0, 1 - Math.abs(z) / station(x, 2)),
    );
  }
  dg.computeVertexNormals();
  mesh("deck", dg, palette.ivory, [0, 0.89, 0]);
  for (const z of [-0.69, 0.69]) {
    box("deck", [-3.05, 0.87, z], [2.65, 0.12, 0.34]);
    box("deck", [-3.05, 0.56, z * 0.8], [2.35, 0.63, 0.07]);
  }
  box("deck", [-3.05, 0.24, 0], [2.3, 0.08, 1.1], palette.teak);
  box("deck", [-4.28, 0.58, 0], [0.08, 0.64, 1.1]);
  // Cabin sides, fore end, roof and actual companionway opening aft.
  for (const z of [-0.91, 0.91]) {
    box("cabin", [0.5, 1.08, z], [4.3, 0.57, 0.07]);
    for (const x of [-0.8, 0.1, 1.35])
      box("cabin", [x, 1.17, z * 1.043], [0.61, 0.18, 0.025], palette.dark);
  }
  box("cabin", [2.63, 1.12, 0], [0.12, 0.43, 1.75]);
  box("cabin", [0.65, 1.34, 0], [4.2, 0.065, 1.85]);
  for (const z of [-0.69, 0.69])
    box("cabin", [-1.49, 1.11, z], [0.08, 0.43, 0.42]);
  profile(
    "keel",
    [
      [-2.05, -0.4],
      [1.95, -0.45],
      [0.8, -1.7],
      [-1.2, -1.7],
    ],
    0.3,
    palette.blue,
  );
  profile(
    "ballast",
    [
      [-1.65, -0.75],
      [1.5, -0.75],
      [0.68, -1.6],
      [-1.1, -1.6],
    ],
    0.22,
    "#777d82",
  );
  const transversePanel = (id: string, x: number, door: boolean) => {
    const sx = x + 0.06,
      width = station(sx, 2) * 0.95,
      bottom = station(sx, 1),
      sheer = station(sx, 3),
      shape = new T.Shape();
    for (let i = 0; i <= 30; i++) {
      const z = -width + (2 * width * i) / 30;
      const y =
        bottom +
        (sheer - bottom) *
          Math.pow(1 - Math.sqrt(1 - (z / station(sx, 2)) ** 2), 1.5) +
        0.025;
      if (i) shape.lineTo(z, y);
      else shape.moveTo(z, y);
    }
    shape.lineTo(width, sheer - 0.02);
    if (door) {
      shape.lineTo(0.87, sheer - 0.02);
      shape.lineTo(0.87, 1.23);
      shape.lineTo(-0.87, 1.23);
    }
    shape.lineTo(-width, sheer - 0.02);
    shape.closePath();
    if (door) {
      const h = new T.Path();
      h.moveTo(-0.36, -0.25);
      h.lineTo(-0.36, 1.02);
      h.lineTo(0.36, 1.02);
      h.lineTo(0.36, -0.25);
      h.closePath();
      shape.holes.push(h);
    }
    mesh(
      id,
      new T.ExtrudeGeometry(shape, { depth: 0.06, bevelEnabled: false }),
      palette.teak,
      [x, 0, 0],
      [0, Math.PI / 2, 0],
    );
  };
  transversePanel("bulkhead", 1.4, true);
  transversePanel("forward-bulkhead", 4.4, false);
  for (const [id, z] of [
    ["stringer-port", -0.8],
    ["stringer-starboard", 0.8],
  ] as const)
    tube(
      id,
      [
        [-3.9, -0.07, z],
        [-2, -0.25, z],
        [0, -0.3, z],
        [2, -0.05, z],
        [3.7, 0.3, z],
      ],
      0.045,
      palette.teak,
      true,
    );
  box("mast-beam", [1.4, 1.22, 0], [0.22, 0.18, 1.8], palette.teak);
  const mastX = 1.38,
    mastTop = 14.91,
    boomY = 2.35,
    clew = -4.05;
  tube(
    "mast",
    [
      [mastX, 1.3, 0],
      [mastX, mastTop, 0],
    ],
    0.082,
    palette.metal,
  );
  tube(
    "boom",
    [
      [mastX, boomY, 0],
      [clew, boomY, 0],
    ],
    0.075,
    palette.metal,
  );
  for (const [side, z] of [
    ["port", -1],
    ["starboard", 1],
  ] as const) {
    tube(
      "spreader-" + side,
      [
        [mastX, 8, 0],
        [mastX, 8, z * 1.37],
      ],
      0.035,
      palette.metal,
    );
    tube(
      "shroud-" + side,
      [
        [mastX, mastTop, 0],
        [mastX, 8, z * 1.37],
        [mastX, 1.2, z * 1.45],
      ],
      0.013,
      palette.metal,
    );
    tube(
      "lower-" + side,
      [
        [mastX, 8, 0],
        [mastX, 1.2, z * 1.45],
      ],
      0.012,
      palette.metal,
    );
    box(
      "chainplate-" + side,
      [mastX, 0.85, z * 1.45],
      [0.08, 0.65, 0.025],
      palette.metal,
    );
    cyl("turnbuckle-" + side, [mastX, 1.23, z * 1.45], 0.025, 0.3);
  }
  tube(
    "forestay",
    [
      [5.995, 1.28, 0],
      [mastX, mastTop, 0],
    ],
    0.014,
    palette.metal,
  );
  tube(
    "backstay",
    [
      [mastX, mastTop, 0],
      [-5.8, 1, 0],
    ],
    0.014,
    palette.metal,
  );
  tube(
    "main-halyard",
    [
      [mastX - 0.1, 14.62, 0],
      [mastX, 14.74, 0.1],
      [mastX, 14.9, 0.1],
      [mastX + 0.11, 1.8, 0.1],
      [mastX + 0.15, 1.4, 0.2],
    ],
    0.016,
    "#b08056",
  );
  tube(
    "jib-halyard",
    [
      [mastX + 0.13, 14.5, 0],
      [mastX + 0.14, 14.88, -0.1],
      [mastX - 0.1, 1.5, -0.12],
    ],
    0.016,
    "#699099",
  );
  const upperY = 2.22,
    lowerY = 1.12,
    sheetX = -3.9;
  tube("mainsheet", rigPaths(0, 0, 0, "jib", 0).mainsheet, 0.017, "#9c6948");
  for (const [side, z] of [
    ["port", -1],
    ["starboard", 1],
  ] as const)
    tube(
      "jibsheet-" + side,
      [
        [1.95, 1.9, 0.08 * z],
        [-0.4, 1.02, z * 1.35],
        [-2.3, 1.06, z * 1.12],
        [-2.6, 1.08, z * 0.82],
      ],
      0.018,
      "#6f9295",
    );
  tube(
    "reef-line",
    [
      [clew, boomY, 0.08],
      [-3.4, 4.4, 0.08],
      [clew, boomY, 0.13],
      [mastX, boomY, 0.13],
      [mastX, 1.55, 0.22],
    ],
    0.014,
    "#b17857",
  );
  tube(
    "vang",
    [
      [mastX, 1.45, 0],
      [-0.6, boomY, 0],
    ],
    0.035,
    palette.dark,
  );
  tube(
    "preventer",
    [
      [clew, boomY, -0.1],
      [4.8, 1.1, -0.45],
      [-2.4, 1, -1.3],
    ],
    0.016,
    palette.rope,
  );
  const sail = (
    id: string,
    a: number[],
    bb: number[],
    c: number[],
    belly: number,
    color = palette.sail,
  ) => {
    const p: number[] = [],
      uv: number[] = [],
      idx: number[] = [];
    const n = 26;
    const A = new T.Vector3(...(a as [number, number, number])),
      B = new T.Vector3(...(bb as [number, number, number])),
      C = new T.Vector3(...(c as [number, number, number]));
    for (let i = 0; i <= n; i++)
      for (let j = 0; j <= n; j++) {
        const u = i / n,
          w = (j / n) * (1 - u),
          q = A.clone()
            .multiplyScalar(1 - u - w)
            .addScaledVector(B, u)
            .addScaledVector(C, w);
        q.z += Math.sin(Math.PI * u) * Math.sin((Math.PI * j) / n) * belly;
        p.push(q.x, q.y, q.z);
        uv.push(u, w);
        if (i < n && j < n) {
          const k = i * (n + 1) + j;
          idx.push(k, k + 1, k + n + 1, k + 1, k + n + 2, k + n + 1);
        }
      }
    const g = new T.BufferGeometry();
    g.setAttribute("position", new T.Float32BufferAttribute(p, 3));
    g.setAttribute("uv", new T.Float32BufferAttribute(uv, 2));
    g.setIndex(idx);
    g.computeVertexNormals();
    mesh(id, g, color);
    tube(id, [a, bb, c, a], 0.012, "#d3c7a7");
    for (let f = 0.16; f < 0.95; f += 0.16) {
      const q = A.clone().lerp(B, f),
        r = C.clone().lerp(B, f);
      tube(
        id,
        [
          q.toArray(),
          q
            .clone()
            .lerp(r, 0.5)
            .add(new T.Vector3(0, 0, belly * 0.3))
            .toArray(),
          r.toArray(),
        ],
        0.006,
        "#d9d0b5",
        true,
      );
    }
  };
  sail(
    "mainsail",
    [mastX - 0.1, boomY + 0.08, 0],
    [mastX - 0.1, boomY + 0.08 + 12.19, 0],
    [clew, boomY + 0.08, 0],
    0.36,
  );
  sail(
    "jib",
    [5.8, 1.48, 0],
    [mastX + 0.13, 14.42, 0],
    [1.95, 1.9, 0.08],
    0.42,
  );
  sail(
    "genoa",
    [5.8, 1.48, 0],
    [mastX + 0.13, 14.42, 0],
    [-1.45, 1.85, 0.12],
    0.7,
  );
  sail(
    "storm-jib",
    [5.8, 1.48, 0],
    [3.1, 9.5, 0],
    [3.2, 1.82, 0.1],
    0.2,
    "#d49556",
  );
  sail(
    "spinnaker",
    [5.1, 2.35, -2.4],
    [mastX + 0.15, 14.5, 0],
    [2, 2.0, 2.6],
    2.3,
    "#c1b48b",
  );
  tube(
    "spinnaker-pole",
    [
      [1.38, 2.35, 0],
      [5.1, 2.35, -2.4],
    ],
    0.045,
    palette.metal,
  );
  tube(
    "pole-lift",
    [
      [1.38, 8, 0],
      [5.1, 2.35, -2.4],
    ],
    0.014,
    palette.rope,
  );
  tube(
    "afterguy",
    [
      [5.1, 2.35, -2.4],
      [-2.3, 1.2, -1.13],
    ],
    0.018,
    palette.rope,
  );
  profile(
    "rudder",
    [
      [-3.98, -0.15],
      [-4.9, -0.2],
      [-5.3, -1.32],
      [-4.82, -1.35],
    ],
    0.12,
    palette.blue,
  );
  tube(
    "rudder-stock",
    [
      [-4.7, -0.9, 0],
      [-4.23, 0.93, 0],
    ],
    0.043,
    palette.metal,
  );
  tube(
    "tiller",
    [
      [-4.23, 0.97, 0],
      [-3.75, 1.05, 0],
      [-2.95, 1.05, 0],
    ],
    0.038,
    palette.teak,
    true,
  );
  cyl("bearing", [-4.27, 0.72, 0], 0.09, 0.13);
  tube(
    "tiller-arm",
    [
      [-4.3, 0.58, 0],
      [-4.3, 0.58, 0.38],
    ],
    0.04,
    palette.metal,
  );
  box("engine", [-1.9, -0.05, 0], [0.65, 0.6, 0.6], "#637d6d");
  box("engine", [-1.85, 0.29, 0], [0.62, 0.12, 0.53], palette.metal);
  for (const x of [-2.1, -1.85, -1.6])
    cyl("engine", [x, 0.31, 0.05], 0.1, 0.1, palette.dark);
  tube(
    "shaft",
    [
      [-2.0, -0.2, 0],
      [-3.1, -0.43, 0],
    ],
    0.025,
    palette.metal,
  );
  cyl("propeller", [-3.12, -0.44, 0], 0.07, 0.19, "#b29559", [
    0,
    0,
    Math.PI / 2,
  ]);
  for (const ang of [0, (Math.PI * 2) / 3, (Math.PI * 4) / 3]) {
    const q = mesh(
      "propeller",
      new T.SphereGeometry(1, 12, 8),
      "#b29559",
      [-3.15, -0.44 + Math.sin(ang) * 0.16, Math.cos(ang) * 0.16],
      [ang, 0, 0.2],
      0.65,
    );
    q.scale.set(0.045, 0.1, 0.24);
  }
  box("fuel-tank", [-3.0, 0.0, 0], [0.8, 0.38, 0.68], "#859598");
  tube(
    "fuel-line",
    [
      [-3, 0.18, 0.3],
      [-2.5, 0.22, 0.36],
      [-1.9, 0.12, 0.33],
    ],
    0.018,
    "#625947",
  );
  tube(
    "exhaust",
    [
      [-1.7, 0.2, -0.25],
      [-2.3, -0.1, -0.6],
      [-4.8, 0.5, -0.4],
      [-5.9, 0.65, -0.3],
    ],
    0.055,
    palette.dark,
    true,
  );
  const bx = (id: string, p: number[], s: number[], color: string) => {
    box(id, p, s, color);
    box(
      id,
      [p[0], p[1] + s[1] / 2 + 0.005, p[2]],
      [s[0] * 0.85, 0.015, s[2] * 0.85],
      palette.dark,
    );
  };
  bx("battery", [-0.8, -0.15, 0.68], [0.62, 0.35, 0.36], "#424f5c");
  for (const x of [-1, -0.6])
    cyl(
      "battery",
      [x, 0.04, 0.68],
      0.025,
      0.03,
      x < -0.8 ? "#ad5449" : palette.metal,
    );
  bx("fuse", [-0.62, 0.22, 0.76], [0.18, 0.17, 0.1], "#ac7052");
  bx("panel", [-1.1, 0.76, 0.91], [0.4, 0.32, 0.045], palette.dark);
  for (let i = 0; i < 5; i++)
    cyl("panel", [-1.24 + i * 0.07, 0.81, 0.946], 0.015, 0.025, "#d2b27c", [
      Math.PI / 2,
      0,
      0,
    ]);
  for (const z of [-0.59, 0.59]) {
    bx("solar", [-5.3, 1.68, z], [1.1, 0.035, 0.88], "#526a7c");
    for (let i = 0; i < 5; i++)
      box(
        "solar",
        [-5.72 + i * 0.21, 1.702, z],
        [0.008, 0.004, 0.82],
        "#9baeb8",
      );
    tube(
      "solar",
      [
        [-5.6, 0.9, z],
        [-5.6, 1.66, z],
      ],
      0.018,
      palette.metal,
    );
  }
  bx("controller", [-0.2, 0.46, 0.87], [0.2, 0.2, 0.08], "#708f97");
  cyl("alternator", [-1.59, 0.07, 0.35], 0.12, 0.16, "#899a9b", [
    Math.PI / 2,
    0,
    0,
  ]);
  cyl("shore", [-4.6, 1.03, 0.58], 0.065, 0.055);
  bx("charger", [-1.5, -0.15, 0.72], [0.35, 0.22, 0.26], "#a6a5a0");
  for (const z of [0.64, 0.7])
    tube(
      "bus-wire",
      [
        [-0.8, 0.05, z],
        [-0.62, 0.2, z],
        [-1.1, 0.7, z],
        [-1.1, 0.7, 0.87],
      ],
      0.014,
      z < 0.7 ? "#a2604b" : "#4b5660",
    );
  const instruments: [string, number[], number[]][] = [
    ["ais", [-1.15, 0.51, 1.04], [0.24, 0.08, 0.17]],
    ["vhf", [-1.22, 0.85, 1.06], [0.3, 0.12, 0.17]],
    ["gps", [-1.5, 1.34, 0.3], [0.07, 0.29, 0.36]],
    ["imu", [0.6, 0.1, -0.5], [0.16, 0.09, 0.16]],
    ["depth", [0.5, -0.53, 0.25], [0.1, 0.06, 0.1]],
    ["handheld", [-0.88, 0.89, 1.05], [0.075, 0.18, 0.05]],
    ["backup-gps", [-0.7, 0.865, 1.03], [0.07, 0.13, 0.04]],
    ["satellite", [-0.52, 0.87, 1.03], [0.08, 0.14, 0.06]],
    ["autopilot", [-1.5, 1.3, -0.3], [0.065, 0.18, 0.2]],
  ];
  for (const [id, pos, size] of instruments)
    bx(id, pos, size, id === "handheld" ? "#b49b57" : palette.dark);
  cyl("compass", [-1.5, 1.5, 0], 0.09, 0.08, palette.dark);
  tube(
    "antenna",
    [
      [mastX, 14.94, 0.04],
      [mastX, 15.7, 0.04],
    ],
    0.01,
    palette.metal,
  );
  tube(
    "wind",
    [
      [mastX, 14.94, 0],
      [mastX + 0.25, 15.1, 0],
    ],
    0.01,
    palette.metal,
  );
  box("wind", [mastX + 0.3, 15.1, 0], [0.22, 0.018, 0.08], palette.dark);
  cyl("drive", [-4.3, 0.58, 0.79], 0.075, 0.65, palette.dark, [
    Math.PI / 2,
    0,
    0,
  ]);
  tube(
    "drive",
    [
      [-4.3, 0.58, 0.47],
      [-4.3, 0.58, 0.38],
    ],
    0.029,
    palette.metal,
  );
  box("drive", [-4.3, 0.58, 1.15], [0.22, 0.22, 0.12], palette.metal);
  tube(
    "windvane",
    [
      [-5.99, 0.7, 0],
      [-6.28, 0.8, 0],
      [-6.28, 2.2, 0],
    ],
    0.025,
    palette.metal,
  );
  box("windvane", [-6.28, 2.25, 0], [0.04, 0.7, 0.28], palette.teak);
  tube(
    "windvane",
    [
      [-6.28, 0.8, 0],
      [-6.28, -0.6, 0],
    ],
    0.023,
    palette.metal,
  );
  box("windvane", [-6.28, -0.65, 0], [0.22, 0.35, 0.04], palette.teak);
  tube(
    "windvane",
    [
      [-6.28, 0.88, -0.2],
      [-5.6, 0.9, -0.5],
      [-4.25, 1, -0.5],
      [-3.3, 1, 0],
    ],
    0.012,
    palette.rope,
  );
  tube(
    "emergency-tiller",
    [
      [-3, 0.6, -1],
      [-3.7, 0.6, -1],
      [-3.9, 0.45, -1],
    ],
    0.033,
    palette.metal,
  );
  bx("epirb", [-1.47, 1.08, -0.55], [0.1, 0.25, 0.1], "#d1b555");
  bx("liferaft", [2.25, 1.58, 0], [0.7, 0.38, 0.58], palette.ivory);
  for (const [side, z] of [
    ["port", -1],
    ["starboard", 1],
  ] as const)
    tube(
      "jackline-" + side,
      [
        [-4.8, 0.96, z * 0.65],
        [-2, 0.96, z * 1.1],
        [1.8, 1.02, z * 1.2],
        [4.8, 1.22, z * 0.47],
      ],
      0.025,
      "#c5a45f",
    );
  tube(
    "tether",
    [
      [-2.7, 1.1, -0.55],
      [-2.5, 1.1, -0.8],
      [-2.3, 1.03, -1.05],
    ],
    0.022,
    "#b48c4d",
    true,
  );
  for (const z of [-0.08, 0.08])
    box("pfd", [-2.8, 1.06, -0.65 + z], [0.32, 0.12, 0.12], "#bd7257");
  cyl("extinguisher", [-1.3, 0.3, -0.77], 0.075, 0.3, "#b26650");
  bx("drogue", [-4.8, 0.42, 0.2], [0.45, 0.28, 0.34], "#ab8760");
  tube(
    "anchor",
    [
      [5.7, 1.36, 0],
      [6.2, 1.3, 0],
      [6.27, 1.03, 0],
    ],
    0.035,
    palette.metal,
  );
  for (const z of [-0.16, 0.16])
    box("anchor", [6.22, 1.08, z], [0.25, 0.04, 0.17], palette.metal);
  tube(
    "chain",
    [
      [6.0, 1.3, 0],
      [5.3, 1.24, 0],
      [4.9, 1.18, 0],
      [4.85, 0.8, 0],
    ],
    0.023,
    palette.metal,
  );
  mesh(
    "rode",
    new T.TorusGeometry(0.18, 0.045, 8, 24),
    palette.rope,
    [4.7, 0.66, 0],
    [Math.PI / 2, 0, 0],
  );
  cyl("windlass", [4.95, 1.26, 0], 0.11, 0.15);
  box("windlass", [4.9, 1.2, 0], [0.3, 0.08, 0.3], palette.metal);
  // Hollow tanks are constructed from walls so inspection reveals an actual interior.
  const tank = (id: string, p: number[], s: number[], color: string) => {
    const [x, y, z] = p,
      [w, h, d] = s;
    box(id, [x, y - h / 2, z], [w, 0.025, d], color);
    for (const sign of [-1, 1]) {
      box(id, [x + (sign * w) / 2, y, z], [0.025, h, d], color);
      box(id, [x, y, z + (sign * d) / 2], [w, h, 0.025], color);
    }
    const lid = box(id, [x, y + h / 2, z], [w, 0.025, d], color);
    lid.name = "tank-lid";
  };
  tank("water-tank", [0.3, -0.12, -0.94], [1.2, 0.25, 0.45], "#92b2b6");
  tank("holding-tank", [2.4, 0.18, 0.65], [0.55, 0.3, 0.4], "#a7ab91");
  bx("water-pump", [-0.5, -0.04, -0.9], [0.25, 0.14, 0.18], palette.dark);
  tube(
    "water-hose",
    [
      [0.1, -0.1, -0.95],
      [-0.5, -0.05, -0.95],
      [-1.1, 0.4, -1.08],
    ],
    0.021,
    "#719dad",
  );
  cyl("head", [2.2, 0.28, -0.54], 0.18, 0.23, palette.ivory);
  cyl("seacock", [2.25, -0.18, -0.4], 0.045, 0.15, "#a39162");
  cyl("through-hull", [2.25, -0.3, -0.4], 0.06, 0.07, "#a39162");
  bx("bilge-pump", [0, -0.53, 0], [0.18, 0.13, 0.14], "#b87b4c");
  cyl("manual-pump", [-3.7, 0.87, 0.7], 0.12, 0.18, palette.dark);
  tube(
    "bilge-hose",
    [
      [0, -0.5, 0],
      [-1, -0.35, 0.3],
      [-2.6, 0.5, 0.95],
      [-4.8, 0.64, 0.84],
    ],
    0.024,
    "#6d898c",
    true,
  );
  box("galley", [-1.05, 0.3, -1.03], [0.95, 0.75, 0.58], palette.teak);
  box("galley", [-1.05, 0.69, -1.03], [1.04, 0.035, 0.65], palette.ivory);
  box("sink", [-1.1, 0.715, -1.05], [0.38, 0.05, 0.31], palette.metal);
  for (const z of [-1.1, 1.1])
    box(
      z < 0 ? "berth-port" : "berth-starboard",
      [0.15, 0.18, z],
      [2.4, 0.2, 0.54],
      "#768e90",
    );
  for (const sign of [-1, 1]) {
    const shape = new T.Shape();
    shape.moveTo(2.55, 0.08 * sign);
    shape.lineTo(2.55, 0.94 * sign);
    shape.lineTo(4.15, 0.35 * sign);
    shape.lineTo(4.15, 0.08 * sign);
    shape.closePath();
    const geo = new T.ExtrudeGeometry(shape, {
      depth: 0.16,
      bevelEnabled: false,
    });
    geo.rotateX(Math.PI / 2);
    mesh("v-berth", geo, "#859c9b", [0, 0.5, 0]);
  }
  box("nav-station", [-1.1, 0.4, 1.08], [0.85, 0.65, 0.52], palette.teak);
  box("nav-station", [-1.1, 0.745, 1.04], [1.3, 0.04, 0.62], palette.ivory);
  box("food", [0.35, 0.05, 0.63], [0.7, 0.27, 0.27], palette.teak);
  box("sole", [0.45, -0.29, 0], [3.8, 0.04, 0.75], palette.teak);
  for (let i = 0; i < 4; i++)
    box(
      "steps",
      [-1.4 + i * 0.16, 0.87 - i * 0.29, 0],
      [0.25, 0.055, 0.63],
      palette.teak,
    );
  box("traveler", [-3.9, 1.02, 0], [0.1, 0.06, 1.65], palette.metal);
  box("traveler-car", [-3.9, 1.08, 0], [0.2, 0.065, 0.24], palette.dark);
  for (const [id, y] of [
    ["block-upper", upperY],
    ["block-lower", lowerY],
  ] as const)
    for (const z of [-0.09, 0.07])
      cyl(id, [sheetX, y, z], 0.078, 0.045, palette.dark, [Math.PI / 2, 0, 0]);
  for (const [id, z] of [
    ["winch-port", -1.13],
    ["winch-starboard", 1.13],
  ] as const) {
    cyl(id, [-2.3, 1.08, z], 0.105, 0.21, palette.metal);
    cyl(id, [-2.3, 1.19, z], 0.12, 0.04, palette.dark);
  }
  cyl("halyard-winch", [mastX + 0.15, 1.5, 0.14], 0.08, 0.13, palette.metal);
  for (const [id, x, z] of [
    ["cleat-bow", 5.05, 0.2],
    ["cleat-stern", -5.2, 0.4],
  ] as const) {
    cyl(id, [x, 1.08, z], 0.028, 0.1);
    box(id, [x, 1.13, z], [0.25, 0.035, 0.05], palette.metal);
  }
  for (const [side, z] of [
    ["port", -1.35],
    ["starboard", 1.35],
  ] as const)
    cyl("fairlead-" + side, [-0.4, 1.0, z], 0.055, 0.05, palette.dark, [
      Math.PI / 2,
      0,
      0,
    ]);
  tube(
    "reef-hook",
    [
      [mastX - 0.14, boomY, 0],
      [mastX - 0.18, boomY + 0.18, 0],
      [mastX - 0.24, boomY + 0.12, 0],
    ],
    0.017,
    palette.metal,
  );
  box("hatch", [2.15, 1.4, 0], [0.6, 0.09, 0.65], palette.dark);
  for (const sign of [-1, 1]) {
    const pts = hullStations
      .filter((_, i) => i % 2 === 0)
      .map((s) => [s[0], s[3] + 0.6, s[2] * 0.97 * sign]);
    tube("lifelines", pts, 0.012, palette.metal, true);
    for (const p of pts)
      tube("lifelines", [[p[0], p[1] - 0.6, p[2]], p], 0.019, palette.metal);
  }
  // Batch compatible surfaces within each selectable component, retaining tank lids separately.
  for (const g of Object.values(groups)) {
    const buckets = new Map<string, T.Mesh[]>();
    for (const child of [...g.children]) {
      if (!(child instanceof T.Mesh) || child.name === "tank-lid") continue;
      const mat = child.material as T.MeshStandardMaterial;
      const key =
        mat.color.getHexString() + "/" + mat.metalness + "/" + mat.vertexColors;
      const list = buckets.get(key) || [];
      list.push(child);
      buckets.set(key, list);
    }
    for (const list of buckets.values()) {
      if (list.length < 2) continue;
      const geometries = list.map((m) => {
        m.updateMatrix();
        const geo = m.geometry.clone().applyMatrix4(m.matrix);
        geo.deleteAttribute("uv");
        return geo.index ? geo.toNonIndexed() : geo;
      });
      const merged = mergeGeometries(geometries);
      if (!merged) throw new Error("Batch failed");
      const replacement = new T.Mesh(merged, list[0].material);
      replacement.userData = { ...list[0].userData };
      list.forEach((m) => g.remove(m));
      g.add(replacement);
    }
  }
  // Normalize each component to a local origin; assembly transforms remain immutable.
  const manifest: Record<
    string,
    { position: number[]; size: number[]; target: number[] }
  > = {};
  for (const p of parts.filter((p) => !p.abstract)) {
    const g = groups[p.id];
    if (!g.children.length) throw new Error("Missing geometry: " + p.id);
    g.updateMatrixWorld(true);
    const bounds = new T.Box3().setFromObject(g),
      center = bounds.getCenter(new T.Vector3()),
      size = bounds.getSize(new T.Vector3());
    for (const child of g.children) child.position.sub(center);
    g.position.copy(center);
    g.userData.assembled = center.toArray();
    manifest[p.id] = {
      position: center.toArray(),
      size: size.toArray(),
      target: [],
    };
  }
  // Pack each system into its own labeled lane. Cell widths derive from true bounds.
  let laneZ = -30;
  for (const sys of systems) {
    const ps = parts.filter((p) => p.system === sys.id && !p.abstract);
    let cursorX = -12;
    let rowZ = laneZ,
      maxDepth = 0;
    for (const p of ps) {
      const m = manifest[p.id];
      if (cursorX + m.size[0] > 20) {
        cursorX = -12;
        rowZ += maxDepth + 1;
        maxDepth = 0;
      }
      m.target = [cursorX + m.size[0] / 2, m.size[1] / 2, rowZ + m.size[2] / 2];
      cursorX += m.size[0] + 0.8;
      maxDepth = Math.max(maxDepth, m.size[2]);
      groups[p.id].userData.exploded = m.target;
    }
    laneZ = rowZ + maxDepth + 3;
  }
  root.updateMatrixWorld(true);
  return { root, manifest };
}
