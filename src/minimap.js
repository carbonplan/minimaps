import React, {
  useState,
  useEffect,
  useRef,
  createContext,
  useContext,
} from 'react'
import Regl from './regl'

const DEFAULTS = {
  naturalEarth1: {
    aspect: 0.5,
    scale: 1,
    translate: [0, 0],
  },
  orthographic: {
    aspect: 1,
    scale: 3,
    translate: [0, 0],
  },
  mercator: {
    aspect: 1,
    scale: 1,
    translate: [0, 0],
  },
  equirectangular: {
    aspect: 0.5,
    scale: 1,
    translate: [0, 0],
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
  projection: getProjection,
  style,
  aspect: aspectProp,
  scale: scaleProp,
  translate: translateProp,
}) => {
  const [projection, setProjection] = useState({
    value: getProjection(),
    scale: scaleProp,
    aspect: aspectProp,
    translate: translateProp,
  })

  const WIDTH = 800

  useEffect(() => {
    const updatedProjection = getProjection()
    const defaults = DEFAULTS[updatedProjection.id]
    const updatedScale = scaleProp || defaults.scale
    const updatedAspect = aspectProp || defaults.aspect
    const updatedTranslate = translateProp || defaults.translate

    updatedProjection.scale(updatedScale * (WIDTH / (2 * Math.PI)))
    updatedProjection.translate([
      ((1 + updatedTranslate[0]) * WIDTH) / 2,
      ((1 + updatedTranslate[1]) * updatedAspect * WIDTH) / 2,
    ])

    setProjection({
      scale: updatedScale,
      aspect: updatedAspect,
      value: updatedProjection,
      translate: updatedTranslate,
    })
  }, [getProjection, scaleProp, aspectProp, translateProp])

  return (
    <MinimapContext.Provider
      value={{
        projection: projection.value,
        translate: projection.translate,
        scale: projection.scale,
        aspect: projection.aspect,
        width: WIDTH,
        height: WIDTH * projection.aspect,
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
          aspect={projection.aspect}
          style={{
            pointerEvents: 'none',
            zIndex: -1,
          }}
        >
          <svg
            viewBox={`0 0 ${WIDTH} ${WIDTH * projection.aspect}`}
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
