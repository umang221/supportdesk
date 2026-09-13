/**
 * Node ESM loader hook that resolves the "@/" import alias (defined in
 * jsconfig.json for Next.js's bundler) when app code is imported from a
 * plain `node` script, such as scripts/seed.mjs.
 */
import path from "node:path";
import { pathToFileURL } from "node:url";

const projectRoot = path.resolve(import.meta.dirname, "..");

export async function resolve(specifier, context, nextResolve) {
  if (specifier.startsWith("@/")) {
    let target = path.join(projectRoot, specifier.slice(2));
    if (!path.extname(target)) target += ".js";
    return nextResolve(pathToFileURL(target).href, context);
  }
  return nextResolve(specifier, context);
}
