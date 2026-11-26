// Fails the build if a published project is missing a required section.
// Front matter is validated by the schema in src/content.config.ts;
// this covers the Markdown body, which a schema cannot see.
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const dir = 'src/content/projects';
const required = ['Problem', 'Design', 'Evidence', 'Limits and next steps'];
let failed = false;

for (const file of readdirSync(dir).filter((f) => f.endsWith('.md'))) {
  const text = readFileSync(join(dir, file), 'utf8');
  const fm = text.match(/^---\n([\s\S]*?)\n---/);
  if (!fm) { console.error(`${file}: missing front matter`); failed = true; continue; }
  if (/^draft:\s*true\s*$/m.test(fm[1])) continue; // drafts may be incomplete
  const headings = [...text.matchAll(/^## (.+)$/gm)].map((m) => m[1].trim());
  const missing = required.filter((h) => !headings.includes(h));
  if (missing.length) {
    console.error(`${file}: missing section(s): ${missing.join(', ')}`);
    failed = true;
  }
}

if (failed) process.exit(1);
console.log('content check passed');
