
import React from 'react';
import { PracticeStats } from '../types';

interface PracticeRankingProps {
  rankings: PracticeStats[];
}

export const PracticeRanking: React.FC<PracticeRankingProps> = ({ rankings }) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
        <h3 className="font-bold text-slate-700">Practice & Clinic Ranking</h3>
        <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full font-bold uppercase">Top Performance</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="text-xs text-slate-400 uppercase bg-slate-50">
            <tr>
              <th className="px-6 py-3 font-semibold">Rank</th>
              <th className="px-6 py-3 font-semibold">Practice</th>
              <th className="px-6 py-3 font-semibold">Clinic</th>
              <th className="px-6 py-3 font-semibold text-right">Order Volume</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rankings.map((row) => (
              <tr key={`${row.practiceName}-${row.clinicName}`} className="hover:bg-slate-50/80 transition-colors">
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                    row.rank === 1 ? 'bg-amber-100 text-amber-700' : 
                    row.rank === 2 ? 'bg-slate-200 text-slate-700' :
                    row.rank === 3 ? 'bg-orange-100 text-orange-700' : 'text-slate-500'
                  }`}>
                    {row.rank}
                  </span>
                </td>
                <td className="px-6 py-4 font-medium text-slate-700">{row.practiceName}</td>
                <td className="px-6 py-4 text-slate-600">{row.clinicName}</td>
                <td className="px-6 py-4 text-right">
                  <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm font-bold">
                    {row.orderCount}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
