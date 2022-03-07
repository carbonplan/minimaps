import Section from '../components/section'

# @carbonplan/minimaps

Demo of our library for making small maps.

```jsx live
<Minimap projection={naturalEarth1}>
  <Graticule stroke={primary} />
  <Path stroke={primary} source={datasets['land-50m.json']} feature={'land'} />
  <Sphere fill={background} />
  <Raster source={datasets['blue-marble.png']} transpose />
</Minimap>
```

```jsx live
() => {
  const colormap = useThemedColormap('fire')

  return (
    <Minimap projection={naturalEarth1}>
      <Graticule stroke={primary} />
      <Path
        stroke={primary}
        source={datasets['land-50m.json']}
        feature={'land'}
      />
      <Sphere fill={background} />
      <Raster
        clim={[0, 50000000]}
        mode='lut'
        nullValue={9.969209968386869e36}
        source={datasets['total_emissions.zarr']}
        variable={'emissions'}
        colormap={colormap}
      />
    </Minimap>
  )
}
```

export default ({ children }) => <Section name='intro'>{children}</Section>
