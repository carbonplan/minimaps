import { useState, useEffect } from 'react'
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
import { datasets } from '../datasets'

const Test = () => {
  const { theme } = useThemeUI()
  const { primary, background } = theme.colors
  const [dataset, setDataset] = useState('gcm_central-america.zarr')
  const [scale, setScale] = useState(1)
  const colormap = useThemedColormap('cool', { count: 255, format: 'rgb' })

  useEffect(() => {
    if (dataset === 'gcm_central-america.zarr') {
      setScale(1)
    } else {
      setScale(2)
    }
  }, [dataset])

  return (
    <>
      <Select
        sx={{ width: '200px', mt: [2], ml: [4] }}
        onChange={(e) => setDataset(e.target.value)}
      >
        <option value='gcm_central-america.zarr'>central-america</option>
        <option value='gcm_westus.zarr'>westus</option>
      </Select>

      <Box sx={{ width: '50%', ml: [4], mt: [6], mb: [3] }}>
        <Minimap projection={equirectangular} scale={scale} translate={[0, 0]}>
          <Path
            stroke={'white'}
            source={datasets['land-110m.json']}
            feature={'land'}
          />
          <Sphere fill={background} />
          <Raster
            source={datasets[dataset]}
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
