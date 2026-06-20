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
// Packages publish in dependency order (a dependency before its dependents),
// and each newly published version gets a `name@version` git tag.
//
// See docs/adr/0002-oidc-trusted-publishing.md.

import { execFileSync } from 'node:child_process'
import { existsSync, mkdtempSync, readFileSync, readdirSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const PACKAGES_DIR = 'packages'
const SCOPE = '@goodnight-dev/'

const run = (command, args, options = {}) =>
  execFileSync(command, args, { encoding: 'utf8', ...options })

const readManifest = (dir) =>
  JSON.parse(readFileSync(join(PACKAGES_DIR, dir, 'package.json'), 'utf8'))

// Collect non-private workspace packages and their internal (@scope) deps.
const packages = new Map()
for (const dir of readdirSync(PACKAGES_DIR)) {
  if (!existsSync(join(PACKAGES_DIR, dir, 'package.json'))) continue
  const manifest = readManifest(dir)
  if (manifest.private) continue
  packages.set(manifest.name, {
    name: manifest.name,
    version: manifest.version,
    deps: Object.keys(manifest.dependencies ?? {}).filter((dep) =>
      dep.startsWith(SCOPE),
    ),
  })
}

// Topological order: a package is published before anything that depends on it.
const ordered = []
const resolved = new Set()
const visit = (name, stack = new Set()) => {
  if (resolved.has(name)) return
  if (stack.has(name)) throw new Error(`Dependency cycle involving ${name}`)
  stack.add(name)
  for (const dep of packages.get(name).deps) {
    if (packages.has(dep)) visit(dep, stack)
  }
  resolved.add(name)
  ordered.push(name)
}
for (const name of packages.keys()) visit(name)

const isPublished = (name, version) => {
  try {
    run('npm', ['view', `${name}@${version}`, 'version'])
    return true
  } catch {
    return false
  }
}

const tmp = mkdtempSync(join(tmpdir(), 'release-'))
let publishedAny = false

for (const name of ordered) {
  const { version } = packages.get(name)
  if (isPublished(name, version)) {
    console.log(`${name}@${version} already on npm — skipping`)
    continue
  }

  console.log(`packing ${name}@${version}`)
  const packOutput = run('pnpm', [
    '--filter',
    name,
    'pack',
    '--pack-destination',
    tmp,
  ])
  const tarball = packOutput
    .split('\n')
    .map((line) => line.trim())
    .findLast((line) => line.endsWith('.tgz'))
  if (!tarball) throw new Error(`Could not locate packed tarball for ${name}`)

  console.log(`publishing ${name}@${version} via OIDC trusted publishing`)
  run('npm', ['publish', tarball, '--provenance', '--access', 'public'], {
    stdio: 'inherit',
  })

  run('git', ['tag', `${name}@${version}`])
  console.log(`published and tagged ${name}@${version}`)
  publishedAny = true
}

if (publishedAny) {
  run('git', ['push', '--tags'], { stdio: 'inherit' })
} else {
  console.log('Nothing to publish.')
}
