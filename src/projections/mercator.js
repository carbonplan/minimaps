import { geoMercator } from 'd3-geo'
import { mercatorInvert } from 'glsl-geo-projection'

const projection = geoMercator().precision(0.1)
projection.glsl = { func: mercatorInvert, name: 'mercatorInvert' }
projection.id = 'mercator'

export default projection