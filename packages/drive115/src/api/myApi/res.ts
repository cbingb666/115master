type ResBase<T> = {
  state: boolean
  code: number
  errNo: number
  error: string
  error_msg: string
} & T

export type UserAq = ResBase<{
  data: {
    /** 用户 ID */
    uid: number
    /** 用户名 */
    uname: string
    /** 性别: 男/女 */
    gender: string
    /** 出生地 */
    location_birth: string
    /** 所在地 */
    location: string
    /** 血型 */
    blood_type: string
    /** 生日 */
    birthday: string
    /** 会员 */
    vip: {
      /** 是否是会员 */
      is_vip: boolean
      /** 是否是全球会员 */
      is_global_vip: boolean
      /** 是否是永久会员 */
      is_forever: boolean
      /** 是否是会员 */
      vip: boolean
      /** 描述 */
      desc: string
      /** 过期时间 */
      expire: string
      /** 过期时间字符串 */
      expire_str: string
      mark: number
      mark3: number
    }
    /** 头像 */
    face: {
      /** 大头像 */
      face_l: string
      /** 中头像 */
      face_m: string
      /** 小头像 */
      face_s: string
    }
    lianghao: 0
    daren: 0
    level: {
      rank: 0
      space_rank: 1
      rank_score: 0
    }
  }
}>
