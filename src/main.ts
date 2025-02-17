debugInfo.bootstrapInfo();

import { minimatch } from "minimatch";
import ROUTE_MATCH from "./constants/route.match";
import HomePage from "./pages/home/index";
import { videoPage } from "./pages/video";
import "./style.css";
import { checkUserAgent } from "./utils/checkUserAgent";
import { debugInfo } from "./utils/debugInfo";

checkUserAgent();

const main = () => {
	if (minimatch(window.location.href, ROUTE_MATCH.HOME)) {
		new HomePage();
	}

	if (minimatch(window.location.href, ROUTE_MATCH.DPLAYER)) {
		videoPage();
	}
};

if (
	document.readyState === "complete" ||
	document.readyState === "interactive"
) {
	main();
} else {
	window.addEventListener("DOMContentLoaded", main);
}
