import {
	testExecutorAgent,
	testPlannerAgent,
	testVerifierAgent,
} from "../agents/playwright";
import {
	TestPlanSchema,
	VerifyResultSchema,
} from "../agents/playwright/schemas";

/**
 * 自律型テスト実行ワークフロー
 * @param userPrompt ユーザーからの指示（例: "ログイン機能が正常か確認して"）
 */
export async function runAutonomousTestWorkflow(userPrompt: string) {
	console.log("🚀 Starting Autonomous Test Workflow...");
	console.log(`📋 Goal: ${userPrompt}\n`);

	// 1. Planning Phase
	console.log("--- Phase 1: Planning ---");
	const planResponse = await testPlannerAgent.generate(userPrompt, {
		output: TestPlanSchema,
	});

	const plan = planResponse.object;
	console.log(`Created Plan with ${plan.steps.length} steps.`);

	// 2. Execution Loop
	console.log("\n--- Phase 2: Execution & Verification ---");

	for (const step of plan.steps) {
		console.log(
			`\n🔹 Step ${step.stepId}: ${step.actionType} - ${step.description}`,
		);

		let verified = false;
		let attempts = 0;
		const maxAttempts = 3;

		while (!verified && attempts < maxAttempts) {
			attempts++;

			try {
				// A. Execute Action
				// verifyステップの場合は操作を行わず、検証のみ行う
				if (step.actionType !== "verify") {
					console.log(`   Action attempt ${attempts}...`);
					await testExecutorAgent.generate(`
                        現在のステップ情報:
                        - アクション: ${step.actionType}
                        - 内容: ${step.description}
                        
                        現在の画面スナップショットを取得し、Ref IDを用いて操作を実行してください。
                    `);

					// SPAの遷移などを考慮して少し待機（必要に応じて調整）
					await new Promise((resolve) => setTimeout(resolve, 2000));
				}

				// B. Verify Outcome
				// 入力やクリックの後、または明示的なVerifyステップで検証を行う
				console.log("   Verifying...");
				const verifyResponse = await testVerifierAgent.generate(
					`
                    直前の操作: ${step.description}
                    期待される結果: ${step.expectedOutcome}
                    
                    現在のスナップショットを確認し、PASS/FAIL/RETRY_NEEDED を判定してください。
                    `,
					{ output: VerifyResultSchema },
				);

				const result = verifyResponse.object;
				console.log(
					`   ➡️ Verification Result: [${result.status}] ${result.reason}`,
				);

				if (result.status === "PASS") {
					verified = true;
				} else if (result.status === "RETRY_NEEDED") {
					console.log("   ⏳ Loading detected, waiting...");
					await new Promise((resolve) => setTimeout(resolve, 3000));
					// ループの先頭に戻り、再検証（Executorはスキップする場合もあるが、今回は簡易化のため再試行）
				} else {
					// FAILの場合
					if (attempts >= maxAttempts) {
						throw new Error(`Step ${step.stepId} Failed: ${result.reason}`);
					}
					console.log("   ⚠️ Retrying action...");
				}
			} catch (error) {
				console.error(`   ❌ Error in step ${step.stepId}:`, error);
				if (attempts >= maxAttempts) throw error;
			}
		}
	}

	console.log("\n✅ Test Workflow Completed Successfully!");
	return { success: true, plan };
}
