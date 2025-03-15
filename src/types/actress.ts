type FolderName = string;
type ActressName = string;

export type ActressImageInfo = {
	Content: Record<FolderName, Record<ActressName, string>>;
	Information: {
		TotalNum: number;
		TotalSize: number;
		Timestamp: number;
	};
};

export type ActressImageMap = Map<
	string,
	{
		folder: string;
		filename: string;
		timestamp: number;
	}[]
>;
