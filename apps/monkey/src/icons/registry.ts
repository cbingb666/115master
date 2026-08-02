/**
 * 图标注册表
 * - ion:<name>     委托给 @iconify/vue 渲染
 * - custom:<name>  动态加载 ./custom/<name>.svg
 */

export const I = {
  // === 动作 / 导航 ===
  RESTART: 'ion:refresh',
  SETTINGS: 'ion:settings',
  ACCOUNT: 'ion:person-circle-outline',
  LOGOUT: 'ion:log-out-outline',
  CLOSE: 'ion:close',
  RIGHT: 'ion:chevron-forward',
  LEFT: 'ion:chevron-back',
  MENU: 'ion:menu',
  COPY: 'ion:copy',
  DOWNLOAD: 'ion:download',
  DELETE: 'ion:trash-outline',
  CANCEL: 'ion:close-circle',
  TOP: 'ion:pin-outline',
  TOP_SOLID: 'ion:pin',
  MOVE: 'ion:arrow-forward',
  RENAME: 'ion:create-outline',
  EXPORT: 'ion:exit',
  IMPORT: 'ion:enter',
  VIEW: 'ion:eye',
  PREVIEW_OFF: 'ion:eye-off',
  PREVIEW_ON: 'ion:eye',
  PLUS: 'ion:add',
  RESET: 'ion:refresh',
  RESET_ALL: 'ion:refresh-circle',
  BACK_DIR: 'ion:arrow-back',
  CHEVRON_DOWN: 'ion:caret-down-circle-outline',
  EMPTY: 'ion:cube',

  // === 媒体控制 ===
  PLAY: 'ion:play',
  PAUSE: 'ion:pause',
  PREV: 'ion:play-back',
  NEXT: 'ion:play-forward',
  FAST_FORWARD: 'ion:caret-forward',
  FAST_REWIND: 'ion:caret-back',
  FULLSCREEN: 'ion:expand',
  FULLSCREEN_EXIT: 'ion:contract',
  VOLUME_OFF: 'ion:volume-off',
  VOLUME_MUTE: 'ion:volume-mute',
  VOLUME_DOWN: 'ion:volume-low',
  VOLUME_UP: 'ion:volume-high',
  PIP: 'ion:arrow-down-right-box',
  PIP_EXIT: 'ion:arrow-up-left-box',
  SUBTITLES: 'ion:logo-closed-captioning',
  SUBTITLES_OFF: 'ion:logo-closed-captioning',
  PLAYLIST: 'ion:list',

  // === 媒体显示 ===
  PLAYER_CORE: 'ion:code-slash',
  AUDIO_TRACK: 'ion:musical-note',
  TRANSFORM: 'ion:repeat',
  ROTATE_LEFT: 'ion:arrow-undo',
  ROTATE_RIGHT: 'ion:arrow-redo',
  ROTATE_NORMAL: 'ion:remove-circle',
  ROTATE: 'ion:refresh',
  FLIP_X: 'ion:swap-horizontal-outline',
  FLIP_Y: 'ion:swap-vertical-outline',
  LOCATION_ON: 'ion:locate',
  TIMER: 'ion:timer',
  PLAYBACK_RATE: 'ion:speedometer',
  STATISTICS_INFO: 'ion:stats-chart',
  SHORTCUTS: 'ion:keypad',
  ABOUT: 'ion:information-circle',
  COLOR_ADJUST: 'ion:color-palette',
  LOADING: 'ion:sync',
  ERROR: 'ion:bug-outline',
  AUTO_LOAD: 'ion:sync',
  ROCKET_LAUNCH: 'ion:rocket',
  MORE: 'ion:ellipsis-vertical',
  EXTENSION: 'ion:extension-puzzle',
  WINDOW: 'ion:desktop',
  QUALITY: 'ion:disc',
  ARROW_UP: 'ion:arrow-up',
  ARROW_DOWN: 'ion:arrow-down',
  SORT: 'ion:options',
  BACK_DIR_ARROW: 'ion:arrow-back-circle',

  // === 通知 / Toast ===
  TOAST_SUCCESS: 'ion:checkmark-circle',
  TOAST_ERROR: 'ion:bug-outline',
  TOAST_WARNING: 'ion:warning',
  TOAST_INFO: 'ion:information-circle',
  TOAST_CLOSE: 'ion:close',

  // === 主题 ===
  THEME_LIGHT: 'ion:sunny',
  THEME_DARK: 'ion:moon',
  THEME_SYSTEM: 'ion:contrast',

  // === 文件 ===
  ALL_FILE: 'ion:file-tray-full-outline',
  FILE_FOLDER: 'custom:folder',
  FILE_IMAGE: 'custom:image-file',
  FILE_VIDEO: 'ion:film',
  FILE_IMPROVE: 'ion:arrow-up',

  // === 标签 ===
  TAG: 'ion:pricetags-outline',
  SELECT_ALL: 'ion:checkmark-done-outline',
  INVERT: 'ion:swap-vertical-outline',

  // === 品牌 ===
  GITHUB: 'ion:logo-github',
  SPONSOR: 'ion:cafe',

  // === 通用 ===
  SEARCH: 'ion:search-outline',
  HISTORY: 'ion:time-outline',
  GRID: 'ion:grid-outline',
  LIST: 'ion:list-outline',
  NEW_FOLDER: 'ion:folder-open-outline',
  DOCUMENT: 'ion:document-text-outline',
  STAR_RATING: 'ion:star',
  UPLOAD: 'ion:cloud-upload',
  ADD_LINK: 'ion:link',
  FLASK: 'ion:flask',
  FILE_UPLOAD: 'ion:cloud-upload',

  // === 上下文 ===
  QA: 'ion:help-circle',
  STAR_FILL: 'ion:star',
  STAR: 'ion:star-outline',

  // === 排序 ===
  SORT_HISTORY: 'ion:document-outline',
  SORT_EDIT_CALENDAR: 'ion:create-outline',
  SORT_SCHEDULE: 'ion:open-outline',
  SORT_ALPHA: 'ion:text-outline',
  SORT_DATABASE: 'ion:server-outline',
} as const

export type IconValue = (typeof I)[keyof typeof I]
