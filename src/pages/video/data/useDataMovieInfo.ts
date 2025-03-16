import { useAsyncState } from "@vueuse/core";
import { computed } from "vue";
import { JavBus, JavDB } from "../../../utils/jav";

export const useDataMovieInfo = () => {
	const javDB = new JavDB();
	const javBus = new JavBus();

	const javDBState = useAsyncState(
		async (avNumber?: string) => {
			if (!avNumber) {
				return null;
			}
			const res = await javDB.getInfo(avNumber);
			return res;
		},
		undefined,
		{
			immediate: false,
		},
	);

	const javBusState = useAsyncState(
		async (avNumber?: string) => {
			if (!avNumber) {
				return null;
			}
			return javBus.getInfo(avNumber);
		},
		undefined,
		{
			immediate: false,
		},
	);

	const movieInfo = computed(() => {
		return {
			javDBState,
			javBusState,
		};
	});

	return movieInfo;
};
