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

## example

```jsx
import { Minimap, Raster, Path, Sphere, Graticule } from '@carbonplan/minimaps'

<Minimap projection='naturalEarth1'>
  <Path
    stroke={'white'}
    source={'https://cdn.jsdelivr.net/npm/world-atlas@2/land-50m.json'}
    variable={'land'}
  />
  <Graticule stroke={'white'} />
  <Sphere fill={'black'} />
  <Raster
    source={'https://upload.wikimedia.org/wikipedia/commons/thumb/2/23/Blue_Marble_2002.png/2880px-Blue_Marble_2002.png'}
  />
</Minimap>
```

## license

All the original code in this repository is [MIT](https://choosealicense.com/licenses/mit/) licensed. We request that you please provide attribution if reusing any of our digital content (graphics, logo, copy, etc.).

## about us

CarbonPlan is a non-profit organization that uses data and science for climate action. We aim to improve the transparency and scientific integrity of carbon removal and climate solutions through open data and tools. Find out more at [carbonplan.org](https://carbonplan.org/) or get in touch by [opening an issue](https://github.com/carbonplan/maps/issues/new) or [sending us an email](mailto:hello@carbonplan.org).