import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const IGNORE_DIRS = new Set(["node_modules", "dist", ".git"]);
const IGNORE_FILES = new Set(["tmp_ref_site.js"]);
const EXTENSIONS = new Set([".js", ".jsx", ".css", ".md", ".html", ".json", ".sql"]);
const BAD_PATTERNS = [
  /Ã/g,
  /Å/g,
  /Ä/g,
  /Â/g,
  /â€™/g,
  /â€œ/g,
  /â€/g,
  /�/g
];

const problems = [];

const walk = (dir) => {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (IGNORE_DIRS.has(entry.name)) continue;
      walk(fullPath);
      continue;
    }

    if (!EXTENSIONS.has(path.extname(entry.name))) continue;
    if (IGNORE_FILES.has(entry.name)) continue;

    const text = fs.readFileSync(fullPath, "utf8");
    for (const pattern of BAD_PATTERNS) {
      if (pattern.test(text)) {
        problems.push(path.relative(ROOT, fullPath));
        break;
      }
    }
  }
};

walk(ROOT);

if (problems.length) {
  console.error("Türkçe karakter bozulması olabilecek dosyalar bulundu:");
  for (const p of problems) console.error(`- ${p}`);
  process.exit(1);
}

console.log("Türkçe karakter kontrolü temiz.");
