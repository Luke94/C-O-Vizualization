import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { build, context } from "esbuild";

const scriptsDirectory = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(scriptsDirectory, "..");
const outputDirectory = path.join(projectRoot, "dist", "client");
const htmlTemplate = path.join(projectRoot, "index.html");

function createBuildOptions({ production = false } = {}) {
  return {
    absWorkingDir: projectRoot,
    entryPoints: { app: "src/main.jsx" },
    outdir: outputDirectory,
    entryNames: "assets/[name]",
    assetNames: "assets/[name]-[hash]",
    bundle: true,
    format: "esm",
    platform: "browser",
    target: ["es2020"],
    jsx: "automatic",
    loader: {
      ".png": "file"
    },
    minify: production,
    sourcemap: production ? false : "linked",
    logLevel: "info"
  };
}

async function copyHtmlTemplate() {
  await fs.mkdir(outputDirectory, { recursive: true });
  await fs.copyFile(htmlTemplate, path.join(outputDirectory, "index.html"));
}

export async function buildClient({ production = false, clean = true } = {}) {
  if (clean) {
    await fs.rm(outputDirectory, { recursive: true, force: true });
  }

  await copyHtmlTemplate();
  await build(createBuildOptions({ production }));
}

export async function watchClient() {
  await fs.rm(outputDirectory, { recursive: true, force: true });
  await copyHtmlTemplate();

  const buildContext = await context({
    ...createBuildOptions({ production: false }),
    plugins: [
      {
        name: "build-status",
        setup(buildApi) {
          buildApi.onEnd(async (result) => {
            if (result.errors.length === 0) {
              await copyHtmlTemplate();
              console.log("Frontend přeložen. Obnovte stránku v prohlížeči.");
            }
          });
        }
      }
    ]
  });

  await buildContext.watch();
  return buildContext;
}
