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
  const { projection, width, height } = useMinimap()

  useEffect(() => {
    fetch(source)
      .then((response) => response.json())
      .then((topology) => {
        setPath(
          geoPath(projection)(topoFeature(topology, topology.objects[feature]))
        )
      })
  }, [source])

  return (
    <path
      d={path}
      stroke={stroke}
      fill={fill}
      opacity={opacity}
      strokeWidth={strokeWidth}
      style={{
        vectorEffect: 'non-scaling-stroke',
      }}
    />
  )
}

export default Path
