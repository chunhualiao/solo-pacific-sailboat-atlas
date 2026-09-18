import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import {
  Canvas,
  useFrame,
  useThree,
  type ThreeEvent,
} from "@react-three/fiber";
import { OrbitControls, useGLTF, Html, Grid, Line } from "@react-three/drei";
import * as T from "three";
import { byId, parts, systems, edges, b } from "./data";
import { useLanguage } from "./Language";
import { explodedPosition, sailing } from "./domain";
import { rigPaths, headTransform, rudderTransform } from "./kinematics";
import rawManifest from "./manifest.json";
const manifest = rawManifest as Record<
  string,
  { position: number[]; size: number[]; target: number[] }
>;
export type SceneState = {
  selected: string;
  hidden: string[];
  system: string;
  isolate: boolean;
  ghost: boolean;
  explode: number;
  explodeSystem: string;
  mode: string;
  hullMode: string;
  deckOff: boolean;
  section: string;
  sectionOffset: number;
  tanksOpen: boolean;
  headsail: string;
  wind: number;
  angle: number;
  main: number;
  jib: number;
  reef: number;
  rudder: number;
  focus: number;
  camera: string;
  labels: boolean;
  highlights: string[];
  failedIds?: string[];
};
function Boat({
  state,
  onSelect,
}: {
  state: SceneState;
  onSelect: (id: string) => void;
}) {
  const { t } = useLanguage();
  const { scene } = useGLTF(`${import.meta.env.BASE_URL}models/cal40.glb`);
  const root = useRef<T.Group>(null);
  const clone = useMemo(() => {
    const s = scene.clone(true);
    s.traverse((o) => {
      if (o instanceof T.Mesh) {
        o.material = (o.material as T.MeshStandardMaterial).clone();
        o.castShadow = [
          "hull",
          "deck",
          "cabin",
          "keel",
          "rudder",
          "mast",
          "boom",
          "mainsail",
          "jib",
          "genoa",
          "spinnaker",
          "storm-jib",
        ].includes(o.userData.componentId);
        o.receiveShadow = !["rig", "sails"].includes(
          byId[o.userData.componentId]?.system,
        );
        o.userData.baseGeometry = o.geometry;
      }
    });
    return s;
  }, [scene]);
  const { camera, controls, invalidate } = useThree();
  const componentGroups = useMemo(() => {
    const gs: T.Object3D[] = [];
    clone.traverse((g) => {
      if (g.userData.assembled && manifest[g.userData.componentId]) gs.push(g);
    });
    return gs;
  }, [clone]);
  const clip = useMemo(
    () =>
      state.section === "longitudinal"
        ? [new T.Plane(new T.Vector3(0, 0, -1), state.sectionOffset)]
        : state.section === "transverse"
          ? [new T.Plane(new T.Vector3(-1, 0, 0), state.sectionOffset)]
          : [],
    [state.section, state.sectionOffset],
  );
  const visible = (id: string) => {
    const p = byId[id];
    if (!p) return true;
    if (state.mode === "rig" && !["rig", "deck"].includes(p.system))
      return false;
    if (state.mode === "below" && ["rig", "sails"].includes(p.system))
      return false;
    if (
      ["spinnaker-pole", "pole-lift", "afterguy"].includes(id) &&
      state.headsail !== "spinnaker"
    )
      return false;
    if (state.hidden.includes(id)) return false;
    if (
      state.isolate &&
      id !== state.selected &&
      !state.highlights.includes(id)
    )
      return false;
    if (state.system && p.system !== state.system) return false;
    if (state.hullMode === "hidden" && id === "hull") return false;
    if (state.deckOff && ["deck", "cabin", "hatch"].includes(id)) return false;
    if (p.system === "sails" && id !== "mainsail" && id !== state.headsail)
      return false;
    return true;
  };
  useEffect(() => {
    clone.traverse((o) => {
      if (o instanceof T.Mesh) {
        const id = o.userData.componentId;
        const mat = o.material as T.MeshStandardMaterial;
        const selected = id === state.selected,
          related = state.highlights.includes(id);
        mat.emissive.set(
          state.failedIds?.includes(id)
            ? "#bc4030"
            : selected
              ? "#ba8c39"
              : related
                ? "#5d9082"
                : "#000000",
        );
        mat.emissiveIntensity = selected ? 0.32 : related ? 0.16 : 0;
        mat.clippingPlanes = clip;
        mat.clipShadows = true;
        const translucent = id === "hull" && state.hullMode === "transparent";
        mat.opacity = translucent
          ? 0.2
          : state.ghost && state.selected && !selected && !related
            ? 0.16
            : 1;
        mat.transparent = mat.opacity < 1;
        mat.depthWrite = mat.opacity === 1;
        mat.needsUpdate = true;
        if (o.name === "tank-lid") o.visible = !state.tanksOpen;
      }
    });
    invalidate();
  }, [
    clone,
    state.selected,
    state.highlights,
    state.ghost,
    state.hullMode,
    state.tanksOpen,
    state.failedIds,
    clip,
    invalidate,
  ]);
  useEffect(() => {
    const orbit = controls as unknown as {
      target: T.Vector3;
      update: () => void;
    } | null;
    if (!orbit) return;
    let center = new T.Vector3(0, 6.0, 0),
      offset = new T.Vector3(12, 9, 28);
    if (state.explode > 0.05) {
      const ids = parts
        .filter((p) => !p.abstract && visible(p.id))
        .map((p) => p.id);
      const bounds = new T.Box3();
      ids.forEach((id) => {
        const m = manifest[id];
        const e =
          state.explodeSystem && byId[id].system !== state.explodeSystem
            ? 0
            : state.explode;
        const c = new T.Vector3(...explodedPosition(m.position, m.target, e));
        bounds.expandByPoint(
          c
            .clone()
            .add(
              new T.Vector3(
                ...(m.size as [number, number, number]),
              ).multiplyScalar(0.5),
            ),
        );
        bounds.expandByPoint(
          c
            .clone()
            .sub(
              new T.Vector3(
                ...(m.size as [number, number, number]),
              ).multiplyScalar(0.5),
            ),
        );
      });
      if (!bounds.isEmpty()) {
        center = bounds.getCenter(new T.Vector3());
        const size = bounds.getSize(new T.Vector3());
        offset = new T.Vector3(
          size.x * 0.65 + 6,
          size.y + size.z * 0.6 + 8,
          size.z * 0.9 + 12,
        );
      }
    } else if (state.camera === "focus" && manifest[state.selected]) {
      const m = manifest[state.selected];
      center = new T.Vector3(...(m.position as [number, number, number]));
      const r = Math.max(...m.size, 1);
      offset = new T.Vector3(r * 1.5, r * 0.8, r * 1.9);
    } else if (state.system) {
      const bounds = new T.Box3();
      for (const part of parts.filter((p) => !p.abstract && visible(p.id))) {
        const m = manifest[part.id];
        bounds.union(
          new T.Box3().setFromCenterAndSize(
            new T.Vector3(...(m.position as [number, number, number])),
            new T.Vector3(...(m.size as [number, number, number])),
          ),
        );
      }
      if (!bounds.isEmpty()) {
        center = bounds.getCenter(new T.Vector3());
        const size = bounds.getSize(new T.Vector3());
        const r = Math.max(size.length(), 2);
        offset = new T.Vector3(r * 0.95, r * 0.7, r * 1.45);
      }
    } else if (state.camera === "bow") {
      center.set(0, 4, 0);
      offset.set(27, 6, 0);
    } else if (state.camera === "stern") {
      center.set(0, 4, 0);
      offset.set(-27, 6, 0);
    } else if (state.camera === "port") {
      center.set(0, 5, 0);
      offset.set(0, 3, -29);
    } else if (state.camera === "starboard") {
      center.set(0, 5, 0);
      offset.set(0, 3, 29);
    } else if (state.camera === "top") {
      center.set(0, 0, 0);
      offset.set(0, 23, 0.01);
    } else if (state.camera === "underwater") {
      center.set(0, -0.4, 0);
      offset.set(7, -5, 10);
    } else if (state.mode === "below" || state.mode === "electrical") {
      center.set(0, 0.4, 0);
      offset.set(12, 10, 17);
    }
    camera.position.copy(center).add(offset);
    orbit.target.copy(center);
    orbit.update();
    invalidate();
    // Camera framing changes only on explicit camera/mode/explosion requests.
  }, [state.focus, state.mode, state.explode, state.explodeSystem, controls]);

  useEffect(() => {
    const moving = state.mode === "sailing",
      sign = state.angle < 0 ? -1 : 1;
    const paths = rigPaths(
      moving ? state.main * sign : 0,
      moving ? state.jib * sign : 0,
      moving ? state.reef : 0,
      state.headsail,
      moving ? state.rudder : 0,
    );
    for (const g of componentGroups) {
      const id = g.userData.componentId;
      if (!paths[id]) continue;
      const meshes = g.children.filter((o) => o instanceof T.Mesh) as T.Mesh[];
      const shouldReplace =
        state.explode === 0 && (moving || id.startsWith("jibsheet"));
      for (let i = 0; i < meshes.length; i++) {
        const m = meshes[i];
        if (m.geometry !== m.userData.baseGeometry) m.geometry.dispose();
        m.geometry = m.userData.baseGeometry;
        m.visible = true;
        if (shouldReplace) {
          if (i > 0) {
            m.visible = false;
            continue;
          }
          const path = new T.CurvePath<T.Vector3>();
          const vs = paths[id].map((p) =>
            new T.Vector3(...p)
              .sub(
                new T.Vector3(
                  ...(manifest[id].position as [number, number, number]),
                ),
              )
              .sub(m.position),
          );
          for (let j = 1; j < vs.length; j++)
            path.add(new T.LineCurve3(vs[j - 1], vs[j]));
          m.geometry = new T.TubeGeometry(
            path,
            Math.max(20, vs.length * 10),
            id === "drive" ? 0.065 : id === "vang" ? 0.03 : 0.017,
            6,
            false,
          );
        }
      }
    }
    invalidate();
  }, [
    componentGroups,
    state.mode,
    state.angle,
    state.main,
    state.jib,
    state.reef,
    state.rudder,
    state.headsail,
    state.explode,
    invalidate,
  ]);
  useFrame(() => {
    for (const g of componentGroups) {
      const id = g.userData.componentId;
      const m = manifest[id],
        e =
          state.explodeSystem && byId[id].system !== state.explodeSystem
            ? 0
            : state.explode;
      g.visible = visible(id);
      g.position.set(...explodedPosition(m.position, m.target, e));
      g.rotation.set(0, 0, 0);
      g.scale.set(1, 1, 1);
      if (state.mode === "sailing" && !e) {
        const main = ["mainsail", "boom", "block-upper"].includes(id),
          head = ["jib", "genoa", "storm-jib", "spinnaker"].includes(id);
        if (main || head) {
          const trim =
            (((main ? state.main : state.jib) * Math.PI) / 180) *
            (state.angle < 0 ? -1 : 1);
          const pivot = new T.Vector3(1.38, 0, 0);
          if (head) {
            const matrix = headTransform(id, (trim * 180) / Math.PI);
            g.position.applyMatrix4(matrix);
            g.quaternion.setFromRotationMatrix(matrix);
          } else {
            g.position
              .sub(pivot)
              .applyAxisAngle(new T.Vector3(0, 1, 0), trim)
              .add(pivot);
            g.rotation.y = trim;
          }
        }
        if (id === "mainsail") {
          g.scale.y = 1 - state.reef * 0.24;
          g.scale.x = 1 - state.reef * 0.12;
          g.position.y = 2.43 + (m.position[1] - 2.43) * g.scale.y;
          const trimmed = new T.Vector3(
            1.28 + (m.position[0] - 1.28) * g.scale.x,
            0,
            m.position[2],
          )
            .sub(new T.Vector3(1.38, 0, 0))
            .applyAxisAngle(new T.Vector3(0, 1, 0), g.rotation.y)
            .add(new T.Vector3(1.38, 0, 0));
          g.position.x = trimmed.x;
          g.position.z = trimmed.z;
        }
        if (["rudder", "rudder-stock", "tiller", "tiller-arm"].includes(id)) {
          const matrix = rudderTransform(state.rudder);
          g.position.applyMatrix4(matrix);
          g.quaternion.setFromRotationMatrix(matrix);
        }
      }
    }
    if (root.current)
      root.current.rotation.x =
        state.mode === "sailing"
          ? (sailing(
              state.wind,
              state.angle,
              state.main,
              state.jib,
              state.reef,
              state.rudder,
              state.headsail,
            ).heel *
              Math.PI) /
            180
          : 0;
  });
  const pick = (event: ThreeEvent<MouseEvent>) => {
    if (event.delta > 5) return;
    const candidates = event.intersections.filter((hit) => {
      const id = hit.object.userData.componentId;
      if (!id || !visible(id)) return false;
      return !clip.some((p) => p.distanceToPoint(hit.point) < 0);
    });
    const hit = candidates[0];
    if (hit) {
      event.stopPropagation();
      onSelect(hit.object.userData.componentId);
    }
  };
  return (
    <group ref={root}>
      <primitive
        object={clone}
        onClick={pick}
        onPointerOver={() => {
          document.body.style.cursor = "pointer";
        }}
        onPointerOut={() => {
          document.body.style.cursor = "auto";
        }}
      />
      {state.labels && state.selected && manifest[state.selected] && (
        <Html
          position={explodedPosition(
            manifest[state.selected].position,
            manifest[state.selected].target,
            state.explode,
          )}
          center
          distanceFactor={20}
        >
          <div className="model-label">{t(byId[state.selected].name)}</div>
        </Html>
      )}
    </group>
  );
}
function ExplodedGuides({ state }: { state: SceneState }) {
  const { t } = useLanguage();
  if (state.explode < 0.05) return null;
  const position = (id: string) => {
    const m = manifest[id];
    return explodedPosition(
      m.position,
      m.target,
      state.explodeSystem && byId[id].system !== state.explodeSystem
        ? 0
        : state.explode,
    );
  };
  return (
    <group>
      {state.explode > 0.65 &&
        systems
          .filter((s) => !state.explodeSystem || s.id === state.explodeSystem)
          .map((s) => {
            const ps = parts.filter((p) => p.system === s.id && !p.abstract);
            const minX = Math.min(
              ...ps.map(
                (p) => manifest[p.id].target[0] - manifest[p.id].size[0] / 2,
              ),
            );
            const minZ = Math.min(
              ...ps.map(
                (p) => manifest[p.id].target[2] - manifest[p.id].size[2] / 2,
              ),
            );
            return (
              <Html key={s.id} position={[minX, 0, minZ - 1]}>
                <div className="system-label" style={{ borderColor: s.color }}>
                  {t(s.name)}
                </div>
              </Html>
            );
          })}
      {edges
        .filter(
          (e) =>
            (e.from === state.selected || e.to === state.selected) &&
            manifest[e.from] &&
            manifest[e.to],
        )
        .map((e, i) => (
          <Line
            key={i}
            points={[position(e.from), position(e.to)]}
            color="#9caa93"
            dashed
            dashSize={0.12}
            gapSize={0.1}
            lineWidth={1}
          />
        ))}
    </group>
  );
}
function Forces({ state }: { state: SceneState }) {
  const { t } = useLanguage();
  const s = sailing(
    state.wind,
    state.angle,
    state.main,
    state.jib,
    state.reef,
    state.rudder,
    state.headsail,
  );
  const vectors = useMemo(
    () =>
      [
        {
          p: [3, 6, 3],
          v: [s.trueX, 0, s.trueZ],
          c: "#799eaa",
          label: b("True wind", "真风"),
        },
        {
          p: [3, 4.8, 3],
          v: [s.apparentX, 0, s.apparentZ],
          c: "#b69353",
          label: b("Apparent wind", "视风"),
        },
        {
          p: [-1, 5, 0],
          v: [s.drive, 0, s.lateral],
          c: "#c77a61",
          label: b("Sail force", "帆气动力"),
        },
        {
          p: [0, -0.9, 0],
          v: [0, 0, s.keelForce],
          c: "#558b93",
          label: b("Keel force", "龙骨侧向力"),
        },
        {
          p: [-4.5, -0.8, 0],
          v: [0, 0, s.rudderForce],
          c: "#8a83a3",
          label: b("Rudder force", "舵力"),
        },
        {
          p: [0, 0.1, 2],
          v: [s.speed, 0, 0],
          c: "#779d6e",
          label: b("Boat velocity", "船速"),
        },
      ].map((x) => ({
        ...x,
        arrow: new T.ArrowHelper(
          new T.Vector3(...(x.v as [number, number, number])).normalize(),
          new T.Vector3(...(x.p as [number, number, number])),
          Math.hypot(...x.v) > 0 ? 2.5 : 0,
          x.c,
          0.24,
          0.12,
        ),
      })),
    [
      s.trueX,
      s.trueZ,
      s.apparentX,
      s.apparentZ,
      s.drive,
      s.lateral,
      s.keelForce,
      s.rudderForce,
      s.speed,
    ],
  );
  return (
    <>
      {vectors.map((x, i) => (
        <group key={i}>
          <primitive object={x.arrow} />
          <Html position={x.p as [number, number, number]}>
            <span className="force-label" style={{ color: x.c }}>
              {t(x.label)}
            </span>
          </Html>
        </group>
      ))}
    </>
  );
}
function ContextRecovery() {
  const { t } = useLanguage();
  const { gl, invalidate } = useThree();
  const [lost, setLost] = useState(false);
  useEffect(() => {
    const canvas = gl.domElement;
    const loss = (event: Event) => {
      event.preventDefault();
      setLost(true);
    };
    const restore = () => {
      setLost(false);
      invalidate();
    };
    canvas.addEventListener("webglcontextlost", loss);
    canvas.addEventListener("webglcontextrestored", restore);
    return () => {
      canvas.removeEventListener("webglcontextlost", loss);
      canvas.removeEventListener("webglcontextrestored", restore);
    };
  }, [gl, invalidate]);
  return lost ? (
    <Html fullscreen>
      <div className="context-recovery" role="alert">
        <p>
          {t(
            b(
              "The graphics context was interrupted. The component catalog remains available. Reload to rebuild the model if it does not recover.",
              "图形上下文中断；部件目录仍可使用。若模型未恢复，请重新加载。",
            ),
          )}
        </p>
        <button onClick={() => window.location.reload()}>
          {t(b("Reload model", "重新加载模型"))}
        </button>
      </div>
    </Html>
  ) : null;
}
function CanvasLanguage() {
  const { t } = useLanguage();
  const { gl } = useThree();
  useEffect(() => {
    gl.domElement.setAttribute(
      "aria-label",
      t(b("Interactive Cal 40 model", "可交互 Cal 40 模型")),
    );
  }, [gl, t]);
  return null;
}
function Diagnostics() {
  const { gl, scene, camera } = useThree();
  useFrame(() => {
    const components: Record<
      string,
      { position: number[]; visible: boolean; screen: number[] }
    > = {};
    scene.traverse((o) => {
      if (!o.userData.assembled) return;
      let visible = true;
      let current: T.Object3D | null = o;
      while (current) {
        visible = visible && current.visible;
        current = current.parent;
      }
      const pos = o.getWorldPosition(new T.Vector3()),
        screen = pos.clone().project(camera);
      components[o.userData.componentId] = {
        position: o.position.toArray(),
        visible,
        screen: screen.toArray(),
      };
    });
    const w = window as unknown as { atlasDiagnostics: unknown };
    w.atlasDiagnostics = {
      calls: gl.info.render.calls,
      triangles: gl.info.render.triangles,
      camera: camera.position.toArray(),
      components,
    };
  });
  return null;
}
export function Scene({
  state,
  onSelect,
}: {
  state: SceneState;
  onSelect: (id: string) => void;
}) {
  const { t } = useLanguage();
  return (
    <Canvas
      frameloop="demand"
      shadows={{ type: T.PCFShadowMap }}
      dpr={[1, 1.5]}
      camera={{ position: [20, 15, 24], fov: 37, near: 0.05, far: 500 }}
      gl={{
        antialias: true,
        localClippingEnabled: true,
        preserveDrawingBuffer: true,
      }}
      onCreated={({ gl }) => {
        gl.setClearColor("#f1f3f0");
      }}
    >
      <CanvasLanguage />
      <ContextRecovery />
      <ambientLight intensity={1.8} />
      <directionalLight
        position={[8, 20, 10]}
        intensity={2.6}
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-left={-12}
        shadow-camera-right={12}
        shadow-camera-top={18}
        shadow-camera-bottom={-8}
      />
      <directionalLight position={[-12, 8, -14]} intensity={1.4} />
      <Suspense
        fallback={
          <Html center>
            <div className="model-label">
              {t(b("Loading components…", "正在加载部件…"))}
            </div>
          </Html>
        }
      >
        <Boat state={state} onSelect={onSelect} />
      </Suspense>
      <OrbitControls
        makeDefault
        minDistance={0.5}
        maxDistance={180}
        enableDamping
        dampingFactor={0.12}
      />
      <Grid
        position={[0, -1.9, 0]}
        args={[120, 120]}
        cellSize={1}
        cellThickness={0.35}
        cellColor="#bbc8c8"
        sectionSize={5}
        sectionThickness={0.6}
        sectionColor="#a7b7b9"
        fadeDistance={50}
        fadeStrength={2}
        infiniteGrid
      />
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -1.96, 0]}
        receiveShadow
      >
        <planeGeometry args={[300, 300]} />
        <shadowMaterial opacity={0.12} />
      </mesh>
      <ExplodedGuides state={state} />
      {state.mode === "sailing" && <Forces state={state} />}
      <Diagnostics />
    </Canvas>
  );
}
useGLTF.preload(`${import.meta.env.BASE_URL}models/cal40.glb`);
