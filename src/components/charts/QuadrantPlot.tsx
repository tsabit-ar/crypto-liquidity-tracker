'use client';

import React from 'react';
import ReactECharts from 'echarts-for-react';
import { SectorMetric } from '@/types/dashboard';

interface QuadrantPlotProps {
  sectors: SectorMetric[];
}

export default function QuadrantPlot({ sectors }: QuadrantPlotProps) {
  // Koordinat: [TVL_Delta_7d, OI_Delta_24h, LMS_Score, Sector_Name, Quadrant, Vol_MC]
  const scatterData = sectors.map((s) => [
    s.tvlDelta7d,
    s.oiDelta24h,
    s.lmsScore,
    s.name,
    s.quadrant,
    s.volMcRatio
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
          <div class="font-sans p-1">
            <div class="font-bold text-sm text-emerald-400 mb-1">${val[3]}</div>
            <div class="text-xs text-slate-300">Δ TVL (7d): <b class="${val[0] >= 0 ? 'text-emerald-400' : 'text-rose-400'}">${val[0]}%</b></div>
            <div class="text-xs text-slate-300">Δ OI (24h): <b class="${val[1] >= 0 ? 'text-emerald-400' : 'text-rose-400'}">${val[1]}%</b></div>
            <div class="text-xs text-slate-300">Vol/MC Ratio: <b>${val[5]}</b></div>
            <div class="text-xs text-slate-300 mt-1 pt-1 border-t border-slate-700">LMS Score: <b class="text-white">${val[2]}</b> (${val[4]})</div>
          </div>
        `;
      }
    },
    grid: {
      top: 30,
      right: 50,
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
        symbolSize: (data: any) => Math.max(data[2] * 3.5, 16),
        data: scatterData,
        itemStyle: {
          color: (params: any) => {
            const quadrant = params.value[4];
            if (quadrant === 'Expansion') return '#10b981';
            if (quadrant === 'Hype Trap') return '#f43f5e';
            if (quadrant === 'Stealth Acc') return '#6366f1';
            return '#64748b';
          },
          shadowBlur: 8,
          shadowColor: 'rgba(0,0,0,0.6)'
        },
        label: {
          show: true,
          formatter: (params: any) => params.value[3],
          position: 'top',
          distance: 6,
          color: '#f1f5f9',
          fontSize: 10,
          fontWeight: 600,
          backgroundColor: 'rgba(15, 23, 42, 0.75)',
          padding: [2, 4],
          borderRadius: 3
        },
        labelLayout: {
          hideOverlap: false,
          moveOverlap: 'shiftY' // Mencegah label saling menimpa secara vertikal
        },
        markLine: {
          silent: true,
          lineStyle: { color: '#334155', width: 1, type: 'solid' },
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
          <span className="flex items-center gap-1 text-slate-400">
            <span className="w-2 h-2 rounded-full bg-slate-500"></span> Dormant
          </span>
        </div>
      </div>
      <ReactECharts option={option} style={{ height: '340px', width: '100%' }} />
    </div>
  );
}