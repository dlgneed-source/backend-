// ============================================================================
// EIP-712 SIGNATURE GENERATION - Withdrawal Security
// ============================================================================
// All operations happen atomically within a single transaction
// ============================================================================

import { ethers } from 'ethers';
import { prisma } from './prisma';
import { logger } from './logger';
import { config } from '../config';
import { AppError } from './errors';

// EIP-712 Domain configuration
const domain = {
  name: config.eip712Domain.name,
  version: config.eip712Domain.version,
  chainId: config.chainId,
  verifyingContract: config.contractAddress,
};

// EIP-712 Types for withdrawal
const withdrawalTypes = {
  Withdrawal: [
    { name: 'userAddress', type: 'address' },
    { name: 'amount', type: 'uint256' },
    { name: 'nonce', type: 'uint256' },
  ],
};

// Initialize admin wallet
let adminWallet: ethers.Wallet;

try {
  if (config.adminPrivateKey) {
    adminWallet = new ethers.Wallet(config.adminPrivateKey);
    logger.info('Admin wallet initialized', { address: adminWallet.address });
  } else {
    logger.warn('Admin private key not configured');
  }
} catch (error) {
  logger.error('Failed to initialize admin wallet', { error });
}

export const generateWithdrawalSignature = async (
  userId: string,
  userWalletAddress: string,
  withdrawAmount: string
): Promise<{
  signature: string;
  nonce: number;
  amountInWei: string;
  contractAddress: string;
}> => {
  if (!adminWallet) {
    throw new AppError('Admin wallet not configured', 500, 'CONFIG_ERROR');
  }

  if (!config.contractAddress) {
    throw new AppError('Contract address not configured', 500, 'CONFIG_ERROR');
  }

  if (!ethers.isAddress(userWalletAddress)) {
    throw new AppError('Invalid wallet address', 400, 'INVALID_ADDRESS');
  }

  const amount = parseFloat(withdrawAmount);
  if (isNaN(amount) || amount <= 0) {
    throw new AppError('Invalid withdrawal amount', 400, 'INVALID_AMOUNT');
  }

  if (amount < 1) {
    throw new AppError('Minimum withdrawal amount is $1', 400, 'MINIMUM_WITHDRAWAL');
  }

  const amountInWei = ethers.parseUnits(withdrawAmount, 18);

  try {
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({ where: { id: userId } });

      if (!user) throw new AppError('User not found', 404, 'USER_NOT_FOUND');
      if (user.status !== 'ACTIVE') throw new AppError('User account is not active', 403, 'ACCOUNT_INACTIVE');

      const userBalance = parseFloat(user.balance.toString());
      if (userBalance < amount) {
        throw new AppError(
          `Insufficient balance. Available: $${userBalance.toFixed(2)}, Requested: $${amount.toFixed(2)}`,
          400,
          'INSUFFICIENT_BALANCE'
        );
      }

      const pendingWithdrawals = await tx.withdrawal.count({
        where: {
          userId,
          status: { in: ['PENDING', 'APPROVED', 'PROCESSING'] },
        },
      });

      if (pendingWithdrawals > 0) {
        throw new AppError('You have pending withdrawals. Please wait for them to complete.', 400, 'PENDING_WITHDRAWALS');
      }

      const currentNonce = user.nonce;

      const signature = await adminWallet.signTypedData(domain, withdrawalTypes, {
        userAddress: userWalletAddress,
        amount: amountInWei,
        nonce: currentNonce,
      });

      const updatedUser = await tx.user.update({
        where: { id: userId },
        data: {
          nonce: { increment: 1 },
          balance: { decrement: withdrawAmount },
          totalWithdrawn: { increment: withdrawAmount },
        },
      });

      const withdrawal = await tx.withdrawal.create({
        data: {
          userId,
          amount: withdrawAmount,
          signature,
          status: 'APPROVED',
        },
      });

      await tx.transaction.create({
        data: {
          userId,
          type: 'WITHDRAWAL',
          amount: withdrawAmount,
          description: `Withdrawal request approved (nonce: ${currentNonce})`,
          referenceId: withdrawal.id,
        },
      });

      return { updatedUser, withdrawal, signature, nonce: currentNonce };
    }, {
      isolationLevel: 'Serializable',
    });

    logger.info('Withdrawal signature generated', {
      userId,
      amount: withdrawAmount,
      nonce: result.nonce,
      withdrawalId: result.withdrawal.id,
    });

    return {
      signature: result.signature,
      nonce: result.nonce,
      amountInWei: amountInWei.toString(),
      contractAddress: config.contractAddress,
    };
  } catch (error) {
    if (error instanceof AppError) throw error;
    logger.error('Failed to generate withdrawal signature', { error, userId, amount: withdrawAmount });
    throw new AppError('Failed to process withdrawal', 500, 'WITHDRAWAL_FAILED');
  }
};

export const verifyWithdrawalSignature = (
  userAddress: string,
  amount: string,
  nonce: number,
  signature: string
): boolean => {
  try {
    const amountInWei = ethers.parseUnits(amount, 18);
    const message = { userAddress, amount: amountInWei, nonce };
    const recoveredAddress = ethers.verifyTypedData(domain, withdrawalTypes, message, signature);
    return recoveredAddress.toLowerCase() === adminWallet.address.toLowerCase();
  } catch (error) {
    logger.error('Signature verification failed', { error });
    return false;
  }
};

export const getUserNonce = async (userId: string): Promise<number> => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { nonce: true },
  });
  return user?.nonce ?? 0;
};
