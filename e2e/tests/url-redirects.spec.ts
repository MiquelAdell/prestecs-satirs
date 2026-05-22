/**
 * URL redirect smoke tests.
 *
 * Verifies the accented-URL canonicalisation done by the dev mirror
 * (and Caddy in prod) plus the 404 surface for unknown paths.
 *
 * Test names match the IDs in TESTING_PARAMETERS.md.
 */

import { test, expect } from "@playwright/test";
import { resolve } from "node:path";

const GUEST_STATE = resolve(__dirname, "..", "fixtures", "guest.json");

const ENCODED_WITH_SLASH = "/prestamos/juegos-de-rol/campa%C3%B1as/";
const CANONICAL_WITH_SLASH = "/prestamos/juegos-de-rol/campanas/";
const ENCODED_NO_SLASH = "/prestamos/juegos-de-rol/campa%C3%B1as";
const CANONICAL_NO_SLASH = "/prestamos/juegos-de-rol/campanas";
const UNKNOWN_PATH = "/this-path-does-not-exist-7f3a";

test.describe("url-redirects", () => {
  test.use({ storageState: GUEST_STATE });

  test("int-1: encoded accented URL with trailing slash redirects to ASCII canonical", async ({
    page,
    baseURL,
  }) => {
    const response = await page.goto(`${baseURL}${ENCODED_WITH_SLASH}`, {
      waitUntil: "commit",
    });
    expect(response, "navigation should produce a response").not.toBeNull();
    expect(new URL(page.url()).pathname).toBe(CANONICAL_WITH_SLASH);
  });

  test("int-2: encoded accented URL without trailing slash redirects to ASCII canonical", async ({
    page,
    baseURL,
  }) => {
    await page.goto(`${baseURL}${ENCODED_NO_SLASH}`, { waitUntil: "commit" });
    expect(new URL(page.url()).pathname).toBe(CANONICAL_NO_SLASH);
  });

  test("url-1: unknown path returns 404", async ({ page, baseURL }) => {
    const response = await page.goto(`${baseURL}${UNKNOWN_PATH}`, {
      waitUntil: "commit",
    });
    expect(response, "expected a response from the dev mirror").not.toBeNull();
    expect(response!.status()).toBe(404);
  });
});
