const esbuild = require("esbuild");

esbuild
  .build({
    entryPoints: ["scripts/nspell-entry.js"],
    bundle: true,
    outfile: "public/nspell.min.js",
    format: "iife",
    globalName: "NSpellModule",
    minify: true,
    platform: "browser",
  })
  .then(() => {
    console.log("nspell.min.js built successfully");
  })
  .catch((error) => {
    console.error("Build failed:", error);
    process.exit(1);
  });
