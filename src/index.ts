import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { randomUUID } from "crypto";
import express from "express";

import { registerSerpTools } from "./tools/serp.js";
import { registerKeywordTools } from "./tools/keywords.js";
import { registerLabsTools } from "./tools/labs.js";
import { registerBacklinksTools } from "./tools/backlinks.js";

function createServer() {
  const server = new McpServer({
    name: "dataforseo-mcp-server",
    version: "1.0.0",
  });
  registerSerpTools(server);
  registerKeywordTools(server);
  registerLabsTools(server);
  registerBacklinksTools(server);
  return server;
}

const SESSION_TTL_MS = 30 * 60 * 1000; // 30 minutes idle timeout

const sessions = new Map<string, { transport: StreamableHTTPServerTransport; timer: ReturnType<typeof setTimeout> }>();

function touchSession(id: string) {
  const session = sessions.get(id);
  if (!session) return;
  clearTimeout(session.timer);
  session.timer = setTimeout(() => {
    session.transport.close();
    sessions.delete(id);
  }, SESSION_TTL_MS);
}

const app = express();
app.use(express.json());

app.post("/mcp", async (req, res) => {
  const sessionId = req.headers["mcp-session-id"] as string | undefined;

  if (sessionId && sessions.has(sessionId)) {
    touchSession(sessionId);
    const session = sessions.get(sessionId)!;
    await session.transport.handleRequest(req, res, req.body);
    return;
  }

  // New session: create server + transport
  const server = createServer();
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: () => randomUUID(),
    enableJsonResponse: true,
  });

  await server.connect(transport);

  const newSessionId = transport.sessionId!;
  const timer = setTimeout(() => {
    transport.close();
    sessions.delete(newSessionId);
  }, SESSION_TTL_MS);
  sessions.set(newSessionId, { transport, timer });

  transport.onclose = () => {
    const session = sessions.get(newSessionId);
    if (session) clearTimeout(session.timer);
    sessions.delete(newSessionId);
  };

  await transport.handleRequest(req, res, req.body);
});

app.get("/health", (_req, res) => {
  res.json({ status: "ok", server: "dataforseo-mcp-server", version: "1.0.0", activeSessions: sessions.size });
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
