# @goodnight-dev/string

String utilities — part of the
[`@goodnight-dev/utils`](https://github.com/goodnight-dev/utils) suite.

Strict, modern, ESM-only TypeScript. Fully typed, tree-shakable, zero runtime
dependencies.

[![npm](https://img.shields.io/npm/v/@goodnight-dev/string)](https://www.npmjs.com/package/@goodnight-dev/string)
[![CI](https://github.com/goodnight-dev/utils/actions/workflows/ci.yml/badge.svg)](https://github.com/goodnight-dev/utils/actions/workflows/ci.yml)
[![docs](https://img.shields.io/badge/docs-online-blue)](https://goodnight-dev.github.io/utils/)

## Install

```sh
# via pnpm
pnpm add @goodnight-dev/string
# or via npm
npm install @goodnight-dev/string
# or via yarn
yarn add @goodnight-dev/string
```

## Usage

```ts
import { camelCase, capitalize, snakeCase } from '@goodnight-dev/string';

capitalize('hELLO'); // => 'Hello'
camelCase('foo-bar baz'); // => 'fooBarBaz'
snakeCase('fooBar baz'); // => 'foo_bar_baz'
```

The same utilities are available through the umbrella package, if you'd rather
depend on one thing:

```ts
import { capitalize } from '@goodnight-dev/utils/string';
import { capitalize } from '@goodnight-dev/utils';
```

## API

### `camelCase(value: string): string`

Converts a string to camelCase. Any run of non-alphanumeric characters is a word
boundary — space, hyphen, and underscore as well as arbitrary punctuation — and
those characters are dropped from the output. Unicode-correct: both word
detection and casing use Unicode semantics, not ASCII-only bit math. See the
[implementation notes](https://github.com/goodnight-dev/utils/blob/main/packages/string/src/camel-case.md)
for the alternatives considered and why this approach was chosen.

### `capitalize(value: string): string`

Uppercases the first character and lowercases the rest. See the
[implementation notes](https://github.com/goodnight-dev/utils/blob/main/packages/string/src/capitalize.md)
for the alternatives considered and why this approach was chosen.

### `snakeCase(value: string): string`

Converts a string to snake_case: words are lowercased and joined with single
underscores. Word boundaries are non-alphanumeric runs **and** camelHumps, so
`snakeCase('fooBar')` is `'foo_bar'` and `snakeCase('XMLHttpRequest')` is
`'xml_http_request'`. Unicode-correct, and the inverse of `camelCase` with hump
splitting added. See the
[implementation notes](https://github.com/goodnight-dev/utils/blob/main/packages/string/src/snake-case.md)
for the alternatives considered and why this approach was chosen.

## License

[MIT](./LICENSE) © Ian Goodnight
