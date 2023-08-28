import { geoMercator } from 'd3-geo'
import { mercatorInvert, mercator } from 'glsl-geo-projection'

export default function () {
  const projection = geoMercator().precision(0.1)
  projection.glsl = {
    name: 'mercatorInvert',
    func: mercatorInvert,
    nameForward: 'mercator',
    funcForward: mercator,
  }
  projection.id = 'mercator'
  return projection
}
