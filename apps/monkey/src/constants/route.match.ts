import { CONSTANT } from '@115master/drive115'
import { MASTER_BASE_URL } from '.'

const ROUTE_MATCH = {
  HOME: `*://${CONSTANT.HOST_115.NORMAL}/?*`,
  MASTER: `${MASTER_BASE_URL}*`,
  MAGNET: `${MASTER_BASE_URL}/magnet/*`,
  VIDEO: `${MASTER_BASE_URL}/video/*`,
  VIDEO_TOKEN: `*://${CONSTANT.HOST_115.DL}/video/token`,
}

export default ROUTE_MATCH
