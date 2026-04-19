import type { NextApiRequest, NextApiResponse } from 'next'
import PaperMCPClient, { createPaperMcpClientFromEnv } from '../../lib/mcp'

// Demo: call Paper MCP get_basic_info via the HTTP RPC endpoint
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Prefer env-based client if configured
    const client = createPaperMcpClientFromEnv() ?? new PaperMCPClient(process.env.PAPER_MCP_URL || 'http://127.0.0.1:29979/mcp', process.env.PAPER_MCP_TOKEN ?? undefined)
    const result = await client.getBasicInfo()
    res.status(200).json({ ok: true, result })
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err?.message ?? String(err) })
  }
}
