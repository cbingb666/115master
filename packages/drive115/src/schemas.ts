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

/** 文件项 */
export const FilesItemSchema = z.object({
  fid: z.string(),
  uid: z.number(),
  aid: z.number(),
  cid: z.string(),
  n: z.string(),
  s: z.number(),
  t: z.string(),
  te: z.string(),
  ico: z.string(),
  sha: z.string(),
  pc: z.string().optional(),
  msta: z.number().optional(),
  fdes: z.string().optional(),
  is_v: z.number().optional(),
  is_m: z.number().optional(),
}).passthrough()

/** 文件列表响应 */
export const FilesResponseSchema = z.object({
  state: z.boolean(),
  errNo: z.number().optional(),
  code: z.number().optional(),
  error: z.string().optional(),
  error_msg: z.string().optional(),
  count: z.number().optional(),
  file_count: z.number().optional(),
  folder_count: z.number().optional(),
  is_asc: z.number().optional(),
  order: z.string().optional(),
  fc_mix: z.number().optional(),
  offset: z.number().optional(),
  cur: z.number().optional(),
  data: z.array(FilesItemSchema).optional(),
  path: z.array(z.unknown()).optional(),
}).passthrough()

/** Pro 下载响应 */
export const ProFilesAppChromeDownurlSchema = z.object({
  state: z.boolean(),
  data: z.string(),
  code: z.number().optional(),
  error: z.string().optional(),
  error_msg: z.string().optional(),
}).passthrough()
