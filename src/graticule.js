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

  const eps = projection.id === 'mercator' ? 0 : 0.1

  return (
    <path
      d={geoPath(projection)(
        geoGraticule()
          .step(step)
          .extentMajor([
            [-180 - eps, -90 - eps],
            [180 + eps, 90 + eps],
          ])()
      )}
      stroke={stroke}
      fill={'none'}
      opacity={opacity}
      strokeWidth={strokeWidth}
      style={{
        vectorEffect: 'non-scaling-stroke',
      }}
    />
  )
}

export default Graticule
