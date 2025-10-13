#!/usr/bin/env -S deno run -A

/**
 * Script to update the version in deno.jsonc
 * Called by semantic-release during the prepare step
 */

const VERSION_ARG = Deno.args[0];

if (!VERSION_ARG) {
  console.error("❌ Error: Version argument is required");
  console.error("Usage: deno run -A scripts/update-version.ts <version>");
  Deno.exit(1);
}

async function updateDenoConfig(newVersion: string): Promise<void> {
  const configPath = "./deno.jsonc";

  try {
    // Read current deno.jsonc
    const configText = await Deno.readTextFile(configPath);
    console.log(`📖 Reading ${configPath}...`);

    // Parse JSON (handle JSONC comments)
    const config = JSON.parse(configText);

    // Store old version for logging
    const oldVersion = config.version || "0.0.0";

    // Update version
    config.version = newVersion;

    // Write updated config back
    const updatedConfig = JSON.stringify(config, null, 2);
    await Deno.writeTextFile(configPath, updatedConfig);

    console.log(`✅ Updated version: ${oldVersion} → ${newVersion}`);
    console.log(`📝 Updated ${configPath}`);

  } catch (error) {
    console.error(`❌ Error updating ${configPath}:`, error);
    Deno.exit(1);
  }
}

async function updatePackageJson(newVersion: string): Promise<void> {
  const packagePath = "./npm/package.json";

  try {
    // Check if npm package.json exists
    const packageExists = await Deno.stat(packagePath).then(() => true).catch(() => false);

    if (!packageExists) {
      console.log(`⚠️ ${packagePath} does not exist, skipping...`);
      return;
    }

    // Read and update package.json
    const packageText = await Deno.readTextFile(packagePath);
    const packageJson = JSON.parse(packageText);

    const oldVersion = packageJson.version || "0.0.0";
    packageJson.version = newVersion;

    await Deno.writeTextFile(packagePath, JSON.stringify(packageJson, null, 2));

    console.log(`✅ Updated NPM package version: ${oldVersion} → ${newVersion}`);
    console.log(`📝 Updated ${packagePath}`);

  } catch (error) {
    console.error(`❌ Error updating ${packagePath}:`, error);
    // Don't exit on package.json error as it might not exist yet
    console.log(`⚠️ Continuing without updating ${packagePath}`);
  }
}

async function main(): Promise<void> {
  console.log(`🔄 Updating version to: ${VERSION_ARG}`);

  // Validate version format (basic semver check)
  if (!/^\d+\.\d+\.\d+(-.*)?$/.test(VERSION_ARG)) {
    console.error(`❌ Invalid version format: ${VERSION_ARG}`);
    console.error("Expected format: x.y.z or x.y.z-suffix");
    Deno.exit(1);
  }

  // Update deno.jsonc
  await updateDenoConfig(VERSION_ARG);

  // Update npm/package.json if it exists
  await updatePackageJson(VERSION_ARG);

  console.log(`🎉 Version update completed successfully!`);
}

if (import.meta.main) {
  await main();
}