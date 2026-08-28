import { expect, test } from "@playwright/test";

type Case = {
    route: string;
    pageChunk: "HomePage" | "ConverterPage";
};

// Every prerendered route must ship exactly one route-specific page chunk
// modulepreload (the lazy chunk React.lazy would otherwise only fetch after
// hydration). "/" uses HomePage; every converter and pair route uses
// ConverterPage. A wrong or missing chunk would regress time-to-interactive.
const cases: Case[] = [
    { route: "/", pageChunk: "HomePage" },
    { route: "/length", pageChunk: "ConverterPage" },
    { route: "/temperature", pageChunk: "ConverterPage" },
    { route: "/length/meters-to-feet", pageChunk: "ConverterPage" },
    { route: "/weight/kilograms-to-pounds", pageChunk: "ConverterPage" },
];

const pagePreloadPattern = (name: string) =>
    new RegExp(
        `<link rel="modulepreload" crossorigin href="/assets/${name}-[A-Za-z0-9_-]+\\.js">`,
    );

const pageChunkPreloadCount = (html: string) =>
    (
        html.match(
            /<link rel="modulepreload" crossorigin href="\/assets\/(HomePage|ConverterPage)-/g,
        ) ?? []
    ).length;

test.describe("route-specific page chunk modulepreload", () => {
    for (const { route, pageChunk } of cases) {
        test(`${route} modulepreloads ${pageChunk} and no other page chunk`, async ({
            request,
        }) => {
            const response = await request.get(route);
            expect(
                response.ok(),
                `expected ${route} to be prerendered (status ${response.status()})`,
            ).toBe(true);
            const html = await response.text();

            expect(
                html,
                `expected ${route} to modulepreload ${pageChunk}`,
            ).toMatch(pagePreloadPattern(pageChunk));

            const wrongChunk =
                pageChunk === "HomePage" ? "ConverterPage" : "HomePage";
            expect(
                html,
                `${route} must not modulepreload the wrong page chunk (${wrongChunk})`,
            ).not.toMatch(pagePreloadPattern(wrongChunk));

            expect(
                pageChunkPreloadCount(html),
                `${route} should ship exactly one page-chunk modulepreload`,
            ).toBe(1);
        });
    }
});
