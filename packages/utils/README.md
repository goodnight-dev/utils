# @goodnight-dev/utils

The complete [`@goodnight-dev`](https://github.com/goodnight-dev/utils) utility
suite — import everything, or by subpath.

Strict, modern, ESM-only TypeScript. Fully typed and tree-shakable.

## Install

```sh
pnpm add @goodnight-dev/utils
```

## Usage

```ts
// the whole suite
import { capitalize } from '@goodnight-dev/utils';

// or by area, via subpath
import { capitalize } from '@goodnight-dev/utils/string';
```

Want the smallest possible dependency surface? Install the area packages
directly (e.g.
[`@goodnight-dev/string`](https://www.npmjs.com/package/@goodnight-dev/string))
— they're versioned independently and re-exported here.

## Subpaths

| Import                        | Re-exports              |
| ----------------------------- | ----------------------- |
| `@goodnight-dev/utils`        | everything below        |
| `@goodnight-dev/utils/string` | `@goodnight-dev/string` |

## License

[MIT](./LICENSE) © Ian Goodnight
