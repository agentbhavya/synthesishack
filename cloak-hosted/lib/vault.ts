import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'crypto';
import { supabaseAdmin } from './supabase';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;
const SALT_LENGTH = 16;
const KEY_LENGTH = 32;

interface EncryptedEntry {
  iv: string;
  salt: string;
  tag: string;
  data: string;
}

function getMasterSecret(): string {
  const secret = process.env['CLOAK_MASTER_SECRET'];
  if (!secret || secret.length < 16) {
    throw new Error('CLOAK_MASTER_SECRET env var must be set and at least 16 characters.');
  }
  return secret;
}

function deriveKey(masterSecret: string, salt: Buffer): Buffer {
  return scryptSync(masterSecret, salt, KEY_LENGTH) as Buffer;
}

function encrypt(plaintext: string): EncryptedEntry {
  const masterSecret = getMasterSecret();
  const salt = randomBytes(SALT_LENGTH);
  const iv = randomBytes(IV_LENGTH);
  const key = deriveKey(masterSecret, salt);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return {
    iv: iv.toString('hex'),
    salt: salt.toString('hex'),
    tag: tag.toString('hex'),
    data: encrypted.toString('hex'),
  };
}

function decrypt(entry: EncryptedEntry): string {
  const masterSecret = getMasterSecret();
  const salt = Buffer.from(entry.salt, 'hex');
  const iv = Buffer.from(entry.iv, 'hex');
  const tag = Buffer.from(entry.tag, 'hex');
  const data = Buffer.from(entry.data, 'hex');
  const key = deriveKey(masterSecret, salt);
  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(data), decipher.final()]).toString('utf8');
}

/**
 * CloudVault — per-user AES-256-GCM encrypted credential store backed by Supabase.
 *
 * Credentials are encrypted server-side before being written to the `vaults` table.
 * The plaintext key is never stored or logged — only the execution engine uses it
 * internally during a request.
 */
export class CloudVault {
  constructor(private userId: string) {}

  async store(service: string, credential: string): Promise<void> {
    const encrypted = encrypt(credential);
    const { error } = await supabaseAdmin
      .from('vaults')
      .upsert(
        { user_id: this.userId, service: service.toLowerCase(), encrypted_entry: encrypted },
        { onConflict: 'user_id,service' }
      );
    if (error) throw new Error(`Failed to store credential: ${error.message}`);
  }

  /** Retrieve and decrypt a credential. Internal use only — never returned to the caller. */
  async retrieve(service: string): Promise<string> {
    const { data, error } = await supabaseAdmin
      .from('vaults')
      .select('encrypted_entry')
      .eq('user_id', this.userId)
      .eq('service', service.toLowerCase())
      .single();
    if (error || !data) throw new Error(`No credential stored for service: "\"`);
    return decrypt(data.encrypted_entry as EncryptedEntry);
  }

  async listServices(): Promise<string[]> {
    const { data, error } = await supabaseAdmin
      .from('vaults')
      .select('service')
      .eq('user_id', this.userId);
    if (error) throw new Error(`Failed to list services: ${error.message}`);
    return (data ?? []).map((row: { service: string }) => row.service);
  }

  async remove(service: string): Promise<void> {
    const { error } = await supabaseAdmin
      .from('vaults')
      .delete()
      .eq('user_id', this.userId)
      .eq('service', service.toLowerCase());
    if (error) throw new Error(`Failed to remove credential: ${error.message}`);
  }
}
