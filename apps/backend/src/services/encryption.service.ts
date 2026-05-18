import crypto from 'crypto';
import { logger } from '@silentsiren/logger';

class EncryptionService {
  private algorithm = 'aes-256-gcm';
  private keyLength = 32; // 256 bits
  private ivLength = 16; // 128 bits
  private saltLength = 64;
  private tagLength = 16;
  private encryptionKey: Buffer;

  constructor() {
    const key = process.env.ENCRYPTION_KEY;
    if (!key || key.length < 32) {
      throw new Error('ENCRYPTION_KEY must be at least 32 characters');
    }
    // Derive a proper 256-bit key from the environment variable
    this.encryptionKey = crypto.scryptSync(key, 'salt', this.keyLength);
  }

  /**
   * Encrypt sensitive data
   */
  encrypt(plaintext: string): string {
    try {
      const iv = crypto.randomBytes(this.ivLength);
      const cipher = crypto.createCipheriv(
        this.algorithm,
        this.encryptionKey,
        iv
      ) as crypto.CipherGCM;

      let encrypted = cipher.update(plaintext, 'utf8', 'hex');
      encrypted += cipher.final('hex');

      const authTag = cipher.getAuthTag();

      // Format: iv:authTag:encrypted
      return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
    } catch (error) {
      logger.error('Encryption failed:', error);
      throw new Error('Failed to encrypt data');
    }
  }

  /**
   * Decrypt encrypted data
   */
  decrypt(encryptedData: string): string {
    try {
      const parts = encryptedData.split(':');
      if (parts.length !== 3) {
        throw new Error('Invalid encrypted data format');
      }

      const iv = Buffer.from(parts[0], 'hex');
      const authTag = Buffer.from(parts[1], 'hex');
      const encrypted = parts[2];

      const decipher = crypto.createDecipheriv(
        this.algorithm,
        this.encryptionKey,
        iv
      ) as crypto.DecipherGCM;
      decipher.setAuthTag(authTag);

      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      return decrypted;
    } catch (error) {
      logger.error('Decryption failed:', error);
      throw new Error('Failed to decrypt data');
    }
  }

  /**
   * Hash password with salt
   */
  hashPassword(password: string): string {
    const salt = crypto.randomBytes(this.saltLength).toString('hex');
    const hash = crypto.scryptSync(password, salt, 64).toString('hex');
    return `${salt}:${hash}`;
  }

  /**
   * Verify password against hash
   */
  verifyPassword(password: string, hashedPassword: string): boolean {
    try {
      const [salt, hash] = hashedPassword.split(':');
      const hashBuffer = Buffer.from(hash, 'hex');
      const suppliedHashBuffer = crypto.scryptSync(password, salt, 64);
      return crypto.timingSafeEqual(hashBuffer, suppliedHashBuffer);
    } catch (error) {
      logger.error('Password verification failed:', error);
      return false;
    }
  }

  /**
   * Generate secure random token
   */
  generateToken(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex');
  }

  /**
   * Generate secure random OTP
   */
  generateOTP(length: number = 6): string {
    const digits = '0123456789';
    let otp = '';
    const randomBytes = crypto.randomBytes(length);

    for (let i = 0; i < length; i++) {
      otp += digits[randomBytes[i] % digits.length];
    }

    return otp;
  }

  /**
   * Hash data with SHA-256
   */
  hash(data: string): string {
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  /**
   * Create HMAC signature
   */
  sign(data: string, secret?: string): string {
    const key = secret || this.encryptionKey.toString('hex');
    return crypto.createHmac('sha256', key).update(data).digest('hex');
  }

  /**
   * Verify HMAC signature
   */
  verifySignature(data: string, signature: string, secret?: string): boolean {
    const expectedSignature = this.sign(data, secret);
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature));
  }

  /**
   * Generate key pair for asymmetric encryption
   */
  generateKeyPair(): { publicKey: string; privateKey: string } {
    const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: {
        type: 'spki',
        format: 'pem',
      },
      privateKeyEncoding: {
        type: 'pkcs8',
        format: 'pem',
      },
    });

    return { publicKey, privateKey };
  }

  /**
   * Encrypt with public key
   */
  encryptWithPublicKey(data: string, publicKey: string): string {
    const buffer = Buffer.from(data, 'utf8');
    const encrypted = crypto.publicEncrypt(publicKey, buffer);
    return encrypted.toString('base64');
  }

  /**
   * Decrypt with private key
   */
  decryptWithPrivateKey(encryptedData: string, privateKey: string): string {
    const buffer = Buffer.from(encryptedData, 'base64');
    const decrypted = crypto.privateDecrypt(privateKey, buffer);
    return decrypted.toString('utf8');
  }

  /**
   * Generate nonce for replay attack prevention
   */
  generateNonce(): string {
    return `${Date.now()}-${this.generateToken(16)}`;
  }

  /**
   * Validate nonce (check if not expired and not used)
   */
  validateNonce(nonce: string, maxAgeMs: number = 300000): boolean {
    try {
      const [timestamp] = nonce.split('-');
      const age = Date.now() - parseInt(timestamp, 10);
      return age >= 0 && age <= maxAgeMs;
    } catch (error) {
      return false;
    }
  }
}

export const encryptionService = new EncryptionService();
