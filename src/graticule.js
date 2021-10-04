import React from 'react'
import { geoPath, geoGraticule } from 'd3-geo'
import { useMinimap } from './minimap'

const Graticule = ({
  stroke,
  strokeWidth = 0.5,
  step = [45, 45],
  opacity = 0.2,
}) => {
  const { projection, width, height } = useMinimap()

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
