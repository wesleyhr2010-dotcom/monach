// Paper MCP client (HTTP JSON-RPC)
// Minimal wrapper to connect to Paper MCP server as described in docs at https://paper.design/docs/mcp
// This is intentionally small and pragmatic: works via HTTP POST to the MCP endpoint:
//   POST { jsonrpc: "2.0", method, params, id }

export interface PaperMCPResponse<T = any> {
  jsonrpc?: string;
  id?: string | number;
  result?: T;
  error?: any;
}

export class PaperMCPClient {
  private baseUrl: string;
  private token?: string;

  constructor(baseUrl: string, token?: string) {
    // Ensure the URL ends without a trailing slash for consistency
    this.baseUrl = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
    this.token = token;
  }

  async request<T = any>(method: string, params?: any, id?: string | number): Promise<T> {
    const payload: Record<string, any> = {
      jsonrpc: "2.0",
      method,
      params,
      id: id ?? Date.now(),
    };

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (this.token) headers["Authorization"] = `Bearer ${this.token}`;

    const resp = await fetch(this.baseUrl, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    });

    if (!resp.ok) {
      throw new Error(`Paper MCP HTTP error ${resp.status}: ${resp.statusText}`);
    }

    const data: PaperMCPResponse<T> = await resp.json();
    if (data?.error) {
      throw new Error(`Paper MCP error: ${JSON.stringify(data.error)}`);
    }
    return data.result as T;
  }

  // Convenience helpers (provide common MCP methods as needed)
  async getBasicInfo(): Promise<any> {
    return this.request("get_basic_info");
  }

  async getSelection(): Promise<any> {
    return this.request("get_selection");
  }

  async getNodeInfo(id: string | number): Promise<any> {
    return this.request("get_node_info", { id });
  }

  async discoverSupportedMethods(): Promise<Array<{ method: string; ok: boolean; view?: any }>> {
    const candidates: Array<{ method: string; params?: any }> = [
      { method: "get_basic_info", params: {} },
      { method: "get_selection", params: {} },
      { method: "get_tree_summary", params: {} },
      { method: "get_tree_summary", params: { depth: 2 } },
      { method: "get_node_info", params: { id: 1 } },
      { method: "get_guide", params: {} },
      { method: "write_html", params: { id: 1, html: "<div/>" } },
    ]
    const results: Array<{ method: string; ok: boolean; data?: any; error?: any }> = []
    for (const c of candidates) {
      try {
        // Call with provided params or empty object
        const params = c.params ?? {}
        const res = await this.request<any>(c.method, params)
        results.push({ method: c.method, ok: true, data: res })
      } catch (err: any) {
        results.push({ method: c.method, ok: false, error: err?.message ?? String(err) })
      }
    }
    // Normalize into a simple view
    return results.map((r) => ({ method: r.method, ok: r.ok, view: r.data ?? r.error }))
  }
}

// Factory helper: read URL and token from env vars if available
export function createPaperMcpClientFromEnv(): PaperMCPClient | null {
  const url = (process.env.PAPER_MCP_URL || "").trim();
  if (!url) return null;
  const token = process.env.PAPER_MCP_TOKEN || undefined;
  return new PaperMCPClient(url, token);
}

export type PaperMCPClientLike = {
  request: <T = any>(method: string, params?: any) => Promise<T>;
};

export default PaperMCPClient;
