import { isMac } from "../../../utils/platform";

export const useWeblink = () => {
	const IS_MAC = isMac();

	const play = async ({ url, cookie }: { url: string; cookie: string }) => {
		if (IS_MAC) {
			const shell = {
				bin: "/opt/homebrew/bin/mpv",
				url,
				referer: "https://dl.115cdn.net/",
				userAgent:
					"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36 115Browser/27.0.6.3",
				cookie,
			};
			window.open(
				`shortcuts://run-shortcut?name=115MasterWebLink&input=text&text=${encodeURIComponent(
					JSON.stringify(shell),
				)}`,
				"_blank",
			);

			// const shell = {
			// 	bin: "/opt/homebrew/bin/iina",
			// 	url,
			// 	referer: "https://dl.115cdn.net/",
			// 	userAgent:
			// 		"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36 115Browser/27.0.6.3",
			// 	cookie,
			// };
			// window.open(
			// 	`shortcuts://run-shortcut?name=115MasterWebLinkIINA&input=text&text=${encodeURIComponent(
			// 		JSON.stringify(shell),
			// 	)}`,
			// 	"_blank",
			// );
		} else {
			alert("该功能目前仅支持 Mac 系统");
			return undefined;
		}
	};

	return {
		play,
	};
};
