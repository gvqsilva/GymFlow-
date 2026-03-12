const fs = require("fs");
const path = require("path");

const targetDir = path.join(
  process.cwd(),
  "node_modules",
  "expo-module-scripts",
);
const baseJsonPath = path.join(targetDir, "tsconfig.base.json");
const aliasPath = path.join(targetDir, "tsconfig.base");

function walk(dirPath, callback) {
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      walk(fullPath, callback);
      continue;
    }
    callback(fullPath);
  }
}

try {
  if (!fs.existsSync(targetDir) || !fs.existsSync(baseJsonPath)) {
    process.exit(0);
  }

  if (!fs.existsSync(aliasPath)) {
    fs.writeFileSync(aliasPath, '{ "extends": "./tsconfig.base.json" }\n');
    console.log("[postinstall] Criado alias: expo-module-scripts/tsconfig.base");
  }

  const nodeModulesDir = path.join(process.cwd(), "node_modules");
  if (fs.existsSync(nodeModulesDir)) {
    let patchedCount = 0;

    walk(nodeModulesDir, (filePath) => {
      if (!filePath.endsWith("tsconfig.json")) return;

      const content = fs.readFileSync(filePath, "utf8");
      if (!content.includes("expo-module-scripts/tsconfig.base")) return;

      const relativeBasePath = path
        .relative(path.dirname(filePath), baseJsonPath)
        .replaceAll("\\", "/");

      const nextContent = content.replace(
        /"expo-module-scripts\/tsconfig\.base(?:\.json)?"/g,
        `"${relativeBasePath}"`,
      );

      if (nextContent !== content) {
        fs.writeFileSync(filePath, nextContent, "utf8");
        patchedCount += 1;
      }
    });

    if (patchedCount > 0) {
      console.log(
        `[postinstall] Ajustado extends em ${patchedCount} tsconfig(s) de dependências Expo.`,
      );
    }
  }
} catch (error) {
  console.warn("[postinstall] Falha ao ajustar expo-module-scripts:", error);
}
