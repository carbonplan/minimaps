import React, { useState, useEffect } from 'react'
import { geoPath } from 'd3-geo'
import { useMinimap } from './minimap'

const Sphere = ({ fill, stroke, strokeWidth = 0.5, opacity = 0.2 }) => {
  const { projection, width, height } = useMinimap()
  const [path, setPath] = useState()
  // replace with uui
  const id = String(Math.floor(Math.random() * 100))

  useEffect(() => {
    setPath(geoPath(projection)({ type: 'Sphere' }))
  }, [projection])

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      style={{ position: 'absolute', width: '100%', top: 0, left: 0 }}
    >
      <mask id={id}>
        <rect x='0' y='0' width='100%' height='100%' fill='#FFFFFF' />
        <path fill='#000000' id='circle-cutout' d={path} />
      </mask>
      <rect
        x='0'
        y='0'
        width='100%'
        height='100%'
        mask={`url(#${id})`}
        style={{ fill: fill }}
      />
      {stroke && (
        <path
          fill='none'
          stroke={stroke}
          strokeWidth={strokeWidth}
          opacity={opacity}
          style={{
            vectorEffect: 'non-scaling-stroke',
          }}
          d={path}
        />
      )}
    </svg>
  )
}

export default Sphere
