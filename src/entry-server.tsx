import React from "react";
import { PassThrough } from "node:stream";
import { renderToPipeableStream } from "react-dom/server";
import { HelmetProvider } from "react-helmet-async";
import { StaticRouter } from "react-router";
import App from "./App";
import { categories } from "./lib/conversion-data";
import { pairPagePath, pairPages } from "./lib/pair-pages";

export const prerenderRoutes = [
  "/",
  ...categories.map(({ id }) => `/${id}`),
  ...pairPages.map(pairPagePath),
];

export const render = (url: string): Promise<string> =>
  new Promise((resolve, reject) => {
    let settled = false;
    let renderError: unknown;
    const output = new PassThrough();
    const chunks: Buffer[] = [];

    output.on("data", (chunk: Buffer | string) => {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    });
    output.on("end", () => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      resolve(Buffer.concat(chunks).toString("utf8"));
    });
    output.on("error", (error) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      reject(error);
    });

    const stream = renderToPipeableStream(
      <HelmetProvider>
        <StaticRouter location={url}>
          <App />
        </StaticRouter>
      </HelmetProvider>,
      {
        onAllReady() {
          if (renderError) {
            settled = true;
            clearTimeout(timeout);
            stream.abort();
            reject(renderError);
            return;
          }
          stream.pipe(output);
        },
        onShellError(error) {
          if (settled) return;
          settled = true;
          clearTimeout(timeout);
          reject(error);
        },
        onError(error) {
          renderError ??= error;
        },
      },
    );
    const timeout = setTimeout(() => {
      if (settled) return;
      settled = true;
      stream.abort();
      reject(new Error(`Prerender timed out for ${url}.`));
    }, 15_000);
  });
