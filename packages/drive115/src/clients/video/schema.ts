import { z } from 'zod'

/** 下载结果 */
export const DownloadResultSchema = z.object({
  url: z.object({
    url: z.string(),
    auth_cookie: z.object({
      expire: z.string(),
      name: z.string(),
      path: z.string(),
      value: z.string(),
    }).optional(),
  }),
})

/** Pro 下载响应 */
export const ProFilesAppChromeDownurlSchema = z.object({
  state: z.boolean(),
  data: z.string(),
  code: z.number().optional(),
  error: z.string().optional(),
  error_msg: z.string().optional(),
}).passthrough()
