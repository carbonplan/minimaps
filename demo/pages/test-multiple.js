import { Minimap, Graticule, Path, Sphere, Raster } from '@carbonplan/minimaps'
import {
  naturalEarth1,
  orthographic,
  mercator,
  equirectangular,
} from '@carbonplan/minimaps/projections'
import { useThemeUI, Box } from 'theme-ui'
import { useColormap, useThemedColormap } from '@carbonplan/colormaps'

const datasets = {
  'land-50m.json': 'https://cdn.jsdelivr.net/npm/world-atlas@2/land-50m.json',
  'blue-marble.png':
    'https://upload.wikimedia.org/wikipedia/commons/thumb/2/23/Blue_Marble_2002.png/2880px-Blue_Marble_2002.png',
  'total_emissions.zarr':
    'https://carbonplan-climatetrace.s3.us-west-2.amazonaws.com/v0.4/blog/total_emissions.zarr',
}

const Test = () => {
  const { theme } = useThemeUI()
  const { primary, background } = theme.colors
  const colormap = useThemedColormap('fire', { count: 255, format: 'rgb' })

  return (
    <>
      <Box sx={{ width: '50%' }}>
        <Minimap projection={naturalEarth1} scale={1}>
          <Path
            stroke={'white'}
            source={'https://cdn.jsdelivr.net/npm/world-atlas@2/land-50m.json'}
            feature={'land'}
          />
          <Graticule stroke={'white'} />
          <Sphere fill={'white'} />
          <Raster
            source={
              'https://upload.wikimedia.org/wikipedia/commons/thumb/2/23/Blue_Marble_2002.png/2880px-Blue_Marble_2002.png'
            }
            format={'rgb'}
            transpose
          />
        </Minimap>
      </Box>
      <Box sx={{ width: '50%' }}>
        <Minimap projection={naturalEarth1} scale={2}>
          <Path
            stroke={'white'}
            source={'https://cdn.jsdelivr.net/npm/world-atlas@2/land-50m.json'}
            feature={'land'}
          />
          <Graticule stroke={'white'} />
          <Sphere fill={'white'} />
          <Raster
            source={
              'https://upload.wikimedia.org/wikipedia/commons/thumb/2/23/Blue_Marble_2002.png/2880px-Blue_Marble_2002.png'
            }
            format={'rgb'}
            transpose
          />
        </Minimap>
      </Box>
    </>
  )
}

export default Test
