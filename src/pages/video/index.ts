import { createApp } from "vue";
import Video from "./index.vue";

const resetDocument = () => {
	document.body.style.backgroundColor = "#000";
	document.body.style.margin = "0";
	document.body.innerHTML = `<div id="app"></div>`;
	document.body.title = "";
	const favicon = document.createElement("link");
	favicon.id = "favicon";
	favicon.rel = "icon";
	favicon.href = "https://115.com/favicon.ico";
	document.head.appendChild(favicon);

	const materialIconLink =
		"https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded";
	const materialIcon = document.createElement("link");
	materialIcon.rel = "stylesheet";
	materialIcon.href = materialIconLink;
	document.head.appendChild(materialIcon);
};

export const videoPage = () => {
	resetDocument();
	createApp(Video).mount("#app");
};
