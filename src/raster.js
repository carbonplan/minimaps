import React, { useEffect } from 'react'
import { useRegl } from './regl'
import { useMinimap } from './minimap'

const Raster = ({ data, colormap, clim, nullValue }) => {
	const { regl } = useRegl()

	const { scale, translate, projectionName, projectionInvert } = useMinimap()

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

		const colormapTexture = regl.texture({
	    data: colormap,
	    format: 'rgb',
	    shape: [255, 1],
	  })

	  const texture = regl.texture()

	  texture(data['biomass'].pick(0, null, null))

		const draw = regl({
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
		  uniform sampler2D colormap;
		  uniform float nullValue;
		  uniform vec3 nullColor;

		  const float pi = 3.14159265358979323846264;
			const float halfPi = pi * 0.5;
			const float twoPi = pi * 2.0;

		  ${projectionInvert}
		  void main() {
		  	
		  	float width = viewportWidth / pixelRatio;
		  	float height = viewportHeight / pixelRatio;
		  	float x = gl_FragCoord.x / pixelRatio;
		  	float y = gl_FragCoord.y / pixelRatio;

		  	vec2 delta = vec2((1.0 + translate.x) * width / 2.0, (1.0 + translate.y) * height / 2.0);

		  	x = (x - delta.x) / (scale * (width / (pi * 2.0)));
		  	y = (delta.y - (height - y)) / (scale * (width / (pi * 2.0)));

		  	vec2 lookup = ${projectionName}Invert(x, y);

		  	lookup = vec2((radians(lookup.y) + halfPi - radians(30.0)) / (pi - radians(30.0 + 10.0)), (radians(lookup.x) + pi) / twoPi);

		  	float value = texture2D(texture, lookup).x;
		  	
		  	vec4 c;

		  	if (value == nullValue) {
		  		gl_FragColor = vec4(0.0, 0.0, 0.0, 0.0);
		  	} else {
		  		float rescaled = (value - clim.x)/(clim.y - clim.x);
		  		c = texture2D(colormap, vec2(rescaled, 1.0));  
		  		gl_FragColor = vec4(c.x, c.y, c.z, 1.0);
		  	}
		  }
			`,

			attributes: {
				position: regl.prop('position'),
				
			},

			uniforms: {
				clim: regl.prop('clim'),
				texture: regl.prop('texture'),
				pixelRatio: regl.context('pixelRatio'),
				viewportWidth: regl.context('viewportWidth'),
        viewportHeight: regl.context('viewportHeight'),
        scale: regl.prop('scale'),
        translate: regl.prop('translate'),
        colormap: regl.prop('colormap'),
        nullValue: regl.prop('nullValue'),
			},

			count: 6,

			primitive: 'triangles'
		})

		regl.clear({
      color: [0, 0, 0, 0],
      depth: 1,
    })
		
		draw({
			position: position, 
			texture: texture, 
			scale: scale, 
			translate: translate,
			colormap: colormapTexture,
			clim: clim,
			nullValue: nullValue,
		})

		regl.frame(() => {
			draw({
				position: position, 
				texture: texture, 
				scale: scale, 
				translate: translate,
				colormap: colormapTexture,
				clim: clim,
				nullValue: nullValue,
			})
		})
	}, [])

	return null
}

export default Raster