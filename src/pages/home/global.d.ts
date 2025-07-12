/**
 * 115 公共字段
 */
declare interface Fields115 {
  /**
   * 区域id
   * 1 正常，7 删除(回收站)，120 彻底删除
   * @see https://www.yuque.com/115yun/open/kz9ft9a7s57ep868
   */
  aid: number
  /**
   * 目录id
   * 0 根目录
   */
  cid: number
  /** 未知 */
  snap: number
  /** 未知 */
  special_order: number
  /** 分页偏移量 */
  offset: number
  /** 分页大小 */
  limit: number
}

/**
 * 115 主页根路径搜索参数
 */
export declare interface TopRootSearchParams {
  /** 目录id */
  cid?: Fields115['cid']
  /** 页偏移量 */
  offset?: Fields115['offset']
  /** 未知 */
  tab?: string
  /** 模式 */
  mode?: 'wangpan' | 'search'
}

/**
 * 115 文件列表请求参数
 * @see https://cdnres.115.com/site/static/js/wl_disk2014/min/main-wl-2014-min.js?_vh=0d1ef7d_88
 */
export declare interface FileMainReInstanceSetting {
  /** 未知 */
  aid: Fields115['aid']
  /** 目录id */
  cid: Fields115['cid']
  /** 排序 */
  o: 'user_ptime' | string
  /** 排序方向 */
  asc: '0' | '1'
  /** 页偏移量 */
  offset: Fields115['offset']
  /** 是否显示目录 */
  show_dir: 1
  /** 页大小 */
  limit: Fields115['limit']
  /** 未知 */
  code: string
  /** 未知 */
  scid: string
  /** 未知 */
  snap: number
  /** 未知 */
  natsort: 1
  /** 是否要记录文件夹的打开时间：1：是；0：否 */
  record_open_time: 1
  /** 是否统计文件夹数量 */
  count_folders: 1
  /** 未知 */
  type: unknown
}

/**
 * 115 Main sdk 配置
 * @see https://cdnres.115.com/site/static/js/wl_disk2014/min/main-wl-2014-min.js?_vh=0d1ef7d_88
 */
declare interface MainConfig {
  /**
   * "#js_cantain_box"
   */
  ContainBox: string
  /**
   * "[rel="page_local"]"
   */
  Local: string
  /**
   * "[rel="list_page_local"]"
   */
  ListLocal: string
  /**
   * "#js_back_button"
   */
  BackBTN: string
  /**
   * "#js_data_list_outer"
   */
  DataListOuter: string
  /**
   * "#js_data_list"
   */
  DataListBox: string
  /**
   * "#js_top_bar_box"
   */
  TopBarBox: string
  /**
   * "#js_file_mark_box"
   */
  MarkBox: string
  /**
   * "#js_no_file_box"
   */
  NoFileBox: string
  /**
   * "#js_default_title_box"
   */
  DetaultTitleBox: string
  /**
   * "#js_pagination_box"
   */
  PagintionBox: string
  /**
   * "#js_sort_menu"
   */
  SortMenu: string
  /**
   * "#js_file_sort_check_warp"
   */
  FileSortCheckWrap: string
  /**
   * "#js_filter_box"
   */
  FilterBox: string
  /**
   * "#js_top_panel_box"
   */
  TopPanelBox: string
  /**
   * "#js_panel_guide"
   */
  TopGuidPanel: string
  /**
   * "#js_hidefile_box"
   */
  HideFileBox: string
  /**
   * "#js_operate_box"
   */
  OPMenuBox: string
  /**
   * "#js_paste_btn"
   */
  PasteMenuBox: string
  /**
   * "#js_upload_btn"
   */
  UploadBTN: string
  /**
   * "#js_cal_filter_btn"
   */
  CalFilterBtn: string
  /**
   * "#js_task_pupup_content"
   */
  TaskBox: string
  /**
   * "#js_task_pupup_btn"
   */
  TaskBtn: string
  /**
   * "#js_starlist_guide_title"
   */
  StarListGuideTitle: string
  /**
   * "#js_top_header_file_path_box"
   */
  TopHeaderFilePathBox: string
  /**
   * "#js-panel_model_switch"
   */
  PanelModeSwitch: string
  /**
   * "[rel=js_selected_file_desc]"
   */
  SelectedFileDesc: string
}

/**
 * 115 Main sdk 类型定义
 * @see https://cdnres.115.com/site/static/js/wl_disk2014/min/main-wl-2014-min.js?_vh=0d1ef7d_88
 */
declare interface Main {
  /** 配置 */
  CONFIG: MainConfig

  /**
   * 跳转目录
   */
  GotoDir: (
    aid: Fields115['aid'],
    cid: Fields115['cid'],
    snap: Fields115['snap'],
    special_order?: Fields115['special_order'],
  ) => void
}

declare global {
  interface Window {
    Main: Main
    FileMainReInstanceSetting: FileMainReInstanceSetting
  }
}
