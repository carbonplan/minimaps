import React, { useEffect, useRef, useState } from 'react'
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

    const rect = ref.current?.getBoundingClientRect() ?? { width: 0, height: 0 }
    const parent = ref.current?.parentElement?.getBoundingClientRect() ?? {
      width,
      height,
    }

    console.log(parent)

    const translate = [
      (parent.width - rect.width) / 2 +
        (2 * (translateProp[0] * width)) / Math.PI,
      (parent.height - rect.height) / 2 +
        (2 * (translateProp[1] * height)) / Math.PI,
    ]

    setTransform(`scale(${scale.join(' ')}) translate(${translate.join(' ')})`)
  }, [projection, scaleProp, translateProp, width, height])

  return (
    path && (
      <path
        ref={ref}
        d={path}
        stroke={stroke}
        fill={fill}
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
