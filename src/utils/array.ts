/**
 * 均匀采样
 * @param array 数组
 * @param sampleSize 采样数量
 * @returns 采样后的数组
 */
export const getUniformSample = <T>(array: T[], sampleSize: number): T[] => {
	if (array.length < sampleSize) {
		return array;
	}
	if (sampleSize === 0) return [];
	if (sampleSize === 1) return [array[0]];

	const step = (array.length - 1) / (sampleSize - 1);
	const indices = Array.from({ length: sampleSize }, (_, i) =>
		Math.round(i * step),
	);
	return indices.map((index) => array[index]);
};
