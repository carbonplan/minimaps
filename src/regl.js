import React, {
  createContext,
  useCallback,
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
  const [ready, setReady] = useState(false)

  const ref = useCallback(
    (node) => {
      if (node !== null) {
        const resize = () => {
          node.style.height = node.offsetWidth * aspect + 'px'
        }
        window.addEventListener('resize', () => {
          resize()
        })
        resize()
        console.log('creating context')
        regl.current = _regl({
          container: node,
          extensions: ['OES_texture_float', 'OES_element_index_uint'],
        })
        setReady(true)
      }
    },
    [aspect]
  )

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
      }}
    >
      <div style={{ width: '100%', ...style }} ref={ref} />
      {ready && children}
    </ReglContext.Provider>
  )
}

export default Regl
