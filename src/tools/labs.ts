import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { dfsPost, dfsGet } from "../services/dataforseo-client.js";
import { handleToolError, toolResult } from "../utils/error-handler.js";
import {
  TOOL_ANNOTATIONS,
  DEFAULT_LIMIT,
  DEFAULT_OFFSET,
} from "../constants.js";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Common schema fields shared by most Labs tools. */
function commonFields() {
  return {
    language_code: z.string().optional().default("en").describe("Language code"),
    location_name: z
      .string()
      .optional()
      .default("United States")
      .describe("Location name"),
    limit: z
      .number()
      .min(1)
      .max(1000)
      .optional()
      .default(DEFAULT_LIMIT)
      .describe("Number of results"),
    offset: z
      .number()
      .optional()
      .default(DEFAULT_OFFSET)
      .describe("Results offset"),
    order_by: z.array(z.string()).optional().describe("Order by fields"),
    filters: z
      .array(z.any())
      .max(3)
      .optional()
      .describe("Filter conditions array"),
    include_clickstream_data: z
      .boolean()
      .optional()
      .default(false)
      .describe("Include clickstream data"),
    item_types: z
      .array(z.string())
      .optional()
      .default(["organic"])
      .describe("Item types to return"),
  } as const;
}

/** Locale-only fields (language_code + location_name). */
function localeFields() {
  return {
    language_code: z.string().optional().default("en").describe("Language code"),
    location_name: z
      .string()
      .optional()
      .default("United States")
      .describe("Location name"),
  } as const;
}

/**
 * Build a request body object containing only defined (non-undefined) values.
 */
function buildBody(params: Record<string, unknown>): Record<string, unknown> {
  const body: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) {
      body[key] = value;
    }
  }
  return body;
}

// ---------------------------------------------------------------------------
// Registration
// ---------------------------------------------------------------------------

export function registerLabsTools(server: McpServer): void {
  // 1. Ranked Keywords
  server.tool(
    "dfs_labs_ranked_keywords",
    "Get keywords a domain ranks for with SERP data",
    {
      target: z.string().describe("Target domain"),
      include_subdomains: z.boolean().optional().describe("Include subdomains"),
      ...commonFields(),
    },
    TOOL_ANNOTATIONS,
    async (params) => {
      try {
        const result = await dfsPost(
          "/dataforseo_labs/google/ranked_keywords/live",
          [buildBody(params)]
        );
        return toolResult(result);
      } catch (error) {
        return handleToolError(error);
      }
    }
  );

  // 2. Competitors Domain
  server.tool(
    "dfs_labs_competitors_domain",
    "Find competitor domains with ranking overlap",
    {
      target: z.string().describe("Target domain"),
      exclude_top_domains: z
        .boolean()
        .optional()
        .default(true)
        .describe("Exclude top domains"),
      ignore_synonyms: z
        .boolean()
        .optional()
        .default(true)
        .describe("Ignore synonyms"),
      ...commonFields(),
    },
    TOOL_ANNOTATIONS,
    async (params) => {
      try {
        const result = await dfsPost(
          "/dataforseo_labs/google/competitors_domain/live",
          [buildBody(params)]
        );
        return toolResult(result);
      } catch (error) {
        return handleToolError(error);
      }
    }
  );

  // 3. Domain Rank Overview (no limit/offset/filters/order_by)
  server.tool(
    "dfs_labs_domain_rank_overview",
    "Domain ranking distribution and traffic data",
    {
      target: z.string().describe("Target domain"),
      ignore_synonyms: z
        .boolean()
        .optional()
        .default(true)
        .describe("Ignore synonyms"),
      ...localeFields(),
    },
    TOOL_ANNOTATIONS,
    async (params) => {
      try {
        const result = await dfsPost(
          "/dataforseo_labs/google/domain_rank_overview/live",
          [buildBody(params)]
        );
        return toolResult(result);
      } catch (error) {
        return handleToolError(error);
      }
    }
  );

  // 4. Keyword Ideas
  server.tool(
    "dfs_labs_keyword_ideas",
    "Keyword ideas for seed keywords",
    {
      keywords: z
        .array(z.string())
        .max(200)
        .describe("Seed keywords (up to 200)"),
      ...commonFields(),
    },
    TOOL_ANNOTATIONS,
    async (params) => {
      try {
        const result = await dfsPost(
          "/dataforseo_labs/google/keyword_ideas/live",
          [buildBody(params)]
        );
        return toolResult(result);
      } catch (error) {
        return handleToolError(error);
      }
    }
  );

  // 5. Keyword Suggestions
  server.tool(
    "dfs_labs_keyword_suggestions",
    "Long-tail keyword suggestions",
    {
      keyword: z.string().describe("Seed keyword"),
      ...commonFields(),
    },
    TOOL_ANNOTATIONS,
    async (params) => {
      try {
        const result = await dfsPost(
          "/dataforseo_labs/google/keyword_suggestions/live",
          [buildBody(params)]
        );
        return toolResult(result);
      } catch (error) {
        return handleToolError(error);
      }
    }
  );

  // 6. Related Keywords
  server.tool(
    "dfs_labs_related_keywords",
    "Keywords from related searches",
    {
      keyword: z.string().describe("Seed keyword"),
      depth: z
        .number()
        .min(0)
        .max(4)
        .optional()
        .default(1)
        .describe("Search depth (0-4)"),
      ...commonFields(),
    },
    TOOL_ANNOTATIONS,
    async (params) => {
      try {
        const result = await dfsPost(
          "/dataforseo_labs/google/related_keywords/live",
          [buildBody(params)]
        );
        return toolResult(result);
      } catch (error) {
        return handleToolError(error);
      }
    }
  );

  // 7. Keyword Overview (no limit/offset/filters/order_by)
  server.tool(
    "dfs_labs_keyword_overview",
    "Overview data for keywords",
    {
      keywords: z
        .array(z.string())
        .max(700)
        .describe("Keywords (up to 700)"),
      ...localeFields(),
    },
    TOOL_ANNOTATIONS,
    async (params) => {
      try {
        const result = await dfsPost(
          "/dataforseo_labs/google/keyword_overview/live",
          [buildBody(params)]
        );
        return toolResult(result);
      } catch (error) {
        return handleToolError(error);
      }
    }
  );

  // 8. Historical Keyword Data (no limit/offset/filters/order_by)
  server.tool(
    "dfs_labs_historical_keyword_data",
    "Historical keyword data since Aug 2021",
    {
      keywords: z
        .array(z.string())
        .max(700)
        .describe("Keywords (up to 700)"),
      ...localeFields(),
    },
    TOOL_ANNOTATIONS,
    async (params) => {
      try {
        const result = await dfsPost(
          "/dataforseo_labs/google/historical_keyword_data/live",
          [buildBody(params)]
        );
        return toolResult(result);
      } catch (error) {
        return handleToolError(error);
      }
    }
  );

  // 9. Historical SERP (no limit/offset/filters/order_by)
  server.tool(
    "dfs_labs_historical_serp",
    "Historical Google SERPs",
    {
      keyword: z.string().describe("Target keyword"),
      ...localeFields(),
    },
    TOOL_ANNOTATIONS,
    async (params) => {
      try {
        const result = await dfsPost(
          "/dataforseo_labs/google/historical_serps/live",
          [buildBody(params)]
        );
        return toolResult(result);
      } catch (error) {
        return handleToolError(error);
      }
    }
  );

  // 10. Historical Rank Overview (no limit/offset/filters/order_by)
  server.tool(
    "dfs_labs_historical_rank_overview",
    "Historical rankings for a domain",
    {
      target: z.string().describe("Target domain"),
      ignore_synonyms: z
        .boolean()
        .optional()
        .default(true)
        .describe("Ignore synonyms"),
      ...localeFields(),
    },
    TOOL_ANNOTATIONS,
    async (params) => {
      try {
        const result = await dfsPost(
          "/dataforseo_labs/google/historical_rank_overview/live",
          [buildBody(params)]
        );
        return toolResult(result);
      } catch (error) {
        return handleToolError(error);
      }
    }
  );

  // 11. SERP Competitors
  server.tool(
    "dfs_labs_serp_competitors",
    "Domains ranking for specified keywords",
    {
      keywords: z
        .array(z.string())
        .max(200)
        .describe("Keywords (up to 200)"),
      include_subdomains: z.boolean().optional().describe("Include subdomains"),
      ...commonFields(),
    },
    TOOL_ANNOTATIONS,
    async (params) => {
      try {
        const result = await dfsPost(
          "/dataforseo_labs/google/serp_competitors/live",
          [buildBody(params)]
        );
        return toolResult(result);
      } catch (error) {
        return handleToolError(error);
      }
    }
  );

  // 12. Subdomains
  server.tool(
    "dfs_labs_subdomains",
    "Subdomains with ranking data",
    {
      target: z.string().describe("Target domain"),
      ignore_synonyms: z
        .boolean()
        .optional()
        .default(true)
        .describe("Ignore synonyms"),
      ...commonFields(),
    },
    TOOL_ANNOTATIONS,
    async (params) => {
      try {
        const result = await dfsPost(
          "/dataforseo_labs/google/subdomains/live",
          [buildBody(params)]
        );
        return toolResult(result);
      } catch (error) {
        return handleToolError(error);
      }
    }
  );

  // 13. Relevant Pages
  server.tool(
    "dfs_labs_relevant_pages",
    "Pages with ranking data",
    {
      target: z.string().describe("Target domain"),
      exclude_top_domains: z
        .boolean()
        .optional()
        .default(true)
        .describe("Exclude top domains"),
      ignore_synonyms: z
        .boolean()
        .optional()
        .default(true)
        .describe("Ignore synonyms"),
      ...commonFields(),
    },
    TOOL_ANNOTATIONS,
    async (params) => {
      try {
        const result = await dfsPost(
          "/dataforseo_labs/google/relevant_pages/live",
          [buildBody(params)]
        );
        return toolResult(result);
      } catch (error) {
        return handleToolError(error);
      }
    }
  );

  // 14. Keywords for Site
  server.tool(
    "dfs_labs_keywords_for_site",
    "Keywords relevant to a domain",
    {
      target: z.string().describe("Target domain"),
      include_subdomains: z.boolean().optional().describe("Include subdomains"),
      ...commonFields(),
    },
    TOOL_ANNOTATIONS,
    async (params) => {
      try {
        const result = await dfsPost(
          "/dataforseo_labs/google/keywords_for_site/live",
          [buildBody(params)]
        );
        return toolResult(result);
      } catch (error) {
        return handleToolError(error);
      }
    }
  );

  // 15. Domain Intersection
  server.tool(
    "dfs_labs_domain_intersection",
    "Keywords where two domains rank",
    {
      target1: z.string().describe("First target domain"),
      target2: z.string().describe("Second target domain"),
      intersections: z
        .boolean()
        .optional()
        .default(true)
        .describe("Only show intersecting keywords"),
      ignore_synonyms: z
        .boolean()
        .optional()
        .default(true)
        .describe("Ignore synonyms"),
      ...commonFields(),
    },
    TOOL_ANNOTATIONS,
    async (params) => {
      try {
        const { target1, target2, intersections, ignore_synonyms, ...rest } = params;
        const body = buildBody({
          targets: { "1": target1, "2": target2 },
          intersections,
          ignore_synonyms,
          ...rest,
        });
        // Remove target1/target2 if they leaked into body
        delete body.target1;
        delete body.target2;
        const result = await dfsPost(
          "/dataforseo_labs/google/domain_intersection/live",
          [body]
        );
        return toolResult(result);
      } catch (error) {
        return handleToolError(error);
      }
    }
  );

  // 16. Page Intersection
  server.tool(
    "dfs_labs_page_intersection",
    "Keywords where pages rank",
    {
      pages: z
        .array(z.string())
        .max(20)
        .describe("Page URLs (up to 20)"),
      exclude_pages: z
        .array(z.string())
        .max(10)
        .optional()
        .describe("Pages to exclude (up to 10)"),
      intersection_mode: z
        .enum(["union", "intersect"])
        .optional()
        .describe("Intersection mode"),
      ...commonFields(),
    },
    TOOL_ANNOTATIONS,
    async (params) => {
      try {
        const { pages, ...rest } = params;
        const pagesObj: Record<string, string> = {};
        pages.forEach((url, index) => {
          pagesObj[String(index + 1)] = url;
        });
        const body = buildBody({
          pages: pagesObj,
          ...rest,
        });
        const result = await dfsPost(
          "/dataforseo_labs/google/page_intersection/live",
          [body]
        );
        return toolResult(result);
      } catch (error) {
        return handleToolError(error);
      }
    }
  );

  // 17. Bulk Keyword Difficulty (no limit/offset/filters/order_by)
  server.tool(
    "dfs_labs_bulk_keyword_difficulty",
    "Keyword Difficulty scores",
    {
      keywords: z
        .array(z.string())
        .max(1000)
        .describe("Keywords (up to 1000)"),
      ...localeFields(),
    },
    TOOL_ANNOTATIONS,
    async (params) => {
      try {
        const result = await dfsPost(
          "/dataforseo_labs/google/bulk_keyword_difficulty/live",
          [buildBody(params)]
        );
        return toolResult(result);
      } catch (error) {
        return handleToolError(error);
      }
    }
  );

  // 18. Bulk Traffic Estimation (no limit/offset/filters)
  server.tool(
    "dfs_labs_bulk_traffic_estimation",
    "Monthly traffic estimation",
    {
      targets: z
        .array(z.string())
        .max(1000)
        .describe("Target domains (up to 1000)"),
      ignore_synonyms: z
        .boolean()
        .optional()
        .default(true)
        .describe("Ignore synonyms"),
      ...localeFields(),
    },
    TOOL_ANNOTATIONS,
    async (params) => {
      try {
        const result = await dfsPost(
          "/dataforseo_labs/google/bulk_traffic_estimation/live",
          [buildBody(params)]
        );
        return toolResult(result);
      } catch (error) {
        return handleToolError(error);
      }
    }
  );

  // 19. Search Intent (no limit/offset/filters/order_by)
  server.tool(
    "dfs_labs_search_intent",
    "Search intent classification",
    {
      keywords: z
        .array(z.string())
        .max(1000)
        .describe("Keywords (up to 1000)"),
      ...localeFields(),
    },
    TOOL_ANNOTATIONS,
    async (params) => {
      try {
        const result = await dfsPost(
          "/dataforseo_labs/google/search_intent/live",
          [buildBody(params)]
        );
        return toolResult(result);
      } catch (error) {
        return handleToolError(error);
      }
    }
  );

  // 20. Top Searches
  server.tool(
    "dfs_labs_top_searches",
    "Access keywords with Google Ads metrics",
    {
      ...commonFields(),
    },
    TOOL_ANNOTATIONS,
    async (params) => {
      try {
        const result = await dfsPost(
          "/dataforseo_labs/google/top_searches/live",
          [buildBody(params)]
        );
        return toolResult(result);
      } catch (error) {
        return handleToolError(error);
      }
    }
  );

  // 21. Available Filters (GET)
  server.tool(
    "dfs_labs_available_filters",
    "Get available filter fields",
    {
      tool: z.string().optional().describe("Specific tool to get filters for"),
    },
    TOOL_ANNOTATIONS,
    async (params) => {
      try {
        const path = params.tool
          ? `/dataforseo_labs/filters/${params.tool}`
          : "/dataforseo_labs/filters";
        const result = await dfsGet(path);
        return toolResult(result);
      } catch (error) {
        return handleToolError(error);
      }
    }
  );
}
