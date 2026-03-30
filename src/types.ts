export interface DfsApiResponse {
  version: string;
  status_code: number;
  status_message: string;
  time: string;
  cost: number;
  tasks_count: number;
  tasks_error: number;
  tasks: DfsTask[];
}

export interface DfsTask {
  id: string;
  status_code: number;
  status_message: string;
  time: string;
  cost: number;
  result_count: number;
  path: string[];
  data: Record<string, unknown>;
  result: unknown[];
}

export interface ToolRegistrar {
  registerTools(server: McpServerType): void;
}

// Re-export for convenience
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
export type McpServerType = McpServer;
