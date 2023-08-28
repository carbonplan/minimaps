import { geoOrthographic } from 'd3-geo'
import { orthographicInvert, orthographic } from 'glsl-geo-projection'

export default function () {
  const projection = geoOrthographic().precision(0.1)
  projection.glsl = {
    name: 'orthographicInvert',
    func: orthographicInvert,
    nameForward: 'orthographic',
    funcForward: orthographic,
  }
  projection.id = 'orthographic'
  return projection
}
