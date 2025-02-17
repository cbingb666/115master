/**
 * 格式化时间
 * @param seconds 秒
 * @returns 格式化后的时间 例如：01:02:03
 */
export const formatTime = (seconds: number): string => {
	const hours = Math.floor(seconds / 3600);
	const minutes = Math.floor((seconds % 3600) / 60);
	const remainingSeconds = Math.floor(seconds % 60);
	return `${hours}:${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
};
