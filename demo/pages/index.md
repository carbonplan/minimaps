import Section from '../components/section'

# @carbonplan/minimaps

Demo of our library for making small maps.

```jsx live
<Minimap projection={naturalEarth1}>
  <Graticule stroke={primary} />
  <Path stroke={primary} source={datasets['land-50m.json']} feature={'land'} />
  <Sphere fill={background} />
  <Raster source={datasets['blue-marble.png']} />
</Minimap>
```

export default ({ children }) => <Section name='intro'>{children}</Section>
