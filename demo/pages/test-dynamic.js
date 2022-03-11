import { useState } from 'react'
import { Minimap, Graticule, Path, Sphere, Raster } from '@carbonplan/minimaps'
import {
  naturalEarth1,
  orthographic,
  mercator,
  equirectangular,
} from '@carbonplan/minimaps/projections'
import { useThemeUI, Box } from 'theme-ui'
import { Slider, Select } from '@carbonplan/components'
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
  const [clim, setClim] = useState(3000)
  const [scale, setScale] = useState(1)
  const [variable, setVariable] = useState('netcostpertonfeed')
  const colormap = useThemedColormap('cool', { count: 255, format: 'rgb' })

  return (
    <>
      <Slider sx={{width: '200px', mt: [4], ml: [4] }} value={clim} min={0} max={6000} onChange={(e) => setClim(parseFloat(e.target.value))}/>
      <Slider sx={{width: '200px', mt: [4], ml: [4]}} step={0.01} value={scale} min={0.1} max={3} onChange={(e) => setScale(parseFloat(e.target.value))}/>
      <Select sx={{width: '200px', mt: [2], ml: [4]}} onChange={(e) => setVariable(e.target.value)}>
        <option value='netcostpertonfeed'>netcostpertonfeed</option>
        <option value='netcostpertonfood'>netcostpertonfood</option>
      </Select>
      <Box sx={{ width: '50%', mt: [6] }}>
        <Minimap projection={naturalEarth1} scale={scale}>
          <Path
            stroke={'white'}
            source={'https://cdn.jsdelivr.net/npm/world-atlas@2/land-110m.json'}
            feature={'land'}
          />
          <Graticule stroke={primary} />
          <Sphere fill={background} />
          <Raster
            source='https://storage.googleapis.com/carbonplan-macroalgae/data/processed/article/costs.zarr'
            colormap={colormap}
            mode={'lut'}
            clim={[0, clim]}
            nullValue={9.969209968386869e36}
            variable={variable}
          />
        </Minimap>
      </Box>
    </>
  )
}

export default Test
