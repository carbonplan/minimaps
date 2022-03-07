<img
  src='https://carbonplan-assets.s3.amazonaws.com/monogram/dark-small.png'
  height='48'
/>

# carbonplan / minimaps

**small maps for figures**

[![GitHub][github-badge]][github]
![MIT License][]

[github]: https://github.com/carbonplan/maps
[github-badge]: https://badgen.net/badge/-/github?icon=github&label
[mit license]: https://badgen.net/badge/license/MIT/blue

_Note: Work in progress!_

This library makes it easy to generate small data-driven raster maps. It's a complement to making [interactive tiled maps](https://github.com/carbonplan/maps) that can be panned and zoomed. The use case here is figures and other static graphics where we don't need interactivity, where we have the entire raster dataset we want to render in one file, and where we often want to show the full globe.

Not relying on tiles frees us up to more easily use custom projections, which we have implemented here performantly via WebGL. We're using a [separate package](https://github.com/carbonplan/glsl-geo-projection) containing the GLSL shader math for inverse geometric map projections.

## usage

Create a `Minimap` component and include the graphical elements you want. Most maps contain a `Raster` (with the data) and a `Path` (typically coastlines or similar). In addition, you might want to render `Graticule` lines or the `Sphere` that bounds the globe.

The source for `Raster` can be an image (e.g. `png`) or a zarr array or group. It must contain a complete data grid in the equirectangular projection (spanning -180,180 lon and -90,90 lat).

Here's a simple example where we use a `json` file for the `Path` and the "Blue Marble" image in `png` format for the `Raster`. We specify that the format is `rgb` because each pixel of the image has three color values that we want to render as rgb.

```jsx
import {
  Minimap,
  Raster,
  Path,
  Sphere,
  Graticule,
} from '@carbonplan/minimaps'
import { naturalEarth1 } from '@carbonplan/minimaps/projections'

return (
  <Minimap projection={naturalEarth1}>
    <Path
      stroke={'white'}
      source={'https://cdn.jsdelivr.net/npm/world-atlas@2/land-50m.json'}
      feature={'land'}
    />
    <Graticule stroke={'white'} />
    <Sphere fill={'black'} />
    <Raster
      source={
        'https://upload.wikimedia.org/wikipedia/commons/thumb/2/23/Blue_Marble_2002.png/2880px-Blue_Marble_2002.png'
      }
      format={'rgb'}
      transpose
    />
  </Minimap>
)
```

Here's a slightly more complicated example where we use a `zarr` file for the `Raster`. The data here are one-dimensional, so we specify a `colormap` and `clim` and the `lut` mode.

```jsx
import {
  Minimap,
  Raster,
  Path,
  Sphere,
  Graticule,
} from '@carbonplan/minimaps'
import { naturalEarth1 } from '@carbonplan/minimaps/projections'
import { useColormap } from '@carbonplan/colormaps'

const colormap = useColormap('fire')

return (
  <Minimap projection={naturalEarth1}>
    <Path
      stroke={'white'}
      source={'https://cdn.jsdelivr.net/npm/world-atlas@2/land-50m.json'}
      feature={'land'}
    />
    <Graticule stroke={'white'} />
    <Sphere fill={'black'} />
        <Raster
      clim={[0, 50000000]}
      mode='lut'
      nullValue={9.969209968386869e36}
      source={'https://carbonplan-climatetrace.s3.us-west-2.amazonaws.com/v0.4/blog/total_emissions.zarr'}
      variable={'emissions'}
      colormap={colormap}
    />
  </Minimap>
)
```

## projections

For either type of raster data source, we can use any of the map projections in `@carbonplan/minimaps/projections`. Here's how the result would look for the blue marble image.

<br><a href="#naturalEarth1" name="naturalEarth1">#</a> <b>naturalEarth1</b>
<br><a href="#orthographic" name="orthographic">#</a> <b>orthographic</b>
<br><a href="#equirectangular" name="equirectangular">#</a> <b>equirectangular</b>
<br><a href="#mercator" name="mercator">#</a> <b>mercator</b>

## license

All the original code in this repository is [MIT](https://choosealicense.com/licenses/mit/) licensed. We request that you please provide attribution if reusing any of our digital content (graphics, logo, copy, etc.).

## about us

CarbonPlan is a non-profit organization that uses data and science for climate action. We aim to improve the transparency and scientific integrity of carbon removal and climate solutions through open data and tools. Find out more at [carbonplan.org](https://carbonplan.org/) or get in touch by [opening an issue](https://github.com/carbonplan/maps/issues/new) or [sending us an email](mailto:hello@carbonplan.org).
