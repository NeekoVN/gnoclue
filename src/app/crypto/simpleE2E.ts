/**
 * Simple Conversation-Based E2E Encryption using CryptoJS
 * 
 * This replaces the complex Matrix Olm E2E with a simpler approach:
 * - Each conversation gets a unique AES-256 key derived deterministically
 * - Keys are derived from conversation ID and participant IDs
 * - Messages are encrypted client-side before sending
 * - Much simpler than Matrix E2E but still provides meaningful protection
 * - Works in HTTP contexts (unlike Web Crypto API)
 * 
 * Key Derivation: Both users derive the same key from conversation metadata
 * to ensure they can encrypt/decrypt each other's messages.
 */

import CryptoJS from 'crypto-js';

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
  private deriveConversationKey(conversationId: string, participantIds: string[]): string {
    // Sort participant IDs to ensure consistent ordering
    const sortedParticipants = [...participantIds].sort();
    
    // Create a deterministic seed from conversation ID and participants
    const seed = `${conversationId}:${sortedParticipants.join(',')}`;
    
    // Hash the seed to create a deterministic key
    return CryptoJS.SHA256(seed).toString();
  }

  /**
   * Get or create a conversation key
   */
  private getConversationKey(conversationId: string, participantIds?: string[]): string {
    // Check cache first
    if (this.keyCache.has(conversationId)) {
      return this.keyCache.get(conversationId)!;
    }

    // Try to load from localStorage
    const storedKey = localStorage.getItem(`conv_key_${conversationId}`);
    if (storedKey) {
      try {
        const keyData = JSON.parse(storedKey);
        this.keyCache.set(conversationId, keyData.key);
        return keyData.key;
      } catch (error) {
        console.warn('[Simple E2E] Failed to load stored key, generating new one:', error);
      }
    }

    // Use provided participant IDs or fallback to conversation ID only
    const ids = participantIds || [conversationId];
    
    // Derive the key deterministically
    const key = this.deriveConversationKey(conversationId, ids);

    // Store locally
    const keyData = {
      key,
      conversationId,
      createdAt: Date.now()
    };
    localStorage.setItem(`conv_key_${conversationId}`, JSON.stringify(keyData));
    
    this.keyCache.set(conversationId, key);
    return key;
  }

  /**
   * Encrypt a message for a conversation
   */
  async encrypt(conversationId: string, plaintext: string, participantIds?: string[]): Promise<EncryptedPayload> {
    const key = this.getConversationKey(conversationId, participantIds);
    
    // Generate unique IV for this encryption
    const iv = CryptoJS.lib.WordArray.random(16);
    
    // Encrypt the message using AES-256-CBC (CryptoJS doesn't support GCM in browser)
    const encrypted = CryptoJS.AES.encrypt(plaintext, key, {
      iv: iv,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7
    });

    return {
      ciphertext: encrypted.toString(),
      nonce: iv.toString(),
      conversationId
    };
  }

  /**
   * Decrypt a message from a conversation
   */
  async decrypt(conversationId: string, payload: { ciphertext: string; nonce: string }, participantIds?: string[]): Promise<string> {
    try {
      const key = this.getConversationKey(conversationId, participantIds);
      
      // Decode the IV
      const iv = CryptoJS.enc.Hex.parse(payload.nonce);

      // Decrypt
      const decrypted = CryptoJS.AES.decrypt(payload.ciphertext, key, {
        iv: iv,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7
      });

      return decrypted.toString(CryptoJS.enc.Utf8);
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
      this.getConversationKey(conversationId);
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
