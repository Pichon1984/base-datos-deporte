const fs = require("fs");
const path = require("path");

const projectRoot = __dirname;
const requireRegex = /require\(['"](.+?)['"]\)/g;

function scanFile(filePath) {
  const content = fs.readFileSync(filePath, "utf8");
  const requires = [...content.matchAll(requireRegex)];
  return requires.map(match => ({
    file: filePath,
    requirePath: match[1]
  }));
}

function fileExistsCaseSensitive(requirePath, baseFile) {
  const fullPath = path.resolve(path.dirname(baseFile), requirePath);
  const ext = path.extname(fullPath) || ".js";
  const dir = path.dirname(fullPath);
  const file = path.basename(fullPath) + ext;

  if (!fs.existsSync(dir)) return false;

  const files = fs.readdirSync(dir);
  return files.includes(file);
}

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat && stat.isDirectory()) {
      if (!fullPath.includes("node_modules")) {
        results = results.concat(walk(fullPath));
      }
    } else if (file.endsWith(".js")) {
      results.push(fullPath);
    }
  });
  return results;
}

const jsFiles = walk(projectRoot);
const mismatches = [];

jsFiles.forEach(file => {
  const requires = scanFile(file);
  requires.forEach(({ requirePath }) => {
    if (
      requirePath.startsWith(".") &&
      !fileExistsCaseSensitive(requirePath, file)
    ) {
      mismatches.push({ file, requirePath });
    }
  });
});

if (mismatches.length === 0) {
  console.log("✅ Todos los require() coinciden con tus archivos.");
} else {
  console.log("❌ Módulos no encontrados (posible error de mayúsculas):");
  mismatches.forEach(({ file, requirePath }) => {
    console.log(`→ ${file} requiere '${requirePath}' pero no existe con ese nombre.`);
  });
}
