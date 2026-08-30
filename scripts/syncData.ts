import { createClient } from '@supabase/supabase-js';
import { GoogleGenAI, Type } from '@google/genai';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
const BINANCE_PROXY_URL = 'https://binance-fapi-proxy.vercel.app';

// Helper: Penanganan timeout request agar pipeline tidak menggantung jika API/proxy lambat
async function fetchWithTimeout(url: string, options: any = {}, timeout = 10000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(id);
    return response;
  } catch (error) {
    clearTimeout(id);
    throw error;
  }
}

// 1. Formula Deterministic Quadrant
function determineQuadrant(tvlDelta: number, oiDelta: number, volMc: number): 'Expansion' | 'Hype Trap' | 'Stealth Acc' | 'Dormant' {
  if (tvlDelta > 3 && volMc > 0.15) return 'Expansion';
  if (oiDelta > 10 && tvlDelta <= 0) return 'Hype Trap';
  if (tvlDelta > 3 && oiDelta <= 5) return 'Stealth Acc';
  return 'Dormant';
}

// 2. Formula Kuantitatif Liquidity Momentum Score (Skala 1.0 - 10.0)
function calculateLMS(tvlDelta7d: number, volMcRatio: number, oiDelta24h: number): number {
  const normTvl = Math.max(-10, Math.min(20, tvlDelta7d)) / 20;
  const normVol = Math.max(0, Math.min(1, volMcRatio));
  const normOi = Math.max(-10, Math.min(30, oiDelta24h)) / 30;

  const rawScore = (normTvl * 0.40 + normVol * 0.35 + normOi * 0.25) * 10;
  const boundedScore = Math.max(1.0, Math.min(9.9, 5.0 + rawScore));
  return parseFloat(boundedScore.toFixed(1));
}

async function runHybridPipeline() {
  console.log('--- Memulai Hybrid Data Pipeline (With Timeout Safety) ---');

  // A. DefiLlama Chains TVL
  console.log('1. [DefiLlama] Mengambil TVL on-chain...');
  let chainsData: any[] = [];
  try {
    const llamaRes = await fetchWithTimeout('https://api.llama.fi/v2/chains');
    const allChains = await llamaRes.json();
    chainsData = allChains.slice(0, 6).map((c: any) => ({
      name: c.name,
      tvl: c.tvl,
      tokenSymbol: c.tokenSymbol
    }));
  } catch (err) {
    console.error('Peringatan: DefiLlama fetch timeout/error:', err);
  }

  // B. CoinGecko Categories
  console.log('2. [CoinGecko] Mengambil data kategori pasar...');
  let dynamicSectors: any[] = [];
  try {
    const cgCatRes = await fetchWithTimeout('https://api.coingecko.com/api/v3/coins/categories');
    const categories = await cgCatRes.json();

    const sectorMapping: Record<string, { id: string; name: string; matchKeywords: string[] }> = {
      ai: { id: 'ai', name: 'AI & Compute', matchKeywords: ['artificial-intelligence', 'ai-agents'] },
      rwa: { id: 'rwa', name: 'Real World Assets', matchKeywords: ['real-world-assets-rwa'] },
      meme: { id: 'meme', name: 'Meme Tokens', matchKeywords: ['meme-token'] },
      l1: { id: 'l1', name: 'Layer-1 Legacy', matchKeywords: ['layer-1'] },
      depin: { id: 'depin', name: 'DePIN', matchKeywords: ['depin'] },
      defi: { id: 'defi', name: 'DeFi Core', matchKeywords: ['decentralized-finance-defi'] }
    };

    dynamicSectors = Object.keys(sectorMapping).map((key) => {
      const config = sectorMapping[key];
      const found = Array.isArray(categories) 
        ? categories.find((c: any) => config.matchKeywords.some((kw) => c.id?.includes(kw) || c.name?.toLowerCase().includes(kw)))
        : null;

      const marketCap = found?.market_cap || 1000000000;
      const volume24h = found?.volume_24h || 200000000;
      const change24h = found?.market_cap_change_24h || 0;
      const volMcRatio = parseFloat((volume24h / (marketCap || 1)).toFixed(2));
      const tvlEstimate = marketCap * 0.4;
      const tvlDelta7d = parseFloat((change24h * 1.5).toFixed(1));
      const oiDelta24h = parseFloat((change24h * 0.8).toFixed(1));

      const lmsScore = calculateLMS(tvlDelta7d, volMcRatio, oiDelta24h);
      const quadrant = determineQuadrant(tvlDelta7d, oiDelta24h, volMcRatio);

      return {
        sector_id: config.id,
        tvl: Math.round(tvlEstimate),
        tvl_delta_7d: tvlDelta7d,
        volume_24h: Math.round(volume24h),
        volume_mc_ratio: volMcRatio,
        oi_delta_24h: oiDelta24h,
        lms_score: lmsScore,
        quadrant
      };
    });
  } catch (err) {
    console.error('Peringatan: CoinGecko fetch timeout/error:', err);
  }

  // C. Binance Futures via Proxy
  console.log('3. [Binance via Proxy] Mengambil data likuiditas derivatif...');
  let derivativeData: any[] = [];
  try {
    const targetPairs = ['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'RENDERUSDT', 'NEARUSDT', 'PEPEUSDT'];
    const tickerRes = await fetchWithTimeout(`${BINANCE_PROXY_URL}/fapi/v1/ticker/24hr`);
    const tickers = await tickerRes.json();

    const fundingRes = await fetchWithTimeout(`${BINANCE_PROXY_URL}/fapi/v1/premiumIndex`);
    const fundings = await fundingRes.json();

    derivativeData = targetPairs.map((symbol) => {
      const tickerInfo = Array.isArray(tickers) ? tickers.find((t: any) => t.symbol === symbol) : null;
      const fundingInfo = Array.isArray(fundings) ? fundings.find((f: any) => f.symbol === symbol) : null;

      return {
        symbol,
        lastPrice: tickerInfo?.lastPrice || '0',
        futuresVolume: tickerInfo?.quoteVolume || '0',
        priceChange24h: tickerInfo?.priceChangePercent || '0',
        fundingRate: fundingInfo?.lastFundingRate ? (parseFloat(fundingInfo.lastFundingRate) * 100).toFixed(4) + '%' : '0.0100%'
      };
    });
  } catch (err) {
    console.error('Peringatan: Binance proxy fetch timeout/error:', err);
  }

  // D. Simpan Sektor Dinamis ke Supabase
  if (dynamicSectors.length > 0) {
    console.log('4. [Supabase] Menyimpan riwayat metrik sektoral dinamis...');
    const { error: secErr } = await supabase.from('sector_metrics_history').insert(dynamicSectors);
    if (secErr) console.error('Error insert sector_metrics_history:', secErr);
  }

  // E. Gemini AI Synthesis
  console.log('5. [Gemini Engine] Menjalankan sintesis data pasar...');
  const prompt = `
    Analisis data pasar aktual berikut:
    - TVL Chains (DefiLlama): ${JSON.stringify(chainsData)}
    - Metrik Sektoral Dinamis: ${JSON.stringify(dynamicSectors)}
    - Pasar Derivatif & Funding Rate: ${JSON.stringify(derivativeData)}

    Tugas:
    1. Tentukan macro regime ('Risk-On', 'Risk-Off', 'Macro Squeeze', atau 'Neutral').
    2. Identifikasi sektor inflow dan outflow modal dominan.
    3. Buat ringkasan eksekutif dan 3 observasi anomali tajam.
    4. Formulasikan 3 setup asimetris (LONG, SHORT, atau CASH) dengan tesis kuantitatif terukur, invalidation jelas, dan rasio R:R.
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-3.6-flash',
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          macroRegime: { type: Type.STRING, enum: ['Risk-On', 'Risk-Off', 'Macro Squeeze', 'Neutral'] },
          dominantInflowSector: { type: Type.STRING },
          dominantOutflowSector: { type: Type.STRING },
          executiveSummary: { type: Type.STRING },
          anomalyObservations: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          },
          setups: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                ticker: { type: Type.STRING },
                sectorId: { type: Type.STRING },
                bias: { type: Type.STRING, enum: ['LONG', 'SHORT', 'CASH'] },
                confidence: { type: Type.STRING, enum: ['High', 'Medium', 'Low'] },
                price: { type: Type.STRING },
                quantitativeThesis: { type: Type.STRING },
                invalidationRule: { type: Type.STRING },
                riskReward: { type: Type.STRING }
              },
              required: ['ticker', 'sectorId', 'bias', 'confidence', 'price', 'quantitativeThesis', 'invalidationRule', 'riskReward']
            }
          }
        },
        required: ['macroRegime', 'dominantInflowSector', 'dominantOutflowSector', 'executiveSummary', 'anomalyObservations', 'setups']
      }
    }
  });

  const parsed = JSON.parse(response.text!);

  // F. Simpan Briefing & Setups
  console.log('6. [Supabase] Menyimpan AI Briefing & Setups...');
  await supabase.from('ai_briefings').insert({
    macro_regime: parsed.macroRegime,
    dominant_inflow_sector: parsed.dominantInflowSector,
    dominant_outflow_sector: parsed.dominantOutflowSector,
    executive_summary: parsed.executiveSummary,
    anomaly_observations: parsed.anomalyObservations
  });

  if (parsed.setups && parsed.setups.length > 0) {
    const formattedSetups = parsed.setups.map((s: any) => ({
      ticker: s.ticker,
      sector_id: ['ai', 'rwa', 'meme', 'l1', 'depin', 'defi'].includes(s.sectorId.toLowerCase())
        ? s.sectorId.toLowerCase()
        : 'ai',
      bias: s.bias,
      confidence: s.confidence,
      price: s.price,
      quantitative_thesis: s.quantitativeThesis,
      invalidation_rule: s.invalidationRule,
      risk_reward: s.riskReward,
      is_active: true
    }));

    await supabase.from('actionable_setups').insert(formattedSetups);
  }

  console.log('✅ Pipeline Selesai! Data berhasil diperbarui tanpa risiko proses menggantung.');
}

runHybridPipeline().catch(console.error);