export type SetupBias = 'LONG' | 'SHORT' | 'CASH';
export type ConfidenceLevel = 'High' | 'Medium' | 'Low';

export interface ActionableSetup {
  id: string;
  ticker: string;
  sector: string;
  bias: SetupBias;
  confidence: ConfidenceLevel;
  price: string;
  quantitativeThesis: string;
  invalidationRule: string;
  riskReward: string;
  metrics: {
    tvlDelta7d: string;
    volMcRatio: string;
    oiDelta24h: string;
    fundingRate: string;
  };
}

export interface SectorMetric {
  id: string;
  name: string;
  tvl: string;
  tvlDelta7d: number;
  volume24h: string;
  volMcRatio: number;
  oiDelta24h: number;
  lmsScore: number;
  quadrant: 'Expansion' | 'Hype Trap' | 'Stealth Acc' | 'Dormant';
}

export interface AiBriefing {
  macroRegime: 'Risk-On' | 'Risk-Off' | 'Macro Squeeze' | 'Neutral';
  dominantInflowSector: string;
  dominantOutflowSector: string;
  executiveSummary: string;
  anomalyObservations: string[];
}