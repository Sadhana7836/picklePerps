// RWA Assets available for trading - matching the web app
export const RWA_ASSETS = [
    // Commodities
    { id: 'gold', name: 'Gold', symbol: 'XAU', pythId: '0xfe650f0367d4a7ef9815a593ea15d36593f0643aaaf0149bb04be67ab851decd', category: 'commodity' },
    { id: 'silver', name: 'Silver', symbol: 'XAG', pythId: '0xf2fb02c32b055c805e7238d628e5e9dadef274376114eb1f012337cabe93871e', category: 'commodity' },
    { id: 'oil', name: 'Crude Oil (WTI)', symbol: 'OIL', pythId: '0xc7c60099c12805bea1ae4df2243d6fe72b63be3adeb2208195e844734219967b', category: 'commodity' },
    // Crypto
    { id: 'btc', name: 'Bitcoin', symbol: 'BTC', pythId: '0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43', category: 'crypto' },
    { id: 'eth', name: 'Ethereum', symbol: 'ETH', pythId: '0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace', category: 'crypto' },
    { id: 'sol', name: 'Solana', symbol: 'SOL', pythId: '0xef0d8b6fda2ceba41da15d4095d1da392a0d2f8ed0c6c7bc0f4cfac8c280b56d', category: 'crypto' },
    // Forex
    { id: 'eurusd', name: 'Euro / USD', symbol: 'EUR', pythId: '0xa995d00bb36a63cef7fd2c287dc105fc8f3d93779f062f09551b0af3e81ec30b', category: 'forex' },
    { id: 'gbpusd', name: 'British Pound / USD', symbol: 'GBP', pythId: '0x84c2dde9633d93d1bcad84e244dc98e6d32c7ea90ebe76b42d62eb6e1b7f6224', category: 'forex' },
    { id: 'jpyusd', name: 'Japanese Yen / USD', symbol: 'JPY', pythId: '0xef2c98c804ba503c6a707e38be4dfbb16683775f195b091252bf24693042fd52', category: 'forex' },
    // Indices
    { id: 'spx', name: 'S&P 500', symbol: 'SPX', pythId: '0x19e09bb805456ada3979a7d1cbb4b6e3e8e6e7e9e8f2e3e4e5e6e7e8e9e0e1e2', category: 'index' },
    // Equities
    { id: 'aapl', name: 'Apple Inc.', symbol: 'AAPL', pythId: '0x49f6b65cb1de6b10eaf75e7c03ca029c306d0357e91b5311b175084a5ad55688', category: 'equity' },
    { id: 'tsla', name: 'Tesla Inc.', symbol: 'TSLA', pythId: '0x16dad506d7db8da01c87581c87ca897a012a153557d4d578c3b9c9e1bc0632f1', category: 'equity' },
    { id: 'nvda', name: 'NVIDIA Corporation', symbol: 'NVDA', pythId: '0x4b98b3afc6e9b4e6c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6', category: 'equity' },
];
// Get asset by ID
export function getAssetById(id) {
    return RWA_ASSETS.find(a => a.id.toLowerCase() === id.toLowerCase());
}
// Get assets by category
export function getAssetsByCategory(category) {
    return RWA_ASSETS.filter(a => a.category === category);
}
// Category display names
export const CATEGORY_NAMES = {
    commodity: 'Commodities',
    crypto: 'Crypto',
    forex: 'Forex',
    index: 'Indices',
    equity: 'Equities',
};
//# sourceMappingURL=rwaAssets.js.map