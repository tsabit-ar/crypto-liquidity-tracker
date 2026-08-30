'use client';

import React from 'react';
import ReactECharts from 'echarts-for-react';
import { SectorMetric } from '@/types/dashboard';

interface QuadrantPlotProps {
  sectors: SectorMetric[];
}

export default function QuadrantPlot({ sectors }: QuadrantPlotProps) {
  // Format data untuk titik koordinat: [TVL_Delta_7d, OI_Delta_24h, LMS_Score, Sector_Name, Quadrant]
  const scatterData = sectors.map((s) => [
    s.tvlDelta7d,
    s.oiDelta24h,
    s.lmsScore,
    s.name,
    s.quadrant
  ]);

  const option = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'item',
      backgroundColor: '#0f172a',
      borderColor: '#334155',
      textStyle: { color: '#f8fafc', fontSize: 12 },
      formatter: (params: any) => {
        const val = params.value;
        return `
          <div class="font-sans">
            <strong class="text-emerald-400 font-bold">${val[3]}</strong><br/>
            <span class="text-slate-400">Δ TVL (7d):</span> <b>${val[0]}%</b><br/>
            <span class="text-slate-400">Δ OI (24h):</span> <b>${val[1]}%</b><br/>
            <span class="text-slate-400">LMS Score:</span> <b>${val[2]}</b><br/>
            <span class="text-slate-400">Status:</span> <b>${val[4]}</b>
          </div>
        `;
      }
    },
    grid: {
      top: 40,
      right: 40,
      bottom: 50,
      left: 60
    },
    xAxis: {
      name: 'Δ TVL 7d (%) - Spot Demand',
      nameLocation: 'middle',
      nameGap: 30,
      nameTextStyle: { color: '#94a3b8', fontSize: 11 },
      type: 'value',
      splitLine: {
        lineStyle: { color: '#1e293b', type: 'dashed' }
      },
      axisLine: { lineStyle: { color: '#475569' } },
      axisLabel: { color: '#94a3b8', formatter: '{value}%' }
    },
    yAxis: {
      name: 'Δ OI 24h (%) - Speculative Heat',
      nameLocation: 'middle',
      nameGap: 40,
      nameTextStyle: { color: '#94a3b8', fontSize: 11 },
      type: 'value',
      splitLine: {
        lineStyle: { color: '#1e293b', type: 'dashed' }
      },
      axisLine: { lineStyle: { color: '#475569' } },
      axisLabel: { color: '#94a3b8', formatter: '{value}%' }
    },
    series: [
      {
        type: 'scatter',
        symbolSize: (data: any) => Math.max(data[2] * 4, 18), // Ukuran bubble proporsional dengan LMS Score
        data: scatterData,
        itemStyle: {
          color: (params: any) => {
            const quadrant = params.value[4];
            if (quadrant === 'Expansion') return '#10b981'; // Hijau
            if (quadrant === 'Hype Trap') return '#f43f5e';  // Merah
            if (quadrant === 'Stealth Acc') return '#6366f1'; // Indigo
            return '#64748b'; // Abu-abu
          },
          shadowBlur: 10,
          shadowColor: 'rgba(0,0,0,0.5)'
        },
        label: {
          show: true,
          formatter: (params: any) => params.value[3],
          position: 'top',
          color: '#e2e8f0',
          fontSize: 11,
          fontWeight: 600
        },
        markLine: {
          silent: true,
          lineStyle: { color: '#475569', width: 1, type: 'solid' },
          data: [{ xAxis: 0 }, { yAxis: 0 }]
        }
      }
    ]
  };

  return (
    <div className="w-full bg-slate-900/40 border border-slate-800 rounded-xl p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Visualisasi Rotasi Likuiditas 2D
        </span>
        <div className="flex items-center gap-3 text-[11px]">
          <span className="flex items-center gap-1 text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span> Expansion
          </span>
          <span className="flex items-center gap-1 text-rose-400">
            <span className="w-2 h-2 rounded-full bg-rose-400"></span> Hype Trap
          </span>
          <span className="flex items-center gap-1 text-indigo-400">
            <span className="w-2 h-2 rounded-full bg-indigo-400"></span> Stealth Acc
          </span>
        </div>
      </div>
      <ReactECharts option={option} style={{ height: '320px', width: '100%' }} />
    </div>
  );
}