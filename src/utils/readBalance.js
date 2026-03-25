const { ethers } = require("ethers");
const { EthMainnet } = require("../config/constant")

// ── Config ──────────────────────────────────────────────────────────────────
const USDC_ADDRESS = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48"; // Ethereum Mainnet

const USDC_ABI = [
  "function balanceOf(address account) view returns (uint256)",
  "function totalSupply() view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)",
];

// ── Main ─────────────────────────────────────────────────────────────────────
const readBalance = async (userAddress) => {
  // Validate address
  if (!ethers.isAddress(userAddress)) {
    const err = new Error(`Invalid Ethereum address ${userAddress}`);
    err.status = 400;
    throw err;
  }

  // Connect to Ethereum mainnet via public RPC
  const provider = new ethers.JsonRpcProvider(process.env.ALCHEMY_API_KEY);

  const usdc = new ethers.Contract(USDC_ADDRESS, USDC_ABI, provider);

  // Fetch in parallel
  const [balance, totalSupply, decimals, symbol] = await Promise.all([
    usdc.balanceOf(userAddress),
    usdc.totalSupply(),
    usdc.decimals(),
    usdc.symbol(),
  ]);

  // USDC has 6 decimals
  const formattedBalance = ethers.formatUnits(balance, decimals);
  const formattedTotalSupply = ethers.formatUnits(totalSupply, decimals);


  console.log(`User Balance:   ${Number(formattedBalance).toLocaleString()} ${symbol}`);
  console.log(`Total Supply:   ${Number(formattedTotalSupply).toLocaleString()} ${symbol}`);
  console.log("─".repeat(50));

  return {
    userBalance: formattedBalance,
    totalSupply: formattedTotalSupply
  }
};

module.exports = readBalance;
