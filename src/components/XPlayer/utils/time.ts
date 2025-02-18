/**
 * 填充零
 * @param value 值
 * @returns 填充零后的值
 */
export const fillZero = (value: number): string => {
	return value.toString().padStart(2, "0");
};

/**
 * 格式化时间
 * @param seconds 秒
 * @returns 格式化后的时间 例如：01:02:03
 */
export const formatTime = (seconds: number): string => {
	if (Number.isNaN(seconds)) {
		return "--:--";
	}

	const hours = Math.floor(seconds / 3600);
	const minutes = Math.floor((seconds % 3600) / 60);
	const remainingSeconds = Math.floor(seconds % 60);
	return `${hours > 0 ? `${fillZero(hours)}:` : ""}${fillZero(minutes)}:${fillZero(remainingSeconds)}`;
};
