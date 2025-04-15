import { ethers } from "ethers";

export async function fetchEvents(contractAddress: string, fromBlock: number, toBlock: number) {
  const provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL || "https://blockchain.googleapis.com/v1/projects/model-coral-286214/locations/us-central1/endpoints/ethereum-sepolia/rpc?key=AIzaSyDXEFg9kGahkj4RvBnMEzx2YbS6WKpbOsA");
  const latestBlock = await provider.getBlockNumber();
  const step = 5; // Max range allowed by Google RPC
  let allEvents: ethers.Log[] = []; // Explicitly type as ethers.Log[]

  for (let start = fromBlock; start <= toBlock; start += step) {
    const end = Math.min(start + step - 1, toBlock, latestBlock);
    const filter = {
      address: contractAddress,
      fromBlock: `0x${start.toString(16)}`,
      toBlock: `0x${end.toString(16)}`,
      topics: [[], [], [], [], []], // Adjust topics if needed
    };
    const events = await provider.getLogs(filter);
    allEvents = allEvents.concat(events);
  }

  return allEvents;
}