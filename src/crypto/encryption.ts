import { config } from "../config";
import * as crypto from "crypto";

function splitEncryptedText(encryptedText: string) {
  return {
    encryptedDataString: encryptedText.slice(56, -32),
    ivString: encryptedText.slice(0, 24),
    assocDataString: encryptedText.slice(24, 56),
    tagString: encryptedText.slice(-32),
  };
}

export default class Encryption {
  encoding: BufferEncoding = "hex";
  key: Buffer;

  constructor() {
    this.key = Buffer.from(config.encryption.key, "hex");
  }

  encrypt(text: string) {
    try {
      const iv = crypto.randomBytes(12);
      const assocData = crypto.randomBytes(16);
      const cipher = crypto.createCipheriv("chacha20-poly1305", this.key, iv, {
        authTagLength: 16,
      });

      cipher.setAAD(assocData, { plaintextLength: Buffer.byteLength(text) });

      const encrypted = Buffer.concat([
        cipher.update(
          text, "utf-8"
        ),
        cipher.final(),
      ]);

      const tag = cipher.getAuthTag();
      return iv.toString(this.encoding) + assocData.toString(this.encoding) + encrypted.toString(this.encoding) + tag.toString(this.encoding);
    } catch (e) {
      console.error(e);
    }
  };

  decrypt(cipherText: string) {
    const {
      encryptedDataString,
      ivString,
      assocDataString,
      tagString,
    } = splitEncryptedText(cipherText);

    try {
      const iv = Buffer.from(ivString, this.encoding);
      const encryptedText = Buffer.from(encryptedDataString, this.encoding);
      const tag = Buffer.from(tagString, this.encoding);

      const decipher = crypto.createDecipheriv("chacha20-poly1305", this.key, iv, { authTagLength: 16 });
      decipher.setAAD(Buffer.from(assocDataString, this.encoding), { plaintextLength: encryptedDataString.length });
      decipher.setAuthTag(Buffer.from(tag));

      const decrypted = decipher.update(encryptedText);
      return Buffer.concat([ decrypted, decipher.final() ]).toString();
    } catch (e) {
      console.error(e);
    }
  }
}