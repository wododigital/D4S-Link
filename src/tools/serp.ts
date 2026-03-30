import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { dfsPost, dfsGet } from "../services/dataforseo-client.js";
import { handleToolError, toolResult } from "../utils/error-handler.js";
import {
  TOOL_ANNOTATIONS,
  DEFAULT_SEARCH_ENGINE,
  DEFAULT_DEVICE,
} from "../constants.js";

/** Strips undefined values from an object so only defined keys are sent to the API. */
function defined<T extends Record<string, unknown>>(obj: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== undefined)
  ) as Partial<T>;
}

export function registerSerpTools(server: McpServer): void {
  // ── 1. Organic SERP (Google / Bing / Yahoo) ──────────────────────────

  server.tool(
    "dfs_serp_organic_live",
    "Retrieve live organic SERP results from Google, Bing, or Yahoo for a given keyword.",
    {
      keyword: z.string().describe("Search keyword"),
      language_code: z.string().describe("Language code (e.g. 'en')"),
      location_name: z
        .string()
        .optional()
        .default("United States")
        .describe("Full location name"),
      search_engine: z
        .enum(["google", "yahoo", "bing"])
        .optional()
        .default(DEFAULT_SEARCH_ENGINE)
        .describe("Search engine to query"),
      depth: z
        .number()
        .min(10)
        .max(700)
        .optional()
        .default(10)
        .describe("Number of results to return (10-700)"),
      max_crawl_pages: z
        .number()
        .min(1)
        .max(7)
        .optional()
        .default(1)
        .describe("Max pages to crawl (1-7)"),
      device: z
        .enum(["desktop", "mobile"])
        .optional()
        .default(DEFAULT_DEVICE)
        .describe("Device type"),
      people_also_ask_click_depth: z
        .number()
        .min(1)
        .max(4)
        .optional()
        .describe("Depth of People Also Ask expansion (1-4)"),
    },
    TOOL_ANNOTATIONS,
    async ({
      keyword,
      language_code,
      location_name,
      search_engine,
      depth,
      max_crawl_pages,
      device,
      people_also_ask_click_depth,
    }) => {
      try {
        const body = defined({
          keyword,
          language_code,
          location_name,
          depth,
          max_crawl_pages,
          device,
          people_also_ask_click_depth,
        });
        const result = await dfsPost(
          `/serp/${search_engine}/organic/live/advanced`,
          [body as Record<string, unknown>]
        );
        return toolResult(result);
      } catch (e) {
        return handleToolError(e);
      }
    }
  );

  // ── 2. SERP Locations ────────────────────────────────────────────────

  server.tool(
    "dfs_serp_locations",
    "List available SERP locations for a search engine filtered by country.",
    {
      country_iso_code: z
        .string()
        .describe("ISO country code (e.g. 'US')"),
      location_name: z
        .string()
        .optional()
        .describe("Filter by location name"),
      location_type: z
        .string()
        .optional()
        .describe("Filter by location type"),
      search_engine: z
        .enum(["google", "yahoo", "bing"])
        .optional()
        .default(DEFAULT_SEARCH_ENGINE)
        .describe("Search engine"),
    },
    TOOL_ANNOTATIONS,
    async ({ country_iso_code, location_name, location_type, search_engine }) => {
      try {
        const params = new URLSearchParams({ country: country_iso_code });
        if (location_name) params.set("location_name", location_name);
        if (location_type) params.set("location_type", location_type);

        const result = await dfsGet(
          `/serp/${search_engine}/locations?${params.toString()}`
        );
        return toolResult(result);
      } catch (e) {
        return handleToolError(e);
      }
    }
  );

  // ── 3. YouTube Organic Search ────────────────────────────────────────

  server.tool(
    "dfs_serp_youtube_organic_live",
    "Retrieve live YouTube organic search results for a keyword.",
    {
      keyword: z.string().describe("Search keyword"),
      language_code: z.string().describe("Language code (e.g. 'en')"),
      location_name: z.string().describe("Full location name"),
      block_depth: z
        .number()
        .max(700)
        .optional()
        .default(20)
        .describe("Number of result blocks to return (max 700)"),
      device: z
        .enum(["desktop", "mobile"])
        .optional()
        .default(DEFAULT_DEVICE)
        .describe("Device type"),
      os: z
        .string()
        .optional()
        .default("windows")
        .describe("Operating system (e.g. 'windows', 'macos')"),
    },
    TOOL_ANNOTATIONS,
    async ({ keyword, language_code, location_name, block_depth, device, os }) => {
      try {
        const body = defined({
          keyword,
          language_code,
          location_name,
          block_depth,
          device,
          os,
        });
        const result = await dfsPost(
          "/serp/youtube/organic/live/advanced",
          [body as Record<string, unknown>]
        );
        return toolResult(result);
      } catch (e) {
        return handleToolError(e);
      }
    }
  );

  // ── 4. YouTube Video Info ────────────────────────────────────────────

  server.tool(
    "dfs_serp_youtube_video_info",
    "Retrieve detailed information about a specific YouTube video.",
    {
      video_id: z.string().describe("YouTube video ID"),
      language_code: z.string().describe("Language code (e.g. 'en')"),
      location_name: z.string().describe("Full location name"),
      device: z
        .enum(["desktop", "mobile"])
        .optional()
        .default(DEFAULT_DEVICE)
        .describe("Device type"),
      os: z
        .string()
        .optional()
        .default("windows")
        .describe("Operating system"),
    },
    TOOL_ANNOTATIONS,
    async ({ video_id, language_code, location_name, device, os }) => {
      try {
        const body = defined({
          video_id,
          language_code,
          location_name,
          device,
          os,
        });
        const result = await dfsPost(
          "/serp/youtube/video_info/live/advanced",
          [body as Record<string, unknown>]
        );
        return toolResult(result);
      } catch (e) {
        return handleToolError(e);
      }
    }
  );

  // ── 5. YouTube Video Comments ────────────────────────────────────────

  server.tool(
    "dfs_serp_youtube_video_comments",
    "Retrieve comments for a specific YouTube video.",
    {
      video_id: z.string().describe("YouTube video ID"),
      language_code: z.string().describe("Language code (e.g. 'en')"),
      location_name: z.string().describe("Full location name"),
      depth: z
        .number()
        .max(700)
        .optional()
        .default(20)
        .describe("Number of comments to return (max 700)"),
      device: z
        .enum(["desktop", "mobile"])
        .optional()
        .default(DEFAULT_DEVICE)
        .describe("Device type"),
      os: z
        .string()
        .optional()
        .default("windows")
        .describe("Operating system"),
    },
    TOOL_ANNOTATIONS,
    async ({ video_id, language_code, location_name, depth, device, os }) => {
      try {
        const body = defined({
          video_id,
          language_code,
          location_name,
          depth,
          device,
          os,
        });
        const result = await dfsPost(
          "/serp/youtube/video_comments/live/advanced",
          [body as Record<string, unknown>]
        );
        return toolResult(result);
      } catch (e) {
        return handleToolError(e);
      }
    }
  );

  // ── 6. YouTube Video Subtitles ───────────────────────────────────────

  server.tool(
    "dfs_serp_youtube_video_subtitles",
    "Retrieve subtitles/captions for a specific YouTube video.",
    {
      video_id: z.string().describe("YouTube video ID"),
      language_code: z.string().describe("Language code (e.g. 'en')"),
      location_name: z.string().describe("Full location name"),
      subtitles_language: z
        .string()
        .optional()
        .describe("Language of subtitles to retrieve"),
      subtitles_translate_language: z
        .string()
        .optional()
        .describe("Language to translate subtitles into"),
      device: z
        .enum(["desktop", "mobile"])
        .optional()
        .default(DEFAULT_DEVICE)
        .describe("Device type"),
      os: z
        .string()
        .optional()
        .default("windows")
        .describe("Operating system"),
    },
    TOOL_ANNOTATIONS,
    async ({
      video_id,
      language_code,
      location_name,
      subtitles_language,
      subtitles_translate_language,
      device,
      os,
    }) => {
      try {
        const body = defined({
          video_id,
          language_code,
          location_name,
          subtitles_language,
          subtitles_translate_language,
          device,
          os,
        });
        const result = await dfsPost(
          "/serp/youtube/video_subtitles/live/advanced",
          [body as Record<string, unknown>]
        );
        return toolResult(result);
      } catch (e) {
        return handleToolError(e);
      }
    }
  );

  // ── 7. YouTube Locations ─────────────────────────────────────────────

  server.tool(
    "dfs_serp_youtube_locations",
    "List available YouTube SERP locations filtered by country.",
    {
      country_iso_code: z
        .string()
        .describe("ISO country code (e.g. 'US')"),
      location_name: z
        .string()
        .optional()
        .describe("Filter by location name"),
      location_type: z
        .string()
        .optional()
        .describe("Filter by location type"),
    },
    TOOL_ANNOTATIONS,
    async ({ country_iso_code, location_name, location_type }) => {
      try {
        const params = new URLSearchParams({ country: country_iso_code });
        if (location_name) params.set("location_name", location_name);
        if (location_type) params.set("location_type", location_type);

        const result = await dfsGet(
          `/serp/youtube/locations?${params.toString()}`
        );
        return toolResult(result);
      } catch (e) {
        return handleToolError(e);
      }
    }
  );
}
