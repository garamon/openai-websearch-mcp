# OpenAI WebSearch MCP

A Model Context Protocol (MCP) server that provides web search capabilities using OpenAI's web search tool.

## Features

This MCP server provides three specialized search tools:

### 🔍 General Web Search (`web_search`)

- For non-technical queries, current events, and general knowledge
- Optimizes for relevance and timeliness across diverse sources
- Balances authoritative information with emerging perspectives

### 💻 Developer Web Search (`dev_web_search`)

- Specialized for software development, debugging, and technical research
- Optimized for finding programming solutions and technical documentation
- Covers API docs, best practices, security fixes, and implementation guides

### 🔧 Error Investigation Search (`debug_error_search`)

- Specialized for debugging errors and exceptions in code
- Intelligently processes error messages to find relevant solutions
- Handles build failures, dependency conflicts, runtime errors, and more

## Installation

### Claude Code Local Server Connection

- [Understanding MCP server scopes](https://docs.anthropic.com/en/docs/claude-code/mcp#understanding-mcp-server-scopes)

```
$ claude mcp add openai-websearch \
  -e OPENAI_API_KEY=<OPENAI API KEY> \
  -- npx -y @garamon/openai-websearch-mcp openai-websearch
```

```json
{
  "mcpServers": {
    "openai-websearch": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "openai-websearch"],
      "env": {
        "OPENAI_API_KEY": "your-openai-api-key-here",
        "OPENAI_MODEL": "o4-mini",
        "SEARCH_CONTEXT_SIZE": "medium",
        "REASONING_EFFORT": "medium",
        "REASONING_SUMMARY": "auto"
      }
    }
  }
}
```

## Configuration

### Required Environment Variables

- `OPENAI_API_KEY` - Your OpenAI API key (required)

### Optional Environment Variables

- `OPENAI_MODEL` - The OpenAI model to use (default: `o3`)
  - **Note**: As of July 2025, using the `o3` model requires your organization to be verified. Please ensure your organization has completed verification before using this model.
- `SEARCH_CONTEXT_SIZE` - Default search context size: `low`, `medium`, or `high` (default: `medium`)
  - If not specified, default value will be used or appropriate context size will be determined based on the request
- `REASONING_EFFORT` - Default reasoning effort level: `low`, `medium`, or `high` (default: `medium`)
  - **Note**: As of July 2025, when using the `o3` model, setting this to `high` may result in rate limit errors due to increased token usage.
- `REASONING_SUMMARY` - Default summary style: `auto`, `concise`, or `detailed` (default: `auto`)
