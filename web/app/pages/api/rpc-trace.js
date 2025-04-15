import { ethers } from "ethers";

export default async function handler(req, res) {
  const provider = new ethers.providers.JsonRpcProvider("YOUR_SEPOLIA_RPC_URL");
  const txHash = req.query.txHash; // Expect txHash from request
  if (!txHash) {
    res.status(400).json({ error: "No transaction hash provided" });
    return;
  }
  try {
    const trace = await provider.send("debug_traceTransaction", [txHash, {}]);
    res.status(200).json(trace);
  } catch (error) {
    res.status(500).json({ error: "Trace failed, likely old transaction" });
  }
}