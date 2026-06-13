import { describe, expect, it } from 'vitest'
import {
  APS_HOST_115,
  CDN_FILE_HOST_115,
  DL_HOST_115,
  MY_HOST_115,
  NORMAL_HOST_115,
  PRO_API_HOST_115,
  VOD_HOST_115,
  WEB_API_HOST_115,
} from '../../constants/urls.ts'

describe('urls', () => {
  it('uses correct 115 host names', () => {
    expect(NORMAL_HOST_115).toBe('115.com')
    expect(MY_HOST_115).toBe('my.115.com')
    expect(WEB_API_HOST_115).toBe('webapi.115.com')
    expect(PRO_API_HOST_115).toBe('proapi.115.com')
    expect(VOD_HOST_115).toBe('115vod.com')
    expect(APS_HOST_115).toBe('aps.115.com')
    expect(DL_HOST_115).toBe('dl.115cdn.net')
    expect(CDN_FILE_HOST_115).toBe('cdnfhnfile.115cdn.net')
  })
})
