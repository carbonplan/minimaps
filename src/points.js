import React, { useState, useEffect, useRef } from 'react'
import { useRegl } from './regl'
import { useMinimap } from './minimap'

const Points = ({
  position,
  value,
  pointSize = 5,
  opacity = 1,
  colormap = null,
  clim = null,
  mode = 'lut'
}) => {
  const { viewport, regl } = useRegl()
  const { scale, translate, projection } = useMinimap()

  const redraw = useRef()
  const draw = useRef()
  const context = useRef({})
  const lut = useRef()
  const invalidated = useRef(null)

  if (mode == 'lut' && !colormap) {
    throw new Error("must provide 'colormap' when using 'lut' mode")
  }

  if (mode == 'lut' && !clim) {
    throw new Error("must provide 'clim' when using 'lut' mode")
  }

  useEffect(() => {
    regl.frame((_context) => {
      context.current = _context

      if (invalidated.current) {
        regl.clear({
          color: [0, 0, 0, 0],
          depth: 1,
        })

        redraw.current(invalidated.current)
      }
      invalidated.current = null
    })
  }, [])

  useEffect(() => {
    lut.current ||= regl.texture()

    let uniforms = {
      pixelRatio: regl.prop('pixelRatio'),
      viewportWidth: regl.prop('viewportWidth'),
      viewportHeight: regl.prop('viewportHeight'),
      bounds: regl.prop('bounds'),
      scale: regl.prop('scale'),
      translate: regl.prop('translate'),
      pointSize: regl.prop('pointSize'),
      opacity: regl.prop('opacity')
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
      attribute float value;
      uniform float scale;
      uniform vec2 translate;
      uniform float pointSize;
      const float pi = 3.14159265358979323846264;
      const float halfPi = pi * 0.5;
      varying float valuev;

      ${projection.glsl.funcForward}
      void main() {
        valuev = value;
        vec2 location = ${projection.glsl.nameForward}(position.x, position.y);
        gl_PointSize = pointSize;
        gl_Position = vec4(location.x * scale / (halfPi * 2.0) + translate.x, location.y * scale / halfPi - translate.y, 0.0, 1.0);
      }
      `,

      frag: `
      #ifdef GL_FRAGMENT_PRECISION_HIGH
      precision highp float;
      #else
      precision mediump float;
      #endif
      uniform vec2 clim;
      uniform sampler2D lut;
      uniform float opacity;
      varying float valuev;
      
      void main() {
        if (length(gl_PointCoord.xy - 0.5) > 0.5) {
          discard;
        }

        float rescaled = (valuev - clim.x)/(clim.y - clim.x);
        vec4 c = texture2D(lut, vec2(rescaled, 1.0));
        gl_FragColor = vec4(c.x, c.y, c.z, 1.0) * opacity;
      }
      `,

      attributes: {
        position: regl.prop('position'),
        value: regl.prop('value'),
      },

      uniforms: uniforms,

      count: position.length,

      primitive: 'points',

      depth: { enable: false },

      blend: {
        enable: true,
        func: {
          srcRGB: 'one',
          srcAlpha: 'one',
          dstRGB: 'one minus src alpha',
          dstAlpha: 'one minus src alpha',
        },
      },
    })
  }, [projection.glsl.name])

  redraw.current = (invalidatedBy) => {
    if (draw.current) {
      const { pixelRatio } = context.current
      draw.current({
        bounds: [-90, 90, -180, 180],
        lut: lut.current,
        position,
        value,
        scale,
        clim,
        translate,
        pointSize,
        opacity,
        viewportWidth: viewport.width * pixelRatio,
        viewportHeight: viewport.height * pixelRatio,
        pixelRatio,
      })
    }
  }

  useEffect(() => {
    invalidated.current = 'on viewport change'
  }, [viewport])

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
    invalidated.current = 'on prop change'
  }, [
    position,
    value,
    projection,
    scale,
    pointSize,
    opacity,
    clim && clim[0],
    clim && clim[1],
    translate[0],
    translate[1],
  ])

  return null
}

export default Points
