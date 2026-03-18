import * as StellarSdk from '@stellar/stellar-sdk';

export const STELLAR_NETWORK = 'TESTNET';
export const STELLAR_NETWORK_PASSPHRASE = StellarSdk.Networks.TESTNET;
export const STELLAR_RPC_URL = 'https://soroban-testnet.stellar.org';
export const STELLAR_HORIZON_URL = 'https://horizon-testnet.stellar.org';

// Contract IDs - Deployed on Stellar Testnet
export const CONTRACT_IDS = {
  tokenFactory: 'CBAHPW7BGC63QFIN4ZRUGEQDVAZQOXVP67AVZPDQNRHN7EZXAOZAJB4O',
  bondingCurve: 'CDEMRBGQK55F5HHLXF67IOUWFUSLIOE5YULDMLYXH3A4QXOPT73AAP5T',
  perpetualTrading: 'CBRWI2CCKLT225CTB3GKC7QIOGVRSLXFYW4FDBK7SWY744HSLWQ35QJM',
  pickleToken: 'CD7Q7ISZECAJDAZMHSH5CMLDEWHZ6HZ6F3YGYHM3K6552UKFQE2CWOMW',
  copyTrading: '',
  rwaPerpeturalTrading: '',
};

// Create server instance
export const server = new StellarSdk.SorobanRpc.Server(STELLAR_RPC_URL);
export const horizonServer = new StellarSdk.Horizon.Server(STELLAR_HORIZON_URL);
