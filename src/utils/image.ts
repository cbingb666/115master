// 压缩图片
export async function compressImage(
	blob: Blob,
	options: {
		maxWidth?: number;
		maxHeight?: number;
		quality?: number;
		type?: string;
	} = {},
): Promise<Blob> {
	const {
		maxWidth = 200,
		maxHeight = 200,
		quality = 0.8,
		type = "image/jpeg",
	} = options;

	return new Promise((resolve, reject) => {
		const img = new Image();
		img.onload = () => {
			// 创建Canvas元素
			const canvas = document.createElement("canvas");

			// 计算新的尺寸，保持宽高比
			let width = img.width;
			let height = img.height;

			if (width > height) {
				if (width > maxWidth) {
					height = Math.round(height * (maxWidth / width));
					width = maxWidth;
				}
			} else {
				if (height > maxHeight) {
					width = Math.round(width * (maxHeight / height));
					height = maxHeight;
				}
			}

			// 设置Canvas尺寸
			canvas.width = width;
			canvas.height = height;

			// 绘制图像
			const ctx = canvas.getContext("2d");
			if (!ctx) {
				reject(new Error("无法获取Canvas上下文"));
				return;
			}

			ctx.drawImage(img, 0, 0, width, height);

			// 转换为Blob
			canvas.toBlob(
				(result) => {
					if (result) {
						resolve(result);
					} else {
						reject(new Error("图片压缩失败"));
					}
				},
				type,
				quality,
			);
		};

		img.onerror = () => {
			reject(new Error("图片加载失败"));
		};

		// 从Blob创建图片URL
		img.src = URL.createObjectURL(blob);
	});
}

// 将Base64编码的图片转换为Blob对象
export function base64ToBlob(base64: string): Promise<Blob> {
	return new Promise((resolve, reject) => {
		try {
			// 移除可能存在的Data URL前缀
			const base64Data = base64.includes("base64,")
				? base64.split("base64,")[1]
				: base64;

			// 解码Base64
			const byteString = atob(base64Data);

			// 创建ArrayBuffer
			const arrayBuffer = new ArrayBuffer(byteString.length);
			const uint8Array = new Uint8Array(arrayBuffer);

			// 填充数据
			for (let i = 0; i < byteString.length; i++) {
				uint8Array[i] = byteString.charCodeAt(i);
			}

			// 确定MIME类型
			let mimeType = "image/png";
			if (base64.includes("data:")) {
				const matches = base64.match(/data:([^;]+);/);
				if (matches?.[1]) {
					mimeType = matches[1];
				}
			}

			// 创建Blob
			const blob = new Blob([uint8Array], { type: mimeType });
			resolve(blob);
		} catch (error) {
			reject(error);
		}
	});
}

// 将ImageBitmap转换为Blob
export const imageBitmapToBlob = async (
	imageBitmap: ImageBitmap,
	quality = 0.85,
): Promise<Blob> => {
	// 使用Canvas将ImageBitmap转换为Blob
	const canvas = document.createElement("canvas");
	canvas.width = imageBitmap.width;
	canvas.height = imageBitmap.height;

	const ctx = canvas.getContext("2d");
	if (!ctx) {
		throw new Error("无法创建Canvas上下文");
	}

	// 绘制ImageBitmap到Canvas
	ctx.drawImage(imageBitmap, 0, 0);

	// 获取Blob
	return new Promise((resolve, reject) => {
		canvas.toBlob(
			(blob) => {
				if (blob) {
					resolve(blob);
				} else {
					reject(new Error("无法创建Blob"));
				}
			},
			"image/webp",
			quality,
		);
	});
};

// 检测图像是否为黑帧
export const isBlackFrame = async (
	imageBitmap: ImageBitmap,
): Promise<boolean> => {
	const canvas = document.createElement("canvas");
	canvas.width = imageBitmap.width;
	canvas.height = imageBitmap.height;

	const ctx = canvas.getContext("2d");
	if (!ctx) {
		return false;
	}

	// 绘制ImageBitmap到Canvas
	ctx.drawImage(imageBitmap, 0, 0);

	// 获取像素数据
	const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
	const pixels = imageData.data;

	// 采样步长
	const sampleStep = 10;
	// 亮度阈值
	const brightnessThreshold = 30;
	// 暗像素比例阈值
	const darkPixelRatio = 0.95;

	let darkPixels = 0;
	let totalSamples = 0;
	let totalBrightness = 0;

	// 遍历像素数据
	for (let y = 0; y < canvas.height; y += sampleStep) {
		for (let x = 0; x < canvas.width; x += sampleStep) {
			const i = (y * canvas.width + x) * 4;
			const r = pixels[i];
			const g = pixels[i + 1];
			const b = pixels[i + 2];

			// 计算亮度
			const brightness = 0.2126 * r + 0.7152 * g + 0.0722 * b;
			totalBrightness += brightness;

			if (brightness <= brightnessThreshold) {
				darkPixels++;
			}

			totalSamples++;
		}
	}

	// 计算暗像素比例和平均亮度
	const darkRatio = darkPixels / totalSamples;
	const avgBrightness = totalBrightness / totalSamples;

	// 判断是否为黑帧
	return darkRatio >= darkPixelRatio && avgBrightness <= 25;
};

// 将Blob转换为Base64
export const blobToBase64 = (blob: Blob): Promise<string> => {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onloadend = () => {
			if (reader.result) {
				resolve(reader.result as string);
			} else {
				reject(new Error("转换Blob到Base64失败"));
			}
		};
		reader.onerror = () => {
			reject(new Error("读取Blob失败"));
		};
		reader.readAsDataURL(blob);
	});
};

export function getImageSize(
	base64: string,
): Promise<{ width: number; height: number }> {
	const img = new Image();
	img.src = base64;
	return new Promise((resolve, reject) => {
		img.onload = () => {
			resolve({ width: img.width, height: img.height });
		};
		img.onerror = () => {
			reject(new Error("图片加载失败"));
		};
	});
}
