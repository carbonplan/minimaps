import React, {
  createContext,
  useState,
  useEffect,
  useContext,
  useRef,
} from 'react'
import _regl from 'regl'

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
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!container.current || !container.current?.style) return

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
      try {
        const canvas = document.createElement('canvas')
        const context =
          canvas.getContext('webgl') || canvas.getContext('experimental-webgl')
        if (!context) {
          throw new Error('WebGL is not supported in this browser.')
        }

        const requiredExtensions = [
          'OES_texture_float',
          'OES_element_index_uint',
        ]
        const missingExtensions = requiredExtensions.filter(
          (ext) => !context.getExtension(ext)
        )

        if (missingExtensions.length > 0) {
          console.error(`missing extensions: ${missingExtensions.join(', ')}`)
          throw new Error(
            `Required WebGL extensions not supported: ${missingExtensions.join(
              ', '
            )}`
          )
        }
        regl.current = _regl({
          container: container.current,
          extensions: requiredExtensions,
        })
        setReady(true)
      } catch (error) {
        setError("Your device doesn't support this figure")
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
      {error && <div style={{ textAlign: 'center' }}>{error}</div>}

      <div style={{ width: '100%', ...style }} ref={container} />
      {ready && children}
    </ReglContext.Provider>
  )
}

export default Regl
