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

// Mobile GPU precision fix: some GPUs can't handle large fill values (e.g. 9.96...e36).
// On low-precision GPUs, we normalize data and use a sentinel fill value instead.

const FILL_SENTINEL = -3.4e4
const HALF_FLOAT_MAX = 65504
let gpuPrecisionTestResult = null

// Test GPU precision: (4096 + 1) - 4096 should equal 1 on highp, 0 on mediump
const testGpuPrecision = (regl) => {
  if (gpuPrecisionTestResult !== null) {
    return gpuPrecisionTestResult
  }

  try {
    const fbo = regl.framebuffer({
      width: 1,
      height: 1,
      colorFormat: 'rgba',
    })

    const testDraw = regl({
      frag: `
        #ifdef GL_FRAGMENT_PRECISION_HIGH
        precision highp float;
        #else
        precision mediump float;
        #endif
        uniform float u;
        void main() {
          float t = (u + 1.0) - u;
          float pass = t > 0.5 ? 1.0 : 0.0;
          gl_FragColor = vec4(pass, 0.0, 0.0, 1.0);
        }
      `,
      vert: `
        precision highp float;
        attribute vec2 position;
        void main() {
          gl_Position = vec4(position, 0, 1);
        }
      `,
      attributes: {
        position: [
          [-1, -1],
          [1, -1],
          [-1, 1],
          [-1, 1],
          [1, -1],
          [1, 1],
        ],
      },
      uniforms: {
        u: 4096.0,
      },
      count: 6,
      framebuffer: fbo,
    })

    testDraw()

    const pixels = regl.read({ framebuffer: fbo })
    fbo.destroy()

    const supportsHighPrecision = pixels[0] > 128
    gpuPrecisionTestResult = supportsHighPrecision
    return supportsHighPrecision
  } catch (e) {
    gpuPrecisionTestResult = false
    return false
  }
}

const needsNormalization = (nullValue, clim, regl) => {
  const largeNullValue = Math.abs(nullValue) > HALF_FLOAT_MAX
  const largeClim =
    clim &&
    (Math.abs(clim[0]) > HALF_FLOAT_MAX || Math.abs(clim[1]) > HALF_FLOAT_MAX)

  if (!largeNullValue && !largeClim) {
    return false
  }
  if (testGpuPrecision(regl)) {
    return false
  }
  return true
}

const normalizeDataForTexture = (data, nullValue, scale) => {
  if (!data?.data || !ArrayBuffer.isView(data.data)) {
    return data
  }

  const normalized = new Float32Array(data.data.length)
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
    () => needsNormalization(nullValue, clim, regl),
    [nullValue, clim && clim[0], clim && clim[1], regl]
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
