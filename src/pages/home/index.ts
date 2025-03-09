import { AppLogger } from "../../utils/logger";
import FileListMod from "./FileListMod";
import { FileOperationMenu } from "./FileOperationMenu";
import { PageTitleMod } from "./PageTitleMod";

class HomePage {
	private readonly logger: AppLogger;
	private fileOperationMenu!: FileOperationMenu;
	private fileListMod!: FileListMod;
	private pageTitleMod!: PageTitleMod;

	constructor() {
		this.logger = new AppLogger("HomePage");
		this.init();
	}

	private async init(): Promise<void> {
		this.logger.log("init");
		this.fileOperationMenu = new FileOperationMenu();
		this.fileListMod = new FileListMod();
		this.pageTitleMod = new PageTitleMod();
	}

	public destroy(): void {
		this.fileOperationMenu.destroy();
		this.fileListMod.destroy();
		this.pageTitleMod.destroy();
	}
}

export default HomePage;
