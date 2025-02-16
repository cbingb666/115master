import vue from "@vitejs/plugin-vue";
import { defineConfig } from "vite";
import monkey, { cdn, util } from "vite-plugin-monkey";

const icons = {
	prod: "https://115.com/favicon.ico",
	dev: "https://vitejs.dev/logo.svg",
};

const isProd = process.env.NODE_ENV === "production";

// https://vitejs.dev/config/
export default defineConfig({
	plugins: [
		vue(),
		monkey({
			entry: "src/main.ts",
			userscript: {
				name: "115Master",
				icon: isProd ? icons.prod : icons.dev,
				namespace: "115Master",
				homepage: "https://github.com/cbingb666/115master",
				author: "cbingb666",
				description:
					"115网盘魔法优化: 画质增强 | 视频缩略图 | 在线字幕 | 内置 Jav 信息",
				supportURL: "https://github.com/cbingb666/115master/issues",
				"run-at": "document-start",
				include: ["https://115.com/?ct*", "https://dl.115cdn.net/fuckkk/*"],
				exclude: [
					"https://*.115.com/bridge*",
					"https://*.115.com/static*",
					"https://q.115.com/*",
				],
				// 自动允许脚本跨域访问的域名
				connect: [
					"115.com",
					"webapi.115.com",
					"proapi.115.com",
					"cdnfhnfile.115cdn.net",
					"v.anxia.com",
					"dl.115cdn.net",
					"115vod.com",
					"subtitlecat.com",
					"javbus.com",
					"javdb.com",
					"jdbstatic.com",
				],
				resource: {
					icon: "https://115.com/favicon.ico",
				},
				downloadURL:
					"https://github.com/cbingb666/115master/releases/latest/download/115master.user.js",
				updateURL:
					"https://github.com/cbingb666/115master/releases/latest/download/115master.meta.js",
			},

			build: {
				fileName: "115master.user.js",
				metaFileName: "115master.meta.js",
				externalGlobals: {
					"hls.js": cdn.jsdelivr("Hls", "dist/hls.min.js"),
					photoswipe: cdn
						.jsdelivr("photoswipe", "dist/umd/photoswipe.umd.min.js")
						.concat(util.dataUrl(";window.photoswipe=PhotoSwipe;")),
					dplayer: cdn
						.jsdelivr("dplayer", "dist/DPlayer.min.js")
						.concat(util.dataUrl(";window.dplayer=DPlayer;")),
				},
			},
		}),
	],
});
