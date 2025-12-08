# Playwright Test Agent

**Playwright Test Agent** は、[Mastra Framework](https://mastra.ai/) と **Model Context Protocol (MCP)** を活用した、次世代の自律型ブラウザ操作・QA支援システムです。

AIモデル（Cerebras / Llama 3.1-70b）が「スナップショット・リファレンス」技術を用いてDOMを正確に認識し、ブラウザ操作の実行だけでなく、ソースコードと照らし合わせたテストのデバッグ支援まで行います。

## 🚀 主な特徴

  - **Snapshot-First Architecture**: 視覚的なスクリーンショットではなく、DOMのアクセシビリティツリー（スナップショット）を「目」として使用。幻覚（ハルシネーション）を減らし、正確な状態把握を実現します。
  - **Ref ID Strategy**: スナップショット内で発行される一時的なID（`ref`）を使用して操作します。CSSセレクタの推測によるエラーを防ぎます。
  - **Dual Agent System**: 役割の異なる2つのエージェントを搭載。
      - **Executive Agent**: ブラウザ操作とタスク実行に特化。
      - **QA Adviser Agent**: ファイルシステムへのアクセス権を持ち、ブラウザの挙動とソースコードを比較して修正案を提示可能。
  - **Robust AI Model Failover**: 複数のAPIキーによるラウンドロビン/フェイルオーバー機能を実装。APIレート制限（429）やサーバーエラーによる中断を防ぎます。
  - **Standardized Protocols**: [MCP (Model Context Protocol)](https://modelcontextprotocol.io/) を採用し、ブラウザ（Chrome DevTools Protocol）やファイルシステムと標準的な方法で接続します。
  - **Modern Tooling**: **Biome** による高速なLint/Format、**LibSQL** によるメモリ管理。

## 📋 前提条件

  - **Node.js**: v20 (LTS) 以上推奨
  - **Cerebras API Key**: 高速推論AIモデルの利用に必要です。
  - **Browser**: Google Chrome または Chromium

## 🛠️ インストール

依存関係とブラウザバイナリをインストールします。

```bash
npm install
npx playwright install --with-deps
```

## ⚙️ 環境設定

プロジェクトルートに `.env` ファイルを作成し、以下の変数を設定してください。
`failoverModel.ts` の実装により、複数のAPIキーをカンマ区切りで設定することで可用性を向上させることができます。

```env
# AI Model Provider (Cerebras)
# 単一キー、またはカンマ区切りで複数設定可能（フェイルオーバー用）
CEREBRAS_API_KEYS=key1,key2,key3
CEREBRAS_MODEL_NAME=llama3.1-70b

# Browser Debugging Configuration
# PlaywrightとMCPサーバーの接続に使用（デフォルト: 9222）
DEBUG_PORT=9222
```

## 🤖 エージェントの種類

このシステムには、`src/mastra/agents/playwright/index.ts` で定義された2つのエージェントが存在します。

| エージェント名 | ID | 役割と権限 |
| :--- | :--- | :--- |
| **Playwright Executive Agent** | `playwright-executive-agent` | **[実行特化]**<br>ブラウザ操作ツールのみを所持。ユーザーの指示に基づき、サイトのナビゲーションやフォーム入力、情報抽出を迅速に行います。 |
| **QA Adviser Agent** | `qa-adviser-agent` | **[QAエンジニア]**<br>ブラウザ操作に加え、**ファイルシステムの読み取り権限**（`read_file`, `list_directory` 等）を持ちます。「テストが落ちる原因」を、画面の状態とテストコード(`tests/`)の両を見て診断し、修正案を提示します。 |

## 💻 使い方

システムを動作させるには、「操作されるブラウザ」と「操作するMastraサーバー」の両方を起動する必要があります。

### 1\. ブラウザの起動 (CDP Endpoint)

エージェントが接続するためのデバッグポート(`9222`)を開いた状態でブラウザを起動します。

**方法A: Playwright UIモードを使用（推奨）**
設定ファイル `playwright.config.ts` により、自動的にデバッグポート付きで起動します。

```bash
npx playwright test --ui
```

**方法B: 手動でChromeを起動**
既存のChromeを使用する場合：

```bash
# macOSの例
/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome --remote-debugging-port=9222
```

### 2\. Mastraサーバーの起動

エージェントサーバーを開発モードで起動します。

```bash
npm run dev
```

起動後、MastraのPlayground（通常 `http://localhost:3000` などの出力されたURL）にアクセスし、エージェントを選択して対話を開始してください。

### 3\. プロンプト例

**Playwright Executive Agent 向け:**

> "http://localhost:3000 にアクセスして、ログインボタンをクリックしてください。その後、ユーザー名 'admin' でフォームに入力してください。"

**QA Adviser Agent 向け:**

> "現在 `tests/example.spec.ts` のテストが失敗しています。ブラウザでそのページを開いて状態を確認し、テストコードのセレクタが正しいかどうか診断してください。修正案があれば提示してください。"

## 📂 プロジェクト構成

```
playwright-test-agent/
├── src/
│   ├── mastra/
│   │   ├── agents/playwright/
│   │   │   ├── index.ts        # エージェント定義 (Executive & QA Adviser)
│   │   │   ├── prompts.ts      # システムプロンプト (Snapshot-First原則など)
│   │   │   └── failoverModel.ts# AIモデルのフェイルオーバーロジック
│   │   ├── mcp/                # MCPクライアント設定 (Playwright & Filesystem)
│   │   └── index.ts            # Mastraサーバーエントリーポイント
├── prompts/                    # 詳細なインストラクションドキュメント
├── tests/                      # Playwright E2Eテストケース
├── playwright.config.ts        # Playwright設定
├── biome.json                  # Biome設定
└── package.json
```

## 📜 開発コマンド

  - **Lint**: `npm run lint`
  - **Format**: `npm run format`
  - **Check**: `npm run check`
  - **Start Agent Server**: `npm run dev`
  - **Build Server**: `npm run build`
  - **Run E2E Tests**: `npx playwright test`

## 🛡️ ライセンス

ISC
