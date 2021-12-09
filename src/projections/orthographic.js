import { geoOrthographic } from 'd3-geo'
import { orthographicInvert } from 'glsl-geo-projection'

const projection = geoOrthographic().precision(0.1)
projection.glsl = { func: orthographicInvert, name: 'orthographicInvert' }
projection.id = 'orthographic'

export default projection
