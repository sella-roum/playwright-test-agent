import path from "node:path";
import { MCPClient } from "@mastra/mcp";

const DEBUG_PORT = process.env.DEBUG_PORT ?? 9222;

// プロジェクトルートへのパスを取得（実行環境に合わせて調整してください）
const currentPath = process.cwd();
const projectRoot = currentPath.endsWith(path.join(".mastra", "output"))
	? path.resolve(currentPath, "..", "..")
	: path.resolve(currentPath);

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

export const qaAdviserAgentMcp = new MCPClient({
	id: "test-agent-mcp-client",
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
		filesystem: {
			command: "npx",
			args: [
				"-y",
				"@modelcontextprotocol/server-filesystem@latest",
				projectRoot, // 許可するディレクトリパス
			],
		},
	},
});
