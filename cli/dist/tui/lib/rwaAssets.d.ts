import type { RWAAsset } from '../types.js';
export declare const RWA_ASSETS: RWAAsset[];
export declare function getAssetById(id: string): RWAAsset | undefined;
export declare function getAssetsByCategory(category: RWAAsset['category']): RWAAsset[];
export declare const CATEGORY_NAMES: Record<RWAAsset['category'], string>;
//# sourceMappingURL=rwaAssets.d.ts.map