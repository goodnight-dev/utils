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
const UTILS_DIR = join(PACKAGES_DIR, 'utils');

interface FunctionAnswers {
  pkg: string;
  name: string;
  notes: boolean;
  bench: boolean;
  inputType?: string;
}

interface PackageAnswers {
  pkg: string;
  description: string;
  addFunction: boolean;
  name?: string;
  notes?: boolean;
  bench?: boolean;
  inputType?: string;
}

interface PackageManifest {
  name: string;
  dependencies?: Record<string, string>;
}

interface UtilsManifest {
  dependencies?: Record<string, string>;
  exports: Record<string, unknown>;
  [key: string]: unknown;
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

function hasSourceOverride(pkgDir: string): boolean {
  return existsSync(join(REPO_ROOT, 'templates', pkgDir, 'source.ts.hbs'));
}

function sortByExportName(line: string): string {
  const match = /export\s*(?:type\s+)?{\s*([^,}\s]+)/.exec(line);
  return (match?.[1] ?? line).toLowerCase();
}

function insertExportLine(indexPath: string, newLine: string): void {
  const lines = readFileSync(indexPath, 'utf8')
    .split('\n')
    .map((line) => line.trimEnd())
    .filter((line) => line !== '');
  if (lines.includes(newLine)) return;

  const exportLines = lines.filter((line) => line.startsWith('export'));
  const otherLines = lines.filter((line) => !line.startsWith('export'));
  exportLines.push(newLine);
  exportLines.sort((a, b) =>
    sortByExportName(a).localeCompare(sortByExportName(b)),
  );

  writeFileSync(indexPath, [...otherLines, ...exportLines].join('\n') + '\n');
}

function sortKeys(obj: Record<string, string>): Record<string, string> {
  return Object.fromEntries(
    Object.entries(obj).sort(([a], [b]) => a.localeCompare(b)),
  );
}

function wireUmbrella(pkg: string): string {
  const depName = `@goodnight-dev/${pkg}`;

  const manifestPath = join(UTILS_DIR, 'package.json');
  const manifest = JSON.parse(
    readFileSync(manifestPath, 'utf8'),
  ) as UtilsManifest;
  manifest.dependencies = sortKeys({
    ...manifest.dependencies,
    [depName]: 'workspace:*',
  });
  const subpath = `./${pkg}`;
  if (!(subpath in manifest.exports)) {
    const current = manifest.exports;
    const rebuilt: Record<string, unknown> = { '.': current['.'] };
    const subpaths = Object.keys(current)
      .filter((key) => key !== '.' && key !== './package.json')
      .concat(subpath)
      .sort();
    for (const key of subpaths) {
      rebuilt[key] =
        key === subpath
          ? { types: `./dist/${pkg}.d.mts`, import: `./dist/${pkg}.mjs` }
          : current[key];
    }
    rebuilt['./package.json'] = current['./package.json'];
    manifest.exports = rebuilt;
  }
  writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n');

  const tsdownPath = join(UTILS_DIR, 'tsdown.config.ts');
  const tsdown = readFileSync(tsdownPath, 'utf8');
  const entry = `'src/${pkg}.ts'`;
  if (!tsdown.includes(entry)) {
    writeFileSync(
      tsdownPath,
      tsdown.replace(/entry:\s*\[([^\]]*)\]/, (_match, inner: string) => {
        const items = inner
          .split(',')
          .map((item) => item.trim())
          .filter(Boolean)
          .concat(entry);
        const index = items.filter((item) => item.includes('index.ts'));
        const rest = items.filter((item) => !item.includes('index.ts')).sort();
        return `entry: [${[...index, ...rest].join(', ')}]`;
      }),
    );
  }

  insertExportLine(
    join(UTILS_DIR, 'src', 'index.ts'),
    `export * from '${depName}';`,
  );

  const typedocPath = join(REPO_ROOT, 'typedoc.json');
  const typedoc = JSON.parse(readFileSync(typedocPath, 'utf8')) as {
    entryPoints: string[];
    [key: string]: unknown;
  };
  const entryPoint = `packages/${pkg}`;
  if (!typedoc.entryPoints.includes(entryPoint)) {
    typedoc.entryPoints = [...typedoc.entryPoints, entryPoint].sort();
    writeFileSync(typedocPath, JSON.stringify(typedoc, null, 2) + '\n');
  }

  return `wired ${depName} into the umbrella and TypeDoc`;
}

function functionFileActions(
  pkg: string,
  opts: { notes: boolean; bench: boolean },
): ActionType[] {
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

  if (opts.notes) {
    actions.push(add('notes.md.hbs', `${base}.md`));
  }

  if (opts.bench) {
    actions.push(
      {
        type: 'add',
        path: `packages/${pkg}/src/{{dashCase pkg}}.fixtures.ts`,
        templateFile: resolveTemplate(pkg, 'fixtures.ts.hbs'),
        skipIfExists: true,
      },
      add('alternatives.ts.hbs', `${base}.alternatives.ts`),
      add('alternatives.test.ts.hbs', `${base}.alternatives.test.ts`),
      add('bench.ts.hbs', `${base}.bench.ts`),
    );
  }

  return actions;
}

function packageFileActions(): ActionType[] {
  const dir = `packages/{{dashCase pkg}}`;
  const add = (file: string, target: string): AddActionConfig => ({
    type: 'add',
    path: target,
    templateFile: join(REPO_ROOT, 'templates', 'package', file),
  });

  return [
    add('package.json.hbs', `${dir}/package.json`),
    add('tsconfig.json.hbs', `${dir}/tsconfig.json`),
    add('tsdown.config.ts.hbs', `${dir}/tsdown.config.ts`),
    add('typedoc.json.hbs', `${dir}/typedoc.json`),
    add('README.md.hbs', `${dir}/README.md`),
    add('LICENSE.hbs', `${dir}/LICENSE`),
    add('index.ts.hbs', `${dir}/src/index.ts`),
    add('index.test.ts.hbs', `${dir}/src/index.test.ts`),
    add('umbrella-subpath.ts.hbs', `packages/utils/src/{{dashCase pkg}}.ts`),
  ];
}

export default function (plop: NodePlopAPI): void {
  const dashCase = plop.getHelper('dashCase') as (text: string) => string;
  const properCase = plop.getHelper('properCase') as (text: string) => string;

  const addBarrel: CustomActionFunction = (answers) => {
    const { pkg, name } = answers as FunctionAnswers;
    insertExportLine(
      join(PACKAGES_DIR, pkg, 'src', 'index.ts'),
      `export { ${name} } from './${dashCase(name)}';`,
    );
    return `wired '${name}' into packages/${pkg}/src/index.ts`;
  };

  const wire: CustomActionFunction = (answers) =>
    wireUmbrella((answers as PackageAnswers).pkg);

  // inquirer types `when` with its loose Answers map (Record<string, any>),
  // which is not assignable to our answer interfaces — so these predicates take
  // the loose map and narrow it.
  const isTypedPackage = (answers: Record<string, unknown>): boolean =>
    hasSourceOverride((answers as unknown as FunctionAnswers).pkg);
  const whenAddingFunction = (answers: Record<string, unknown>): boolean =>
    (answers as unknown as PackageAnswers).addFunction;

  const functionName = {
    type: 'input' as const,
    name: 'name',
    message: 'Function name (camelCase, e.g. snakeCase):',
    validate: (input: string) =>
      /^[a-z][a-zA-Z0-9]*$/.test(input.trim()) ||
      'Use a camelCase identifier, e.g. snakeCase',
    filter: (input: string) => input.trim(),
  };
  const inputType = {
    type: 'input' as const,
    name: 'inputType',
    message: 'Input type the function takes (e.g. string, number, unknown):',
    default: 'string',
    filter: (input: string) => input.trim(),
  };
  const addNotes = {
    type: 'confirm' as const,
    name: 'notes',
    message: 'Add an implementation-notes .md?',
    default: true,
  };
  const addBench = {
    type: 'confirm' as const,
    name: 'bench',
    message:
      'Scaffold the benchmark harness (alternatives + parity test + bench + fixtures)?',
    default: false,
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
      functionName,
      { ...inputType, when: isTypedPackage },
      addNotes,
      addBench,
    ],
    actions: (data) => {
      const { pkg, notes, bench } = data as FunctionAnswers;
      return [...functionFileActions(pkg, { notes, bench }), addBarrel];
    },
  });

  plop.setGenerator('package', {
    description:
      'Scaffold a new leaf package, optionally with a first function',
    prompts: [
      {
        type: 'input',
        name: 'pkg',
        message: 'Package area name (lowercase, e.g. predicate):',
        validate: (input: string) => {
          const value = input.trim();
          if (!/^[a-z][a-z0-9-]*$/.test(value)) {
            return 'Use a lowercase name, e.g. predicate';
          }
          return existsSync(join(PACKAGES_DIR, value))
            ? `packages/${value} already exists`
            : true;
        },
        filter: (input: string) => input.trim(),
      },
      {
        type: 'input',
        name: 'description',
        message: 'package.json description:',
        default: (answers: PackageAnswers) =>
          `${properCase(answers.pkg)} utilities — part of the @goodnight-dev utility suite.`,
      },
      {
        type: 'confirm',
        name: 'addFunction',
        message: 'Add a first function now?',
        default: true,
      },
      { ...functionName, when: whenAddingFunction },
      {
        ...inputType,
        when: (answers: Record<string, unknown>) =>
          whenAddingFunction(answers) && isTypedPackage(answers),
      },
      { ...addNotes, when: whenAddingFunction },
      { ...addBench, when: whenAddingFunction },
    ],
    actions: (data) => {
      const answers = data as PackageAnswers;
      const actions: ActionType[] = [...packageFileActions(), wire];
      if (answers.addFunction) {
        actions.push(
          ...functionFileActions(answers.pkg, {
            notes: answers.notes ?? true,
            bench: answers.bench ?? false,
          }),
          addBarrel,
        );
      }
      return actions;
    },
  });
}
