import { geoNaturalEarth1 } from 'd3-geo'
import { naturalEarth1, naturalEarth1Invert } from 'glsl-geo-projection'

export default function () {
  const projection = geoNaturalEarth1().precision(0.1)
  projection.glsl = { 
    name: 'naturalEarth1Invert',
    func: naturalEarth1Invert, 
    nameForward: 'naturalEarth1',
    funcForward: naturalEarth1,  
  }
  projection.id = 'naturalEarth1'
  return projection
}
