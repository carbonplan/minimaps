import { MDXProvider, useMDXComponents } from '@mdx-js/react'
import { useThemedStylesWithMdx } from '@theme-ui/mdx'
import { useThemeUI, Box } from 'theme-ui'
import { Layout, Row, Column } from '@carbonplan/components'
import { LiveCode } from '@carbonplan/prism'
import { useThemedColormap } from '@carbonplan/colormaps'

import * as minimaps from '@carbonplan/minimaps'
import * as minimapsProjections from '@carbonplan/minimaps/projections'

const transform = (src) => {
  if (!src.startsWith('()')) {
    return `<>${src}</>`
  } else {
    return `${src}`
  }
}

const datasets = {
  'land-50m.json': 'https://cdn.jsdelivr.net/npm/world-atlas@2/land-50m.json',
  'blue-marble.png':
    'https://upload.wikimedia.org/wikipedia/commons/thumb/2/23/Blue_Marble_2002.png/2880px-Blue_Marble_2002.png',
  'total_emissions.zarr':
    'https://carbonplan-climatetrace.s3.us-west-2.amazonaws.com/v0.4/blog/total_emissions.zarr',
}

const Section = ({ children, name }) => {
  const { theme } = useThemeUI()

  const scope = {
    Box,
    datasets,
    ...minimaps,
    ...minimapsProjections,
    ...theme.colors,
    useThemedColormap,
  }

  const components = {
    pre: ({ ...props }) => (
      <LiveCode
        theme={'monochrome'}
        transform={transform}
        scope={scope}
        {...props}
      />
    ),
  }

  const componentsWithStyles = useThemedStylesWithMdx(
    useMDXComponents(components)
  )

  return (
    <MDXProvider components={componentsWithStyles}>
      <Layout
        title='Minimaps – CarbonPlan'
        description='Demo of our minimaps library.'
      >
        <Row>
          <Column start={[1, 2, 3, 3]} width={[6]} sx={{ mb: [8, 8, 9, 10] }}>
            {children}
          </Column>
        </Row>
      </Layout>
    </MDXProvider>
  )
}

export default Section
