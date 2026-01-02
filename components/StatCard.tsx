
import React from 'react';

interface StatCardProps {
  label: string;
  value: string | number;
  subValue?: string;
  colorClass?: string;
  icon?: React.ReactNode;
}

export const StatCard: React.FC<StatCardProps> = ({ label, value, subValue, colorClass = "bg-white", icon }) => {
  return (
    <div className={`${colorClass} p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col justify-between hover:shadow-md transition-shadow`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-slate-500 font-medium text-sm uppercase tracking-wider">{label}</span>
        {icon && <div className="p-2 bg-slate-50 rounded-lg text-slate-400">{icon}</div>}
      </div>
      <div>
        <h3 className="text-3xl font-bold text-slate-800">{value}</h3>
        {subValue && <p className="text-sm text-slate-500 mt-1 font-medium">{subValue}</p>}
      </div>
    </div>
  );
};
