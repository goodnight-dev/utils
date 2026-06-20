# @goodnight-dev/string

String utilities — part of the
[`@goodnight-dev/utils`](https://github.com/goodnight-dev/utils) suite.

Strict, modern, ESM-only TypeScript. Fully typed, tree-shakable, zero runtime
dependencies.

## Install

```sh
pnpm add @goodnight-dev/string
```

## Usage

```ts
import { capitalize } from '@goodnight-dev/string';

capitalize('hELLO'); // => 'Hello'
```

The same utilities are available through the umbrella package, if you'd rather
depend on one thing:

```ts
import { capitalize } from '@goodnight-dev/utils/string';
import { capitalize } from '@goodnight-dev/utils';
```

## API

### `capitalize(value: string): string`

Uppercases the first character and lowercases the rest. See the
[implementation notes](https://github.com/goodnight-dev/utils/blob/main/packages/string/src/capitalize.md)
for the alternatives considered and why this approach was chosen.

## License

[MIT](./LICENSE) © Ian Goodnight
