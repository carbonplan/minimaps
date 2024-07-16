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

const resizeToAspectRatio = (containerWidth, aspectRatio) => {
  const findDimensions = (width) => {
    let height = aspectRatio * width
    height = Math.round(height)
    const recalculatedWidth = height / aspectRatio
    if (Math.round(recalculatedWidth) === width) {
      console.log('found', width, height)
      return { adjustedWidth: width, adjustedHeight: height }
    }

    return findDimensions(width - 1)
  }

  return findDimensions(containerWidth)
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
  const [viewport, setViewport] = useState({ width: null, height: null })
  const container = useRef(null)
  const rounderRef = useRef(null)
  const svgRef = useRef(null)

  const WIDTH = 800

  const handleResize = () => {
    if (
      container.current &&
      svgRef.current &&
      rounderRef.current &&
      projection.aspect
    ) {
      const containerWidth = container.current.offsetWidth
      const roundedWidth = Math.floor(containerWidth)
      const { adjustedWidth, adjustedHeight } = resizeToAspectRatio(
        roundedWidth,
        projection.aspect
      )
      rounderRef.current.style.height = adjustedHeight + 'px'
      rounderRef.current.style.width = adjustedWidth + 'px'
      svgRef.current.style.height = adjustedHeight + 'px'
      svgRef.current.style.width = adjustedWidth + 'px'
      setViewport({
        height: adjustedHeight,
        width: adjustedWidth,
      })
    }
  }
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
    window.addEventListener('resize', handleResize)
    handleResize() // Set initial size
    return () => {
      window.removeEventListener('resize', handleResize)
    }
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
        ref={container}
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
        <div ref={rounderRef}>
          <Regl
            aspect={projection.aspect}
            style={{
              pointerEvents: 'none',
              zIndex: -1,
            }}
            viewport={viewport}
          >
            <svg
              ref={svgRef}
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
      </div>
    </MinimapContext.Provider>
  )
}

export default Minimap
