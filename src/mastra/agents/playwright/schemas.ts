import { z } from "zod";

// テスト計画の出力スキーマ
export const TestPlanSchema = z.object({
	steps: z.array(
		z.object({
			stepId: z.number(),
			actionType: z.enum(["navigate", "input", "click", "verify", "wait"]),
			description: z
				.string()
				.describe("このステップで実行すべき内容の自然言語記述"),
			expectedOutcome: z
				.string()
				.describe("このステップ完了後の期待される状態"),
		}),
	),
});

// 検証結果の出力スキーマ
export const VerifyResultSchema = z.object({
	status: z.enum(["PASS", "FAIL", "RETRY_NEEDED"]),
	reason: z
		.string()
		.describe("判定の理由。FAILの場合は現在見えている画面の説明を含む"),
	suggestion: z.string().optional().describe("RETRYやFAIL時の推奨アクション"),
});
