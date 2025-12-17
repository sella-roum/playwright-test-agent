import { createCerebras } from "@ai-sdk/cerebras";

const CEREBRAS_API_KEY = process.env.CEREBRAS_API_KEY ?? "";
const CEREBRAS_MODEL_NAME = process.env.CEREBRAS_MODEL_NAME ?? "";

const cerebras = createCerebras({
	apiKey: CEREBRAS_API_KEY,
});

export function getCerebrasModel() {
	return cerebras(CEREBRAS_MODEL_NAME);
}
