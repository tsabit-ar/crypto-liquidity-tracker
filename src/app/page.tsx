'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import QuadrantPlot from '@/components/charts/QuadrantPlot';
import { 
  AlertTriangle, 
  ShieldAlert, 
  Activity, 
  Zap, 
  Compass, 
  Layers,
  RefreshCw,
  Radio
} from 'lucide-react';
import { AiBriefing, ActionableSetup, SectorMetric } from '@/types/dashboard';

export default function DashboardPage() {
  const [macroKillSwitch, setMacroKillSwitch] = useState(false);
  const [briefing, setBriefing] = useState<AiBriefing | null>(null);
  const [setups, setSetups] = useState<ActionableSetup[]>([]);
  const [sectors, setSectors] = useState<SectorMetric[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastSyncTime, setLastSyncTime] = useState<string>('-');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // 1. Fetch AI Briefing Terkini
      const { data: briefingData } = await supabase
        .from('ai_briefings')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (briefingData) {
        setBriefing({
          macroRegime: briefingData.macro_regime,
          dominantInflowSector: briefingData.dominant_inflow_sector,
          dominantOutflowSector: briefingData.dominant_outflow_sector,
          executiveSummary: briefingData.executive_summary,
          anomalyObservations: briefingData.anomaly_observations || []
        });
        setLastSyncTime(new Date(briefingData.created_at).toLocaleTimeString());
      }

      // 2. Fetch Active Setups Terkini
      const { data: setupsData } = await supabase
        .from('actionable_setups')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(3);

      if (setupsData) {
        setSetups(
          setupsData.map((s: any) => ({
            id: s.id.toString(),
            ticker: s.ticker,
            sector: s.sector_id,
            bias: s.bias,
            confidence: s.confidence,
            price: s.price || '-',
            quantitativeThesis: s.quantitative_thesis,
            invalidationRule: s.invalidation_rule,
            riskReward: s.risk_reward || 'N/A',
            metrics: {
              tvlDelta7d: 'Live',
              volMcRatio: '0.35',
              oiDelta24h: '+12.4%',
              fundingRate: '0.005%'
            }
          }))
        );
      }

      // 3. Fetch Data Sektor Terkini
      const { data: sectorsData } = await supabase
        .from('sector_metrics_history')
        .select('*, sectors(name)')
        .order('timestamp', { ascending: false })
        .limit(6);

      if (sectorsData && sectorsData.length > 0) {
        setSectors(
          sectorsData.map((sec: any) => ({
            id: sec.sector_id,
            name: sec.sectors?.name || sec.sector_id.toUpperCase(),
            tvl: `$${(sec.tvl / 1e9).toFixed(2)}B`,
            tvlDelta7d: Number(sec.tvl_delta_7d),
            volume24h: `$${(sec.volume_24h / 1e6).toFixed(0)}M`,
            volMcRatio: Number(sec.volume_mc_ratio),
            oiDelta24h: Number(sec.oi_delta_24h),
            lmsScore: Number(sec.lms_score),
            quadrant: sec.quadrant
          }))
        );
      }
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();

    // Setup Supabase Realtime Subscription
    const channel = supabase
      .channel('realtime_market_updates')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'ai_briefings' },
        () => {
          console.log('📡 Realtime update terdeteksi: AI Briefing baru masuk.');
          fetchData();
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'sector_metrics_history' },
        () => {
          console.log('📡 Realtime update terdeteksi: Metrik Sektor baru masuk.');
          fetchData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchData]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8 font-sans">
      <header className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-slate-800 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Zap className="w-6 h-6 text-emerald-400" />
            <h1 className="text-xl md:text-2xl font-bold tracking-tight">
              Crypto Sector Liquidity & Setup Radar
            </h1>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Deterministic Capital Rotation Engine & AI Synthesis
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-950/40 border border-emerald-800/40 px-3 py-2 rounded-lg font-mono">
            <Radio className="w-3.5 h-3.5 animate-pulse text-emerald-400" />
            Live Realtime (Last sync: {lastSyncTime})
          </div>

          <button
            onClick={fetchData}
            disabled={loading}
            className="flex items-center gap-1.5 text-xs bg-slate-900 border border-slate-800 hover:bg-slate-800 px-3 py-2 rounded-lg text-slate-300 transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>

          <div className="flex items-center gap-3 bg-slate-900 border border-slate-800 px-4 py-2 rounded-lg">
            <ShieldAlert className={`w-5 h-5 ${macroKillSwitch ? 'text-rose-500' : 'text-slate-500'}`} />
            <span className="text-xs font-medium text-slate-300">BTC Flash Drop Guard:</span>
            <button
              onClick={() => setMacroKillSwitch(!macroKillSwitch)}
              className={`text-xs px-2.5 py-1 rounded font-semibold transition ${
                macroKillSwitch 
                  ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40' 
                  : 'bg-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              {macroKillSwitch ? 'ACTIVE' : 'Normal Mode'}
            </button>
          </div>
        </div>
      </header>

      {macroKillSwitch && (
        <div className="mt-6 p-4 bg-rose-950/50 border border-rose-600/50 rounded-lg flex items-center gap-3 text-rose-200 text-sm">
          <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
          <div>
            <strong className="font-semibold">SISTEM PENGAMAN AKTIF:</strong> Terdeteksi penurunan tajam BTC (&gt;5%). Semua rekomendasi bias <code>LONG</code> dinonaktifkan otomatis.
          </div>
        </div>
      )}

      {/* AI Intelligence Briefing */}
      <section className="mt-6 bg-slate-900/60 border border-slate-800 rounded-xl p-5 backdrop-blur-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 text-emerald-400 text-sm font-semibold uppercase tracking-wider">
            <Activity className="w-4 h-4" /> AI Market Flow Intelligence (Live Database)
          </div>
          <span className="text-xs bg-slate-800 text-slate-300 px-2 py-0.5 rounded border border-slate-700">
            Regime: {briefing?.macroRegime || 'Loading...'}
          </span>
        </div>
        <p className="text-slate-200 text-sm leading-relaxed mb-4">
          {briefing?.executiveSummary || 'Mengambil data ringkasan pasar dari database...'}
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-3 border-t border-slate-800/80">
          {briefing?.anomalyObservations?.map((obs, idx) => (
            <div key={idx} className="flex items-start gap-2 text-xs text-slate-300 bg-slate-950/40 p-2.5 rounded border border-slate-800/50">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
              <span>{obs}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Matriks Likuiditas Sektoral Live + Grafik Kuadran */}
      <section className="mt-8">
        <div className="flex items-center gap-2 mb-4">
          <Layers className="w-5 h-5 text-indigo-400" />
          <h2 className="text-lg font-semibold">Matriks Likuiditas Sektoral (Dynamic Rotation)</h2>
        </div>

        {sectors.length > 0 && (
          <div className="mb-6">
            <QuadrantPlot sectors={sectors} />
          </div>
        )}

        <div className="overflow-x-auto bg-slate-900/40 border border-slate-800 rounded-xl">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-900/80 text-xs uppercase text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Sektor</th>
                <th className="py-3 px-4">TVL Riil</th>
                <th className="py-3 px-4">Δ TVL (7h)</th>
                <th className="py-3 px-4">Volume 24h</th>
                <th className="py-3 px-4">Vol / MC</th>
                <th className="py-3 px-4">Δ OI (24h)</th>
                <th className="py-3 px-4">LMS Score</th>
                <th className="py-3 px-4">Kuadran</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono text-xs">
              {sectors.map((sector) => (
                <tr key={sector.id} className="hover:bg-slate-800/30 transition">
                  <td className="py-3.5 px-4 font-sans font-medium text-slate-200">{sector.name}</td>
                  <td className="py-3.5 px-4 text-slate-300">{sector.tvl}</td>
                  <td className={`py-3.5 px-4 font-semibold ${sector.tvlDelta7d >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {sector.tvlDelta7d >= 0 ? `+${sector.tvlDelta7d}%` : `${sector.tvlDelta7d}%`}
                  </td>
                  <td className="py-3.5 px-4 text-slate-300">{sector.volume24h}</td>
                  <td className="py-3.5 px-4 text-slate-300">{sector.volMcRatio}</td>
                  <td className={`py-3.5 px-4 ${sector.oiDelta24h > 15 ? 'text-amber-400 font-bold' : 'text-slate-300'}`}>
                    {sector.oiDelta24h >= 0 ? `+${sector.oiDelta24h}%` : `${sector.oiDelta24h}%`}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="bg-slate-800 text-slate-200 px-2 py-0.5 rounded font-bold">
                      {sector.lmsScore}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-sans">
                    <span className={`px-2 py-0.5 rounded text-[11px] font-semibold border ${
                      sector.quadrant === 'Expansion' ? 'bg-emerald-950/60 text-emerald-300 border-emerald-700/50' :
                      sector.quadrant === 'Hype Trap' ? 'bg-rose-950/60 text-rose-300 border-rose-700/50' :
                      sector.quadrant === 'Stealth Acc' ? 'bg-indigo-950/60 text-indigo-300 border-indigo-700/50' :
                      'bg-slate-800 text-slate-400 border-slate-700'
                    }`}>
                      {sector.quadrant}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Actionable Setups Card Grid */}
      <section className="mt-8">
        <div className="flex items-center gap-2 mb-4">
          <Compass className="w-5 h-5 text-emerald-400" />
          <h2 className="text-lg font-semibold">Actionable Asymmetric Setups (Live Ingestion)</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {setups.map((setup) => {
            const isLongDisabled = macroKillSwitch && setup.bias === 'LONG';

            return (
              <div 
                key={setup.id} 
                className={`bg-slate-900/50 border rounded-xl p-5 flex flex-col justify-between transition ${
                  isLongDisabled 
                    ? 'opacity-30 border-slate-800 pointer-events-none' 
                    : setup.bias === 'LONG' ? 'border-emerald-800/40 hover:border-emerald-600/60' :
                      setup.bias === 'SHORT' ? 'border-rose-800/40 hover:border-rose-600/60' :
                      'border-slate-800 hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-base font-bold text-white tracking-wide">{setup.ticker}</span>
                        <span className="text-xs text-slate-400">({setup.price})</span>
                      </div>
                      <span className="text-xs text-slate-400 capitalize">{setup.sector}</span>
                    </div>

                    <div className="flex flex-col items-end gap-1">
                      <span className={`px-2.5 py-0.5 rounded text-xs font-black tracking-wider border ${
                        setup.bias === 'LONG' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' :
                        setup.bias === 'SHORT' ? 'bg-rose-500/20 text-rose-400 border-rose-500/30' :
                        'bg-slate-800 text-slate-400 border-slate-700'
                      }`}>
                        {setup.bias}
                      </span>
                      <span className="text-[10px] text-slate-400">Conf: {setup.confidence}</span>
                    </div>
                  </div>

                  <div className="mt-4 text-xs text-slate-300 space-y-2">
                    <p className="leading-relaxed bg-slate-950/50 p-2.5 rounded border border-slate-800/60">
                      <strong className="text-slate-200">Tesis:</strong> {setup.quantitativeThesis}
                    </p>
                    <p className="leading-relaxed bg-rose-950/20 text-rose-300/90 p-2.5 rounded border border-rose-900/30">
                      <strong className="text-rose-300">Invalidation:</strong> {setup.invalidationRule}
                    </p>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-800/80 grid grid-cols-2 gap-2 text-[11px] font-mono">
                  <div className="text-slate-400">Status: <span className="text-emerald-400">Live Active</span></div>
                  <div className="text-slate-400">R:R: <span className="text-emerald-400 font-bold">{setup.riskReward}</span></div>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}