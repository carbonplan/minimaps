import React, {
  useEffect,
  useRef,
  createContext,
  useContext,
  useState,
} from 'react'
import Regl from './regl'

const DEFAULTS = {
  naturalEarth1: {
    aspect: 0.5,
    scale: 1,
  },
  orthographic: {
    aspect: 1,
    scale: 3,
  },
  mercator: {
    aspect: 1,
    scale: 1,
  },
  equirectangular: {
    aspect: 0.5,
    scale: 1,
  },
}

const WIDTH = 800

const MinimapContext = createContext(null)

export const useMinimap = () => {
  return useContext(MinimapContext)
}

const Minimap = ({
  id,
  tabIndex,
  className,
  children,
  projection: getProjection,
  style,
  aspect: aspectProp,
  scale: scaleProp,
  translate = [0, 0],
}) => {
  const [projection, setProjection] = useState({ value: getProjection() })
  const [aspect, setAspect] = useState(aspectProp)
  const [scale, setScale] = useState(scaleProp)

  useEffect(() => {
    const updatedProjection = getProjection()
    const defaults = DEFAULTS[updatedProjection.id]
    const updatedScale = scaleProp || defaults.scale
    const updatedAspect = aspectProp || defaults.aspect

    updatedProjection.scale(updatedScale * (WIDTH / (2 * Math.PI)))
    updatedProjection.translate([
      ((1 + translate[0]) * WIDTH) / 2,
      ((1 + translate[1]) * updatedAspect * WIDTH) / 2,
    ])

    setAspect(updatedAspect)
    setScale(updatedScale)
    setProjection({ value: updatedProjection })
  }, [getProjection, scaleProp, aspectProp, translate[0], translate[1]])

  return (
    <MinimapContext.Provider
      value={{
        projection: projection.value,
        translate: translate,
        scale,
        aspect,
        width: WIDTH,
        height: aspect * WIDTH,
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
            viewBox={`0 0 ${WIDTH} ${WIDTH * aspect}`}
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
