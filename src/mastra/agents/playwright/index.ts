import { Agent } from "@mastra/core/agent";
import { fastembed } from "@mastra/fastembed";
import { LibSQLStore, LibSQLVector } from "@mastra/libsql";
import { Memory } from "@mastra/memory";
import { chromeDevToolsMcp, playwrightMcp, qaAdviserAgentMcp } from "../../mcp";
import { failoverModel } from "./failoverModel";
import {
	PLAYWRIGHT_BROWSER_AGENT_EXECUTIVE_INSTRUCTIONS,
	QA_ADVISER_AGENT_INSTRUCTIONS,
	TECHNICAL_FORENSICS_AGENT_INSTRUCTIONS,
} from "./prompts";

// ---------------------------------------------------------
// 1. Shared Infrastructure Setup
// ---------------------------------------------------------

// ストレージとベクターストアの初期化
const sharedStorage = new LibSQLStore({
	url: "file:mastra.db",
});

const sharedVector = new LibSQLVector({
	connectionUrl: "file:mastra.db",
});

/**
 * エージェント用のメモリ設定を作成するヘルパー関数
 * @param semanticRecallConfig - Semantic Recallの設定（topK, messageRange）
 */
function createAgentMemory(semanticRecallConfig: {
	topK: number;
	messageRange: number;
}) {
	return new Memory({
		embedder: fastembed,
		storage: sharedStorage,
		vector: sharedVector,
		options: {
			lastMessages: 10,
			workingMemory: {
				enabled: true,
			},
			semanticRecall: semanticRecallConfig,
		},
	});
}

// ---------------------------------------------------------
// 2. Tool Configuration
// ---------------------------------------------------------

// QA Agentから除外する「書き込み・変更系」の危険なツール
const QA_EXCLUDED_TOOLS = [
	"filesystem_write_file",
	"filesystem_edit_file",
	"filesystem_create_directory",
	"filesystem_move_file",
] as const;

async function getQaTools() {
	const allTools = await qaAdviserAgentMcp.getTools();
	return Object.fromEntries(
		Object.entries(allTools).filter(
			// 修正: 配列側を string[] として扱うことで型安全に includes チェックを行う
			([toolName]) =>
				!(QA_EXCLUDED_TOOLS as readonly string[]).includes(toolName),
		),
	);
}

// ---------------------------------------------------------
// 3. Agent Definitions
// ---------------------------------------------------------

export const playwrightExecutiveAgent = new Agent({
	id: "playwright-executive-agent",
	name: "Playwright Executive Agent",
	description:
		"Playwright-MCP を介して Web ブラウザを操作する、自律型ブラウザ自動化エージェントです。",
	maxRetries: 20,
	// 実行エージェントは直近の指示重視のため、Recallは控えめに設定
	memory: createAgentMemory({ topK: 3, messageRange: 2 }),
	instructions: PLAYWRIGHT_BROWSER_AGENT_EXECUTIVE_INSTRUCTIONS,
	model: failoverModel,
	tools: await playwrightMcp.getTools(),
});

export const qaAdviserAgent = new Agent({
	id: "qa-adviser-agent",
	name: "QA Adviser Agent",
	description:
		"Playwright-MCP を介した「Webブラウザ操作」と、ファイルシステムへの「読み取りアクセス」権限を持つ、自律型エンジニアリングエージェントです。",
	maxRetries: 20,
	// QAエージェントは文脈依存度が高いため、Recallを広めに設定
	memory: createAgentMemory({ topK: 5, messageRange: 3 }),
	instructions: QA_ADVISER_AGENT_INSTRUCTIONS,
	model: failoverModel,
	tools: await getQaTools(),
});

export const forensicsAgent = new Agent({
	id: "technical-forensics-agent",
	name: "Technical Forensics Agent",
	description:
		"ブラウザのコンソールログ、ネットワーク通信、パフォーマンス情報を分析し、技術的なエラー原因を特定するエージェントです。",
	maxRetries: 20,
	memory: createAgentMemory({ topK: 3, messageRange: 2 }),
	instructions: TECHNICAL_FORENSICS_AGENT_INSTRUCTIONS,
	model: failoverModel,
	tools: await chromeDevToolsMcp.getTools(),
});
