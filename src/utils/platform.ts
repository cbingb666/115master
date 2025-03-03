import { GM_info } from "$";

export const isMac = GM_info.userAgentData.platform.match(/mac/i);
