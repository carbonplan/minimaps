import React, { useEffect, useState } from 'react'
import { geoPath } from 'd3-geo'
import { feature } from 'topojson-client'
import { useMinimap } from './minimap'

const Path = ({ source, variable, fill, stroke, strokeWidth, opacity }) => {
	const [path, setPath] = useState()
  const { projection, width, height } = useMinimap()

  opacity = opacity || 0.7
  strokeWidth = strokeWidth || 0.5
  stroke = stroke || 'none'
  fill = fill || 'none'

	useEffect(() => {
    fetch(source)
      .then((response) => response.json())
      .then((topology) => {
        setPath(geoPath(projection)(feature(topology, topology.objects[variable])))
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
        vectorEffects: 'non-scaling-stroke',
      }}
    />
  )
}

export default Path