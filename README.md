# Playwright Test Agent

**Playwright Test Agent** は、[Mastra](https://mastra.ai/) フレームワークと **Model Context Protocol (MCP)** を活用した、自律型Webブラウザ操作エージェントの実装プロジェクトです。

AIモデル（Cerebras）が **Playwright** を介してブラウザを操作し、「スナップショット・リファレンス」モデルに基づいた堅牢かつ安全なWebインタラクションを実現します。

## 🚀 特徴

- **Mastra Framework Integration**: エージェントのライフサイクル、メモリ、MCPツールの統合をMastraで管理。
- **MCP (Model Context Protocol)**: `@playwright/mcp` を使用し、標準化されたプロトコルでAIとブラウザ（Chrome DevTools Protocol）を接続。
- **Snapshot-First Architecture**: 視覚的なスクリーンショットではなく、DOMのアクセシビリティツリー（スナップショット）を「目」として使用。
- **Ref ID Strategy**: CSSセレクタの推測によるエラーを防ぐため、スナップショット内で割り当てられた一意なID（`ref`）を使用して要素を操作。
- **Safety & Ethics**: 個人情報の保護、最小権限の原則、リスク管理を重視したプロンプト設計。
- **High Performance**: 高速な推論を提供する **Cerebras** APIを採用。
- **Modern Tooling**: **Biome** による高速なLint/Format環境。

## 📋 前提条件

- Node.js (LTS推奨)
- **Cerebras API Key**: AIモデルの利用に必要です。
- Google Chrome または Chromium ブラウザ

## 🛠️ インストール

依存関係をインストールします。

```bash
npm install
```

ブラウザバイナリ（Playwright用）をインストールします。

```bash
npx playwright install --with-deps
```

## ⚙️ 環境設定

プロジェクトルートに `.env` ファイルを作成し、以下の環境変数を設定してください。
※ `DEBUG_PORT` はPlaywrightとMCPサーバーの接続に使用されます（デフォルト: 9222）。

```env
# AI Model Provider
CEREBRAS_API_KEY=your_cerebras_api_key
# コード内の変数名に基づく（MODEL_NAMEの意図と思われます）
CEREBRAS_MODEL_BANE=llama3.1-70b

# Browser Debugging
DEBUG_PORT=9222
```

## 💻 使い方

### 1. 開発サーバーの起動 (Mastra)

Mastraエージェントサーバーを起動します。

```bash
npm run dev
```

これにより、エージェントが待機状態になり、MastraのインターフェースやAPIを通じてタスクを受け付けることができます。

### 2. ブラウザ操作の仕組み

このエージェントは、`http://localhost:9222` で待機しているブラウザ（CDPエンドポイント）に接続して操作を行います。

エージェントに操作させるブラウザを立ち上げるには、以下の方法があります：

**A. Playwrightでデバッグポートを開いて起動する場合:**
`playwright.config.ts` には既に `launchOptions` が設定されています。

```bash
# UIモードでテストランナーを起動（ブラウザが立ち上がります）
npx playwright test --ui
```

**B. 手動でChromeを起動する場合:**
既存のChromeをデバッグポート付きで起動することも可能です。

```bash
# macOSの例
/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome --remote-debugging-port=9222
```

### 3. 通常のPlaywrightテストの実行

エージェントによる自律操作とは別に、記述済みのE2Eテスト（`tests/` ディレクトリ）を実行する場合：

```bash
npx playwright test
```

## 📂 プロジェクト構成

```
playwright-test-agent/
├── src/
│   ├── mastra/
│   │   ├── agents/playwright/  # エージェント定義
│   │   │   ├── index.ts        # エージェント本体とツール設定
│   │   │   └── prompts.ts      # エージェントへの行動指針（プロンプト）
│   │   ├── mcp/                # MCPクライアント設定 (@playwright/mcp)
│   │   └── index.ts            # Mastraサーバーエントリーポイント
├── prompts/                    # エージェント向け詳細インストラクション (Markdown)
├── tests/                      # Playwright E2Eテストケース
├── playwright.config.ts        # Playwright設定 (デバッグポート設定など)
├── biome.json                  # Biome設定 (Lint/Format)
└── package.json
```

## 📜 開発コマンド

`package.json` に定義されているスクリプトです。

- **Lint**: `npm run lint`
- **Format**: `npm run format`
- **Check**: `npm run check`
- **Start Mastra**: `npm run dev`
- **Build Mastra**: `npm run build`

## 🛡️ ライセンス

ISC
