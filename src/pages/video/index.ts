import { createApp } from "vue";
import Video from "./index.vue";

const resetDocument = () => {
	document.body.style.backgroundColor = "#000";
	document.body.style.margin = "0";
	document.body.innerHTML = `<div id="app"></div>`;
	document.title = "";
};

export const videoPage = () => {
	resetDocument();
	createApp(Video).mount("#app");
};
