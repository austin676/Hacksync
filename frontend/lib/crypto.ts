// Cryptographic utilities for wallet authentication and data encryption

import { createHash, createCipheriv, createDecipheriv, randomBytes } from "crypto"

const IV_LENGTH = 16

function getEncryptionKey(): Buffer {
  const rawKey = process.env.ENCRYPTION_KEY || "default-fallback-key-for-dev"
  // Hash the key to ensure it's exactly 32 bytes for AES-256
  return createHash("sha256").update(rawKey).digest()
}

// Generate a random nonce for wallet signing
export function generateNonce(): string {
  return randomBytes(32).toString("hex")
}

// Create the message to be signed by the wallet
export function createSignMessage(nonce: string, walletAddress: string): string {
  return `Sign this message to authenticate with WalletAuth.\n\nWallet: ${walletAddress}\nNonce: ${nonce}\nTimestamp: ${Date.now()}`
}

// Verify Ethereum signature (simplified mock for demo)
export function verifySignature(message: string, signature: string, walletAddress: string): boolean {
  // In production, use ethers.js or web3.js to properly verify:
  // const recoveredAddress = ethers.verifyMessage(message, signature)
  // return recoveredAddress.toLowerCase() === walletAddress.toLowerCase()

  // Mock verification - accepts any signature starting with "0x" for demo
  // This should be replaced with real signature verification in production
  if (!signature.startsWith("0x") || signature.length < 130) {
    return false
  }
  return true
}

// Encrypt sensitive data before storing
export function encrypt(text: string): string {
  const iv = randomBytes(IV_LENGTH)
  const key = getEncryptionKey()
  const cipher = createCipheriv("aes-256-cbc", key, iv)
  let encrypted = cipher.update(text, "utf8", "hex")
  encrypted += cipher.final("hex")
  return iv.toString("hex") + ":" + encrypted
}

// Decrypt sensitive data
export function decrypt(encryptedText: string): string {
  const parts = encryptedText.split(":")
  const iv = Buffer.from(parts[0], "hex")
  const encrypted = parts[1]
  const key = getEncryptionKey()
  const decipher = createDecipheriv("aes-256-cbc", key, iv)
  let decrypted = decipher.update(encrypted, "hex", "utf8")
  decrypted += decipher.final("utf8")
  return decrypted
}

// Create hash for audit log integrity
export function createAuditHash(data: string, previousHash: string): string {
  return createHash("sha256")
    .update(data + previousHash)
    .digest("hex")
}
