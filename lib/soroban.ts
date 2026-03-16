import * as StellarSdk from '@stellar/stellar-sdk';
import { server, STELLAR_NETWORK_PASSPHRASE } from './stellar';
import { signStellarTransaction } from './freighter';

const { Contract, TransactionBuilder, BASE_FEE, nativeToScVal, scValToNative, Address } = StellarSdk;

export async function callContract(
  contractId: string,
  method: string,
  args: StellarSdk.xdr.ScVal[],
  callerAddress: string,
  sendTransaction: boolean = false
// eslint-disable-next-line @typescript-eslint/no-explicit-any
): Promise<any> {
  let account;
  try {
    account = await server.getAccount(callerAddress);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes('not found') || msg.includes('404')) {
      throw new Error(
        'Account not found on Stellar testnet. Please fund your wallet at https://friendbot.stellar.org/?addr=' + callerAddress
      );
    }
    throw new Error(`Failed to load account: ${msg}`);
  }
  const contract = new Contract(contractId);

  const tx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: STELLAR_NETWORK_PASSPHRASE,
  })
    .addOperation(contract.call(method, ...args))
    .setTimeout(30)
    .build();

  if (!sendTransaction) {
    // Simulate only (read-only call)
    const simResult = await server.simulateTransaction(tx);
    if (StellarSdk.SorobanRpc.Api.isSimulationSuccess(simResult)) {
      return scValToNative(simResult.result!.retval);
    }
    // Extract error details from simulation
    const errorMsg = StellarSdk.SorobanRpc.Api.isSimulationError(simResult)
      ? simResult.error
      : 'Simulation failed';
    throw new Error(errorMsg);
  }

  // Simulate first
  const simResult = await server.simulateTransaction(tx);
  if (!StellarSdk.SorobanRpc.Api.isSimulationSuccess(simResult)) {
    const errorMsg = StellarSdk.SorobanRpc.Api.isSimulationError(simResult)
      ? simResult.error
      : 'Transaction simulation failed';
    console.error('[callContract] Simulation failed:', errorMsg);
    throw new Error(errorMsg);
  }

  // Assemble transaction with simulation results (includes auth, resource limits, fees)
  const preparedTx = StellarSdk.SorobanRpc.assembleTransaction(tx, simResult).build();

  // Sign with Freighter
  let signedXdr: string;
  try {
    signedXdr = await signStellarTransaction(preparedTx.toXDR());
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[callContract] Signing failed:', msg);
    throw new Error(`Wallet signing failed: ${msg}`);
  }

  if (!signedXdr) {
    throw new Error('Transaction was rejected by wallet');
  }

  const signedTx = TransactionBuilder.fromXDR(signedXdr, STELLAR_NETWORK_PASSPHRASE);

  // Submit
  const sendResult = await server.sendTransaction(signedTx);
  console.log('[callContract] sendTransaction status:', sendResult.status);

  if (sendResult.status === 'ERROR') {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const errorDetail = (sendResult as any).errorResult
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ? JSON.stringify((sendResult as any).errorResult)
      : 'Unknown error';
    console.error('[callContract] Send error:', errorDetail);
    throw new Error(`Transaction send error: ${errorDetail}`);
  }

  if (sendResult.status !== 'PENDING') {
    throw new Error(`Transaction send failed with status: ${sendResult.status}`);
  }

  // Poll for result with timeout (max 60 seconds)
  const maxAttempts = 30;
  let attempts = 0;
  let getResult = await server.getTransaction(sendResult.hash);

  while (getResult.status === 'NOT_FOUND' && attempts < maxAttempts) {
    await new Promise(resolve => setTimeout(resolve, 2000));
    getResult = await server.getTransaction(sendResult.hash);
    attempts++;
  }

  if (getResult.status === 'NOT_FOUND') {
    throw new Error('Transaction confirmation timed out');
  }

  if (getResult.status === 'SUCCESS') {
    return getResult.returnValue ? scValToNative(getResult.returnValue) : null;
  }

  // Transaction FAILED — extract details
  console.error('[callContract] Transaction failed. Status:', getResult.status);
  throw new Error(`Transaction failed: ${getResult.status}`);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function toScVal(value: any, type: string): StellarSdk.xdr.ScVal {
  switch (type) {
    case 'address':
      return new Address(value).toScVal();
    case 'string':
      return nativeToScVal(value, { type: 'string' });
    case 'i128':
      return nativeToScVal(BigInt(value), { type: 'i128' });
    case 'u64':
      return nativeToScVal(BigInt(value), { type: 'u64' });
    case 'u32':
      return nativeToScVal(value, { type: 'u32' });
    case 'bool':
      return nativeToScVal(value, { type: 'bool' });
    case 'symbol':
      return nativeToScVal(value, { type: 'symbol' });
    default:
      return nativeToScVal(value);
  }
}

export function formatAmount(amount: bigint | string, decimals: number = 7): string {
  const val = typeof amount === 'string' ? BigInt(amount) : amount;
  const divisor = BigInt(10 ** decimals);
  const whole = val / divisor;
  const frac = val % divisor;
  return `${whole}.${frac.toString().padStart(decimals, '0')}`;
}

export function parseAmount(amount: string, decimals: number = 7): bigint {
  const [whole, frac = ''] = amount.split('.');
  const fracPadded = frac.padEnd(decimals, '0').slice(0, decimals);
  return BigInt(whole + fracPadded);
}
