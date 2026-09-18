import { test, expect } from "@playwright/test";
test("production build loads model and audit links beneath a project path", async ({
  page,
}) => {
  const failures: string[] = [];
  page.on("response", (response) => {
    if (response.status() >= 400) failures.push(response.url());
  });
  await page.goto("./");
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          Object.keys(
            (window as unknown as { atlasDiagnostics?: { components: object } })
              .atlasDiagnostics?.components || {},
          ).length,
      ),
    )
    .toBe(120);
  await page
    .getByRole("button", {
      name: "Sources & accuracy（来源与精度）",
      exact: true,
    })
    .click();
  for (const name of [
    "Read the engineering audit（阅读工程审计报告）",
    "Component audit ledger（逐部件审计台账）",
  ]) {
    const href = await page
      .getByRole("link", { name, exact: true })
      .getAttribute("href");
    expect(href).toMatch(/^\/atlas\/audit\.(md|json)$/);
    expect((await page.request.get(href!)).status()).toBe(200);
  }
  expect(failures).toEqual([]);
});
