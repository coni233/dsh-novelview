import { readFileSync } from 'node:fs'
import { defineConfig } from 'tsdown'

const packageJson = JSON.parse(
  readFileSync(new URL('./package.json', import.meta.url), 'utf8'),
) as { name: string }

const baselineExternals = [
  'react',
  'react/jsx-runtime',
  'react-dom',
  'react-dom/client',
  '@deepseek-ai/cordis',
]

function isBaseline(specifier: string): boolean {
  return baselineExternals.some(
    name => specifier === name || specifier.startsWith(`${name}/`),
  )
}

export default defineConfig({
  name: `${packageJson.name}/client`,
  entry: { client: 'src/client/index.tsx' },
  outDir: 'lib',
  format: 'cjs',
  platform: 'browser',
  target: 'es2022',
  dts: false,
  clean: false,
  sourcemap: true,
  deps: {
    neverBundle: isBaseline,
    alwaysBundle: (specifier: string) => !isBaseline(specifier),
  },
  outputOptions: {
    entryFileNames: 'client.js',
    banner: chunk =>
      `window.__ModuleLoader__.load({ id: ${JSON.stringify(packageJson.name)},${chunk.isEntry ? '' : ` chunk: ${JSON.stringify(chunk.fileName)},`} factory: (require) => {`,
    intro: 'var module = { exports: {} }; var exports = module.exports;',
    footer: 'return module.exports; } });',
  },
})
