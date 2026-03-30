import { API_BASE } from "../constants.js";

function getAuthHeader(): string {
  const login = process.env.DATAFORSEO_LOGIN;
  const password = process.env.DATAFORSEO_PASSWORD;

  if (!login || !password) {
    throw new Error(
      "Missing DATAFORSEO_LOGIN or DATAFORSEO_PASSWORD environment variables"
    );
  }

  return `Basic ${Buffer.from(`${login}:${password}`).toString("base64")}`;
}

export async function dfsPost(
  path: string,
  body: Record<string, unknown>[]
): Promise<unknown> {
  const response = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: getAuthHeader(),
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(
      `DataForSEO API error: ${response.status} ${response.statusText}`
    );
  }

  const data = (await response.json()) as {
    status_code: number;
    status_message: string;
    tasks?: Array<{
      status_code: number;
      status_message: string;
      result: unknown[];
    }>;
  };

  if (data.status_code !== 20000) {
    throw new Error(`DataForSEO error: ${data.status_message}`);
  }

  if (data.tasks?.[0]?.status_code !== 20000) {
    throw new Error(
      `DataForSEO task error: ${data.tasks?.[0]?.status_message}`
    );
  }

  return data.tasks[0].result;
}

export async function dfsGet(path: string): Promise<unknown> {
  const response = await fetch(`${API_BASE}${path}`, {
    method: "GET",
    headers: {
      Authorization: getAuthHeader(),
    },
  });

  if (!response.ok) {
    throw new Error(
      `DataForSEO API error: ${response.status} ${response.statusText}`
    );
  }

  const data = (await response.json()) as {
    status_code: number;
    status_message: string;
    tasks?: Array<{
      status_code: number;
      status_message: string;
      result: unknown[];
    }>;
  };

  if (data.status_code !== 20000) {
    throw new Error(`DataForSEO error: ${data.status_message}`);
  }

  return data.tasks?.[0]?.result ?? data;
}
