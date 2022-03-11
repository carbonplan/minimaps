import React, { useState, useEffect, useRef } from 'react'
import { extname } from 'path'
import { useRegl } from './regl'
import { useMinimap } from './minimap'
import zarr from 'zarr-js'

const Raster = ({
  source,
  variable,
  mode = 'rgb',
  colormap,
  clim,
  transpose,
  nullValue = -999,
}) => {
  const { regl } = useRegl()
  const { scale, translate, projection } = useMinimap()

  if (mode == 'lut' && !colormap) {
    throw new Error("must provide 'colormap' when using 'lut' mode")
  }

  if (mode == 'lut' && !clim) {
    throw new Error("must provide 'clim' when using 'lut' mode")
  }

  const draw = useRef()
  const texture = useRef()
  const lut = useRef()
  const context = useRef({})
  const isLoaded = useRef(false)
  const isRendering = useRef(false)
  const zarrGroupCache = useRef()

  useEffect(() => {
    texture.current = regl.texture({
      width: 1,
      height: 1,
      data: [0, 0, 0, 0],
    })

    lut.current = regl.texture()

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
      transpose: regl.prop('transpose'),
      nullValue: regl.prop('nullValue'),
    }

    if (mode === 'lut') {
      uniforms = {
        ...uniforms,
        lut: regl.prop('lut'),
        clim: regl.prop('clim'),
      }
    }

    draw.current = regl({
      vert: `
      #ifdef GL_FRAGMENT_PRECISION_HIGH
      precision highp float;
      #else
      precision mediump float;
      #endif
      attribute vec2 position;
      varying vec2 uv;
      void main() {
        uv = vec2(position.y, position.x);
        gl_Position = vec4(2.0 * position.x - 1.0, 2.0 * position.y - 1.0, 0.0, 1.0);
      }
      `,

      frag: `
      #ifdef GL_FRAGMENT_PRECISION_HIGH
      precision highp float;
      #else
      precision mediump float;
      #endif
      varying vec2 uv;
      uniform vec2 clim;
      uniform float viewportWidth;
      uniform float viewportHeight;
      uniform sampler2D texture;
      uniform float pixelRatio;
      uniform float scale;
      uniform vec2 translate;
      uniform bool transpose;
      uniform float nullValue;
      ${mode === 'lut' ? 'uniform sampler2D lut;' : ''}
      ${mode === 'lut' ? 'uniform vec3 nullColor;' : ''}

      const float pi = 3.14159265358979323846264;
      const float halfPi = pi * 0.5;
      const float twoPi = pi * 2.0;

      bool isnan(float val)
      {
        return ( val < 0.0 || 0.0 < val || val == 0.0 ) ? false : true;
      }

      ${projection.glsl.func}
      void main() {
        
        float width = viewportWidth / pixelRatio;
        float height = viewportHeight / pixelRatio;
        float x = gl_FragCoord.x / pixelRatio;
        float y = gl_FragCoord.y / pixelRatio;

        vec2 delta = vec2((1.0 + translate.x) * width / 2.0, (1.0 - translate.y) * height / 2.0);        

        x = (x - delta.x) / (scale * (width / (pi * 2.0)));
        ${
          transpose
            ? `y = (delta.y - y) / (scale * (width / (pi * 2.0)));`
            : `y = (y - delta.y) / (scale * (width / (pi * 2.0)));`
        }

        vec2 lookup = ${projection.glsl.name}(x, y);

        ${
          transpose
            ? `lookup = vec2((radians(lookup.x) + pi) / twoPi, (radians(lookup.y) + halfPi) / (pi));`
            : `lookup = vec2((radians(lookup.y) + halfPi) / (pi), (radians(lookup.x) + pi) / twoPi);`
        }

        vec4 value = texture2D(texture, lookup);
        
        ${
          mode === 'lut'
            ? `
          vec4 c;
          if (value.x == nullValue || isnan(value.x)) {
            gl_FragColor = vec4(0.0, 0.0, 0.0, 0.0);
          } else {
            float rescaled = (value.x - clim.x)/(clim.y - clim.x);
            c = texture2D(lut, vec2(rescaled, 1.0));  
            gl_FragColor = vec4(c.x, c.y, c.z, 1.0);
          }`
            : ''
        }

        ${
          mode === 'rgb'
            ? `
          if (value.x == nullValue) {
            gl_FragColor = vec4(0.0, 0.0, 0.0, 0.0);
          } else {
            gl_FragColor = vec4(value.x , value.y, value.z, 1.0);
          }
        `
            : ''
        }
      }
      `,

      attributes: {
        position: position,
      },

      uniforms: uniforms,

      count: 6,

      primitive: 'triangles',
    })

    regl.clear({
      color: [0, 0, 0, 0],
      depth: 1,
    })

    regl.frame((_context) => {
      context.current = _context
      if (!isRendering.current) {
        isRendering.current = true
      }
    })
  }, [])

  const redraw = (caller) => {
    if (draw.current && isLoaded.current && isRendering.current) {
      const { viewportWidth, viewportHeight, pixelRatio } = context.current
      draw.current({
        texture: texture.current,
        lut: lut.current,
        scale,
        translate,
        clim,
        nullValue,
        viewportWidth,
        viewportHeight,
        pixelRatio,
      })
    }
  }

  useEffect(() => {
    const ext = extname(source)

    // handle images
    if (['.png', '.jpg', '.jpeg'].includes(ext)) {
      const image = document.createElement('img')
      image.src = source
      image.crossOrigin = 'anonymous'
      image.onload = function () {
        setTimeout(() => {
          isLoaded.current = true
          texture.current(image)
          redraw('on image load')
        }, 0)
      }
    }

    // handle zarr groups and arrays
    if (ext === '.zarr') {
      if (variable) {
        zarr().loadGroup(source, (error, data, metadata) => {
          zarrGroupCache.current = data
          isLoaded.current = true
          texture.current(zarrGroupCache.current[variable])
          redraw('on zarr group load')
        })
      } else {
        zarr().load(source, (error, data) => {
          isLoaded.current = true
          texture.current(data)
          redraw('on zarr array load')
        })
      }
    }
  }, [source])

  useEffect(() => {
    // handle variable change on cached zarr group data
    if (zarrGroupCache.current) {
      texture.current(zarrGroupCache.current[variable])
      redraw('on variable change')
    }
  }, [variable])

  useEffect(() => {
    lut.current({
      data: colormap,
      format: 'rgb',
      shape: [255, 1],
    })
    redraw('on colormap change')
  }, [colormap])

  useEffect(() => {
    redraw('on prop change')
  }, [
    clim[0],
    clim[1],
    mode,
    scale,
    translate[0],
    translate[1],
    nullValue,
    projection,
  ])

  return null
}

export default Raster
