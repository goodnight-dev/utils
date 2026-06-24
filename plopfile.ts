import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import type {
  ActionType,
  AddActionConfig,
  CustomActionFunction,
  NodePlopAPI,
} from 'plop';

const REPO_ROOT = dirname(fileURLToPath(import.meta.url));
const PACKAGES_DIR = join(REPO_ROOT, 'packages');

interface FunctionAnswers {
  pkg: string;
  name: string;
  notes: boolean;
  bench: boolean;
}

interface PackageManifest {
  name: string;
  dependencies?: Record<string, string>;
}

function discoverLeafPackages(): { name: string; value: string }[] {
  return readdirSync(PACKAGES_DIR, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .filter((dir) => existsSync(join(PACKAGES_DIR, dir, 'src', 'index.ts')))
    .map((dir) => ({
      dir,
      pkg: JSON.parse(
        readFileSync(join(PACKAGES_DIR, dir, 'package.json'), 'utf8'),
      ) as PackageManifest,
    }))
    .filter(({ pkg }) => Object.keys(pkg.dependencies ?? {}).length === 0)
    .map(({ dir, pkg }) => ({
      name: `${pkg.name}  (packages/${dir})`,
      value: dir,
    }));
}

function resolveTemplate(pkgDir: string, file: string): string {
  const override = join(REPO_ROOT, 'templates', pkgDir, file);
  return existsSync(override)
    ? override
    : join(REPO_ROOT, 'templates', 'function', file);
}

function addBarrelExport(
  pkgDir: string,
  name: string,
  toFileName: (text: string) => string,
): string {
  const indexPath = join(PACKAGES_DIR, pkgDir, 'src', 'index.ts');
  const newLine = `export { ${name} } from './${toFileName(name)}';`;

  const lines = readFileSync(indexPath, 'utf8')
    .split('\n')
    .map((line) => line.trimEnd())
    .filter((line) => line !== '');

  if (lines.includes(newLine)) {
    return `barrel already exports ${name}`;
  }

  const exportLines = lines.filter((line) => line.startsWith('export'));
  const otherLines = lines.filter((line) => !line.startsWith('export'));
  exportLines.push(newLine);

  const sortKey = (line: string): string => {
    const match = /export\s*(?:type\s+)?{\s*([^,}\s]+)/.exec(line);
    return (match?.[1] ?? line).toLowerCase();
  };
  exportLines.sort((a, b) => sortKey(a).localeCompare(sortKey(b)));

  writeFileSync(indexPath, [...otherLines, ...exportLines].join('\n') + '\n');
  return `added '${name}' to packages/${pkgDir}/src/index.ts (sorted)`;
}

export default function (plop: NodePlopAPI): void {
  const dashCase = plop.getHelper('dashCase') as (text: string) => string;

  const addBarrel: CustomActionFunction = (answers) => {
    const { pkg, name } = answers as FunctionAnswers;
    return addBarrelExport(pkg, name, dashCase);
  };

  plop.setGenerator('function', {
    description: 'Add a utility function to an existing leaf package',
    prompts: [
      {
        type: 'list',
        name: 'pkg',
        message: 'Which package?',
        choices: discoverLeafPackages(),
      },
      {
        type: 'input',
        name: 'name',
        message: 'Function name (camelCase, e.g. snakeCase):',
        validate: (input: string) =>
          /^[a-z][a-zA-Z0-9]*$/.test(input.trim()) ||
          'Use a camelCase identifier, e.g. snakeCase',
        filter: (input: string) => input.trim(),
      },
      {
        type: 'confirm',
        name: 'notes',
        message: 'Add an implementation-notes .md?',
        default: true,
      },
      {
        type: 'confirm',
        name: 'bench',
        message:
          'Scaffold the benchmark harness (alternatives + parity test + bench + fixtures)?',
        default: false,
      },
    ],
    actions: (data) => {
      const { pkg, notes, bench } = data as FunctionAnswers;
      const base = `packages/${pkg}/src/{{dashCase name}}`;

      const add = (file: string, target: string): AddActionConfig => ({
        type: 'add',
        path: target,
        templateFile: resolveTemplate(pkg, file),
      });

      const actions: ActionType[] = [
        add('source.ts.hbs', `${base}.ts`),
        add('test.ts.hbs', `${base}.test.ts`),
      ];

      if (notes) {
        actions.push(add('notes.md.hbs', `${base}.md`));
      }

      if (bench) {
        // one shared corpus per package; created on the first benchmarked
        // function and reused by the rest
        const fixtures: AddActionConfig = {
          type: 'add',
          path: `packages/${pkg}/src/{{dashCase pkg}}.fixtures.ts`,
          templateFile: resolveTemplate(pkg, 'fixtures.ts.hbs'),
          skipIfExists: true,
        };
        actions.push(
          fixtures,
          add('alternatives.ts.hbs', `${base}.alternatives.ts`),
          add('alternatives.test.ts.hbs', `${base}.alternatives.test.ts`),
          add('bench.ts.hbs', `${base}.bench.ts`),
        );
      }

      // wire up the barrel last, after the files it points at exist
      actions.push(addBarrel);

      return actions;
    },
  });
}
