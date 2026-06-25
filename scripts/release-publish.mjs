// Publishes each public workspace package whose version is not yet on npm.
//
// Why this exists instead of `changeset publish`:
//   As of mid-2026, `changeset publish` does not drive npm's OIDC trusted-
//   publishing handshake — it returns ENEEDAUTH even on npm >= 11.5.1 with a
//   trusted publisher configured. To publish over OIDC (no stored token) we do
//   it ourselves: `pnpm pack` resolves the `workspace:` protocol in a package's
//   dependencies, and `npm publish <tarball>` performs the OIDC auth +
//   provenance attestation.
//
// Packages publish in dependency order (a dependency before its dependents), and
// each newly published version gets a `name@version` git tag and a matching
// GitHub Release whose notes come from the package's changelog.
//
// See docs/adr/0002-oidc-trusted-publishing.md.

import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const PACKAGES_DIR = 'packages';
const SCOPE = '@goodnight-dev/';

const run = (command, args, options = {}) =>
  execFileSync(command, args, { encoding: 'utf8', ...options });

const readManifest = (dir) =>
  JSON.parse(readFileSync(join(PACKAGES_DIR, dir, 'package.json'), 'utf8'));

// Pull the changelog section for a version (everything under `## <version>` up
// to the next `## ` heading), to use as GitHub Release notes.
const changelogNotes = (dir, version) => {
  const path = join(PACKAGES_DIR, dir, 'CHANGELOG.md');
  if (!existsSync(path)) return '';
  const lines = readFileSync(path, 'utf8').split('\n');
  const start = lines.findIndex((line) => line.trim() === `## ${version}`);
  if (start === -1) return '';
  let end = lines.length;
  for (let i = start + 1; i < lines.length; i++) {
    if (lines[i].startsWith('## ')) {
      end = i;
      break;
    }
  }
  return lines
    .slice(start + 1, end)
    .join('\n')
    .trim();
};

// Collect non-private workspace packages and their internal (@scope) deps.
const packages = new Map();
for (const dir of readdirSync(PACKAGES_DIR)) {
  if (!existsSync(join(PACKAGES_DIR, dir, 'package.json'))) continue;
  const manifest = readManifest(dir);
  if (manifest.private) continue;
  packages.set(manifest.name, {
    name: manifest.name,
    version: manifest.version,
    dir,
    deps: Object.keys(manifest.dependencies ?? {}).filter((dep) =>
      dep.startsWith(SCOPE),
    ),
  });
}

// Topological order: a package is published before anything that depends on it.
const ordered = [];
const resolved = new Set();
const visit = (name, stack = new Set()) => {
  if (resolved.has(name)) return;
  if (stack.has(name)) throw new Error(`Dependency cycle involving ${name}`);
  stack.add(name);
  for (const dep of packages.get(name).deps) {
    if (packages.has(dep)) visit(dep, stack);
  }
  resolved.add(name);
  ordered.push(name);
};
for (const name of packages.keys()) visit(name);

const isPublished = (name, version) => {
  try {
    run('npm', ['view', `${name}@${version}`, 'version']);
    return true;
  } catch {
    return false;
  }
};

const tmp = mkdtempSync(join(tmpdir(), 'release-'));
const published = [];

for (const name of ordered) {
  const { version, dir } = packages.get(name);
  if (isPublished(name, version)) {
    console.log(`${name}@${version} already on npm — skipping`);
    continue;
  }

  console.log(`packing ${name}@${version}`);
  const packOutput = run('pnpm', [
    '--filter',
    name,
    'pack',
    '--pack-destination',
    tmp,
  ]);
  const tarball = packOutput
    .split('\n')
    .map((line) => line.trim())
    .findLast((line) => line.endsWith('.tgz'));
  if (!tarball) throw new Error(`Could not locate packed tarball for ${name}`);

  console.log(`publishing ${name}@${version} via OIDC trusted publishing`);
  run('npm', ['publish', tarball, '--provenance', '--access', 'public'], {
    stdio: 'inherit',
  });

  run('git', ['tag', `${name}@${version}`]);
  console.log(`published and tagged ${name}@${version}`);
  published.push({ name, version, dir });
}

if (published.length === 0) {
  console.log('Nothing to publish.');
} else {
  run('git', ['push', '--tags'], { stdio: 'inherit' });

  // Mirror each published version as a GitHub Release. Non-fatal: the package is
  // already on npm, so a Release-page failure must not fail the run. `--latest`
  // is off because no single package version is "the latest" of the monorepo.
  for (const { name, version, dir } of published) {
    const tag = `${name}@${version}`;
    try {
      run('gh', [
        'release',
        'create',
        tag,
        '--title',
        tag,
        '--notes',
        changelogNotes(dir, version) || tag,
        '--latest=false',
      ]);
      console.log(`created GitHub release ${tag}`);
    } catch (error) {
      console.warn(
        `WARN: could not create GitHub release ${tag}: ${error.stderr ?? error.message}`,
      );
    }
  }
}
