import { defineConfig } from 'tsdown';

export default defineConfig({
  entry: ['src/index.ts', 'src/predicate.ts', 'src/string.ts'],
  format: 'esm',
  dts: true,
  clean: true,
  // Sibling @goodnight-dev/* packages are runtime `dependencies`, so tsdown
  // keeps them external by default — the umbrella re-exports them rather than
  // bundling their source, which preserves independent versioning.
});
