import { createLogger } from "@mastra/core/logger";
import { Mastra } from "@mastra/core/mastra";
import { LibSQLStore } from "@mastra/libsql";
import { playwrightExecutiveAgent, qaAdviserAgent, forensicsAgent } from "./agents/playwright";

// LibSQLの設定（ローカルファイル mastra.db に保存）
const storage = new LibSQLStore({
	url: "file:mastra.db",
});

export const mastra = new Mastra({
	agents: { playwrightExecutiveAgent, qaAdviserAgent, forensicsAgent },
	logger: createLogger({
		name: "Mastra",
		level: "info",
	}),
	storage,
});
