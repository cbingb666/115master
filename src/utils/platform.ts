import { GM_info } from "$";

export const isMac = () => {
	return GM_info.userAgentData.platform.match(/mac/i);
};
