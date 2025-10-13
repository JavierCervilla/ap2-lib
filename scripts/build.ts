import { build, emptyDir } from "https://deno.land/x/dnt/mod.ts";

async function loadDenoConfig() {
    const denoConfig = JSON.parse(await Deno.readTextFile("./deno.jsonc"));
    return denoConfig;
}

async function main() {
    const config = await loadDenoConfig();
    await emptyDir("./npm");


    await build({
        entryPoints: [
            { name: ".", path: "./src/mod.ts" },
            { name: "types", path: "./src/types/mod.ts" }
        ],
        outDir: "./npm",
        shims: {
            deno: false,
            crypto: true,
            weakRef: true
        },
        package: {
            ...config,
            name: 'ap2-lib',
            // Add Node.js polyfills for crypto
            dependencies: {
                ...config.dependencies,
                // Add node crypto polyfill if needed
            }
        },
        typeCheck: false,
        declaration: 'inline',
        test: false,
        compilerOptions: {
            target: "ES2022",
            lib: ["ES2022", "DOM"],
            strict: true,
            skipLibCheck: true
        },
        postBuild: () => {
            console.log("📄 Copying additional files...");
            try {
                Deno.copyFileSync("LICENSE", "npm/LICENSE");
                console.log("✅ LICENSE copied");
            } catch {
                console.log("⚠️ LICENSE not found, skipping...");
            }
            try {
                Deno.copyFileSync("README.md", "npm/README.md");
                console.log("✅ README.md copied");
            } catch {
                console.log("⚠️ README.md not found, skipping...");
            }
        }
    });

    console.log("✅ Build completed. You can now publish to NPM.");
}

main();