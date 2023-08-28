import { geoEquirectangular } from 'd3-geo'
import { equirectangularInvert, equirectangular } from 'glsl-geo-projection'

export default function () {
  const projection = geoEquirectangular().precision(0.1)
  projection.glsl = {
    name: 'equirectangularInvert',
    func: equirectangularInvert,
    nameForward: 'equirectangular',
    funcForward: equirectangular
  }
  projection.id = 'equirectangular'
  return projection
}
