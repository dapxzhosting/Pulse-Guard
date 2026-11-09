import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { minify } from 'terser';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sourcePath = path.join(rootDir, 'frontend', 'app.js');
const outputPath = path.join(rootDir, 'public', 'app.min.js');
const source = await readFile(sourcePath, 'utf8');
const result = await minify(source, {
  compress: true,
  mangle: true,
  format: { comments: false },
});

if (!result.code) {
  throw new Error('Frontend minification produced no output.');
}

await writeFile(outputPath, `${result.code}\n`, 'utf8');
console.log(`Built minified frontend: ${path.relative(rootDir, outputPath)}`);
