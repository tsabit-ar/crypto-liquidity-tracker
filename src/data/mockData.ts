import type { AiBriefing, SectorMetric, ActionableSetup } from '@/types/dashboard';

export const mockAiBriefing: AiBriefing = {
  macroRegime: 'Neutral',
  dominantInflowSector: 'AI & Compute',
  dominantOutflowSector: 'Layer-1 (Legacy)',
  executiveSummary:
    'Terjadi rotasi modal bersih dari L1 berkapitalisasi lama menuju infrastruktur AI Agents dan RWA. Sektor Meme menunjukkan penumpukan leverage derivatif tanpa volume spot yang memadai.',
  anomalyObservations: [
    'Sektor Meme: Open Interest naik +38% tanpa inflow TVL spot (Indikasi Hype Trap).',
    'Sektor AI: Rasio Vol/MC berada di 0.38 dengan funding rate netral 0.004%.',
    'Arus bridge keluar dari Layer-1 lama tercatat -$45M dalam 48 jam terakhir.'
  ]
};

export const mockSectors: SectorMetric[] = [
  { id: 'ai', name: 'AI & Compute', tvl: '$1.42B', tvlDelta7d: 24.5, volume24h: '$680M', volMcRatio: 0.38, oiDelta24h: 8.2, lmsScore: 8.9, quadrant: 'Expansion' },
  { id: 'rwa', name: 'Real World Assets', tvl: '$2.10B', tvlDelta7d: 14.2, volume24h: '$310M', volMcRatio: 0.22, oiDelta24h: 3.1, lmsScore: 7.6, quadrant: 'Stealth Acc' },
  { id: 'meme', name: 'Meme Tokens', tvl: '$480M', tvlDelta7d: -3.4, volume24h: '$1.12B', volMcRatio: 0.62, oiDelta24h: 38.0, lmsScore: 4.1, quadrant: 'Hype Trap' },
  { id: 'l1', name: 'Layer-1 Legacy', tvl: '$18.4B', tvlDelta7d: -8.1, volume24h: '$2.40B', volMcRatio: 0.06, oiDelta24h: -5.4, lmsScore: 3.2, quadrant: 'Dormant' },
  { id: 'depin', name: 'DePIN', tvl: '$890M', tvlDelta7d: 9.8, volume24h: '$195M', volMcRatio: 0.18, oiDelta24h: 4.0, lmsScore: 6.8, quadrant: 'Stealth Acc' },
  { id: 'defi', name: 'DeFi Core', tvl: '$32.1B', tvlDelta7d: 1.2, volume24h: '$1.80B', volMcRatio: 0.11, oiDelta24h: 0.5, lmsScore: 5.4, quadrant: 'Dormant' }
];

export const mockSetups: ActionableSetup[] = [
  {
    id: 'setup-1',
    ticker: 'RENDER',
    sector: 'AI & Compute',
    bias: 'LONG',
    confidence: 'High',
    price: '$6.42',
    quantitativeThesis: 'Sektor AI memimpin inflow TVL (+24.5% 7d). Rasio Vol/MC 0.38 mengonfirmasi akumulasi spot riil tanpa overheat leverage.',
    invalidationRule: 'Breakdown harga di bawah $5.85 atau TVL sektor AI berbalik negatif.',
    riskReward: '1 : 3.4',
    metrics: { tvlDelta7d: '+24.5%', volMcRatio: '0.38', oiDelta24h: '+8.2%', fundingRate: '+0.004%' }
  },
  {
    id: 'setup-2',
    ticker: 'PEPE',
    sector: 'Meme Tokens',
    bias: 'SHORT',
    confidence: 'Medium',
    price: '$0.0000095',
    quantitativeThesis: 'OI naik +38% dalam 24 jam bersamaan sentimen sosial masif, tetapi TVL turun -3.4%. Karakteristik overextended long leverage.',
    invalidationRule: 'Volume spot CEX melompat menembus resistance likuiditas di level $0.0000115.',
    riskReward: '1 : 2.8',
    metrics: { tvlDelta7d: '-3.4%', volMcRatio: '0.62', oiDelta24h: '+38.0%', fundingRate: '+0.048%' }
  },
  {
    id: 'setup-3',
    ticker: 'ADA',
    sector: 'Layer-1 Legacy',
    bias: 'CASH',
    confidence: 'High',
    price: '$0.34',
    quantitativeThesis: 'Perputaran modal mandek (Vol/MC 0.06) dan outflow konsisten selama 7 hari berturut-turut.',
    invalidationRule: 'Net inflow ekosistem berubah positif > $50M dengan lonjakan volume.',
    riskReward: 'N/A (Avoid)',
    metrics: { tvlDelta7d: '-8.1%', volMcRatio: '0.06', oiDelta24h: '-5.4%', fundingRate: '+0.001%' }
  }
];