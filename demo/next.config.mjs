import path from 'path'
import remarkMdxCodeMeta from 'remark-mdx-code-meta'
import nextMDX from '@next/mdx'
import * as url from 'url'

const withMDX = nextMDX({
  extension: /\.mdx?$/,
  options: { remarkPlugins: [remarkMdxCodeMeta], format: 'mdx' },
})

const __dirname = url.fileURLToPath(new URL('.', import.meta.url))

export default withMDX({
  pageExtensions: ['js', 'jsx', 'mdx', 'md'],
  webpack: (config, options) => {
    if (options.isServer) {
      config.externals = ['react', 'theme-ui', ...config.externals]
    }
    config.resolve.alias['react'] = path.resolve(
      __dirname,
      '.',
      'node_modules',
      'react'
    )
    config.resolve.alias['theme-ui'] = path.resolve(
      __dirname,
      '.',
      'node_modules',
      'theme-ui'
    )
    return config
  },
})
