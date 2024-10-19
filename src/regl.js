import React, {
  createContext,
  useState,
  useEffect,
  useContext,
  useRef,
} from 'react'
import _regl from 'regl'
import webgl2Compat from './webgl2-compat'

export const ReglContext = createContext(null)

export const useRegl = () => {
  return useContext(ReglContext)
}

const Regl = ({ style, aspect, children }) => {
  const regl = useRef()
  const container = useRef(null)
  const resize = useRef()
  const [ready, setReady] = useState(false)
  const [viewport, setViewport] = useState({ width: null, height: null })

  useEffect(() => {
    resize.current = () => {
      container.current.style.height =
        container.current.offsetWidth * aspect + 'px'

      setViewport({
        height: container.current.offsetWidth
          ? container.current.offsetWidth * aspect
          : container.current.style.height,
        width: container.current.offsetWidth,
      })
    }
    window.addEventListener('resize', resize.current)
    resize.current()

    if (!regl.current) {
      const requiredExtensions = ['OES_texture_float', 'OES_element_index_uint']

      try {
        const canvas = document.createElement('canvas')
        const context =
          canvas.getContext('webgl') || canvas.getContext('experimental-webgl')
        if (!context) {
          throw new Error('WebGL is not supported in this browser.')
        }
        const missingExtensions = requiredExtensions.filter(
          (ext) => !context.getExtension(ext)
        )
        canvas.remove()

        if (missingExtensions.length > 0) {
          console.log(
            'using webgl2 compat due to missing extensions: ',
            missingExtensions
          )
          regl.current = webgl2Compat.overrideContextType(() =>
            _regl({
              container: container.current,
              extensions: requiredExtensions,
            })
          )
        } else {
          regl.current = _regl({
            container: container.current,
            extensions: requiredExtensions,
          })
        }
        setReady(true)
      } catch (err) {
        console.error('Error initializing regl:', err)
        throw err
      }
    }

    return () => {
      window.removeEventListener('resize', resize.current)
    }
  }, [aspect])

  useEffect(() => {
    return () => {
      if (regl.current) regl.current.destroy()
      setReady(false)
    }
  }, [])

  return (
    <ReglContext.Provider
      value={{
        regl: regl.current,
        viewport,
      }}
    >
      <div style={{ width: '100%', ...style }} ref={container} />
      {ready && children}
    </ReglContext.Provider>
  )
}

export default Regl
