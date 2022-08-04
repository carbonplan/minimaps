import { useState } from 'react'
import { Minimap, Path, Sphere, Raster } from '@carbonplan/minimaps'
import {
  naturalEarth1,
  orthographic,
  mercator,
  equirectangular,
} from '@carbonplan/minimaps/projections'
import { useThemeUI, Box, Flex } from 'theme-ui'
import { Toggle, Select } from '@carbonplan/components'
import { useThemedColormap } from '@carbonplan/colormaps'
import { datasets } from '../datasets'

const projections = {
  naturalEarth1,
  orthographic,
  mercator,
  equirectangular,
}

const Test = () => {
  const { theme } = useThemeUI()
  const [projection, setProjection] = useState('naturalEarth1')
  const [basemaps, setBasemaps] = useState({
    land: true,
    ocean: false,
  })
  const colormap = useThemedColormap('cool', { count: 255, format: 'rgb' })

  return (
    <>
      <Box sx={{ width: '200px', mt: [2], ml: [4] }}>
        <Select onChange={(e) => setProjection(e.target.value)}>
          <option value='naturalEarth1'>naturalEarth1</option>
          <option value='orthographic'>orthographic</option>
          <option value='mercator'>mercator</option>
          <option value='equirectangular'>equirectangular</option>
        </Select>

        <Flex sx={{ gap: 2 }}>
          Land
          <Toggle
            value={basemaps.land}
            onClick={() => setBasemaps((v) => ({ ...v, land: !v.land }))}
          />
        </Flex>

        <Flex sx={{ gap: 2 }}>
          Ocean
          <Toggle
            value={basemaps.ocean}
            onClick={() => setBasemaps((v) => ({ ...v, ocean: !v.ocean }))}
          />
        </Flex>
      </Box>

      <Box sx={{ width: '50%', ml: [4], mt: [6], mb: [3] }}>
        <Minimap
          projection={projections[projection]}
          scale={1}
          translate={[0, 0]}
        >
          {basemaps.ocean && (
            <Path
              fill={theme.colors.background}
              opacity={1}
              source={
                'https://storage.googleapis.com/carbonplan-maps/world-atlas/ocean-50m.json'
              }
              feature={'ocean'}
            />
          )}

          {basemaps.land && (
            <Path
              stroke={theme.colors.primary}
              source={
                'https://cdn.jsdelivr.net/npm/world-atlas@2/land-50m.json'
              }
              feature={'land'}
              opacity={1}
            />
          )}

          <Sphere fill={theme.colors.background} />
          <Raster
            source={datasets['gcm_central-america.zarr']}
            colormap={colormap}
            mode={'lut'}
            clim={[280, 310]}
            nullValue={9.969209968386869e36}
            variable={'tasmax'}
          />
        </Minimap>
      </Box>
    </>
  )
}

export default Test
