import { b, edges, parts, type Bi } from "./data";
export type Status = {
  state: "operating" | "failed" | "degraded" | "conditional";
  reason: Bi;
  path: string[];
};
export function evaluate(
  failure: string,
  backup: boolean,
): Record<string, Status> {
  const state: Record<string, Status> = Object.fromEntries(
    parts.map((p) => [
      p.id,
      {
        state: "operating",
        reason: b(
          "Available in this educational configuration.",
          "在此教学配置中可用。",
        ),
        path: [],
      },
    ]),
  );
  const fail = (id: string, path: string[]) => {
    state[id] = {
      state: "failed",
      reason: b(
        "A required component or supply path is unavailable.",
        "必要部件或供电路径不可用。",
      ),
      path,
    };
  };
  if (failure && failure !== "low-charge" && state[failure])
    fail(failure, [failure]);
  const dependencies = edges.filter(
    (e) => e.type === "power" && !["shore", "charger"].includes(e.from),
  );
  // Bounded monotone propagation: sensing loops are not power dependencies.
  for (let i = 0; i < parts.length; i++) {
    let changed = false;
    for (const e of dependencies)
      if (state[e.from].state === "failed" && state[e.to].state !== "failed") {
        fail(e.to, [...state[e.from].path, e.to]);
        changed = true;
      }
    if (!changed) break;
  }
  if (failure === "low-charge")
    for (const id of [
      "battery",
      "autopilot",
      "drive",
      "ais",
      "vhf",
      "gps",
      "bilge-pump",
      "water-pump",
    ])
      state[id] = {
        state: "conditional",
        reason: b(
          "Voltage, load and reserve are unknown; reliable operation is not established.",
          "电压、负载和余量未知；无法确认可靠运行。",
        ),
        path: ["battery", id],
      };
  for (const id of ["handheld", "backup-gps"]) if (!backup) fail(id, [id]);
  // An operative controller alone does not mean that heading control is available.
  for (const dep of ["imu", "drive", "tiller-arm", "rudder-stock", "rudder"])
    if (state[dep].state === "failed" && state.autopilot.state !== "failed")
      fail("autopilot", [...state[dep].path, "autopilot"]);
  for (const [cap, main, alt] of [
    ["navigation", "gps", "backup-gps"],
    ["communication", "vhf", "handheld"],
  ]) {
    if (state[main].state === "failed")
      state[cap] =
        state[alt].state === "operating"
          ? {
              state: "degraded",
              reason: b(
                "The fixed unit is unavailable; an independent handheld preserves a reduced capability.",
                "固定设备不可用；独立手持设备保留有限功能。",
              ),
              path: [...state[main].path, alt, cap],
            }
          : {
              state: "failed",
              reason: b(
                "Neither the main unit nor an enabled independent backup is available.",
                "主设备和已启用的独立备用设备均不可用。",
              ),
              path: [...state[main].path, cap],
            };
    else if (state[main].state === "conditional")
      state[cap] = { ...state[main], path: [...state[main].path, cap] };
  }
  return state;
}
export function explodedPosition(
  a: number[],
  z: number[],
  amount: number,
): [number, number, number] {
  const f = Math.min(1, Math.max(0, amount));
  return [0, 1, 2].map((i) => a[i] + (z[i] - a[i]) * f) as [
    number,
    number,
    number,
  ];
}
export function sailing(
  wind: number,
  angle: number,
  main: number,
  jib: number,
  reef: number,
  rudder: number,
  headsail = "jib",
) {
  const rad = Math.PI / 180,
    a = angle * rad,
    sign = angle < 0 ? -1 : 1,
    area =
      32.52 * (1 - reef * 0.24) * (1 - reef * 0.12) +
      ({ jib: 24, genoa: 43, spinnaker: 85, "storm-jib": 11 }[headsail] ?? 24);
  const noGo = Math.abs(angle) < 32;
  const ideal = Math.max(8, Math.min(82, (Math.abs(angle) - 25) * 0.6));
  const trim = Math.max(
    0.04,
    1 - (Math.abs(main - ideal) + Math.abs(jib - ideal)) / 130,
  );
  // Resistance equilibrium is illustrative, not Cal 40 performance data.
  const speed =
    wind === 0 || noGo
      ? 0
      : Math.min(
          9.5,
          wind *
            0.43 *
            Math.pow(Math.sin(Math.abs(a) / 2), 0.55) *
            Math.sqrt(area / 56.52) *
            trim,
        );
  const trueX = -wind * Math.cos(a),
    trueZ = wind * Math.sin(a),
    apparentX = trueX - speed,
    apparentZ = trueZ;
  const apparent = Math.hypot(apparentX, apparentZ),
    pressure = 0.5 * 1.225 * (apparent * 0.514444) ** 2;
  const drive = noGo
    ? 0
    : pressure * area * 0.62 * trim * Math.sin(Math.abs(a) / 2);
  const lateral = noGo
    ? 0
    : sign * pressure * area * 0.48 * trim * Math.sin(Math.abs(a));
  const heel = Math.atan((lateral * 4.6) / (6804 * 9.81 * 0.8)) / rad;
  const rudderForce =
    0.5 * 1025 * (speed * 0.514444) ** 2 * 0.75 * Math.sin(rudder * rad) * 0.6;
  return {
    speed,
    area,
    apparent,
    apparentX,
    apparentZ,
    trueX,
    trueZ,
    drive,
    lateral,
    heel: Math.max(-32, Math.min(32, heel)),
    rudderForce,
    keelForce: -lateral,
    ideal,
    noGo,
  };
}
