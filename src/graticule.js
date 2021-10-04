import React from 'react'
import { geoPath, geoGraticule } from 'd3-geo'
import { useMinimap } from './minimap'

const Graticule = ({ step, stroke, strokeWidth, opacity }) => {
  const { projection, width, height } = useMinimap()

  step = step || [45, 45]
  opacity = opacity || 0.2
  strokeWidth = strokeWidth || 0.5

  return (
    <path
      d={geoPath(projection)(geoGraticule().step(step)())}
      stroke={stroke}
      fill={'none'}
      opacity={opacity}
      strokeWidth={strokeWidth}
      style={{
        vectorEffects: 'non-scaling-stroke',
      }}
    />
  )
}

export default Graticule