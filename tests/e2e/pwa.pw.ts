import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("ships an installable web app manifest and versioned service worker", async ({ request }) => {
  const manifestResponse = await request.get("/manifest.webmanifest");
  expect(manifestResponse.ok()).toBe(true);
  expect(manifestResponse.headers()["content-type"]).toContain("application/manifest+json");

  const manifest = await manifestResponse.json();
  expect(manifest).toMatchObject({
    id: "/",
    name: "Q Converter — Measurement Studio",
    short_name: "Q Converter",
    start_url: "/",
    scope: "/",
    display: "standalone",
    theme_color: "#0f172a",
    background_color: "#0f172a",
  });
  expect(manifest.icons).toEqual(expect.arrayContaining([
    expect.objectContaining({ src: "/pwa-192.png", sizes: "192x192", type: "image/png" }),
    expect.objectContaining({ src: "/pwa-512.png", sizes: "512x512", type: "image/png" }),
  ]));

  for (const icon of ["/apple-touch-icon.png", "/pwa-192.png", "/pwa-512.png"]) {
    const response = await request.get(icon);
    expect(response.ok(), icon).toBe(true);
    expect(response.headers()["content-type"], icon).toBe("image/png");
  }

  const workerResponse = await request.get("/sw.js");
  expect(workerResponse.ok()).toBe(true);
  const worker = await workerResponse.text();
  expect(worker).toMatch(/q-converter-[a-f0-9]{12}/);
  const precache = worker.match(/const PRECACHE_URLS = (\[[\s\S]*?\]);/)?.[1];
  expect(precache).toBeTruthy();
  for (const url of JSON.parse(precache ?? "[]") as string[]) {
    const response = await request.get(url, { maxRedirects: 0 });
    expect(response.status(), `precache URL ${url}`).toBe(200);
  }
});

test("a previously visited converter remains usable offline", async ({ context, page }) => {
  await page.goto("/length");
  await page.evaluate(async () => navigator.serviceWorker.ready);
  await page.reload();
  expect(await page.evaluate(() => Boolean(navigator.serviceWorker.controller))).toBe(true);

  await page.goto("/weight?from=kilograms&to=pounds&value=10");
  await expect(page.locator("#weight-result")).toHaveValue("22.05");
  const cachedUrls = await page.evaluate(async () => {
    const urls: string[] = [];
    for (const cacheName of await caches.keys()) {
      for (const request of await (await caches.open(cacheName)).keys()) urls.push(request.url);
    }
    return urls;
  });
  expect(cachedUrls).toContain("http://127.0.0.1:4173/weight");
  expect(cachedUrls.some((url) => url.includes("value=10"))).toBe(false);

  await context.setOffline(true);
  try {
    await page.reload();
    await expect(page.getByRole("heading", { level: 1, name: "Weight Converter" })).toBeVisible();
    await expect(page.locator("#weight-result")).toHaveValue("22.05");

    await page.locator("#weight-from-value").fill("25");
    await expect(page.locator("#weight-result")).toHaveValue("55.12");
  } finally {
    await context.setOffline(false);
  }
});

test("legacy and trailing-slash converter URLs resolve from canonical offline cache", async ({ context, page }) => {
  await page.goto("/");
  await page.evaluate(async () => navigator.serviceWorker.ready);
  await page.reload();

  await context.setOffline(true);
  try {
    await page.goto("/convert/length?from=feet&to=centimeters&value=5");
    await expect(page.getByRole("heading", { level: 1, name: "Length Converter" })).toBeVisible();
    await expect(page.locator("#length-result")).toHaveValue("152.4");

    await page.goto("/temperature/?from=celsius&to=fahrenheit&value=100");
    await expect(page.getByRole("heading", { level: 1, name: "Temperature Converter" })).toBeVisible();
    await expect(page.locator("#temperature-result")).toHaveValue("212");
  } finally {
    await context.setOffline(false);
  }
});

test("offers the native install flow only when the browser makes it available", async ({ page }) => {
  await page.goto("/");
  await page.locator("footer").waitFor();
  const declineAnalytics = page.getByRole("button", { name: "Use without analytics" });
  if (await declineAnalytics.isVisible()) await declineAnalytics.click();
  await expect(page.getByRole("button", { name: "Install app" })).toHaveCount(0);

  await page.evaluate(() => {
    const event = new Event("beforeinstallprompt", { cancelable: true });
    Object.defineProperties(event, {
      prompt: { value: async () => {
        (window as typeof window & { __installPromptCalled?: boolean }).__installPromptCalled = true;
      } },
      userChoice: { value: Promise.resolve({ outcome: "accepted", platform: "web" }) },
    });
    window.dispatchEvent(event);
  });

  const installButton = page.getByRole("button", { name: "Install app" });
  await expect(installButton).toBeVisible();
  await installButton.click();
  expect(await page.evaluate(() =>
    (window as typeof window & { __installPromptCalled?: boolean }).__installPromptCalled,
  )).toBe(true);
  await expect(installButton).toHaveCount(0);
});

test("offline feedback is accessible without overflowing at 320px", async ({ context, page }) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await page.goto("/");
  await context.setOffline(true);
  try {
    await expect(page.getByRole("status")).toContainText("Cached converters still work");
    const results = await new AxeBuilder({ page }).include('[role="status"]').analyze();
    expect(results.violations).toEqual([]);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
  } finally {
    await context.setOffline(false);
  }
});
