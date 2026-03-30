import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import express from "express";

import { registerSerpTools } from "./tools/serp.js";
import { registerKeywordTools } from "./tools/keywords.js";
import { registerLabsTools } from "./tools/labs.js";
import { registerBacklinksTools } from "./tools/backlinks.js";

const server = new McpServer({
  name: "dataforseo-mcp-server",
  version: "1.0.0",
});

// Register all 55+ tools
registerSerpTools(server);
registerKeywordTools(server);
registerLabsTools(server);
registerBacklinksTools(server);

const app = express();
app.use(express.json());

app.post("/mcp", async (req, res) => {
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
    enableJsonResponse: true,
  });
  res.on("close", () => transport.close());
  await server.connect(transport);
  await transport.handleRequest(req, res, req.body);
});

app.get("/health", (_req, res) => {
  res.json({ status: "ok", server: "dataforseo-mcp-server", version: "1.0.0" });
});

app.get("/", (_req, res) => {
  res.json({
    name: "dataforseo-mcp-server",
    version: "1.0.0",
    transport: "streamable-http",
    endpoint: "/mcp",
    health: "/health",
  });
});

const port = parseInt(process.env.PORT || "3000", 10);
app.listen(port, () => {
  console.error(
    `DataForSEO MCP server running on http://localhost:${port}/mcp`
  );
});
