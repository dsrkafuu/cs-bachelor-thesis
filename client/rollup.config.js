import process from 'process';
import nodeResolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import babel from '@rollup/plugin-babel';
import replace from '@rollup/plugin-replace';
import { terser } from 'rollup-plugin-terser';

const plugins = [
  nodeResolve({
    extensions: ['.js', '.ts'],
  }),
  commonjs(),
  babel({
    babelHelpers: 'runtime',
    extensions: ['.js', '.ts'],
    exclude: /^(.+\/)?node_modules\/.+$/,
  }),
  replace({
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV),
  }),
];

export default process.env.NODE_ENV === 'development'
  ? // dev debug build
    {
      input: 'src/client.ts',
      output: {
        file: 'web/client.dev.js',
        format: 'iife',
      },
      plugins,
    }
  : // production build for cdn & npm
    [
      {
        input: 'src/client.ts',
        output: {
          file: 'dist/client.min.js',
          format: 'iife',
        },
        plugins: [...plugins, terser()],
      },
      {
        input: 'src/index.ts',
        output: {
          file: 'dist/index.js',
          format: 'esm',
        },
        plugins,
      },
    ];
