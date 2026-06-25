# @goodnight-dev/predicate

Runtime type and value predicates (`is*`) — part of the @goodnight-dev utility
suite. Not limited to one input type: a predicate's name and signature say what
it checks (`isAsciiString`, and more to come).

Strict, modern, ESM-only TypeScript. Fully typed, tree-shakable, zero runtime
dependencies.

[![npm](https://img.shields.io/npm/v/@goodnight-dev/predicate)](https://www.npmjs.com/package/@goodnight-dev/predicate)
[![CI](https://github.com/goodnight-dev/utils/actions/workflows/ci.yml/badge.svg)](https://github.com/goodnight-dev/utils/actions/workflows/ci.yml)
[![docs](https://img.shields.io/badge/docs-online-blue)](https://goodnight-dev.github.io/utils/)

## Install

```sh
# via pnpm
pnpm add @goodnight-dev/predicate
# or via npm
npm install @goodnight-dev/predicate
```

## Usage

```ts
import { isAsciiString } from '@goodnight-dev/predicate';

isAsciiString('hello'); // => true
isAsciiString('café'); // => false
```

The same utilities are available through the umbrella package, if you'd rather
depend on one thing:

```ts
import { isAsciiString } from '@goodnight-dev/utils/predicate';
import { isAsciiString } from '@goodnight-dev/utils';
```

## API

### `isAsciiString(value: string): boolean`

Returns `true` if every character in the string is ASCII (U+0000–U+007F),
`false` otherwise (and `true` for an empty string). See the
[implementation notes](https://github.com/goodnight-dev/utils/blob/main/packages/predicate/src/is-ascii-string.md)
for the alternatives considered and why this approach was chosen.

## License

[MIT](./LICENSE) © Ian Goodnight
