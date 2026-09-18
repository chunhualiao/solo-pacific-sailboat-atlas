import { test, expect, type Page } from "@playwright/test";
const diag = (page: Page) =>
  page.evaluate(
    () =>
      (
        window as unknown as {
          atlasDiagnostics: {
            calls: number;
            camera: number[];
            triangles: number;
            components: Record<
              string,
              { visible: boolean; position: number[]; screen: number[] }
            >;
          };
        }
      ).atlasDiagnostics,
  );
async function ready(page: Page) {
  await page.goto("/");
  await expect
    .poll(async () => Object.keys((await diag(page))?.components || {}).length)
    .toBe(120);
}
test("GLB selection, visibility, isolation, and exact reassembly", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await ready(page);
  const d = await diag(page);
  expect(d.components.jib.visible).toBe(true);
  expect(d.components.genoa.visible).toBe(false);
  expect(d.components["storm-jib"].visible).toBe(false);
  await page.screenshot({ path: "docs/screenshots/assembled.png" });
  await page.getByLabel("Search components（搜索部件）").fill("autopilot");
  await page.locator('[data-part="autopilot"]').click();
  await expect(page.locator(".component-heading h2")).toContainText(
    "自动舵控制器",
  );
  await page
    .getByRole("button", { name: "Isolate（单独显示）", exact: true })
    .click();
  await expect
    .poll(
      async () =>
        Object.values((await diag(page)).components).filter((p) => p.visible)
          .length,
    )
    .toBe(1);
  await page
    .getByRole("button", { name: "Reset all（全部重置）", exact: true })
    .click();
  await page.getByLabel("Search components（搜索部件）").fill("");
  const assembled = (await diag(page)).components;
  for (const v of ["25", "50", "75", "100"]) {
    await page.getByLabel("Explode boat（拆解整船）", { exact: true }).fill(v);
    await expect(
      page.getByLabel("Explode boat（拆解整船）", { exact: true }),
    ).toHaveValue(v);
  }
  await page.screenshot({ path: "docs/screenshots/exploded.png" });
  await page.getByLabel("Explode boat（拆解整船）", { exact: true }).fill("0");
  await expect
    .poll(async () => (await diag(page)).components.hull.position)
    .toEqual(assembled.hull.position);
  for (const [id, p] of Object.entries((await diag(page)).components))
    expect(p.position).toEqual(assembled[id].position);
  await page
    .getByLabel("Headsail configuration（前帆配置）", { exact: true })
    .selectOption("genoa");
  await expect
    .poll(async () => (await diag(page)).components.genoa.visible)
    .toBe(true);
  expect((await diag(page)).components.jib.visible).toBe(false);
  expect(errors).toEqual([]);
});
test("knowledge graph and conditional failure consequences", async ({
  page,
}) => {
  await ready(page);
  await page
    .getByLabel("Inject failure（注入故障）", { exact: true })
    .selectOption("battery");
  await expect(page.locator(".status-item.failed")).toHaveCount(2);
  await expect(page.locator(".status-item.degraded")).toHaveCount(2);
  await page
    .getByLabel("Independent handheld backups（独立手持备用设备）")
    .uncheck();
  await expect(page.locator(".status-item.failed")).toHaveCount(4);
  await page.getByLabel("Search components（搜索部件）").fill("mainsheet");
  await page.locator('[data-part="mainsheet"]').click();
  await page
    .getByRole("button", { name: "Open graph（打开图谱）", exact: true })
    .click();
  await expect(page.locator(".graph-node")).toHaveCount(8);
  await page
    .locator(".graph-node")
    .filter({ hasText: "Lower sheet block" })
    .click();
  await expect(page.locator(".component-heading h2")).toContainText(
    "下缭绳滑轮",
  );
  await page.screenshot({ path: "docs/screenshots/graph.png" });
});
test("cutaway, cameras, sailing controls, and every scenario", async ({
  page,
}) => {
  await ready(page);
  await page
    .getByRole("button", { name: "Below deck （舱内）", exact: true })
    .click();
  await expect
    .poll(async () => (await diag(page)).components.deck.visible)
    .toBe(false);
  expect((await diag(page)).components.mainsail.visible).toBe(false);
  await page.screenshot({ path: "docs/screenshots/interior.png" });
  await page
    .getByLabel("Cutting plane（切割平面）")
    .selectOption("longitudinal");
  await page.getByLabel("Section position（剖面位置）").fill("0.2");
  await page.getByLabel("Open tank lids（打开水箱盖）").check();
  for (const camera of [
    "bow",
    "stern",
    "port",
    "starboard",
    "top",
    "underwater",
  ]) {
    await page.getByLabel("Camera angle（观察角度）").selectOption(camera);
    await page.screenshot({ path: `docs/screenshots/${camera}.png` });
  }
  await page
    .getByRole("button", { name: "Sailing lab （航行实验）", exact: true })
    .click();
  await page.getByLabel("Reefing state（缩帆级别）").fill("2");
  await page.getByLabel("Mainsail trim（主帆调整）").fill("45");
  await expect(page.locator(".readouts")).toContainText("kn");
  await page.screenshot({ path: "docs/screenshots/sailing.png" });
  await page
    .getByRole("button", { name: "Solo Pacific （独航太平洋）", exact: true })
    .click();
  await expect(page.locator(".scenario-card")).toHaveCount(11);
  for (let i = 0; i < 11; i++) {
    await page.locator(".scenario-card").nth(i).click();
    const steps = await page.locator(".scenario-step").count();
    expect(steps).toBeGreaterThanOrEqual(4);
    for (let j = 0; j < steps; j++)
      await page.locator(".step-detail .primary").click();
    await expect(page.locator(".scenario-card")).toHaveCount(11);
  }
});
test("mobile bilingual layout and source panel", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await ready(page);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(
    390,
  );
  await page.screenshot({
    path: "docs/screenshots/mobile.png",
    fullPage: true,
  });
  await page
    .getByRole("button", { name: "Systems（系统）", exact: true })
    .click();
  await page.getByLabel("Search components（搜索部件）").fill("蓄电池");
  await page.locator('[data-part="battery"]').click();
  await expect(page.locator(".component-heading h2")).toContainText(
    "House battery",
  );
  await page
    .getByRole("button", {
      name: "Sources & accuracy（来源与精度）",
      exact: true,
    })
    .click();
  await expect(page.getByRole("dialog")).toContainText("来源核实事实");
  await page
    .getByRole("button", { name: "Close sources（关闭来源）", exact: true })
    .click();
});

test("real canvas picking, orbit, pan, zoom and rendering budget", async ({
  page,
}) => {
  await ready(page);
  await page.getByLabel("Camera angle（观察角度）").selectOption("starboard");
  const canvas = page.locator("canvas");
  const box = (await canvas.boundingBox())!;
  // Click visible model pixels using projected centers; selection must come from the canvas.
  let picked = false;
  for (const id of ["mainsail", "jib", "cabin", "hull"]) {
    const d = await diag(page);
    const [x, y] = d.components[id].screen;
    const before = await page.locator(".component-heading h2").textContent();
    await page.mouse.click(
      box.x + ((x + 1) * box.width) / 2,
      box.y + ((1 - y) * box.height) / 2,
    );
    if (
      (await page.locator(".component-heading h2").textContent()) !== before
    ) {
      picked = true;
      break;
    }
  }
  expect(picked).toBe(true);
  const start = (await diag(page)).camera;
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(
    box.x + box.width / 2 + 90,
    box.y + box.height / 2 + 30,
    { steps: 15 },
  );
  await page.mouse.up();
  await expect.poll(async () => (await diag(page)).camera).not.toEqual(start);
  const orbit = (await diag(page)).camera;
  await page.mouse.wheel(0, -200);
  await expect.poll(async () => (await diag(page)).camera).not.toEqual(orbit);
  const zoom = (await diag(page)).camera;
  await page.mouse.down({ button: "right" });
  await page.mouse.move(
    box.x + box.width / 2 + 130,
    box.y + box.height / 2 + 80,
    { steps: 10 },
  );
  await page.mouse.up({ button: "right" });
  await expect.poll(async () => (await diag(page)).camera).not.toEqual(zoom);
  const measured = await diag(page);
  expect(measured.calls).toBeLessThan(200);
  expect(measured.triangles).toBeLessThan(250000);
  console.log(
    "Measured rendering budget",
    JSON.stringify({ calls: measured.calls, triangles: measured.triangles }),
  );
});

test("graphics interruption retains catalog and actionable bilingual recovery", async ({
  page,
}) => {
  await ready(page);
  await page.locator("canvas").dispatchEvent("webglcontextlost");
  await expect(page.getByRole("alert")).toContainText("图形上下文中断");
  await page.getByLabel("Search components（搜索部件）").fill("battery");
  await expect(page.locator('[data-part="battery"]')).toBeVisible();
  await page.locator("canvas").dispatchEvent("webglcontextrestored");
  await expect(page.getByRole("alert")).toHaveCount(0);
});
