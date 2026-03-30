import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { dfsPost, dfsGet } from "../services/dataforseo-client.js";
import { handleToolError, toolResult } from "../utils/error-handler.js";
import { TOOL_ANNOTATIONS, DEFAULT_LIMIT, DEFAULT_OFFSET } from "../constants.js";

// ---------------------------------------------------------------------------
// Shared Zod schemas for common backlinks parameters
// ---------------------------------------------------------------------------

const commonParams = {
  limit: z
    .number()
    .min(1)
    .max(1000)
    .default(DEFAULT_LIMIT)
    .optional()
    .describe("Maximum number of results to return (1-1000)"),
  offset: z
    .number()
    .min(0)
    .default(DEFAULT_OFFSET)
    .optional()
    .describe("Offset for pagination"),
  order_by: z
    .array(z.string())
    .optional()
    .describe("Sorting rules, e.g. ['rank,desc']"),
  filters: z
    .array(z.any())
    .max(3)
    .optional()
    .describe("Filter conditions (max 3 elements)"),
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Build a request body, keeping only keys whose values are defined. */
function buildBody(
  params: Record<string, unknown>
): Record<string, unknown> {
  const body: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) {
      body[key] = value;
    }
  }
  return body;
}

/** Convert a targets array to the indexed object DataForSEO expects. */
function targetsToMap(
  targets: string[]
): Record<string, string> {
  const map: Record<string, string> = {};
  targets.forEach((t, i) => {
    map[String(i + 1)] = t;
  });
  return map;
}

// ---------------------------------------------------------------------------
// Registration
// ---------------------------------------------------------------------------

export function registerBacklinksTools(server: McpServer): void {
  // 1. Summary
  server.tool(
    "dfs_backlinks_summary",
    "Overview of backlinks data",
    {
      target: z.string().describe("Domain, subdomain, or URL to analyze"),
      include_subdomains: z
        .boolean()
        .default(true)
        .optional()
        .describe("Include subdomains in results"),
      exclude_internal_backlinks: z
        .boolean()
        .default(true)
        .optional()
        .describe("Exclude internal backlinks"),
    },
    TOOL_ANNOTATIONS,
    async ({ target, include_subdomains, exclude_internal_backlinks }) => {
      try {
        const body = buildBody({
          target,
          include_subdomains,
          exclude_internal_backlinks,
        });
        const result = await dfsPost("/backlinks/summary/live", [body]);
        return toolResult(result);
      } catch (error) {
        return handleToolError(error);
      }
    }
  );

  // 2. Backlinks
  server.tool(
    "dfs_backlinks_backlinks",
    "List of backlinks for a target",
    {
      target: z.string().describe("Domain, subdomain, or URL to analyze"),
      mode: z
        .enum(["as_is", "one_per_domain", "one_per_anchor"])
        .default("as_is")
        .optional()
        .describe("Deduplication mode"),
      ...commonParams,
    },
    TOOL_ANNOTATIONS,
    async ({ target, mode, limit, offset, order_by, filters }) => {
      try {
        const body = buildBody({ target, mode, limit, offset, order_by, filters });
        const result = await dfsPost("/backlinks/backlinks/live", [body]);
        return toolResult(result);
      } catch (error) {
        return handleToolError(error);
      }
    }
  );

  // 3. Anchors
  server.tool(
    "dfs_backlinks_anchors",
    "Anchors used when linking to target",
    {
      target: z.string().describe("Domain, subdomain, or URL to analyze"),
      ...commonParams,
    },
    TOOL_ANNOTATIONS,
    async ({ target, limit, offset, order_by, filters }) => {
      try {
        const body = buildBody({ target, limit, offset, order_by, filters });
        const result = await dfsPost("/backlinks/anchors/live", [body]);
        return toolResult(result);
      } catch (error) {
        return handleToolError(error);
      }
    }
  );

  // 4. Referring Domains
  server.tool(
    "dfs_backlinks_referring_domains",
    "Referring domains",
    {
      target: z.string().describe("Domain, subdomain, or URL to analyze"),
      ...commonParams,
    },
    TOOL_ANNOTATIONS,
    async ({ target, limit, offset, order_by, filters }) => {
      try {
        const body = buildBody({ target, limit, offset, order_by, filters });
        const result = await dfsPost("/backlinks/referring_domains/live", [body]);
        return toolResult(result);
      } catch (error) {
        return handleToolError(error);
      }
    }
  );

  // 5. Referring Networks
  server.tool(
    "dfs_backlinks_referring_networks",
    "Referring networks by IP/subnet",
    {
      target: z.string().describe("Domain, subdomain, or URL to analyze"),
      network_address_type: z
        .enum(["ip", "subnet"])
        .default("ip")
        .optional()
        .describe("Type of network address grouping"),
      ...commonParams,
    },
    TOOL_ANNOTATIONS,
    async ({ target, network_address_type, limit, offset, order_by, filters }) => {
      try {
        const body = buildBody({
          target,
          network_address_type,
          limit,
          offset,
          order_by,
          filters,
        });
        const result = await dfsPost("/backlinks/referring_networks/live", [body]);
        return toolResult(result);
      } catch (error) {
        return handleToolError(error);
      }
    }
  );

  // 6. Domain Pages
  server.tool(
    "dfs_backlinks_domain_pages",
    "Domain pages with backlink data",
    {
      target: z.string().describe("Domain, subdomain, or URL to analyze"),
      ...commonParams,
    },
    TOOL_ANNOTATIONS,
    async ({ target, limit, offset, order_by, filters }) => {
      try {
        const body = buildBody({ target, limit, offset, order_by, filters });
        const result = await dfsPost("/backlinks/domain_pages/live", [body]);
        return toolResult(result);
      } catch (error) {
        return handleToolError(error);
      }
    }
  );

  // 7. Domain Pages Summary
  server.tool(
    "dfs_backlinks_domain_pages_summary",
    "Summary data on all backlinks per page",
    {
      target: z.string().describe("Domain, subdomain, or URL to analyze"),
      ...commonParams,
    },
    TOOL_ANNOTATIONS,
    async ({ target, limit, offset, order_by, filters }) => {
      try {
        const body = buildBody({ target, limit, offset, order_by, filters });
        const result = await dfsPost("/backlinks/domain_pages_summary/live", [body]);
        return toolResult(result);
      } catch (error) {
        return handleToolError(error);
      }
    }
  );

  // 8. Competitors
  server.tool(
    "dfs_backlinks_competitors",
    "Competitors sharing backlink overlap",
    {
      target: z.string().describe("Domain, subdomain, or URL to analyze"),
      exclude_internal_backlinks: z
        .boolean()
        .default(true)
        .optional()
        .describe("Exclude internal backlinks"),
      exclude_large_domains: z
        .boolean()
        .default(true)
        .optional()
        .describe("Exclude large generic domains"),
      main_domain: z
        .boolean()
        .default(true)
        .optional()
        .describe("Return main domain results"),
      ...commonParams,
    },
    TOOL_ANNOTATIONS,
    async ({
      target,
      exclude_internal_backlinks,
      exclude_large_domains,
      main_domain,
      limit,
      offset,
      order_by,
      filters,
    }) => {
      try {
        const body = buildBody({
          target,
          exclude_internal_backlinks,
          exclude_large_domains,
          main_domain,
          limit,
          offset,
          order_by,
          filters,
        });
        const result = await dfsPost("/backlinks/competitors/live", [body]);
        return toolResult(result);
      } catch (error) {
        return handleToolError(error);
      }
    }
  );

  // 9. Domain Intersection
  server.tool(
    "dfs_backlinks_domain_intersection",
    "Link Gap tool for domains",
    {
      targets: z
        .array(z.string())
        .min(1)
        .max(20)
        .describe("Array of domains to compare (up to 20)"),
      ...commonParams,
    },
    TOOL_ANNOTATIONS,
    async ({ targets, limit, offset, order_by, filters }) => {
      try {
        const body = buildBody({
          targets: targetsToMap(targets),
          limit,
          offset,
          order_by,
          filters,
        });
        const result = await dfsPost("/backlinks/domain_intersection/live", [body]);
        return toolResult(result);
      } catch (error) {
        return handleToolError(error);
      }
    }
  );

  // 10. Page Intersection
  server.tool(
    "dfs_backlinks_page_intersection",
    "Link Gap for pages",
    {
      targets: z
        .array(z.string())
        .min(1)
        .max(20)
        .describe("Array of page URLs to compare (up to 20)"),
      ...commonParams,
    },
    TOOL_ANNOTATIONS,
    async ({ targets, limit, offset, order_by, filters }) => {
      try {
        const body = buildBody({
          targets: targetsToMap(targets),
          limit,
          offset,
          order_by,
          filters,
        });
        const result = await dfsPost("/backlinks/page_intersection/live", [body]);
        return toolResult(result);
      } catch (error) {
        return handleToolError(error);
      }
    }
  );

  // 11. Timeseries Summary
  server.tool(
    "dfs_backlinks_timeseries_summary",
    "Time-series backlink data",
    {
      target: z.string().describe("Domain, subdomain, or URL to analyze"),
      date_from: z
        .string()
        .optional()
        .describe("Start date in YYYY-MM-DD format"),
      date_to: z
        .string()
        .optional()
        .describe("End date in YYYY-MM-DD format"),
      group_range: z
        .enum(["day", "week", "month", "year"])
        .default("month")
        .optional()
        .describe("Time grouping interval"),
    },
    TOOL_ANNOTATIONS,
    async ({ target, date_from, date_to, group_range }) => {
      try {
        const body = buildBody({ target, date_from, date_to, group_range });
        const result = await dfsPost("/backlinks/timeseries_summary/live", [body]);
        return toolResult(result);
      } catch (error) {
        return handleToolError(error);
      }
    }
  );

  // 12. Timeseries New/Lost
  server.tool(
    "dfs_backlinks_timeseries_new_lost",
    "New/lost backlinks over time",
    {
      target: z.string().describe("Domain, subdomain, or URL to analyze"),
      date_from: z
        .string()
        .optional()
        .describe("Start date in YYYY-MM-DD format"),
      date_to: z
        .string()
        .optional()
        .describe("End date in YYYY-MM-DD format"),
      group_range: z
        .enum(["day", "week", "month", "year"])
        .default("month")
        .optional()
        .describe("Time grouping interval"),
    },
    TOOL_ANNOTATIONS,
    async ({ target, date_from, date_to, group_range }) => {
      try {
        const body = buildBody({ target, date_from, date_to, group_range });
        const result = await dfsPost(
          "/backlinks/timeseries_new_lost_summary/live",
          [body]
        );
        return toolResult(result);
      } catch (error) {
        return handleToolError(error);
      }
    }
  );

  // 13. Bulk Backlinks
  server.tool(
    "dfs_backlinks_bulk_backlinks",
    "Backlink counts for up to 1000 targets",
    {
      targets: z
        .array(z.string())
        .min(1)
        .max(1000)
        .describe("Array of domains/URLs to check (up to 1000)"),
    },
    TOOL_ANNOTATIONS,
    async ({ targets }) => {
      try {
        const body = buildBody({ targets });
        const result = await dfsPost("/backlinks/bulk_backlinks/live", [body]);
        return toolResult(result);
      } catch (error) {
        return handleToolError(error);
      }
    }
  );

  // 14. Bulk Referring Domains
  server.tool(
    "dfs_backlinks_bulk_referring_domains",
    "Referring domain counts",
    {
      targets: z
        .array(z.string())
        .min(1)
        .describe("Array of domains/URLs to check"),
    },
    TOOL_ANNOTATIONS,
    async ({ targets }) => {
      try {
        const body = buildBody({ targets });
        const result = await dfsPost("/backlinks/bulk_referring_domains/live", [body]);
        return toolResult(result);
      } catch (error) {
        return handleToolError(error);
      }
    }
  );

  // 15. Bulk Ranks
  server.tool(
    "dfs_backlinks_bulk_ranks",
    "Rank scores for targets",
    {
      targets: z
        .array(z.string())
        .min(1)
        .describe("Array of domains/URLs to check"),
      rank_scale: z
        .enum(["one_hundred", "one_thousand"])
        .default("one_thousand")
        .optional()
        .describe("Scale for rank values"),
    },
    TOOL_ANNOTATIONS,
    async ({ targets, rank_scale }) => {
      try {
        const body = buildBody({ targets, rank_scale });
        const result = await dfsPost("/backlinks/bulk_ranks/live", [body]);
        return toolResult(result);
      } catch (error) {
        return handleToolError(error);
      }
    }
  );

  // 16. Bulk Spam Score
  server.tool(
    "dfs_backlinks_bulk_spam_score",
    "Spam scores for targets",
    {
      targets: z
        .array(z.string())
        .min(1)
        .describe("Array of domains/URLs to check"),
    },
    TOOL_ANNOTATIONS,
    async ({ targets }) => {
      try {
        const body = buildBody({ targets });
        const result = await dfsPost("/backlinks/bulk_spam_score/live", [body]);
        return toolResult(result);
      } catch (error) {
        return handleToolError(error);
      }
    }
  );

  // 17. Bulk New/Lost Backlinks
  server.tool(
    "dfs_backlinks_bulk_new_lost_backlinks",
    "New/lost backlink counts",
    {
      targets: z
        .array(z.string())
        .min(1)
        .describe("Array of domains/URLs to check"),
      date_from: z
        .string()
        .optional()
        .describe("Start date in YYYY-MM-DD format"),
    },
    TOOL_ANNOTATIONS,
    async ({ targets, date_from }) => {
      try {
        const body = buildBody({ targets, date_from });
        const result = await dfsPost(
          "/backlinks/bulk_new_lost_backlinks/live",
          [body]
        );
        return toolResult(result);
      } catch (error) {
        return handleToolError(error);
      }
    }
  );

  // 18. Bulk New/Lost Referring Domains
  server.tool(
    "dfs_backlinks_bulk_new_lost_referring_domains",
    "New/lost referring domain counts",
    {
      targets: z
        .array(z.string())
        .min(1)
        .describe("Array of domains/URLs to check"),
      date_from: z
        .string()
        .optional()
        .describe("Start date in YYYY-MM-DD format"),
    },
    TOOL_ANNOTATIONS,
    async ({ targets, date_from }) => {
      try {
        const body = buildBody({ targets, date_from });
        const result = await dfsPost(
          "/backlinks/bulk_new_lost_referring_domains/live",
          [body]
        );
        return toolResult(result);
      } catch (error) {
        return handleToolError(error);
      }
    }
  );

  // 19. Bulk Pages Summary
  server.tool(
    "dfs_backlinks_bulk_pages_summary",
    "Comprehensive backlink overview",
    {
      targets: z
        .array(z.string())
        .min(1)
        .describe("Array of domains/URLs to check"),
      include_subdomains: z
        .boolean()
        .default(true)
        .optional()
        .describe("Include subdomains in results"),
    },
    TOOL_ANNOTATIONS,
    async ({ targets, include_subdomains }) => {
      try {
        const body = buildBody({ targets, include_subdomains });
        const result = await dfsPost("/backlinks/bulk_pages_summary/live", [body]);
        return toolResult(result);
      } catch (error) {
        return handleToolError(error);
      }
    }
  );

  // 20. Available Filters (GET endpoint)
  server.tool(
    "dfs_backlinks_available_filters",
    "Get available filter fields",
    {
      tool: z
        .string()
        .optional()
        .describe("Specific backlinks tool to get filters for"),
    },
    TOOL_ANNOTATIONS,
    async ({ tool }) => {
      try {
        const path = tool
          ? `/backlinks/filters?tool=${encodeURIComponent(tool)}`
          : "/backlinks/filters";
        const result = await dfsGet(path);
        return toolResult(result);
      } catch (error) {
        return handleToolError(error);
      }
    }
  );
}
