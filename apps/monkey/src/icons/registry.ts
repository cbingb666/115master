/**
 * 图标注册表
 * - ion:<name>     委托给 @iconify/vue 渲染
 * - custom:<name>  动态加载 ./custom/<name>.vue
 */

export const I = {
  // === 动作 / 导航 ===
  RESTART: 'ion:refresh',
  SETTINGS: 'ion:settings-sharp',
  CLOSE: 'ion:close',
  RIGHT: 'ion:chevron-forward',
  LEFT: 'ion:chevron-back',
  MENU: 'ion:menu',
  COPY: 'ion:copy',
  DOWNLOAD: 'ion:download',
  DELETE: 'ion:trash',
  CANCEL: 'ion:close-circle',
  TOP: 'ion:pin',
  TOP_SOLID: 'ion:pin',
  MOVE: 'ion:folder-open',
  RENAME: 'ion:text',
  EXPORT: 'ion:cloud-upload',
  IMPORT: 'ion:cloud-download',
  VIEW: 'ion:eye',
  PREVIEW_OFF: 'ion:eye-off',
  PREVIEW_ON: 'ion:eye',
  PLUS: 'ion:add',
  RESET: 'ion:refresh',
  RESET_ALL: 'ion:refresh-circle',
  BACK_DIR: 'ion:arrow-back',
  EMPTY: 'ion:cube',

  // === 媒体控制 ===
  PLAY: 'ion:play',
  PAUSE: 'ion:pause',
  PREV: 'ion:play-skip-back',
  NEXT: 'ion:play-skip-forward',
  FAST_FORWARD: 'ion:play-forward',
  FAST_REWIND: 'ion:play-back',
  FULLSCREEN: 'ion:expand',
  FULLSCREEN_EXIT: 'ion:contract',
  VOLUME_OFF: 'ion:volume-off',
  VOLUME_MUTE: 'ion:volume-mute',
  VOLUME_DOWN: 'ion:volume-low',
  VOLUME_UP: 'ion:volume-high',
  PIP: 'ion:videocam',
  PIP_EXIT: 'ion:videocam-off',
  SUBTITLES: 'ion:chatbubbles',
  SUBTITLES_OFF: 'ion:chatbubbles-outline',

  // === 媒体显示 ===
  PLAYER_CORE: 'ion:code-slash',
  AUDIO_TRACK: 'ion:musical-notes',
  TRANSFORM: 'ion:resize',
  ROTATE_LEFT: 'ion:refresh',
  ROTATE_RIGHT: 'ion:refresh',
  ROTATE_NORMAL: 'ion:stop',
  ROTATE: 'ion:refresh',
  FLIP_X: 'custom:flip-x',
  FLIP_Y: 'custom:flip-y',
  LOCATION_ON: 'ion:locate',
  TIMER: 'ion:timer',
  PLAYBACK_RATE: 'ion:speedometer',
  STATISTICS_INFO: 'ion:analytics',
  SHORTCUTS: 'ion:keypad',
  ABOUT: 'ion:information-circle',
  COLOR_ADJUST: 'ion:color-palette',
  LOADING: 'ion:sync',
  ERROR: 'ion:alert-circle',

  // === 通知 / Toast ===
  TOAST_SUCCESS: 'ion:checkmark-circle',
  TOAST_ERROR: 'ion:alert-circle',
  TOAST_WARNING: 'ion:warning',
  TOAST_INFO: 'ion:information-circle',
  TOAST_CLOSE: 'ion:close',

  // === 主题 ===
  THEME_LIGHT: 'ion:sunny',
  THEME_DARK: 'ion:moon',
  THEME_SYSTEM: 'ion:contrast',

  // === 文件 ===
  ALL_FILE: 'custom:all-file',
  FILE_FOLDER: 'ion:folder',
  FILE_IMAGE: 'custom:image-file',
  FILE_IMPROVE: 'ion:arrow-up-circle',

  // === 品牌 ===
  GITHUB: 'ion:logo-github',
  SPONSOR: 'ion:cafe',

  // === 上下文 ===
  QA: 'ion:help-circle',
  STAR_FILL: 'custom:star-fill',
  STAR: 'custom:star',
  PLAYLIST: 'ion:list',

  // === 排序 ===
  SORT_HISTORY: 'ion:time',
  SORT_EDIT_CALENDAR: 'ion:calendar',
  SORT_SCHEDULE: 'ion:alarm',
  SORT_ALPHA: 'ion:text',
  SORT_DATABASE: 'ion:server',
} as const

export type IconValue = (typeof I)[keyof typeof I]
