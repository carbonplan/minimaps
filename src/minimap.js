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
  extensions,
  children,
  projection,
  style,
  aspect,
  scale,
  translate = [0, 0],
}) => {

  const scaleProp = scale || DEFAULTS[projection.id].scale
  const aspectProp = aspect || DEFAULTS[projection.id].aspect

  const width = 800
  const height = aspectProp * width

  projection.scale(scaleProp * (width / (2 * Math.PI)))
  projection.translate([
    ((1 + translate[0]) * width) / 2,
    ((1 + translate[1]) * height) / 2,
  ])

  return (
    <MinimapContext.Provider
      value={{
        projection: projection,
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
          extensions={extensions}
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
