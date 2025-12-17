import { Workflow } from "@mastra/core";
import { z } from "zod";
import {
	testExecutorAgent,
	testPlannerAgent,
	testVerifierAgent,
} from "../agents/playwright";
import {
	TestPlanSchema,
	VerifyResultSchema,
} from "../agents/playwright/schemas";

// 型推論用のヘルパー
type TestPlan = z.infer<typeof TestPlanSchema>;

// Contextの型定義
type StepExecuteContext<
	TTrigger = unknown,
	TSteps = Record<string, { output: unknown }>,
> = {
	context: {
		triggerData: TTrigger;
		steps: TSteps;
		[key: string]: unknown;
	};
};

// ---------------------------------------------------------
// Step定義
// ---------------------------------------------------------

const planStep = {
	id: "plan-test",
	description: "ユーザーの指示を具体的なテスト手順に分解します",
	inputSchema: z.object({
		userPrompt: z.string(),
	}),
	outputSchema: z.object({
		plan: TestPlanSchema,
	}),
	execute: async ({ context }: StepExecuteContext<{ userPrompt: string }>) => {
		const prompt = context.triggerData.userPrompt;
		const result = await testPlannerAgent.generate(prompt, {
			output: TestPlanSchema,
		});
		return { plan: result.object };
	},
	// biome-ignore lint/suspicious/noExplicitAny: Framework type mismatch workaround
} as any;

const executeStep = {
	id: "execute-test",
	description: "計画された手順に従ってブラウザを操作し、結果を検証します",
	inputSchema: z.object({
		plan: TestPlanSchema,
	}),
	execute: async ({
		context,
	}: StepExecuteContext<
		unknown,
		{ "plan-test"?: { output: { plan: TestPlan } } }
	>) => {
		const plan = context.steps?.["plan-test"]?.output?.plan;
		const logs: string[] = [];

		if (!plan) throw new Error("Test plan not found");

		for (const step of plan.steps) {
			logs.push(`Starting Step ${step.stepId}: ${step.description}`);

			let verified = false;
			let attempts = 0;
			const maxAttempts = 3;

			while (!verified && attempts < maxAttempts) {
				attempts++;
				try {
					// Verifyステップ以外は操作を実行
					if (step.actionType !== "verify") {
						await testExecutorAgent.generate(`
              現在のステップ: ${step.description}
              アクション: ${step.actionType}
              
              スナップショットを取得し、Ref IDを用いて操作を実行してください。
            `);
						// 待機
						await new Promise((r) => setTimeout(r, 2000));
					}

					// 検証
					const verifyRes = await testVerifierAgent.generate(
						`
            直前の操作: ${step.description}
            期待値: ${step.expectedOutcome}
            現在の状態を判定してください。
          `,
						{ output: VerifyResultSchema },
					);

					const result = verifyRes.object;
					logs.push(
						`  [Attempt ${attempts}] Verification: ${result.status} - ${result.reason}`,
					);

					if (result.status === "PASS") {
						verified = true;
					} else if (result.status === "RETRY_NEEDED") {
						await new Promise((r) => setTimeout(r, 3000));
					} else {
						if (attempts >= maxAttempts)
							throw new Error(`Step Failed: ${result.reason}`);
					}
				} catch (error) {
					if (attempts >= maxAttempts) throw error;
				}
			}
		}

		return { status: "success", logs };
	},
	// biome-ignore lint/suspicious/noExplicitAny: Framework type mismatch workaround
} as any;

// ---------------------------------------------------------
// Workflow定義
// ---------------------------------------------------------

const workflowInstance = new Workflow({
	name: "Autonomous Playwright Test",
	triggerSchema: z.object({
		userPrompt: z.string().describe("テストの内容"),
	}),
	// biome-ignore lint/suspicious/noExplicitAny: Framework type mismatch workaround
} as any);

// biome-ignore lint/suspicious/noExplicitAny: Framework type mismatch workaround
export const autonomousTestWorkflow = (workflowInstance as any)
	.step(planStep)
	.step(executeStep)
	.commit();
