import { z } from 'zod'

/** 标签项 schema */
export const LabelInfoSchema = z.object({
  id: z.string(),
  name: z.string(),
  sort: z.union([z.string(), z.number()]).optional(),
  color: z.string().optional().default(''),
  update_time: z.number().optional().default(0),
  create_time: z.number().optional().default(0),
}).passthrough()

/** 标签列表 schema */
export const LabelsSchema = z.object({
  state: z.boolean(),
  errNo: z.number().optional(),
  code: z.number().optional(),
  error: z.string().optional(),
  error_msg: z.string().optional(),
  total: z.number().optional(),
  list: z.array(LabelInfoSchema).optional().default([]),
  sort: z.string().optional(),
  order: z.string().optional(),
}).passthrough()

/** 创建标签响应 schema（数组） */
export const LabelsAddSchema = z.object({
  state: z.boolean(),
  errNo: z.number().optional(),
  code: z.number().optional(),
  error: z.string().optional(),
  error_msg: z.string().optional(),
  data: z.array(LabelInfoSchema).optional().default([]),
}).passthrough()
