import React, { useEffect, useState } from 'react'
import { geoPath } from 'd3-geo'
import { feature as topoFeature } from 'topojson-client'
import { useMinimap } from './minimap'

const Path = ({
  source,
  feature,
  fill = 'none',
  stroke = 'none',
  strokeWidth = 0.5,
  opacity = 0.7,
}) => {
  const [path, setPath] = useState()
  const [data, setData] = useState()
  const { projection, scale, translate, width, height } = useMinimap()

  useEffect(() => {
    fetch(source)
      .then((response) => response.json())
      .then((topology) => {
        setData(topoFeature(topology, topology.objects[feature]))
      })
  }, [source])

  useEffect(() => {
    setPath(geoPath(projection)(data))
  }, [data, projection])

  const actualScale = [
    (scale * (width / (2 * Math.PI))) / projection.scale(),
    (scale * (height / Math.PI)) / projection.scale(),
  ]
  let actualTranslate = [
    ((1 + translate[0]) * width) / 2 +
      ((projection.translate()[0] / projection.scale()) * 2) / width,
    ((1 + translate[1]) * height) / 2 +
      ((projection.translate()[1] / projection.scale()) * 2) / height,
  ]
  // actualTranslate = [20, 3]

  console.log('projected', projection.scale(), projection.translate())
  console.log('props', scale, translate)
  console.log('calculated', actualScale, actualTranslate)
  return (
    <path
      d={path}
      stroke={stroke}
      fill={fill}
      opacity={opacity}
      strokeWidth={strokeWidth}
      transform={`scale(${actualScale.join(
        ' '
      )}) translate(${actualTranslate.join(' ')})`}
      style={{
        vectorEffect: 'non-scaling-stroke',
      }}
    />
  )
}

export default Path
