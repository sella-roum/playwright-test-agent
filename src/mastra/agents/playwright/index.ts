import { createCerebras } from "@ai-sdk/cerebras";
import { Agent } from "@mastra/core/agent";
// import { Memory } from "@mastra/memory";
import { playwrightMcp } from "../../mcp";
import { PLAYWRIGHT_BROWSER_AGENT_INSTRUCTIONS } from "./prompts";

const CEREBRAS_API_KEY = process.env.CEREBRAS_API_KEY ?? "";
const CEREBRAS_MODEL_BANE = process.env.CEREBRAS_MODEL_BANE ?? "";

const cerebras = createCerebras({
	apiKey: CEREBRAS_API_KEY,
});

export const playwrightAgent = new Agent({
	id: "playwright-agent",
	name: "Playwright Browser Agent",
	maxRetries: 10,
	// memory: new Memory({
	// 	options: {
	// 		lastMessages: 10,
	// 	},
	// }),
	instructions: PLAYWRIGHT_BROWSER_AGENT_INSTRUCTIONS,
	model: cerebras(CEREBRAS_MODEL_BANE),
	tools: await playwrightMcp.getTools(),
});
