import { ref } from "vue";
import type { Entity } from "../../../utils/drive115";
import Drive115Instance from "../../../utils/drive115";

export const useDataPlaylist = () => {
	const playlist = ref<Entity.PlaylistItem[]>([]);

	const fetch = async ({
		cid,
		pickcode,
	}: {
		cid: string;
		pickcode: string;
	}) => {
		const res = await Drive115Instance.getPlaylist(cid, pickcode);
		playlist.value = res.data;
	};

	const cleanup = () => {
		playlist.value = [];
	};

	return {
		playlist,
		fetch,
		cleanup,
	};
};
