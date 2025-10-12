import { build, emptyDir } from "https://deno.land/x/dnt/mod.ts";

async function loadDenoConfig() {
    const denoConfig = JSON.parse(await Deno.readTextFile("./deno.json"));
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
        shims: { deno: false },
        package: {
            ...config,
            name: 'ap2-lib',
        },
        typeCheck: false,
        declaration: 'inline',
        test: false,
        //postBuild: () => {
        //    Deno.copyFileSync("LICENSE", "npm/LICENSE");
        //    Deno.copyFileSync("README.md", "npm/README.md");
        //}
    });

    console.log("✅ Build completado. Ahora puedes publicar en NPM.");
}

main();