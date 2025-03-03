/**
 * 使用 shortcuts 打开 mpv 播放网页
 * 保留备份
 * @param url
 * @returns
 */
export const webLinkShortcutsMpv = (url: string) => {
	const shell = {
		bin: "/opt/homebrew/bin/mpv",
		url,
		userAgent: navigator.userAgent,
	};
	return `shortcuts://run-shortcut?name=115MasterWebLink&input=text&text=${encodeURIComponent(
		JSON.stringify(shell),
	)}`;
};

/**
 * 使用 iina 打开网页
 * @param url
 * @returns
 */
export const webLinkIINA = (url: string) => {
	return `iina://weblink?url=${encodeURIComponent(url)}&mpv_http-header-fields=${encodeURIComponent(
		`User-Agent: ${navigator.userAgent.replace(",", "\\,")}`,
	)}`;
};
