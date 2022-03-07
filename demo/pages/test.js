import { Minimap, Graticule, Path, Sphere, Raster } from '@carbonplan/minimaps'
import { naturalEarth1, orthographic } from '@carbonplan/minimaps/projections'
import { useThemeUI, Box } from 'theme-ui'
import { useColormap, useThemedColormap } from '@carbonplan/colormaps'

const datasets = {
  'land-50m.json': 'https://cdn.jsdelivr.net/npm/world-atlas@2/land-50m.json',
  'blue-marble.png':
    'https://upload.wikimedia.org/wikipedia/commons/thumb/2/23/Blue_Marble_2002.png/2880px-Blue_Marble_2002.png',
}

const Test = () => {
  const { theme } = useThemeUI()
  const { primary, background } = theme.colors
  const colormap = useThemedColormap('warm', { count: 255, format: 'rgb' })

  return (
    <Box sx={{ width: '50%' }}>
      <Minimap projection={naturalEarth1}>
        <Graticule stroke={primary} />
        <Path
          stroke={primary}
          source={datasets['land-50m.json']}
          feature={'land'}
        />
        <Sphere fill={background} />
        <Raster
          clim={[0, 1]}
          mode='lut'
          source={datasets['blue-marble.png']}
          colormap={colormap}
        />
      </Minimap>
    </Box>
  )
}

export default Test
