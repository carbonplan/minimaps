import React, { useState, useRef, createContext, useContext } from 'react'
import { projections } from './projections'
import Regl from './regl'

const MinimapContext = createContext(null)

export const useMinimap = () => {
  return useContext(MinimapContext)
}

const Minimap = ({ id, tabIndex, className, extensions, children, projection, style, aspect, scale, translate }) => {
	aspect = aspect || 0.5
	scale = scale || 1
	translate = translate || [0, 0]

	const projectionName = projection
	if (!projections.includes(projectionName)) {
		throw new Error(`projection '${projectionName}' not supported`)
	}

	let _projection = useRef()
	let _projectionInvert = useRef()
	const width = 800
	const height = aspect * width

	const [ready, setReady] = useState(false)

	import('d3-geo').then(m => {
		const name = 'geo' + projection.charAt(0).toUpperCase() + projection.slice(1)
		_projection.current = m[name]()
		_projection.current.scale(scale * (width / (2 * Math.PI)))
		_projection.current.translate([(1 + translate[0]) * width / 2, (1 + translate[1]) * height / 2])
		setReady(true)
		import('glsl-geo-projection').then(m2 => {
			_projectionInvert.current = m2[projection + 'Invert']
			setReady(true)
		})
	})

	return (
		<MinimapContext.Provider
			value={{
				projection: _projection.current,
				projectionInvert: _projectionInvert.current,
				projectionName: projectionName,
				translate: translate,
				scale: scale,
				aspect: aspect,
				width: width,
				height: height
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
	        extensions={extensions}
	        aspect={aspect}
	        style={{
	          pointerEvents: 'none',
	          zIndex: -1,
	        }}
	      >
	      	<svg
			      viewBox={`0 0 ${width} ${height}`}
			      style={{
			        position: 'absolute',
			        width: '100%',
			        top: 0,
			        left: 0,
			        overflow: 'hidden',
			        pointerEvents: 'none'
			      }}
			    >
	      	{ready && children}
	      	</svg>
	      </Regl>
	    </div>
    </MinimapContext.Provider>
	)
}

export default Minimap