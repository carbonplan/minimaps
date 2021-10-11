import React, { useState, useEffect, useRef } from 'react'
import { useRegl } from './regl'
import { useMinimap } from './minimap'

const Raster = ({
  source,
  mode = 'rgb',
  format,
  colormap,
  clim,
  nullValue,
}) => {
  const { regl } = useRegl()
  const { scale, translate, projection } = useMinimap()

  const draw = useRef()
  const texture = useRef()
  const lut = useRef()

  texture.current = regl.texture({
    width: 1,
    height: 1,
    data: [-999, -999, -999, 0],
  })
  lut.current = regl.texture()

  useEffect(() => {
    const image = document.createElement('img')
    image.src = source
    image.crossOrigin = 'anonymous'
    image.onload = function () {
      texture.current(image)
      draw.current({
        texture: texture.current,
        lut: lut.current,
        scale,
        translate,
        clim,
        nullValue,
      })
    }
  }, [source])

  useEffect(() => {
    const position = [
      0.0,
      0.0,
      0.0,
      1.0,
      1.0,
      0.0,
      1.0,
      0.0,
      0.0,
      1.0,
      1.0,
      1.0,
    ]

    const uniforms = {
      pixelRatio: regl.context('pixelRatio'),
      viewportWidth: regl.context('viewportWidth'),
      viewportHeight: regl.context('viewportHeight'),
      texture: regl.prop('texture'),
      scale: regl.prop('scale'),
      translate: regl.prop('translate'),
      transpose: regl.prop('transpose'),
    }

    if (mode === 'lut') {
      uniforms = {
        ...uniforms,
        lut: regl.prop('lut'),
        clim: regl.prop('clim'),
        nullValue: regl.prop('nullValue'),
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
		  ${mode === 'lut' ? 'uniform sampler2D lut;' : ''}
		  ${mode === 'lut' ? 'uniform float nullValue;' : ''}
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

		  	vec2 delta = vec2((1.0 + translate.x) * width / 2.0, (1.0 + translate.y) * height / 2.0);

		  	x = (x - delta.x) / (scale * (width / (pi * 2.0)));
		  	y = (delta.y - y) / (scale * (width / (pi * 2.0)));

		  	vec2 lookup = ${projection.glsl.name}(x, y);

		  	lookup = vec2((radians(lookup.x) + pi) / twoPi, (radians(lookup.y) + halfPi) / (pi));

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
		  		if (value.x == -999.0) {
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
  }, [])

  useEffect(() => {
    // const lut = regl.texture({
    //    data: useColormap(colormap),
    //    format: 'rgb',
    //    shape: [255, 1],
    //  })
    draw.current({
      texture: texture.current,
      lut: lut.current,
      scale,
      translate,
      clim,
      nullValue,
    })
  }, [clim, mode, scale, translate, clim, colormap, nullValue])

  return null
}

export default Raster
