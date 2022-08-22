import { useCallback, useEffect, useRef, useState } from 'react'
import zarr from 'zarr-js'
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

const projections = {
  naturalEarth1,
  orthographic,
  mercator,
  equirectangular,
}

const aspects = {
  naturalEarth1: 0.5,
  orthographic: 1,
  mercator: 1,
  equirectangular: 0.5,
}

const DATASET =
  'https://cmip6downscaling.blob.core.windows.net/vis/article/fig1/regions/central-america/gcm-tasmax.zarr'

const fetchData = () => {
  return new Promise((resolve) =>
    zarr().loadGroup(DATASET, (error, rawData, metadata) => {
      const variables = Object.keys(metadata.metadata)
        .map((k) => k.match(/\w+(?=\/\.zarray)/))
        .filter(Boolean)
        .map((a) => a[0])
        .filter((d) => !['lat', 'lon'].includes(d))

      // temporarily hardcode to always look at first variable
      const variable = variables[0]
      const { [variable]: data, lat, lon } = rawData

      const nullValue = metadata.metadata[`${variable}/.zarray`].fill_value
      const bounds = {
        lat: [
          lat.data.reduce((a, b) => Math.min(a, b)),
          lat.data.reduce((a, b) => Math.max(a, b)),
        ],
        lon: [
          lon.data.reduce((a, b) => Math.min(a, b)),
          lon.data.reduce((a, b) => Math.max(a, b)),
        ],
      }
      const f = {
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'LineString',
          coordinates: [
            [bounds.lon[0], bounds.lat[0]],
            [bounds.lon[1], bounds.lat[1]],
          ],
        },
      }

      const getMapProps = (projection) => {
        const aspect = aspects[projection]
        const p = projections[projection]().fitSize(
          [Math.PI * (1 / aspect), Math.PI],
          f
        )
        const scale = p.scale()
        const translate = [
          p.translate()[0] / Math.PI - 1,
          ((1 / aspect) * p.translate()[1]) / Math.PI - 1,
        ]

        return { scale, translate }
      }
      resolve({ nullValue, data, bounds, getMapProps })
    })
  )
}

const Test = () => {
  const { theme } = useThemeUI()
  const colormap = useThemedColormap('cool', { count: 255, format: 'rgb' })
  const [data, setData] = useState()
  const [bounds, setBounds] = useState()
  const [nullValue, setNullValue] = useState()
  const [projection, setProjection] = useState('naturalEarth1')
  const getMapProps = useRef(null)
  const [mapProps, setMapProps] = useState({ scale: 1, translate: [0, 0] })
  const [basemaps, setBasemaps] = useState({
    land: true,
    ocean: false,
  })

  useEffect(() => {
    fetchData().then((result) => {
      setData(result.data)
      setBounds(result.bounds)
      setNullValue(result.nullValue)
      getMapProps.current = result.getMapProps
      setMapProps(getMapProps.current(projection))
    })
  }, [])

  const handleProjectionChange = useCallback((e) => {
    setProjection(e.target.value)
    if (getMapProps.current) {
      setMapProps(getMapProps.current(e.target.value))
    }
  })

  return (
    <>
      <Box sx={{ width: '200px', mt: [2], ml: [4] }}>
        <Select onChange={handleProjectionChange} value={projection}>
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
        {data && bounds && (
          <Minimap {...mapProps} projection={projections[projection]}>
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
              source={data}
              bounds={bounds}
              colormap={colormap}
              mode={'lut'}
              clim={[280, 310]}
              nullValue={nullValue}
            />
          </Minimap>
        )}
      </Box>
    </>
  )
}

export default Test
