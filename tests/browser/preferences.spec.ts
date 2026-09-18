import { test, expect, type Page } from "@playwright/test";

async function ready(page: Page) {
  await page.goto("/");
  await expect(page.locator("canvas")).toBeVisible();
  await expect(page.locator(".model-label")).toHaveCount(0);
}
async function englishOnly(page: Page) {
  await expect(page).toHaveTitle("Solo Pacific Sailboat Atlas");
  expect(await page.locator("body").innerText()).not.toMatch(/[\u3400-\u9fff]/);
  const labels = await page
    .locator("[aria-label], [title], [placeholder], option")
    .evaluateAll((els) =>
      els
        .map((el) =>
          [
            el.getAttribute("aria-label"),
            el.getAttribute("title"),
            el.getAttribute("placeholder"),
            el.tagName === "OPTION" ? el.textContent : "",
          ].join(" "),
        )
        .join(" "),
    );
  expect(labels).not.toMatch(/[\u3400-\u9fff]/);
}

test("language toggle covers controls, scene labels, graphs, sources and reload", async ({
  page,
}) => {
  await ready(page);
  const toggle = page.getByRole("switch", { name: /Bilingual text/ });
  await expect(toggle).toBeChecked();
  await toggle.click();
  await expect(toggle).not.toBeChecked();
  await englishOnly(page);
  await page
    .getByRole("button", { name: "Selected label", exact: true })
    .click();
  await expect(page.locator(".model-label")).toContainText("Mainsail");
  await englishOnly(page);
  await page
    .getByLabel("Inject failure", { exact: true })
    .selectOption("battery");
  await expect(page.locator(".graph-node")).not.toHaveCount(0);
  await englishOnly(page);
  await page
    .getByRole("button", { name: "Sources & accuracy", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await englishOnly(page);
  await page
    .getByRole("button", { name: "Close sources", exact: true })
    .click();
  await page.reload();
  await expect(toggle).not.toBeChecked();
  await englishOnly(page);
  await toggle.click();
  await expect(page.locator(".component-heading")).toContainText("主帆");
  await expect(page.getByLabel("Search components（搜索部件）")).toBeVisible();
});

test("four desktop panels collapse independently and preserve model state", async ({
  page,
}) => {
  await ready(page);
  await page.getByRole("switch", { name: /Bilingual text/ }).click();
  await page.getByLabel("Explode boat", { exact: true }).fill("40");
  const before = (await page.locator("canvas").boundingBox())!;
  for (const panel of ["left", "right", "top", "bottom"]) {
    const button = page.getByRole("button", {
      name: `Collapse ${panel} panel`,
      exact: true,
    });
    await expect(button).toHaveAttribute("aria-expanded", "true");
    await button.click();
    await expect(
      page.getByRole("button", { name: `Expand ${panel} panel`, exact: true }),
    ).toHaveAttribute("aria-expanded", "false");
  }
  await expect(page.locator(".sidebar")).toBeHidden();
  await expect(page.locator(".inspector")).toBeHidden();
  await expect(page.locator(".topbar")).toBeHidden();
  await expect(page.locator(".modebar")).toBeHidden();
  await expect(page.locator(".explode-bar")).toBeHidden();
  await expect
    .poll(async () => (await page.locator("canvas").boundingBox())!.width)
    .toBeGreaterThan(before.width + 400);
  await expect
    .poll(async () => (await page.locator("canvas").boundingBox())!.height)
    .toBeGreaterThan(before.height + 150);
  await page.screenshot({
    path: ".wrangler/ui-evidence/english-collapsed.png",
  });
  // A canvas drag should still orbit with the panels hidden.
  const camera = () =>
    page.evaluate(
      () =>
        (window as unknown as { atlasDiagnostics: { camera: number[] } })
          .atlasDiagnostics?.camera,
    );
  const start = await camera();
  const box = (await page.locator("canvas").boundingBox())!;
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(
    box.x + box.width / 2 + 90,
    box.y + box.height / 2 + 30,
    { steps: 10 },
  );
  await page.mouse.up();
  await expect.poll(camera).not.toEqual(start);
  for (const panel of ["top", "bottom", "left", "right"]) {
    await page
      .getByRole("button", { name: `Expand ${panel} panel`, exact: true })
      .click();
  }
  await expect(page.getByLabel("Explode boat", { exact: true })).toHaveValue(
    "40",
  );
  await expect(page.locator(".component-heading h2")).toContainText("Mainsail");
});

test("mobile retains language choice and existing navigation", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await ready(page);
  await page.getByRole("switch", { name: /Bilingual text/ }).click();
  await englishOnly(page);
  await page.getByRole("button", { name: "Systems", exact: true }).click();
  await page.getByLabel("Search components", { exact: true }).fill("battery");
  await page.locator('[data-part="battery"]').click();
  await expect(page.locator(".component-heading h2")).toContainText(
    "House battery",
  );
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(
    390,
  );
});

test("English-only follows every view and graphics recovery", async ({
  page,
}) => {
  await ready(page);
  await page.getByRole("switch", { name: /Bilingual text/ }).click();
  for (const mode of [
    "Exploded",
    "Cutaway",
    "Rigging",
    "Below deck",
    "Electrical",
    "Steering",
    "Safety",
    "Sailing lab",
    "Solo Pacific",
    "Assembled",
  ]) {
    await page
      .locator(".modebar")
      .getByRole("button", { name: mode, exact: true })
      .click();
    await englishOnly(page);
  }
  await page.locator("canvas").dispatchEvent("webglcontextlost");
  await expect(page.getByRole("alert")).toContainText(
    "graphics context was interrupted",
  );
  await englishOnly(page);
  await page.getByRole("switch", { name: /Bilingual text/ }).click();
  await expect(page.getByRole("alert")).toContainText("图形上下文中断");
  await page.locator("canvas").dispatchEvent("webglcontextrestored");
  await expect(page.getByRole("alert")).toHaveCount(0);
});

for (const width of [390, 800]) {
  test(`systems drawer stays below the mode bar at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 844 });
    await ready(page);
    for (const bilingual of [true, false]) {
      if (!bilingual)
        await page.getByRole("switch", { name: /Bilingual text/ }).click();
      await page.getByRole("button", { name: /^Systems/ }).click();
      const modes = (await page.locator(".modebar").boundingBox())!;
      const drawer = (await page.locator(".sidebar").boundingBox())!;
      expect(drawer.y).toBeGreaterThanOrEqual(modes.y + modes.height - 1);
      await page.getByRole("button", { name: /^Close hierarchy/ }).click();
    }
    await page.getByRole("switch", { name: /Bilingual text/ }).click();
    await expect(page).toHaveTitle(
      "Solo Pacific Sailboat Atlas（独航太平洋帆船图谱）",
    );
  });
}

test("mobile results remain visible when scrolling with the drawer open", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await ready(page);
  await page.getByLabel("Search components（搜索部件）").fill("battery");
  await page.evaluate(() => window.scrollTo(0, 650));
  const result = page.locator('[data-part="battery"]');
  await expect
    .poll(async () => (await result.boundingBox())!.y)
    .toBeGreaterThanOrEqual(0);
  const box = (await result.boundingBox())!;
  expect(box.y + box.height).toBeLessThan(844);
  await result.click();
  await expect(page.locator(".component-heading h2")).toContainText(
    "House battery",
  );
});
