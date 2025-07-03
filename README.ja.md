# OpenAI WebSearch MCP

OpenAIの [Web search](https://platform.openai.com/docs/guides/tools-web-search?api-mode=responses) を使用してウェブ検索機能を提供するModel Context Protocol (MCP) サーバーです。

## 機能

### 🔍 一般ウェブ検索 (`web_search`)

- 技術的でない質問、時事問題、一般知識向け
- 多様な情報源から関連性と適時性を最適化
- 権威ある情報と新興の視点のバランスを取る

### 💻 開発者向けウェブ検索 (`dev_web_search`)

- ソフトウェア開発、デバッグ、技術調査に特化
- プログラミングソリューションと技術ドキュメントの検索に最適化
- APIドキュメント、ベストプラクティス、セキュリティ修正、実装ガイドをカバー

### 🔧 エラー調査検索 (`debug_error_search`)

- コードのエラーと例外のデバッグに特化
- エラーメッセージをインテリジェントに処理して関連するソリューションを検索
- ビルド失敗、依存関係の競合、ランタイムエラーなどに対応

## インストール

### Claude Code Local Server Connection

- [Understanding MCP server scopes](https://docs.anthropic.com/en/docs/claude-code/mcp#understanding-mcp-server-scopes)

```
$ claude mcp add openai-websearch \
  -e OPENAI_API_KEY=<OPENAI API KEY> \
  -- npx -y @garamon/openai-websearch-mcp openai-websearch
```

```
{
  "mcpServers": {
    "openai-websearch": {
      "type": "stdio",
      "command": "npx",
      "args": [
        "-y",
        "openai-websearch"
      ],
      "env": {
        "OPENAI_API_KEY": "your-openai-api-key-here",
        "OPENAI_MODEL": "o4-mini"
        "SEARCH_CONTEXT_SIZE": "medium"
        "REASONING_EFFORT": "medium"
        "REASONING_SUMMARY": "auto"
      }
    }
  }
}
```

## 設定

### 必須環境変数

- `OPENAI_API_KEY` - OpenAI APIキー（必須）

### 環境変数(オプション)

- `OPENAI_MODEL` - 使用するOpenAIモデル（デフォルト: `o4-mini`）
  - **注意**
    - 2025年7月時点で、`o3`モデルの使用には組織の検証が必要です。
    - tierに依るレート制限があるため、自身にあったモデルを選択してください
- `SEARCH_CONTEXT_SIZE` - 検索コンテキストサイズ: `low`、`medium`、または `high`（デフォルト: `medium`）
  - 指定しない場合は、デフォルト値 または リクエストに応じて適切なコンテキストサイズを決定します。
  - o3, o3-pro, o4-mini, deep research modelsはコンテキストサイズ非対応です [Search context size](https://platform.openai.com/docs/guides/tools-web-search?api-mode=responses#search-context-size)
- `REASONING_EFFORT` - 推論レベル: `low`、`medium`、または `high`（デフォルト: `medium`）
- `REASONING_SUMMARY` - 要約スタイル: `auto`、`concise`、または `detailed`（デフォルト: `auto`）
