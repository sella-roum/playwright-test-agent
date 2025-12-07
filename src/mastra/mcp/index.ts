import { MCPClient } from "@mastra/mcp";

const DEBUG_PORT = process.env.DEBUG_PORT ?? 9222;

export const playwrightMcp = new MCPClient({
	id: "playwright-mcp-client",
	servers: {
		playwright: {
			command: "npx",
			args: [
				"-y",
				"@playwright/mcp@latest",
				"--cdp-endpoint",
				`http://localhost:${DEBUG_PORT}`,
			],
		},
	},
});
