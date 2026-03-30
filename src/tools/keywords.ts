import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { dfsPost, dfsGet } from "../services/dataforseo-client.js";
import { handleToolError, toolResult } from "../utils/error-handler.js";
import { TOOL_ANNOTATIONS } from "../constants.js";

export function registerKeywordTools(server: McpServer): void {
  // 1. Google Ads Search Volume
  server.tool(
    "dfs_kw_google_ads_search_volume",
    "Get search volume data for keywords from Google Ads. Returns monthly search volumes, competition, CPC, and other metrics.",
    {
      keywords: z.array(z.string()).describe("List of keywords to get search volume for"),
      location_name: z.string().optional().default("United States").describe("Location name for the search"),
      language_code: z.string().nullable().optional().describe("Language code (e.g. 'en')"),
    },
    TOOL_ANNOTATIONS,
    async ({ keywords, location_name, language_code }) => {
      try {
        const body: Record<string, unknown> = { keywords, location_name };
        if (language_code !== undefined && language_code !== null) {
          body.language_code = language_code;
        }
        const result = await dfsPost("/v3/keywords_data/google_ads/search_volume/live", [body]);
        return toolResult(result);
      } catch (e) {
        return handleToolError(e);
      }
    }
  );

  // 2. Google Ads Locations
  server.tool(
    "dfs_kw_google_ads_locations",
    "Get available Google Ads locations for keyword data. Returns location names, codes, and types filtered by country.",
    {
      country_iso_code: z.string().describe("ISO country code (e.g. 'US')"),
      location_name: z.string().optional().describe("Filter by location name"),
      location_type: z.string().optional().describe("Filter by location type"),
    },
    TOOL_ANNOTATIONS,
    async ({ country_iso_code, location_name, location_type }) => {
      try {
        const params = new URLSearchParams();
        params.set("country_iso_code", country_iso_code);
        if (location_name !== undefined) params.set("location_name", location_name);
        if (location_type !== undefined) params.set("location_type", location_type);
        const result = await dfsGet(`/v3/keywords_data/google_ads/locations?${params.toString()}`);
        return toolResult(result);
      } catch (e) {
        return handleToolError(e);
      }
    }
  );

  // 3. Google Trends Explore
  server.tool(
    "dfs_kw_google_trends_explore",
    "Explore Google Trends data for up to 5 keywords. Returns trend graphs, interest over time, and related queries.",
    {
      keywords: z.array(z.string()).max(5).describe("Keywords to explore (max 5)"),
      type: z.enum(["web", "news", "youtube", "images", "froogle"]).optional().default("web").describe("Type of search"),
      time_range: z.enum([
        "past_hour", "past_4_hours", "past_day", "past_7_days",
        "past_30_days", "past_90_days", "past_12_months", "past_5_years",
      ]).optional().default("past_7_days").describe("Time range for trends data"),
      date_from: z.string().optional().describe("Start date (YYYY-MM-DD)"),
      date_to: z.string().optional().describe("End date (YYYY-MM-DD)"),
      location_name: z.string().nullable().optional().describe("Location name"),
      language_code: z.string().nullable().optional().describe("Language code"),
      category_code: z.number().nullable().optional().describe("Google Trends category code"),
      item_types: z.array(z.string()).optional().default(["google_trends_graph"]).describe("Item types to return"),
    },
    TOOL_ANNOTATIONS,
    async ({ keywords, type, time_range, date_from, date_to, location_name, language_code, category_code, item_types }) => {
      try {
        const body: Record<string, unknown> = { keywords, type, time_range, item_types };
        if (date_from !== undefined) body.date_from = date_from;
        if (date_to !== undefined) body.date_to = date_to;
        if (location_name !== undefined && location_name !== null) body.location_name = location_name;
        if (language_code !== undefined && language_code !== null) body.language_code = language_code;
        if (category_code !== undefined && category_code !== null) body.category_code = category_code;
        const result = await dfsPost("/v3/keywords_data/google_trends/explore/live", [body]);
        return toolResult(result);
      } catch (e) {
        return handleToolError(e);
      }
    }
  );

  // 4. Google Trends Categories
  server.tool(
    "dfs_kw_google_trends_categories",
    "Get the full list of Google Trends categories and their codes.",
    {},
    TOOL_ANNOTATIONS,
    async () => {
      try {
        const result = await dfsGet("/v3/keywords_data/google_trends/categories");
        return toolResult(result);
      } catch (e) {
        return handleToolError(e);
      }
    }
  );

  // Shared schema for DataForSEO Trends tools (5, 6, 7)
  const dfsTrendsSchema = {
    keywords: z.array(z.string()).max(5).describe("Keywords to explore (max 5)"),
    type: z.enum(["web", "news", "ecommerce"]).optional().default("web").describe("Type of search"),
    time_range: z.enum([
      "past_4_hours", "past_day", "past_7_days",
      "past_30_days", "past_90_days", "past_12_months", "past_5_years",
    ]).optional().default("past_7_days").describe("Time range for trends data"),
    date_from: z.string().optional().describe("Start date (YYYY-MM-DD)"),
    date_to: z.string().optional().describe("End date (YYYY-MM-DD)"),
    location_name: z.string().nullable().optional().describe("Location name"),
  };

  function buildDfsTrendsBody(params: {
    keywords: string[];
    type: string;
    time_range: string;
    date_from?: string;
    date_to?: string;
    location_name?: string | null;
  }): Record<string, unknown> {
    const body: Record<string, unknown> = {
      keywords: params.keywords,
      type: params.type,
      time_range: params.time_range,
    };
    if (params.date_from !== undefined) body.date_from = params.date_from;
    if (params.date_to !== undefined) body.date_to = params.date_to;
    if (params.location_name !== undefined && params.location_name !== null) {
      body.location_name = params.location_name;
    }
    return body;
  }

  // 5. DataForSEO Trends Explore
  server.tool(
    "dfs_kw_dfs_trends_explore",
    "Explore DataForSEO Trends data for up to 5 keywords. Returns search interest over time across web, news, or ecommerce.",
    dfsTrendsSchema,
    TOOL_ANNOTATIONS,
    async (params) => {
      try {
        const body = buildDfsTrendsBody(params);
        const result = await dfsPost("/v3/keywords_data/dataforseo_trends/explore/live", [body]);
        return toolResult(result);
      } catch (e) {
        return handleToolError(e);
      }
    }
  );

  // 6. DataForSEO Trends Demography
  server.tool(
    "dfs_kw_dfs_trends_demography",
    "Get demographic data for keyword trends from DataForSEO. Returns interest breakdown by age and gender.",
    dfsTrendsSchema,
    TOOL_ANNOTATIONS,
    async (params) => {
      try {
        const body = buildDfsTrendsBody(params);
        const result = await dfsPost("/v3/keywords_data/dataforseo_trends/demography/live", [body]);
        return toolResult(result);
      } catch (e) {
        return handleToolError(e);
      }
    }
  );

  // 7. DataForSEO Trends Subregion Interests
  server.tool(
    "dfs_kw_dfs_trends_subregion_interests",
    "Get subregion interest data for keyword trends from DataForSEO. Returns geographic breakdown of search interest by subregion.",
    dfsTrendsSchema,
    TOOL_ANNOTATIONS,
    async (params) => {
      try {
        const body = buildDfsTrendsBody(params);
        const result = await dfsPost("/v3/keywords_data/dataforseo_trends/subregion_interests/live", [body]);
        return toolResult(result);
      } catch (e) {
        return handleToolError(e);
      }
    }
  );
}
