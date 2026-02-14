import { MASTER_BASE_URL } from '.'
import { DL_HOST_155, NORMAL_HOST_155 } from './115'

const ROUTE_MATCH = {
  HOME: `*://${NORMAL_HOST_155}/?*`,
  MASTER: `${MASTER_BASE_URL}*`,
  MAGNET: `${MASTER_BASE_URL}/magnet/*`,
  VIDEO: `${MASTER_BASE_URL}/video/*`,
  VIDEO_TOKEN: `*://${DL_HOST_155}/video/token`,
}

export default ROUTE_MATCH
