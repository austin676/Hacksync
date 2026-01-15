"use client"

import { ethers, BrowserProvider, Contract } from "ethers"

// ============ POLYGON AMOY NETWORK CONFIG ============
const POLYGON_AMOY = {
  chainId: "0x13882", // 80002 in hex
  chainName: "Polygon Amoy Testnet",
  nativeCurrency: {
    name: "POL",
    symbol: "POL",
    decimals: 18,
  },
  rpcUrls: ["https://rpc-amoy.polygon.technology"],
  blockExplorerUrls: ["https://amoy.polygonscan.com"],
}

// Switch to Polygon Amoy network
export async function switchToPolygonAmoy(): Promise<boolean> {
  if (typeof window === "undefined" || !window.ethereum) {
    throw new Error("MetaMask not installed")
  }

  try {
    // Try to switch to Polygon Amoy
    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: POLYGON_AMOY.chainId }],
    })
    return true
  } catch (switchError: any) {
    // If network doesn't exist, add it
    if (switchError.code === 4902) {
      try {
        await window.ethereum.request({
          method: "wallet_addEthereumChain",
          params: [POLYGON_AMOY],
        })
        return true
      } catch (addError) {
        console.error("Failed to add Polygon Amoy:", addError)
        return false
      }
    }
    console.error("Failed to switch network:", switchError)
    return false
  }
}

// Check if on correct network
export async function isOnPolygonAmoy(): Promise<boolean> {
  if (typeof window === "undefined" || !window.ethereum) return false
  
  try {
    const chainId = await window.ethereum.request({ method: "eth_chainId" })
    return chainId === POLYGON_AMOY.chainId
  } catch {
    return false
  }
}

// Contract ABI - only the functions we need
const CONTRACT_ABI = [
  // Read functions
  "function admins(address) view returns (bool)",
  "function users(address) view returns (bool)",
  "function auditors(address) view returns (bool)",
  "function paused() view returns (bool)",
  "function getTotalTransactions() view returns (uint256)",
  "function getTransaction(uint256 _txId) view returns (tuple(uint256 id, address sender, address receiver, uint256 amount, bytes32 encryptedMetadata, uint256 timestamp, bool isFlagged, string status))",
  "function getUserTransactions(address _user) view returns (uint256[])",
  "function getRecentTransactions(uint256 _count) view returns (tuple(uint256 id, address sender, address receiver, uint256 amount, bytes32 encryptedMetadata, uint256 timestamp, bool isFlagged, string status)[])",
  "function checkTransactionAnomaly(address _sender) view returns (bool isAnomaly, string reason)",
  "function getFlaggedTransactions() view returns (tuple(uint256 id, address sender, address receiver, uint256 amount, bytes32 encryptedMetadata, uint256 timestamp, bool isFlagged, string status)[])",
  
  // Write functions
  "function registerUser()",
  "function createTransaction(address _receiver, string _metadata) payable",
  "function addAdmin(address _admin)",
  "function addAuditor(address _auditor)",
  "function flagTransaction(uint256 _txId, string _reason)",
  "function pauseContract()",
  "function unpauseContract()",
  
  // Events
  "event TransactionCreated(uint256 indexed txId, address indexed sender, address indexed receiver, uint256 amount, uint256 timestamp)",
  "event TransactionFlagged(uint256 indexed txId, string reason)",
  "event AdminAdded(address indexed admin)",
  "event AuditorAdded(address indexed auditor)",
  "event UserRegistered(address indexed user)",
  "event ContractPaused(address indexed by, uint256 timestamp)",
  "event ContractUnpaused(address indexed by, uint256 timestamp)",
]

// ⚠️ UPDATE THIS after deploying your contract!
const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || "0x0000000000000000000000000000000000000000"

// Get provider and signer
export async function getProvider() {
  if (typeof window === "undefined" || !window.ethereum) {
    throw new Error("MetaMask not installed")
  }
  return new BrowserProvider(window.ethereum)
}

export async function getSigner() {
  const provider = await getProvider()
  return provider.getSigner()
}

export async function getContract(withSigner = false) {
  const provider = await getProvider()
  
  if (withSigner) {
    const signer = await provider.getSigner()
    return new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer)
  }
  
  return new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider)
}

// ============ READ FUNCTIONS ============

export async function getUserRole(address: string): Promise<"admin" | "auditor" | "user" | "none"> {
  try {
    const contract = await getContract()
    
    const isAdmin = await contract.admins(address)
    if (isAdmin) return "admin"
    
    const isAuditor = await contract.auditors(address)
    if (isAuditor) return "auditor"
    
    const isUser = await contract.users(address)
    if (isUser) return "user"
    
    return "none"
  } catch (error) {
    console.error("Error getting user role:", error)
    return "none"
  }
}

export async function isContractPaused(): Promise<boolean> {
  try {
    const contract = await getContract()
    return await contract.paused()
  } catch {
    return false
  }
}

export async function getTotalTransactions(): Promise<number> {
  try {
    const contract = await getContract()
    const total = await contract.getTotalTransactions()
    return Number(total)
  } catch {
    return 0
  }
}

export interface ContractTransaction {
  id: number
  sender: string
  receiver: string
  amount: string
  encryptedMetadata: string
  timestamp: number
  isFlagged: boolean
  status: string
}

export async function getTransaction(txId: number): Promise<ContractTransaction | null> {
  try {
    const contract = await getContract()
    const tx = await contract.getTransaction(txId)
    
    return {
      id: Number(tx.id),
      sender: tx.sender,
      receiver: tx.receiver,
      amount: ethers.formatEther(tx.amount),
      encryptedMetadata: tx.encryptedMetadata,
      timestamp: Number(tx.timestamp),
      isFlagged: tx.isFlagged,
      status: tx.status,
    }
  } catch {
    return null
  }
}

export async function getUserTransactions(address: string): Promise<ContractTransaction[]> {
  try {
    const contract = await getContract()
    const txIds = await contract.getUserTransactions(address)
    
    const transactions: ContractTransaction[] = []
    for (const txId of txIds) {
      const tx = await getTransaction(Number(txId))
      if (tx) transactions.push(tx)
    }
    
    return transactions.reverse() // Most recent first
  } catch {
    return []
  }
}

export async function getRecentTransactions(count: number): Promise<ContractTransaction[]> {
  try {
    const contract = await getContract()
    const txs = await contract.getRecentTransactions(count)
    
    return txs.map((tx: any) => ({
      id: Number(tx.id),
      sender: tx.sender,
      receiver: tx.receiver,
      amount: ethers.formatEther(tx.amount),
      encryptedMetadata: tx.encryptedMetadata,
      timestamp: Number(tx.timestamp),
      isFlagged: tx.isFlagged,
      status: tx.status,
    })).reverse()
  } catch {
    return []
  }
}

export async function checkAnomaly(address: string): Promise<{ isAnomaly: boolean; reason: string }> {
  try {
    const contract = await getContract()
    const [isAnomaly, reason] = await contract.checkTransactionAnomaly(address)
    return { isAnomaly, reason }
  } catch {
    return { isAnomaly: false, reason: "Unable to check" }
  }
}

export async function getFlaggedTransactions(): Promise<ContractTransaction[]> {
  try {
    const contract = await getContract(true) // Need signer for auditor check
    const txs = await contract.getFlaggedTransactions()
    
    return txs.map((tx: any) => ({
      id: Number(tx.id),
      sender: tx.sender,
      receiver: tx.receiver,
      amount: ethers.formatEther(tx.amount),
      encryptedMetadata: tx.encryptedMetadata,
      timestamp: Number(tx.timestamp),
      isFlagged: tx.isFlagged,
      status: tx.status,
    }))
  } catch {
    return []
  }
}

// ============ WRITE FUNCTIONS ============

export async function registerUser(): Promise<string> {
  const contract = await getContract(true)
  const tx = await contract.registerUser()
  await tx.wait()
  return tx.hash
}

export async function createTransaction(
  receiver: string,
  metadata: string,
  amountInEth: string
): Promise<string> {
  const contract = await getContract(true)
  const tx = await contract.createTransaction(receiver, metadata, {
    value: ethers.parseEther(amountInEth),
  })
  await tx.wait()
  return tx.hash
}

export async function addAdmin(address: string): Promise<string> {
  const contract = await getContract(true)
  const tx = await contract.addAdmin(address)
  await tx.wait()
  return tx.hash
}

export async function addAuditor(address: string): Promise<string> {
  const contract = await getContract(true)
  const tx = await contract.addAuditor(address)
  await tx.wait()
  return tx.hash
}

export async function flagTransaction(txId: number, reason: string): Promise<string> {
  const contract = await getContract(true)
  const tx = await contract.flagTransaction(txId, reason)
  await tx.wait()
  return tx.hash
}

export async function pauseContract(): Promise<string> {
  const contract = await getContract(true)
  const tx = await contract.pauseContract()
  await tx.wait()
  return tx.hash
}

export async function unpauseContract(): Promise<string> {
  const contract = await getContract(true)
  const tx = await contract.unpauseContract()
  await tx.wait()
  return tx.hash
}

// ============ UTILITY ============

export function formatAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

export function formatTimestamp(timestamp: number): string {
  return new Date(timestamp * 1000).toLocaleString()
}
