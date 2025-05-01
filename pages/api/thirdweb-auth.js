// pages/api/thirdweb-auth.js
import { ThirdwebSDK } from "@thirdweb-dev/sdk/evm";

export default async function handler(req, res) {
    // Only accept POST requests
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    try {
        // Get the secret key from environment variables
        const secretKey = process.env.THIRDWEB_SECRET_KEY;

        if (!secretKey) {
            return res.status(500).json({ error: "Server not configured with Thirdweb secret key" });
        }

        // Create a server-side SDK with the secret key
        const sdk = ThirdwebSDK.fromPrivateKey(
            // You would use a server wallet private key for actual operations
            process.env.SERVER_WALLET_PRIVATE_KEY || "",
            "polygon-amoy", // The chain to connect to
            {
                secretKey: secretKey,
            }
        );

        // Example operation: Get a specific contract
        const {contractAddress} = req.body;
        if (!contractAddress) {
            return res.status(400).json({ error: "Contract address is required" });
        }

        // Get the contract
        const contract = await sdk.getContract(contractAddress);

        // Example: Read contract data
        const name = await contract.call("name"); // If the contract has a name() function

        // Return the result
        return res.status(200).json({ success: true, data: { name } });
    } catch (error) {
        console.error("Thirdweb API error:", error);
        return res.status(500).json({ error: error.message || "An unknown error occurred" });
    }
}