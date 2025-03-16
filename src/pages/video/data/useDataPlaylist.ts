import { useAsyncState } from "@vueuse/core";
import { reactive } from "vue";
import Drive115Instance from "../../../utils/drive115";

export const useDataPlaylist = () => {
	const playlist = useAsyncState(
		async (cid: string, pickcode: string) => {
			const res = await Drive115Instance.getPlaylist(cid, pickcode);
			return res;
		},
		[],
		{
			immediate: false,
		},
	);

	return reactive(playlist);
};
