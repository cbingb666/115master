import { ref } from "vue";
import Drive115Instance from "../../../utils/drive115";
import type { WebApi } from "../../../utils/drive115/api";

export const useDataFileInfo = () => {
	const fileInfo = ref<WebApi.Res.FilesInfo>();

	const fetch = async (pickCode: string) => {
		if (!pickCode) {
			throw new Error("pickCode is required");
		}
		const response = await Drive115Instance.getFileInfo({
			pickcode: pickCode,
			share_id: "0",
			local: "1",
		});

		fileInfo.value = response;
	};

	const cleanup = () => {
		fileInfo.value = undefined;
	};

	return {
		fileInfo,
		fetch,
		cleanup,
	};
};
