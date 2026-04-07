import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { ethers } from "ethers";

const SIGNER_PRIVATE_KEY = "0x59c6995e998f97a5a0044966f0945382d7f9f691f8f8f7f2a5f4e5f5a5c5d5e5";
const BASE_ENV = { ...process.env };

async function loadEip712(envOverrides: Record<string, string | undefined> = {}) {
  process.env = {
    ...BASE_ENV,
    NODE_ENV: "test",
    CONTRACT_ADDRESS: "0x0000000000000000000000000000000000000010",
    CHAIN_ID: "1",
    SIGNER_PRIVATE_KEY,
    EIP712_DOMAIN_NAME: "eAkhuwat",
    EIP712_DOMAIN_VERSION: "1",
    EIP712_WITHDRAWAL_TTL_SECONDS: "3600",
    EIP712_MAX_DEADLINE_SECONDS: "86400",
  };

  Object.entries(envOverrides).forEach(([key, value]) => {
    if (value === undefined) {
      delete process.env[key];
      return;
    }
    process.env[key] = value;
  });

  vi.resetModules();
  return import("../utils/eip712");
}

beforeEach(() => {
  vi.useRealTimers();
});

afterEach(() => {
  process.env = { ...BASE_ENV };
  vi.resetModules();
});

describe("EIP-712 withdrawal signing hardening", () => {
  it("signs and verifies a valid withdrawal signature", async () => {
    const eip712 = await loadEip712();
    const recipient = "0x0000000000000000000000000000000000000020";
    const nonce = 12345;

    const { signature, deadline } = await eip712.signWithdrawal(recipient, 25.5, nonce, 300);
    const recovered = eip712.verifySignedWithdrawal({
      recipient,
      amountUsdc: 25.5,
      nonce,
      deadline,
      signature,
      expectedSigner: new ethers.Wallet(SIGNER_PRIVATE_KEY).address,
    });

    expect(recovered.toLowerCase()).toBe(new ethers.Wallet(SIGNER_PRIVATE_KEY).address.toLowerCase());
  });

  it("rejects invalid chainId config", async () => {
    const eip712 = await loadEip712({ CHAIN_ID: "abc" });
    await expect(eip712.signWithdrawal("0x0000000000000000000000000000000000000020", 10, 1, 300))
      .rejects
      .toMatchObject({ code: "EIP712_CONFIG_INVALID" });
  });

  it("rejects wrong contract address config", async () => {
    const eip712 = await loadEip712({ CONTRACT_ADDRESS: "0x1234" });
    await expect(eip712.signWithdrawal("0x0000000000000000000000000000000000000020", 10, 1, 300))
      .rejects
      .toMatchObject({ code: "EIP712_CONFIG_INVALID" });
  });

  it("rejects expired deadlines", async () => {
    const eip712 = await loadEip712();
    const wallet = new ethers.Wallet(SIGNER_PRIVATE_KEY);
    const domain = eip712.getValidatedEIP712Domain();
    const expiredDeadline = Math.floor(Date.now() / 1000) - 10;
    const data = {
      recipient: "0x0000000000000000000000000000000000000020",
      amount: ethers.parseUnits("25.500000", 6),
      nonce: 99n,
      deadline: BigInt(expiredDeadline),
    };
    const signature = await wallet.signTypedData(domain, eip712.WITHDRAWAL_TYPES, data);

    expect(() => eip712.verifySignedWithdrawal({
      recipient: data.recipient,
      amountUsdc: 25.5,
      nonce: 99,
      deadline: expiredDeadline,
      signature,
    })).toThrowError(/expired/i);
  });

  it("detects replayed nonce", async () => {
    const eip712 = await loadEip712();
    await expect(eip712.ensureNonceNotUsed(77, async () => true))
      .rejects
      .toMatchObject({ code: "EIP712_NONCE_REPLAY" });
  });

  it("rejects malformed payload", async () => {
    const eip712 = await loadEip712();
    const wallet = new ethers.Wallet(SIGNER_PRIVATE_KEY);
    const domain = eip712.getValidatedEIP712Domain();
    const deadline = Math.floor(Date.now() / 1000) + 1000;
    const signature = await wallet.signTypedData(domain, eip712.WITHDRAWAL_TYPES, {
      recipient: "0x0000000000000000000000000000000000000020",
      amount: ethers.parseUnits("10.000000", 6),
      nonce: 1n,
      deadline: BigInt(deadline),
    });

    expect(() => eip712.verifySignedWithdrawal({
      recipient: "not-an-address",
      amountUsdc: 10,
      nonce: 1,
      deadline,
      signature,
    })).toThrowError(/recipient/i);
  });

  it("rejects missing signer config", async () => {
    const eip712 = await loadEip712({ SIGNER_PRIVATE_KEY: undefined });
    await expect(eip712.signWithdrawal("0x0000000000000000000000000000000000000020", 5, 1, 300))
      .rejects
      .toMatchObject({ code: "EIP712_CONFIG_INVALID" });
  });

  it("rejects invalid signature format", async () => {
    const eip712 = await loadEip712();
    expect(() => eip712.verifySignedWithdrawal({
      recipient: "0x0000000000000000000000000000000000000020",
      amountUsdc: 10,
      nonce: 1,
      deadline: Math.floor(Date.now() / 1000) + 1000,
      signature: "0x1234",
    })).toThrowError(/Malformed signature format/i);
  });
});
