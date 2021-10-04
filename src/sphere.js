import React from 'react'
import { geoPath } from 'd3-geo'
import { useMinimap } from './minimap'

const Sphere = ({ fill, stroke, strokeWidth = 0.5, opacity = 0.7 }) => {
  const { projection, width, height } = useMinimap()

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      style={{ position: 'absolute', width: '100%', top: 0, left: 0 }}
    >
      <mask id='circle-mask'>
        <rect x='0' y='0' width='100%' height='100%' fill='#FFFFFF' />
        <path
          fill='#000000'
          id='circle-cutout'
          d={geoPath(projection)({ type: 'Sphere' })}
        />
      </mask>
      <rect
        x='0'
        y='0'
        width='100%'
        height='100%'
        mask='url(#circle-mask)'
        style={{ fill: fill }}
      />
      {stroke && (
        <path
          fill='none'
          stroke={stroke}
          strokeWidth={strokeWidth}
          opacity={opacity}
          style={{
            vectorEffects: 'non-scaling-stroke',
          }}
          d={geoPath(projection)({ type: 'Sphere' })}
        />
      )}
    </svg>
  )
}

export default Sphere
