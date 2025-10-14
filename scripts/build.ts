import { build, emptyDir } from "https://deno.land/x/dnt/mod.ts";

/** Carga y parsea deno.jsonc (admite comentarios // y /* ... * /) */
async function loadDenoConfig() {
  const text = await Deno.readTextFile("./deno.jsonc");
  // Elimina comentarios JSONC (// y /* ... */)
  const noComments = text
    .replace(/\/\/.*$/gm, "")
    .replace(/\/\*[\s\S]*?\*\//g, "");
  return JSON.parse(noComments);
}

/** Extrae las dependencias npm:... desde imports */
function extractNpmDependencies(imports: Record<string, string> = {}) {
  const deps: Record<string, string> = {};
  for (const [key, value] of Object.entries(imports)) {
    if (value.startsWith("npm:")) {
      const match = value.match(/^npm:([^@]+)@?(.*)$/);
      if (match) {
        const [, name, version] = match;
        deps[name] = version || "latest";
      }
    }
  }
  return deps;
}

async function main() {
  const config = await loadDenoConfig();
  await emptyDir("./npm");

  // Extrae dependencias npm de los imports y devDependencies (si existen)
  const devNpmDeps = extractNpmDependencies(config.devDependencies);

  console.log("🚧 Building package for npm...");

  await build({
    entryPoints: [{ name: ".", path: "./src/mod.ts" }],
    outDir: "./npm",
    shims: {
      deno: false,
      crypto: true,
      weakRef: true,
    },
    typeCheck: false,
    declaration: "inline",
    test: false,
    compilerOptions: {
      target: "ES2022",
      lib: ["ES2022", "DOM"],
      skipLibCheck: true,
    },
    package: {
      // --- Metadata base desde deno.jsonc ---
      name: "ap2-lib",
      version: config.version || "0.1.0",
      description: config.description || "",
      license: config.license || "MIT",

      // --- Configuración de build ---
      main: "./script/mod.js",
      module: "./esm/mod.js",
      types: "./esm/types/mod.d.ts",
      exports: {
        ".": {
          import: "./esm/mod.js",
          require: "./script/mod.js",
        },
      },

      // --- Dependencias ---
      dependencies: {
        "@deno/shim-crypto": "~0.3.1",
        "@deno/sham-weakref": "~0.1.0",
        "jose": "^6.1.0",
        "currency-codes": "^2.2.0",
        "@noble/hashes": "^2.0.1",
      },

      // --- Dev dependencies opcionales ---
      devDependencies: Object.keys(devNpmDeps).length > 0 ? devNpmDeps : undefined,

      // --- Extras opcionales ---
      keywords: ["deno", "library", "payments", "AI", "agents", "AP2", "hacktoberfest"],
      author: "Javier Cervilla",
      repository: {
        type: "git",
        url: "https://github.com/JavierCervilla/ap2-lib.git",
      },
    },

    postBuild: () => {
      console.log("📄 Copying additional files...");
      for (const file of ["LICENSE", "README.md"]) {
        try {
          Deno.copyFileSync(file, `npm/${file}`);
          console.log(`✅ ${file} copied`);
        } catch {
          console.log(`⚠️ ${file} not found, skipping...`);
        }
      }
    },
  });

  console.log("✅ Build completed. Ready for npm publish!");
}

if (import.meta.main) {
  main();
}
