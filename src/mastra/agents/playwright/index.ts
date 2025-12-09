import { createCerebras } from "@ai-sdk/cerebras";
import { Agent } from "@mastra/core/agent";
import { fastembed } from "@mastra/fastembed";
import { Memory } from "@mastra/memory";
import { chromeDevToolsMcp, playwrightMcp, qaAdviserAgentMcp } from "../../mcp";
import {
	PLAYWRIGHT_BROWSER_AGENT_EXECUTIVE_INSTRUCTIONS,
	QA_ADVISER_AGENT_INSTRUCTIONS,
	TECHNICAL_FORENSICS_AGENT_INSTRUCTIONS,
} from "./prompts";

const CEREBRAS_API_KEY = process.env.CEREBRAS_API_KEY ?? "";
const CEREBRAS_MODEL_NAME = process.env.CEREBRAS_MODEL_NAME ?? "";

const cerebras = createCerebras({
	apiKey: CEREBRAS_API_KEY,
});

export const playwrightExecutiveAgent = new Agent({
	id: "playwright-executive-agent",
	name: "Playwright Executive Agent",
	description:
		"Playwright-MCP を介して Web ブラウザを操作する、自律型ブラウザ自動化エージェントです。",
	maxRetries: 20,
	memory: new Memory({
		embedder: fastembed,
		options: {
			lastMessages: 10,
			workingMemory: {
				enabled: true,
			},
			semanticRecall: false,
		},
	}),
	instructions: PLAYWRIGHT_BROWSER_AGENT_EXECUTIVE_INSTRUCTIONS,
	model: cerebras(CEREBRAS_MODEL_NAME),
	tools: await playwrightMcp.getTools(),
});

// 全ツールを取得
const allTools = await qaAdviserAgentMcp.getTools();

// 除外したいツール名のリスト
const excludedTools = [
	// 'filesystem_read_file',
	// 'filesystem_read_text_file',
	// 'filesystem_read_media_file',
	// 'filesystem_read_multiple_files',
	"filesystem_write_file",
	"filesystem_edit_file",
	"filesystem_create_directory",
	// 'filesystem_list_directory',
	// 'filesystem_list_directory_with_sizes',
	// 'filesystem_directory_tree',
	"filesystem_move_file",
	// 'filesystem_search_files',
	// 'filesystem_get_file_info',
	// 'filesystem_list_allowed_directories',
];

// フィルタリングを実行
const allowedTools = Object.fromEntries(
	Object.entries(allTools).filter(
		([toolName]) => !excludedTools.includes(toolName),
	),
);

export const qaAdviserAgent = new Agent({
	id: "qa-adviser-agent",
	name: "QA Adviser Agent",
	description:
		"Playwright-MCP を介した「Webブラウザ操作」と、ファイルシステムへの「読み取りアクセス」権限を持つ、自律型エンジニアリングエージェントです。",
	maxRetries: 20,
	memory: new Memory({
		embedder: fastembed,
		options: {
			lastMessages: 10,
			workingMemory: {
				enabled: true,
			},
			semanticRecall: false,
		},
	}),
	instructions: QA_ADVISER_AGENT_INSTRUCTIONS,
	model: cerebras(CEREBRAS_MODEL_NAME),
	tools: allowedTools,
});

export const forensicsAgent = new Agent({
	id: "technical-forensics-agent",
	name: "Technical Forensics Agent",
	description:
		"ブラウザのコンソールログ、ネットワーク通信、パフォーマンス情報を分析し、技術的なエラー原因を特定するエージェントです。",
	maxRetries: 20,
	memory: new Memory({
		embedder: fastembed,
		options: {
			lastMessages: 10,
			workingMemory: {
				enabled: true,
			},
			semanticRecall: false,
		},
	}),
	instructions: TECHNICAL_FORENSICS_AGENT_INSTRUCTIONS,
	model: cerebras(CEREBRAS_MODEL_NAME),
	tools: await chromeDevToolsMcp.getTools(),
});
