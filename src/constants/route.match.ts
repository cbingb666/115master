import { DL_HOST_155, NORMAL_HOST_155 } from './115'

const ROUTE_MATCH = {
  HOME: `*://${NORMAL_HOST_155}/?*`,
  VIDEO: `*://${NORMAL_HOST_155}/web/lixian/master/video/*`,
  MAGNET: `*://${NORMAL_HOST_155}/web/lixian/master/magnet/*`,
  VIDEO_TOKEN: `*://${DL_HOST_155}/video/token`,
}

export default ROUTE_MATCH
