/**
 * 异步队列
 * 最大并发数
 * 最大队列长度
 * 支持优先级
 * 支持取消
 * 支持暂停
 * 支持恢复
 * 支持重试
 * 支持超时
 */

interface Task<T> {
	execute: () => Promise<T>;
	priority: number;
	resolve: (value: T) => void;
	reject: (reason: Error) => void;
	timeout?: number;
	retries?: number;
	id: string;
	group?: string;
	status:
		| "pending"
		| "running"
		| "paused"
		| "cancelled"
		| "completed"
		| "failed";
}

export class AsyncQueue<T> {
	private queue: Task<T>[] = [];
	private running: Map<string, Task<T>> = new Map();
	private paused: Set<string> = new Set();

	constructor(
		private maxConcurrent = 3,
		private maxQueueLength = 100,
		private defaultRetryDelay = 1000,
	) {}

	/**
	 * 添加任务到队列
	 */
	async add(
		execute: () => Promise<T>,
		options: {
			priority?: number;
			timeout?: number;
			retries?: number;
			group?: string;
			id?: string;
		} = {},
	): Promise<T> {
		if (this.queue.length >= this.maxQueueLength) {
			throw new Error("队列已满");
		}

		return new Promise((resolve, reject) => {
			const task: Task<T> = {
				execute,
				priority: options.priority || 0,
				resolve,
				reject,
				timeout: options.timeout,
				retries: options.retries || 0,
				id: options.id || Math.random().toString(36).substr(2, 9),
				group: options.group,
				status: "pending",
			};

			if (this.isPaused(task.id)) {
				task.status = "paused";
			}

			this.queue.push(task);
			this.queue.sort((a, b) => b.priority - a.priority);

			this.processQueue();
		});
	}

	/**
	 * 暂停指定任务或任务组
	 */
	pause(idOrGroup: string) {
		this.paused.add(idOrGroup);

		// 暂停正在运行的任务
		this.running.forEach((task) => {
			if (task.id === idOrGroup || task.group === idOrGroup) {
				task.status = "paused";
			}
		});

		// 暂停队列中的任务
		this.queue.forEach((task) => {
			if (task.id === idOrGroup || task.group === idOrGroup) {
				task.status = "paused";
			}
		});
	}

	/**
	 * 恢复指定任务或任务组
	 */
	resume(idOrGroup: string) {
		this.paused.delete(idOrGroup);

		// 恢复队列中的任务
		this.queue.forEach((task) => {
			if (
				(task.id === idOrGroup || task.group === idOrGroup) &&
				task.status === "paused"
			) {
				task.status = "pending";
			}
		});

		this.processQueue();
	}

	/**
	 * 取消指定任务或任务组
	 */
	cancel(idOrGroup: string) {
		// 取消队列中的任务
		this.queue = this.queue.filter((task) => {
			if (task.id === idOrGroup || task.group === idOrGroup) {
				task.status = "cancelled";
				task.reject(new Error("Task cancelled"));
				return false;
			}
			return true;
		});

		// 取消正在运行的任务
		this.running.forEach((task, taskId) => {
			if (task.id === idOrGroup || task.group === idOrGroup) {
				task.status = "cancelled";
				task.reject(new Error("Task cancelled"));
				this.running.delete(taskId);
			}
		});
	}

	/**
	 * 重试指定任务或任务组
	 */
	retry(idOrGroup: string, retries?: number) {
		const tasksToRetry: Task<T>[] = [];

		// 收集失败的任务
		this.queue.forEach((task) => {
			if (
				(task.id === idOrGroup || task.group === idOrGroup) &&
				task.status === "failed"
			) {
				task.retries = retries ?? task.retries;
				task.status = "pending";
				tasksToRetry.push(task);
			}
		});

		// 重新添加到队列
		tasksToRetry.forEach((task) => {
			this.queue.push(task);
		});

		this.processQueue();
	}

	private isPaused(idOrGroup: string): boolean {
		return Boolean(
			this.paused.has(idOrGroup) || (idOrGroup && this.paused.has(idOrGroup)),
		);
	}

	/**
	 * 处理队列
	 */
	private async processQueue() {
		if (this.running.size >= this.maxConcurrent) {
			return;
		}

		const nextTask = this.queue.find(
			(task) => task.status === "pending" && !this.isPaused(task.id),
		);

		if (!nextTask) return;

		this.queue = this.queue.filter((task) => task !== nextTask);
		this.running.set(nextTask.id, nextTask);
		nextTask.status = "running";

		try {
			let timeoutId: number | undefined;

			const executeWithTimeout = async () => {
				if (nextTask.timeout) {
					const timeoutPromise = new Promise<T>((_, reject) => {
						timeoutId = window.setTimeout(() => {
							reject(new Error("Task timeout"));
						}, nextTask.timeout);
					});

					return Promise.race([nextTask.execute(), timeoutPromise]);
				}

				return nextTask.execute();
			};

			const result = await this.executeWithRetry(
				executeWithTimeout,
				nextTask.retries || 0,
				nextTask,
			);

			if (timeoutId) clearTimeout(timeoutId);
			nextTask.status = "completed";
			nextTask.resolve(result);
		} catch (error) {
			nextTask.status = "failed";
			nextTask.reject(error as Error);
		} finally {
			this.running.delete(nextTask.id);
			this.processQueue();
		}
	}

	/**
	 * 带重试的执行
	 */
	private async executeWithRetry(
		fn: () => Promise<T>,
		retriesLeft: number,
		task: Task<T>,
	): Promise<T> {
		try {
			return await fn();
		} catch (error) {
			if (retriesLeft > 0 && task.status !== "cancelled") {
				await new Promise((resolve) =>
					setTimeout(resolve, this.defaultRetryDelay),
				);
				return this.executeWithRetry(fn, retriesLeft - 1, task);
			}
			throw error;
		}
	}

	/**
	 * 获取队列状态
	 */
	getStatus() {
		return {
			queueLength: this.queue.length,
			runningCount: this.running.size,
			pausedGroups: Array.from(this.paused),
			tasks: {
				pending: this.queue.filter((t) => t.status === "pending").length,
				running: this.running.size,
				paused: this.queue.filter((t) => t.status === "paused").length,
				failed: this.queue.filter((t) => t.status === "failed").length,
				completed: this.queue.filter((t) => t.status === "completed").length,
				cancelled: this.queue.filter((t) => t.status === "cancelled").length,
			},
		};
	}

	clear() {
		this.queue.forEach((task) => {
			task.status = "cancelled";
			task.reject(new Error("Queue cleared"));
		});
		this.queue = [];
		this.running.clear();
		this.paused.clear();
	}

	get length() {
		return this.queue.length;
	}

	get runningCount() {
		return this.running.size;
	}
}
