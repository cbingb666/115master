import { FileOperationMenu } from "../../components/FileOperationMenu";
import { AppLogger } from "../../utils/logger";

class HomePage {
	private readonly logger: AppLogger;
	private fileOperationMenu!: FileOperationMenu;

	constructor() {
		this.logger = new AppLogger("HomePage");
		this.init();
	}

	private init(): void {
		this.logger.log("init");
		this.fileOperationMenu = new FileOperationMenu();
	}

	public destroy(): void {
		this.fileOperationMenu.destroy();
	}
}

export default HomePage;
