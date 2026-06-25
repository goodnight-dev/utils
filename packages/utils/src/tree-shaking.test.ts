import { build } from 'esbuild';
import { describe, expect, it } from 'vitest';

// Regression guard for the whole point of the suite: importing one utility must
// not drag its siblings into a consumer's bundle. This bundles a single named
// import with esbuild (a stand-in for any consumer's bundler) across all three
// entry points and asserts the other function — name and internals — is absent
// from the output. It fails if a change couples the utilities so they can no
// longer be separated: one calling another, a shared top-level value, a
// side-effecting barrel, or a build that stops tree-shaking.
//
// It bundles the published `dist`, so the packages must be built first. `pnpm
// check` builds before it runs tests; if you run this in isolation, `pnpm
// build` once beforehand. `resolveDir` is relative to the repo root, which is
// Vitest's working directory.

async function bundleNamedImport(
  specifier: string,
  name: string,
): Promise<string> {
  const result = await build({
    stdin: {
      contents: `import { ${name} } from '${specifier}';\nglobalThis.__keep = ${name};`,
      resolveDir: 'packages/utils', // resolves the leaf (dependency) and the umbrella (self-reference)
      loader: 'js',
    },
    bundle: true,
    write: false,
    format: 'esm',
    treeShaking: true,
    logLevel: 'silent',
  }).catch((cause: unknown) => {
    throw new Error(
      `Failed to bundle '${specifier}'. Build the packages first (pnpm build); this fixture bundles the published dist.`,
      { cause },
    );
  });

  const file = result.outputFiles[0];
  if (!file) throw new Error('esbuild produced no output');
  return file.text;
}

// `\b` word boundaries so `capitalizeNext` (a local inside camelCase) is not
// mistaken for the `capitalize` function being present.
const CAPITALIZE_FN = /\bcapitalize\b/;
const CAMEL_CASE_FN = /\bcamelCase\b/;
const IS_ASCII_STRING_FN = /\bisAsciiString\b/;
// Internal sentinels unique to one function, as a second, independent check.
const CAPITALIZE_INTERNAL = 'slice(1)';
const CAMEL_CASE_INTERNAL = 'UNICODE_ALPHANUMERIC_REGEX';

const specifiers = [
  { label: 'leaf (@goodnight-dev/string)', specifier: '@goodnight-dev/string' },
  {
    label: 'umbrella subpath (@goodnight-dev/utils/string)',
    specifier: '@goodnight-dev/utils/string',
  },
  {
    label: 'umbrella barrel (@goodnight-dev/utils)',
    specifier: '@goodnight-dev/utils',
  },
];

describe('tree-shaking', () => {
  for (const { label, specifier } of specifiers) {
    it(`${label}: importing capitalize excludes camelCase`, async () => {
      const bundle = await bundleNamedImport(specifier, 'capitalize');

      expect(bundle).toMatch(CAPITALIZE_FN);
      expect(bundle).toContain(CAPITALIZE_INTERNAL);
      expect(bundle).not.toMatch(CAMEL_CASE_FN);
      expect(bundle).not.toContain(CAMEL_CASE_INTERNAL);
    });

    it(`${label}: importing camelCase excludes capitalize`, async () => {
      const bundle = await bundleNamedImport(specifier, 'camelCase');

      expect(bundle).toMatch(CAMEL_CASE_FN);
      expect(bundle).toContain(CAMEL_CASE_INTERNAL);
      expect(bundle).not.toMatch(CAPITALIZE_FN);
      expect(bundle).not.toContain(CAPITALIZE_INTERNAL);
    });
  }
});

// Cross-package: importing one leaf's function through the umbrella must not drag
// in another leaf. This is the guarantee that lets the umbrella re-export every
// package without coupling them — the leaves stay independently shakable even
// when consumed as one dependency.
describe('tree-shaking across packages', () => {
  const crossPackage = [
    { label: 'predicate leaf', specifier: '@goodnight-dev/predicate' },
    {
      label: 'umbrella subpath (@goodnight-dev/utils/predicate)',
      specifier: '@goodnight-dev/utils/predicate',
    },
    {
      label: 'umbrella barrel (@goodnight-dev/utils)',
      specifier: '@goodnight-dev/utils',
    },
  ];

  for (const { label, specifier } of crossPackage) {
    it(`${label}: importing isAsciiString excludes the string package`, async () => {
      const bundle = await bundleNamedImport(specifier, 'isAsciiString');

      expect(bundle).toMatch(IS_ASCII_STRING_FN);
      expect(bundle).not.toMatch(CAMEL_CASE_FN);
      expect(bundle).not.toMatch(CAPITALIZE_FN);
      expect(bundle).not.toContain(CAMEL_CASE_INTERNAL);
      expect(bundle).not.toContain(CAPITALIZE_INTERNAL);
    });
  }

  it('umbrella barrel: importing camelCase excludes the predicate package', async () => {
    const bundle = await bundleNamedImport('@goodnight-dev/utils', 'camelCase');

    expect(bundle).toMatch(CAMEL_CASE_FN);
    expect(bundle).not.toMatch(IS_ASCII_STRING_FN);
  });
});
