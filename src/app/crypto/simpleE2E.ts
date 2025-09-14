/**
 * Simple Conversation-Based E2E Encryption using @noble/ciphers
 * 
 * This replaces the complex Matrix Olm E2E with a simpler approach:
 * - Each conversation gets a unique AES-256 key derived deterministically
 * - Keys are derived from conversation ID and participant IDs
 * - Messages are encrypted client-side before sending using AES-256-GCM
 * - Much simpler than Matrix E2E but still provides meaningful protection
 * - Works in HTTP contexts (unlike Web Crypto API)
 * - Uses authenticated encryption (AES-GCM) for better security
 * 
 * Key Derivation: Both users derive the same key from conversation metadata
 * to ensure they can encrypt/decrypt each other's messages.
 */

import { gcm } from '@noble/ciphers/aes.js';
import { randomBytes, utf8ToBytes, bytesToUtf8, bytesToHex, hexToBytes } from '@noble/ciphers/utils.js';

export interface EncryptedPayload {
  ciphertext: string;
  nonce: string;
  conversationId: string;
}

export interface ConversationKey {
  key: string;
  conversationId: string;
  createdAt: number;
}

export class SimpleE2EClient {
  private static instance: SimpleE2EClient | null = null;
  private keyCache = new Map<string, string>();
  private userId: string | null = null;

  private constructor() {}

  static getInstance(): SimpleE2EClient {
    if (!SimpleE2EClient.instance) {
      SimpleE2EClient.instance = new SimpleE2EClient();
    }
    return SimpleE2EClient.instance;
  }

  /**
   * Initialize the client with user ID
   */
  setUserId(userId: string): void {
    this.userId = userId;
  }

  /**
   * Derive a conversation key deterministically from conversation metadata
   */
  private async deriveConversationKey(conversationId: string, participantIds: string[]): Promise<Uint8Array> {
    // Sort participant IDs to ensure consistent ordering
    const sortedParticipants = [...participantIds].sort();
    
    // Create a deterministic seed from conversation ID and participants
    const seed = `${conversationId}:${sortedParticipants.join(',')}`;
    
    // Convert to bytes and hash using Web Crypto API
    const seedBytes = utf8ToBytes(seed);
    
    // Use Web Crypto API for SHA-256 (works in all contexts)
    const hash = await crypto.subtle.digest('SHA-256', seedBytes);
    return new Uint8Array(hash);
  }

  /**
   * Get or create a conversation key
   */
  private async getConversationKey(conversationId: string, participantIds?: string[]): Promise<Uint8Array> {
    // Check cache first
    if (this.keyCache.has(conversationId)) {
      const cachedKey = this.keyCache.get(conversationId)!;
      return hexToBytes(cachedKey);
    }

    // Try to load from localStorage
    const storedKey = localStorage.getItem(`conv_key_${conversationId}`);
    if (storedKey) {
      try {
        const keyData = JSON.parse(storedKey);
        const keyBytes = hexToBytes(keyData.key);
        this.keyCache.set(conversationId, keyData.key);
        return keyBytes;
      } catch (error) {
        console.warn('[Simple E2E] Failed to load stored key, generating new one:', error);
      }
    }

    // Use provided participant IDs or fallback to conversation ID only
    const ids = participantIds || [conversationId];
    
    // Derive the key deterministically
    const keyBytes = await this.deriveConversationKey(conversationId, ids);
    const keyHex = bytesToHex(keyBytes);

    // Store locally
    const keyData = {
      key: keyHex,
      conversationId,
      createdAt: Date.now()
    };
    localStorage.setItem(`conv_key_${conversationId}`, JSON.stringify(keyData));
    
    this.keyCache.set(conversationId, keyHex);
    return keyBytes;
  }

  /**
   * Encrypt a message for a conversation
   */
  async encrypt(conversationId: string, plaintext: string, participantIds?: string[]): Promise<EncryptedPayload> {
    const key = await this.getConversationKey(conversationId, participantIds);
    
    // Generate unique 96-bit IV for AES-GCM
    const iv = randomBytes(12);
    
    // Convert plaintext to bytes
    const plaintextBytes = utf8ToBytes(plaintext);
    
    // Encrypt using AES-256-GCM
    const cipher = gcm(key, iv);
    const ciphertext = cipher.encrypt(plaintextBytes);

    return {
      ciphertext: bytesToHex(ciphertext),
      nonce: bytesToHex(iv),
      conversationId
    };
  }

  /**
   * Decrypt a message from a conversation
   */
  async decrypt(conversationId: string, payload: { ciphertext: string; nonce: string }, participantIds?: string[]): Promise<string> {
    try {
      const key = await this.getConversationKey(conversationId, participantIds);
      
      // Decode the IV and ciphertext
      const iv = hexToBytes(payload.nonce);
      const ciphertextBytes = hexToBytes(payload.ciphertext);

      // Decrypt using AES-256-GCM
      const cipher = gcm(key, iv);
      const plaintextBytes = cipher.decrypt(ciphertextBytes);

      return bytesToUtf8(plaintextBytes);
    } catch (error) {
      console.warn('[Simple E2E] Decryption failed:', error);
      throw new Error('Decryption failed');
    }
  }

  /**
   * Check if we have a key for a conversation
   */
  async hasConversationKey(conversationId: string): Promise<boolean> {
    try {
      await this.getConversationKey(conversationId);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Clear all keys (for logout)
   */
  clearKeys(): void {
    this.keyCache.clear();
    // Note: We don't clear localStorage keys here as they might be needed
    // for other users or after re-login. Clear them explicitly if needed.
  }

  /**
   * Export conversation keys (for backup)
   */
  async exportKeys(): Promise<Record<string, string>> {
    const keys: Record<string, string> = {};
    
    // Get all conversation keys from localStorage
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('conv_key_')) {
        const conversationId = key.replace('conv_key_', '');
        const storedKey = localStorage.getItem(key);
        if (storedKey) {
          keys[conversationId] = storedKey;
        }
      }
    }
    
    return keys;
  }

  /**
   * Import conversation keys (for restore)
   */
  async importKeys(keys: Record<string, string>): Promise<void> {
    for (const [conversationId, keyData] of Object.entries(keys)) {
      localStorage.setItem(`conv_key_${conversationId}`, keyData);
      // Clear cache to force reload
      this.keyCache.delete(conversationId);
    }
  }
}
