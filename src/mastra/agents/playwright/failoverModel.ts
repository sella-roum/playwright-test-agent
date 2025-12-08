import { createCerebras } from "@ai-sdk/cerebras";
import type { LanguageModelV2 } from "@ai-sdk/provider";

const CEREBRAS_API_KEYS = (
	process.env.CEREBRAS_API_KEYS ??
	process.env.CEREBRAS_API_KEY ??
	""
)
	.split(",")
	.filter((key) => key.trim() !== "");
const CEREBRAS_MODEL_NAME = process.env.CEREBRAS_MODEL_NAME ?? "llama3.1-70b";

/**
 * エラーがリトライ可能か（429 Quota Exceeded や 5xx Server Error）を判定する型ガード関数
 */
function isRetryableError(error: unknown): boolean {
	if (typeof error !== "object" || error === null) {
		return false;
	}

	// 安全にプロパティにアクセスするために Record<string, unknown> として扱う
	const err = error as Record<string, unknown>;
	const statusCode = err.statusCode;
	const name = err.name;

	return (
		statusCode === 429 || // Too Many Requests
		(typeof statusCode === "number" && statusCode >= 500) || // Server Error
		name === "AI_RetryError"
	);
}

function createFailoverModel(models: LanguageModelV2[]): LanguageModelV2 {
	if (models.length === 0) throw new Error("No models provided for failover.");

	const baseModel = models[0];

	return {
		...baseModel,
		specificationVersion: "v2",
		provider: "cerebras-failover",
		modelId: baseModel.modelId,

		doGenerate: async (options) => {
			let lastError: unknown;

			for (const model of models) {
				try {
					return await model.doGenerate(options);
				} catch (error) {
					lastError = error;

					// ヘルパー関数を使って判定
					if (isRetryableError(error)) {
						console.warn(
							`[Model Failover] Switch key due to error: ${(error as Error).message}`,
						);
						continue;
					}
					throw error;
				}
			}
			throw lastError;
		},

		doStream: async (options) => {
			let lastError: unknown;
			for (const model of models) {
				try {
					return await model.doStream(options);
				} catch (error) {
					lastError = error;

					// ヘルパー関数を使って判定
					if (isRetryableError(error)) {
						console.warn(
							`[Model Failover Stream] Switch key due to error: ${(error as Error).message}`,
						);
						continue;
					}
					throw error;
				}
			}
			throw lastError;
		},
	};
}

const cerebrasInstances = CEREBRAS_API_KEYS.map((key) => {
	const provider = createCerebras({ apiKey: key.trim() });
	return provider(CEREBRAS_MODEL_NAME);
});

export const failoverModel = createFailoverModel(cerebrasInstances);
