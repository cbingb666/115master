import { ref } from "vue";
import { JavBus, JavDB } from "../../../utils/jav";
import type { JavInfo } from "../../../utils/jav/jav";
import { GMRequest } from "../../../utils/request/gmRequst";

export type MovieInfo = {
	JavDB?: JavInfo;
	JavBus?: JavInfo;
};

export const useDataMovieInfo = () => {
	const movieInfo = ref<MovieInfo>();
	const javDB = new JavDB(new GMRequest());
	const javBus = new JavBus(new GMRequest());

	const fetch = async (avNumber: string) => {
		const infoDB = await javDB.getInfoByAvNumber(avNumber);
		const infoBus = await javBus.getInfoByAvNumber(avNumber);
		movieInfo.value = {
			JavDB: infoDB,
			JavBus: infoBus,
		};
	};

	const cleanup = () => {
		movieInfo.value = undefined;
	};

	return {
		movieInfo,
		fetch,
		cleanup,
	};
};
