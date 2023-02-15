import React, { useCallback, useEffect, useRef, useState } from 'react'
import { geoPath } from 'd3-geo'
import { feature as topoFeature } from 'topojson-client'
import { useMinimap } from './minimap'

const Path = ({
  source,
  feature,
  fill = 'none',
  stroke = 'none',
  strokeWidth = 0.5,
  opacity = 0.7,
}) => {
  const ref = useRef(null)
  const [path, setPath] = useState()
  const [initialized, setInitialized] = useState(false)
  const [data, setData] = useState()
  const {
    projection,
    scale: scaleProp,
    translate: translateProp,
    width,
    height,
  } = useMinimap()
  const [transform, setTransform] = useState(null)

  useEffect(() => {
    fetch(source)
      .then((response) => response.json())
      .then((topology) => {
        setData(topoFeature(topology, topology.objects[feature]))
      })
  }, [source])

  useEffect(() => {
    setPath(geoPath(projection)(data))
  }, [data, projection])

  useEffect(() => {
    const scale = [
      (scaleProp * (width / (2 * Math.PI))) / projection.scale(),
      (scaleProp * (height / Math.PI)) / projection.scale(),
    ]

    const {
      x,
      y,
      width: bWidth,
      height: bHeight,
    } = ref.current?.getBBox() ?? {
      x: 0,
      y: 0,
      width,
      height,
    }

    const translate = [
      (scale[0] - 1) * -x +
        (width - scale[0] * bWidth) / 2 +
        (translateProp[0] * width) / 2,
      (scale[1] - 1) * -y +
        (height - scale[1] * bHeight) / 2 +
        (translateProp[1] * height) / 2,
    ]

    setTransform(`translate(${translate.join(' ')}) scale(${scale.join(' ')})`)
  }, [initialized, projection, scaleProp, translateProp, width, height])

  const pathRef = useCallback((node) => {
    ref.current = node
    setInitialized(true)
  }, [])

  return (
    path && (
      <path
        ref={pathRef}
        d={path}
        stroke={initialized ? stroke : 'none'}
        fill={initialized ? fill : 'none'}
        opacity={opacity}
        strokeWidth={strokeWidth}
        transform={transform}
        style={{
          vectorEffect: 'non-scaling-stroke',
        }}
      />
    )
  )
}

export default Path
