import { Minimap, Graticule, Path, Sphere, Raster } from '@carbonplan/minimaps'
import {
  naturalEarth1,
  orthographic,
  mercator,
  equirectangular,
} from '@carbonplan/minimaps/projections'
import { useThemeUI, Box } from 'theme-ui'
import { useColormap, useThemedColormap } from '@carbonplan/colormaps'
import { datasets } from '../datasets'

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
            source={datasets['land-50m.json']}
            feature={'land'}
          />
          <Graticule stroke={'white'} />
          <Sphere fill={'white'} />
          <Raster source={datasets['blue-marble.png']} mode={'rgb'} transpose />
        </Minimap>
      </Box>
      <Box sx={{ width: '50%' }}>
        <Minimap projection={naturalEarth1} scale={2}>
          <Path
            stroke={'white'}
            source={datasets['land-50m.json']}
            feature={'land'}
          />
          <Graticule stroke={'white'} />
          <Sphere fill={'white'} />
          <Raster source={datasets['blue-marble.png']} mode={'rgb'} transpose />
        </Minimap>
      </Box>
    </>
  )
}

export default Test
