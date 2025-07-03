#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';
import { OpenAI } from 'openai';
import packageJson from '../package.json' with { type: 'json' };

enum SearchContextSize {
  Low = 'low',
  Medium = 'medium',
  High = 'high',
}

enum ReasoningEffort {
  Low = 'low',
  Medium = 'medium',
  High = 'high',
}

enum ReasoningSummary {
  Auto = 'auto',
  Concise = 'concise',
  Detailed = 'detailed',
}

enum ToolName {
  WebSearch = 'web_search',
  DevWebSearch = 'dev_web_search',
  DebugErrorSearch = 'debug_error_search',
}

interface SearchArgs {
  query: string;
  search_context_size?: SearchContextSize;
}

function parseEnum<T extends Record<string, string>>(
  value: string | undefined,
  enumObj: T
): T[keyof T] | undefined {
  if (!value) return undefined;
  const enumValues = Object.values(enumObj);
  if (enumValues.includes(value)) {
    return value as T[keyof T];
  }
  console.error(
    `Invalid enum value: ${value}. Expected one of: ${enumValues.join(', ')}`
  );
  return undefined;
}

const config = {
  apiKey: process.env.OPENAI_API_KEY || '',
  model: process.env.OPENAI_MODEL || 'o4-mini',
  searchContextSize(argValue?: SearchContextSize): SearchContextSize {
    // Priority: Environment variable > Argument value > Default
    const envValue = parseEnum(
      process.env.SEARCH_CONTEXT_SIZE,
      SearchContextSize
    );
    return envValue || argValue || SearchContextSize.Medium;
  },
  reasoningEffort:
    parseEnum(process.env.REASONING_EFFORT, ReasoningEffort) ||
    ReasoningEffort.Medium,
  reasoningSummary:
    parseEnum(process.env.REASONING_SUMMARY, ReasoningSummary) ||
    ReasoningSummary.Auto,
};

if (!config.apiKey) {
  console.error('Error: OPENAI_API_KEY environment variable is required');
  process.exit(1);
}

const GENERAL_SEARCH_TOOL: Tool = {
  name: ToolName.WebSearch,
  description: `General web search for current information, news, and diverse content.

  WHEN TO USE:
  - Non-technical queries and general knowledge
  - Current events and news updates
  - Broad research topics
  - When specialized tools don't apply

  SEARCH APPROACH:
  Optimizes queries for relevance and timeliness across diverse sources,
  balancing authoritative information with emerging perspectives.`,
  inputSchema: {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description: 'Search query for any topic',
      },
      search_context_size: {
        type: 'string',
        enum: ['low', 'medium', 'high'],
        description: `Scope of information sources.
        "low": Focused search on most authoritative sources.
        "medium": Diverse sources for balanced perspective.
        "high": Extensive search across wide range of sources.`,
        default: 'medium',
      },
    },
    required: ['query'],
  },
};

const DEVELOPER_WEB_SEARCH_TOOL: Tool = {
  name: ToolName.DevWebSearch,
  description: `Specialized web search for software development, debugging, and technical research.
    Optimized for finding solutions to programming problems and technical documentation.

    PRIMARY USE CASES:
    - API documentation and usage examples
    - Library/framework specific questions (React hooks, Python packages, etc.)
    - Best practices and design patterns
    - Security vulnerabilities and fixes (CVEs, security advisories)
    - Performance optimization techniques
    - Compatibility issues between versions
    - Implementation tutorials and guides

    SEARCH APPROACH:
    Intelligently optimizes queries based on the specific context and needs,
    prioritizing official docs, GitHub, and Stack Overflow for reliable solutions.
    Version numbers are included for accuracy when relevant.

    EXAMPLE USE CASES (not exhaustive):
    - Implementation questions across various technologies
    - Migration and upgrade scenarios
    - Configuration and setup tasks
    - Architecture and design considerations
    - Performance and security optimizations
    - DevOps and automation workflows
    - And many other development challenges`,

  inputSchema: {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description: `Technical search query optimized for developer needs.
        CORE ELEMENTS TO INCLUDE:
        - What you're trying to achieve (implement, debug, optimize, etc.)
        - Technology stack and versions when relevant
        - Specific feature or API you're working with

        Query enhancement includes:
        - Adding appropriate technical keywords (tutorial, example, best practices)
        - Optimizing for official documentation and trusted sources
        - Considering current technology trends and patterns
        - Focusing on practical, implementable solutions`,
      },
      search_context_size: {
        type: 'string',
        enum: ['medium', 'high'],
        description: `Research thoroughness and reliability balance.
        "medium": Prioritizes verified solutions from established sources - official docs, highly-rated community answers, stable releases.
        "high": Comprehensive exploration including experimental solutions - beta documentation, ongoing discussions, pull requests, and emerging practices.`,
        default: 'medium',
      },
    },
    required: ['query'],
  },
};

const ERROR_INVESTIGATION_TOOL: Tool = {
  name: ToolName.DebugErrorSearch,
  description: `Specialized search for debugging errors and exceptions in code.

  WHEN TO USE:
  - Encountering runtime errors or exceptions
  - Build/compilation failures
  - Dependency conflicts
  - Mysterious behavior or edge cases
  - CI/CD pipeline failures

  HOW IT WORKS:
  Intelligently processes error messages to find the most relevant solutions,
  leveraging official documentation, community knowledge, and recent fixes.
  The search adapts to your specific technology stack and error context.

  COMMON ERROR TYPES HANDLED:
  Including but not limited to:
  - Module resolution and dependency errors
  - Type system and compilation errors
  - Build tool and bundler issues
  - Container and deployment problems
  - API and network-related errors
  - Cross-platform compatibility issues
  - And any other error patterns you encounter`,

  inputSchema: {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description: `Error search query optimized for maximum relevance.
        ESSENTIAL COMPONENTS:
        - Core error message (sanitized of personal/path information)
        - Technology stack and versions involved
        - Environment context when applicable

        Intelligently formats the query based on:
        - Error type and severity
        - Technology-specific search patterns
        - Current best practices for finding solutions

        The query will be optimized for finding the most relevant, recent, and reliable fixes.`,
      },
      search_context_size: {
        type: 'string',
        enum: ['medium', 'high'],
        description: `Fix reliability vs coverage.
        "medium": Community-validated fixes from multiple sources.
        "high": Every possible solution including experimental fixes and workarounds - use for stubborn bugs.`,
      },
    },
    required: ['query'],
  },
};

const server = new Server(
  {
    name: 'openai-web-search',
    version: packageJson.version,
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

const openai = new OpenAI({
  apiKey: config.apiKey,
});

server.setRequestHandler(ListToolsRequestSchema, () => ({
  tools: [
    GENERAL_SEARCH_TOOL,
    DEVELOPER_WEB_SEARCH_TOOL,
    ERROR_INVESTIGATION_TOOL,
  ],
}));

function isSearchArgs(args: unknown): args is SearchArgs {
  return (
    typeof args === 'object' &&
    args !== null &&
    'query' in args &&
    typeof (args as SearchArgs).query === 'string'
  );
}

async function performWebSearch(args: SearchArgs) {
  const contextSize = config.searchContextSize(args.search_context_size);

  // https://platform.openai.com/docs/guides/tools-web-search?api-mode=responses
  const response = await openai.responses.create({
    model: config.model,
    tools: [
      {
        type: 'web_search_preview',
        user_location: null,
        search_context_size: contextSize,
      },
    ],
    input: args.query,
    reasoning: {
      effort: config.reasoningEffort,
      summary: config.reasoningSummary,
    },
  });

  const metaInfo = `[model: ${config.model}, search_context_size: ${contextSize}]\n\n`;
  return metaInfo + (response.output_text || 'No results found');
}

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  if (!isSearchArgs(args)) {
    return {
      content: [{ type: 'text', text: 'Error: query parameter is required' }],
      isError: true,
    };
  }

  try {
    const results = await performWebSearch(args);

    let prefix = '';
    switch (name as ToolName) {
      case ToolName.WebSearch:
        prefix = '🔍 WEB SEARCH RESULTS: ';
        break;
      case ToolName.DevWebSearch:
        prefix = '💻 TECHNICAL SEARCH RESULTS: ';
        break;
      case ToolName.DebugErrorSearch:
        prefix = '🔧 DEBUG SEARCH RESULTS: ';
        break;
    }
    return {
      content: [{ type: 'text', text: prefix + results }],
      isError: false,
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `Error: ${
            error instanceof Error ? error.message : String(error)
          }`,
        },
      ],
      isError: true,
    };
  }
});

async function runServer() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.log('OpenAI Web Search MCP Server running on stdio');
}

runServer().catch((error) => {
  console.error('Fatal error running server:', error);
  process.exit(1);
});
