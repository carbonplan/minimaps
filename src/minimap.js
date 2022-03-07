import React, { useState, useRef, createContext, useContext } from 'react'
import Regl from './regl'

const DEFAULTS = {
  'naturalEarth1': {
    aspect: 0.5,
    scale: 1
  },
  'orthographic': {
    aspect: 1,
    scale: 3
  },
  'mercator': {
    aspect: 1,
    scale: 1
  },
}

const MinimapContext = createContext(null)

export const useMinimap = () => {
  return useContext(MinimapContext)
}

const Minimap = ({
  id,
  tabIndex,
  className,
  children,
  projection,
  style,
  aspect,
  scale,
  translate = [0, 0],
}) => {
  const _projection = Object.assign({}, projection)

  const scaleProp = scale || DEFAULTS[_projection.id].scale
  const aspectProp = aspect || DEFAULTS[_projection.id].aspect

  const width = 800
  const height = aspectProp * width

  _projection.scale(scaleProp * (width / (2 * Math.PI)))
  _projection.translate([
    ((1 + translate[0]) * width) / 2,
    ((1 + translate[1]) * height) / 2,
  ])

  return (
    <MinimapContext.Provider
      value={{
        projection: _projection,
        translate: translate,
        scale: scaleProp,
        aspect: aspectProp,
        width: width,
        height: height,
      }}
    >
      <div
        id={id}
        tabIndex={tabIndex}
        className={className}
        style={{
          position: 'relative',
          width: '100%',
          overflow: 'hidden',
          ...style,
        }}
      >
        <Regl
          aspect={aspectProp}
          style={{
            pointerEvents: 'none',
            zIndex: -1,
          }}
        >
          <svg
            viewBox={`0 0 ${width} ${height}`}
            style={{
              position: 'absolute',
              width: '100%',
              top: 0,
              left: 0,
              overflow: 'hidden',
              pointerEvents: 'none',
            }}
          >
            {children}
          </svg>
        </Regl>
      </div>
    </MinimapContext.Provider>
  )
}

export default Minimap
