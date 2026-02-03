import React, { useState, useEffect, useRef, useMemo } from 'react'
import { extname } from 'path'
import { useRegl } from './regl'
import { useMinimap } from './minimap'
import zarr from 'zarr-js'
import { frag, vert } from './shaders'

const validateGroup = (data, variable) => {
  if (!Object.keys(data).includes(variable)) {
    throw new Error(
      `variable ${variable} not found in zarr dataset, options are: ${Object.keys(
        data
      )}`
    )
  }

  return true
}

const getBounds = ({ data, lat, lon }) => {
  return {
    lat: [
      data[lat].data.reduce((a, b) => Math.min(a, b)),
      data[lat].data.reduce((a, b) => Math.max(a, b)),
    ],
    lon: [
      data[lon].data.reduce((a, b) => Math.min(a, b)),
      data[lon].data.reduce((a, b) => Math.max(a, b)),
    ],
  }
}

// Mobile GPU precision fix: some GPUs can't handle large float values.
// When values exceed half-float range, normalize data and use a sentinel fill value.

const FILL_SENTINEL = -3.4e4
const HALF_FLOAT_MAX = 65504

const needsNormalization = (nullValue, clim) => {
  const largeNullValue = Math.abs(nullValue) > HALF_FLOAT_MAX
  const largeClim =
    clim && Math.max(Math.abs(clim[0]), Math.abs(clim[1])) > HALF_FLOAT_MAX
  return largeNullValue || largeClim
}

const normalizeBuffer = { current: null }

const normalizeDataForTexture = (data, nullValue, scale) => {
  if (!data?.data || !ArrayBuffer.isView(data.data)) {
    return data
  }

  // Reuse buffer if same size for performance
  if (
    !normalizeBuffer.current ||
    normalizeBuffer.current.length !== data.data.length
  ) {
    normalizeBuffer.current = new Float32Array(data.data.length)
  }
  const normalized = normalizeBuffer.current

  for (let i = 0; i < data.data.length; i++) {
    const v = data.data[i]
    if (v === nullValue || Number.isNaN(v)) {
      normalized[i] = FILL_SENTINEL
    } else {
      normalized[i] = v / scale
    }
  }

  return { ...data, data: normalized }
}

const NORTH_POLE = [0, 90]

const Raster = ({
  source,
  variable,
  mode = 'rgb',
  colormap = null,
  clim = null,
  transpose,
  frag: customFrag,
  northPole = NORTH_POLE,
  nullValue = -999,
  bounds = null,
  lat = 'lat',
  lon = 'lon',
}) => {
  const { regl, viewport } = useRegl()
  const { scale, translate, projection, aspect } = useMinimap()

  if (mode == 'lut' && !colormap) {
    throw new Error("must provide 'colormap' when using 'lut' mode")
  }

  if (mode == 'lut' && !clim) {
    throw new Error("must provide 'clim' when using 'lut' mode")
  }

  const shouldNormalize = useMemo(
    () => needsNormalization(nullValue, clim),
    [nullValue, clim && clim[0], clim && clim[1]]
  )

  const dataScale = useMemo(() => {
    if (shouldNormalize && clim) {
      return Math.max(Math.abs(clim[0]), Math.abs(clim[1]), 1)
    }
    return 1
  }, [shouldNormalize, clim && clim[0], clim && clim[1]])

  const redraw = useRef()
  const draw = useRef()
  const texture = useRef()
  const lut = useRef()
  const context = useRef({})
  const isLoaded = useRef(false)
  const boundsRef = useRef(null)
  const zarrGroupCache = useRef()
  const zarrArrayCache = useRef()
  const invalidated = useRef(null)

  useEffect(() => {
    regl.frame((_context) => {
      context.current = _context

      const canvas = regl._gl.canvas
      const dpr = _context.pixelRatio
      const targetWidth = Math.round(canvas.clientWidth * dpr)
      const targetHeight = Math.round(canvas.clientHeight * dpr)

      let needsRedraw = !!invalidated.current

      // Sync canvas buffer to display size and redraw on resize
      if (targetWidth > 0 && targetHeight > 0) {
        if (canvas.width !== targetWidth || canvas.height !== targetHeight) {
          canvas.width = targetWidth
          canvas.height = targetHeight
          needsRedraw = true
        }
      }

      if (needsRedraw && draw.current && isLoaded.current) {
        regl.clear({
          color: [0, 0, 0, 0],
          depth: 1,
        })
        redraw.current()
      }
      invalidated.current = null
    })
  }, [])

  useEffect(() => {
    texture.current ||= regl.texture({
      width: 1,
      height: 1,
      data: [0, 0, 0, 0],
    })

    lut.current ||= regl.texture()

    const position = [
      0.0, 0.0, 0.0, 1.0, 1.0, 0.0, 1.0, 0.0, 0.0, 1.0, 1.0, 1.0,
    ]

    let uniforms = {
      pixelRatio: regl.prop('pixelRatio'),
      viewportWidth: regl.prop('viewportWidth'),
      viewportHeight: regl.prop('viewportHeight'),
      texture: regl.prop('texture'),
      scale: regl.prop('scale'),
      translate: regl.prop('translate'),
      northPole: regl.prop('northPole'),
      transpose: regl.prop('transpose'),
      nullValue: regl.prop('nullValue'),
      bounds: regl.prop('bounds'),
      aspect: regl.prop('aspect'),
      dataScale: regl.prop('dataScale'),
    }

    if (mode === 'lut') {
      uniforms = {
        ...uniforms,
        lut: regl.prop('lut'),
        clim: regl.prop('clim'),
      }
    }

    draw.current = regl({
      vert: vert(),
      frag: frag(customFrag, projection, mode, transpose),

      attributes: {
        position: position,
      },

      uniforms: uniforms,

      count: 6,

      primitive: 'triangles',
    })
  }, [customFrag, projection.glsl.name])

  redraw.current = () => {
    const canvas = regl._gl.canvas
    const pixelRatio = context.current?.pixelRatio || 1
    draw.current({
      texture: texture.current,
      lut: lut.current,
      bounds: boundsRef.current
        ? [
            boundsRef.current.lat[0],
            boundsRef.current.lat[1],
            boundsRef.current.lon[0],
            boundsRef.current.lon[1],
          ]
        : [-90, 90, -180, 180],
      scale,
      translate,
      northPole,
      clim,
      nullValue: shouldNormalize ? FILL_SENTINEL : nullValue,
      aspect,
      dataScale,
      viewportWidth: canvas.width,
      viewportHeight: canvas.height,
      pixelRatio,
    })
  }

  const uploadTexture = (data) => {
    if (!data) return
    texture.current(
      shouldNormalize
        ? normalizeDataForTexture(data, nullValue, dataScale)
        : data
    )
    invalidated.current = 'on texture upload'
  }

  useEffect(() => {
    if (typeof source === 'string') {
      const ext = extname(source)

      if (['.png', '.jpg', '.jpeg'].includes(ext)) {
        const image = document.createElement('img')
        image.src = source
        image.crossOrigin = 'anonymous'
        image.onload = function () {
          setTimeout(() => {
            isLoaded.current = true
            texture.current(image)
            invalidated.current = 'on image load'
          }, 0)
        }
      }

      if (ext === '.zarr') {
        if (variable) {
          zarr().loadGroup(source, (error, data, metadata) => {
            validateGroup(data, variable)
            if (!bounds && data[lat] && data[lon]) {
              boundsRef.current = getBounds({ data, lat, lon })
            }
            zarrGroupCache.current = data
            zarrArrayCache.current = null
            isLoaded.current = true
            uploadTexture(data[variable])
          })
        } else {
          zarr().load(source, (error, data) => {
            zarrArrayCache.current = data
            zarrGroupCache.current = null
            isLoaded.current = true
            uploadTexture(data)
          })
        }
      }
    } else {
      if (variable) {
        validateGroup(source, variable)
        if (!bounds && source[lat] && source[lon]) {
          boundsRef.current = getBounds({ data: source, lat, lon })
        }
        zarrGroupCache.current = source
        zarrArrayCache.current = null
        isLoaded.current = true
        uploadTexture(source[variable])
      } else {
        zarrArrayCache.current = source
        zarrGroupCache.current = null
        isLoaded.current = true
        uploadTexture(source)
      }
    }
  }, [source, lat, lon])

  useEffect(() => {
    if (!isLoaded.current) return
    if (zarrGroupCache.current && variable) {
      uploadTexture(zarrGroupCache.current[variable])
    } else if (zarrArrayCache.current) {
      uploadTexture(zarrArrayCache.current)
    }
  }, [variable, shouldNormalize, nullValue, dataScale])

  useEffect(() => {
    if (bounds) {
      boundsRef.current = bounds
    }
    invalidated.current = 'on bounds change'
  }, [
    bounds && bounds.lat[0],
    bounds && bounds.lat[1],
    bounds && bounds.lon[0],
    bounds && bounds.lon[1],
  ])

  useEffect(() => {
    if (colormap) {
      lut.current({
        data: colormap,
        format: 'rgb',
        shape: [colormap.length, 1],
      })
      invalidated.current = 'on colormap change'
    }
  }, [colormap])

  useEffect(() => {
    invalidated.current = 'on viewport change'
  }, [viewport])

  useEffect(() => {
    invalidated.current = 'on prop change'
  }, [
    clim && clim[0],
    clim && clim[1],
    mode,
    scale,
    translate[0],
    translate[1],
    northPole ? northPole[0] : undefined,
    northPole ? northPole[1] : undefined,
    nullValue,
    projection,
  ])

  return null
}

export default Raster
