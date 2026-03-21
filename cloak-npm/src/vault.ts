import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from "crypto";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { join } from "path";
import { homedir } from "os";

const DEFAULT_VAULT_DIR = join(homedir(), ".cloak");
const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;
const SALT_LENGTH = 16;
const KEY_LENGTH = 32;

interface EncryptedEntry { iv: string; salt: string; tag: string; data: string; }
type VaultStore = Record<string, EncryptedEntry>;

function deriveKey(masterSecret: string, salt: Buffer): Buffer {
  return scryptSync(masterSecret, salt, KEY_LENGTH);
}

function encrypt(plaintext: string, masterSecret: string): EncryptedEntry {
  const salt = randomBytes(SALT_LENGTH);
  const iv = randomBytes(IV_LENGTH);
  const key = deriveKey(masterSecret, salt);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return { iv: iv.toString("hex"), salt: salt.toString("hex"), tag: tag.toString("hex"), data: encrypted.toString("hex") };
}

function decrypt(entry: EncryptedEntry, masterSecret: string): string {
  const salt = Buffer.from(entry.salt, "hex");
  const iv = Buffer.from(entry.iv, "hex");
  const tag = Buffer.from(entry.tag, "hex");
  const data = Buffer.from(entry.data, "hex");
  const key = deriveKey(masterSecret, salt);
  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(data), decipher.final()]).toString("utf8");
}

export class CredentialVault {
  private masterSecret: string;
  private vaultFile: string;

  constructor(masterSecret: string, vaultPath?: string) {
    if (!masterSecret || masterSecret.length < 16) throw new Error("Master secret must be at least 16 characters.");
    this.masterSecret = masterSecret;
    this.vaultFile = vaultPath ?? join(DEFAULT_VAULT_DIR, "vault.json");
  }

  private load(): VaultStore {
    if (!existsSync(this.vaultFile)) return {};
    return JSON.parse(readFileSync(this.vaultFile, "utf8")) as VaultStore;
  }

  private save(store: VaultStore): void {
    mkdirSync(join(this.vaultFile, ".."), { recursive: true });
    writeFileSync(this.vaultFile, JSON.stringify(store, null, 2), { encoding: "utf8", mode: 0o600 });
  }

  store(service: string, credential: string): void {
    const vault = this.load();
    vault[service.toLowerCase()] = encrypt(credential, this.masterSecret);
    this.save(vault);
  }

  retrieve(service: string): string {
    const entry = this.load()[service.toLowerCase()];
    if (!entry) throw new Error(`No credential stored for: "${service}"`);
    return decrypt(entry, this.masterSecret);
  }

  has(service: string): boolean { return service.toLowerCase() in this.load(); }
  listServices(): string[] { return Object.keys(this.load()); }

  remove(service: string): boolean {
    const vault = this.load();
    if (!(service.toLowerCase() in vault)) return false;
    delete vault[service.toLowerCase()];
    this.save(vault);
    return true;
  }
}
