import { ConsoleLogger } from "@mastra/core/logger";
import { Mastra } from "@mastra/core/mastra";
import { LibSQLStore } from "@mastra/libsql";
import { playwrightExecutiveAgent, qaAdviserAgent } from "./agents/playwright";
import { autonomousTestWorkflow } from "./workflows";

// LibSQLの設定（ローカルファイル mastra.db に保存）
const storage = new LibSQLStore({
	url: "file:mastra.db",
});

export const mastra = new Mastra({
	agents: { playwrightExecutiveAgent, qaAdviserAgent },
	workflows: { autonomousTestWorkflow },
	logger: new ConsoleLogger({
		name: "Mastra",
		level: "info",
	}),
	storage,
});
