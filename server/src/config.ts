export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // Database
  databaseUrl: process.env.DATABASE_URL || '',
  
  // JWT
  jwtSecret: process.env.JWT_SECRET || 'change-this-secret-in-production',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  
  // EIP-712
  adminPrivateKey: process.env.ADMIN_PRIVATE_KEY || '',
  contractAddress: process.env.CONTRACT_ADDRESS || '',
  chainId: parseInt(process.env.CHAIN_ID || '56', 10), // BSC Mainnet default
  
  eip712Domain: {
    name: process.env.EIP712_DOMAIN_NAME || 'eAkhuwat',
    version: process.env.EIP712_DOMAIN_VERSION || '1',
  },
  
  // Rate Limiting
  rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 min
  rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
  
  // CORS
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
};
