
import React, { useState, useMemo, useEffect } from 'react';
import { 
  OrderType, 
  OrderStatus, 
  DeviceType, 
  Order, 
  DashboardStats, 
  ReturnStats, 
  PracticeStats 
} from './types';
import { MOCK_ORDERS, MOCK_STOCK } from './data/mockData';
import { StatCard } from './components/StatCard';
import { PracticeRanking } from './components/PracticeRanking';
import { getLogisticsInsights } from './services/geminiService';
import { Icons, COLORS } from './constants';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
  PieChart, Pie, Cell, AreaChart, Area, ScatterChart, Scatter, ZAxis
} from 'recharts';

const App: React.FC = () => {
  const [view, setView] = useState<'New' | 'Return'>('New');
  const [startDate, setStartDate] = useState<string>('2024-01-01');
  const [endDate, setEndDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [deviceFilter, setDeviceFilter] = useState<string>('All');
  const [aiInsights, setAiInsights] = useState<string>("Analyzing current data...");

  // Core Filtering Logic
  const filteredOrders = useMemo(() => {
    return MOCK_ORDERS.filter(order => {
      const orderDate = order.createdDate.toISOString().split('T')[0];
      const isInDateRange = orderDate >= startDate && orderDate <= endDate;
      const isCorrectView = view === 'New' 
        ? [OrderType.NEW, OrderType.REPLACEMENT, OrderType.ADDITIONAL].includes(order.type)
        : order.type === OrderType.RETURN;
      const isDeviceMatch = deviceFilter === 'All' || order.deviceType === deviceFilter;
      
      return isInDateRange && isCorrectView && isDeviceMatch;
    });
  }, [view, startDate, endDate, deviceFilter]);

  // Derived Stats
  const stats = useMemo(() => {
    const s: Record<string, number> = {
      Pending: 0,
      Created: 0,
      'In Transit': 0,
      Delivered: 0
    };
    const dev: Record<string, number> = {};
    const trendMap: Record<string, number> = {};
    const unassignedByDevice: Record<string, number> = {};
    const now = new Date();

    let pendingOver7 = 0;
    let notCreatedOver1 = 0;
    let unassignedDeliveredCount = 0;

    filteredOrders.forEach(o => {
      s[o.status]++;
      dev[o.deviceType] = (dev[o.deviceType] || 0) + 1;

      // Unassigned delivered tracking
      if (o.status === OrderStatus.DELIVERED && o.isAssignedToPatient === false) {
        unassignedDeliveredCount++;
        unassignedByDevice[o.deviceType] = (unassignedByDevice[o.deviceType] || 0) + 1;
      }

      // Trend data
      const dateKey = o.createdDate.toISOString().split('T')[0];
      trendMap[dateKey] = (trendMap[dateKey] || 0) + 1;

      const diffDays = Math.floor((now.getTime() - o.createdDate.getTime()) / (1000 * 3600 * 24));
      
      if (o.status === OrderStatus.PENDING && diffDays > 7) pendingOver7++;
      if (o.status === OrderStatus.PENDING && diffDays > 1) notCreatedOver1++;
    });

    const total = filteredOrders.length;

    // Sort trend data
    const trendData = Object.entries(trendMap)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    const assignmentData = Object.entries(unassignedByDevice).map(([name, value]) => ({ 
      name, 
      unassigned: value,
      total: dev[name] || 0
    }));

    return {
      totalOrders: total,
      pendingOrders: s[OrderStatus.PENDING],
      pendingDeliveries: s[OrderStatus.IN_TRANSIT],
      ordersByStatus: s as Record<OrderStatus, number>,
      ordersByDevice: dev as Record<DeviceType, number>,
      trendData,
      assignmentData,
      unassignedDeliveredCount,
      agingAlerts: {
        pendingOver7Days: pendingOver7,
        notCreatedOver1Day: notCreatedOver1
      },
      returnedDevicesCount: s[OrderStatus.DELIVERED],
      returnLabelsIssued: total,
      returnPercentage: total > 0 ? (s[OrderStatus.DELIVERED] / total) * 100 : 0
    };
  }, [filteredOrders]);

  // Ranking Logic
  const rankings = useMemo(() => {
    const map: Record<string, number> = {};
    filteredOrders.forEach(o => {
      const key = `${o.practiceName}|${o.clinicName}`;
      map[key] = (map[key] || 0) + 1;
    });

    return Object.entries(map)
      .map(([key, count]) => {
        const [practiceName, clinicName] = key.split('|');
        return { practiceName, clinicName, orderCount: count, rank: 0 };
      })
      .sort((a, b) => b.orderCount - a.orderCount)
      .slice(0, 10)
      .map((item, idx) => ({ ...item, rank: idx + 1 }));
  }, [filteredOrders]);

  // Recharts Data Prep
  const statusData = useMemo(() => {
    return Object.entries(stats.ordersByStatus).map(([name, value]) => ({ name, value }));
  }, [stats]);

  const devicePieData = useMemo(() => {
    return Object.entries(stats.ordersByDevice).map(([name, value]) => ({ name, value }));
  }, [stats]);

  const PIE_COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

  // AI Insights Trigger
  useEffect(() => {
    const fetchInsights = async () => {
      setAiInsights("Synthesizing data...");
      const summary = {
        view,
        total: stats.totalOrders,
        unassignedDelivered: stats.unassignedDeliveredCount,
        agingAlerts: stats.agingAlerts,
        stockAlerts: MOCK_STOCK.filter(s => s.quantity < s.minLevel),
        topPractice: rankings[0]?.practiceName
      };
      const text = await getLogisticsInsights(summary);
      setAiInsights(text);
    };
    fetchInsights();
  }, [view, stats.agingAlerts, stats.unassignedDeliveredCount, rankings]);

  return (
    <div className="min-h-screen flex bg-slate-50">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-white flex flex-col fixed h-full z-10">
        <div className="p-6 border-b border-slate-800">
          <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
            Logistics Dash
          </h1>
          <p className="text-[10px] text-slate-500 mt-1 uppercase tracking-widest font-bold">Intelligent Supply Chain</p>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          <button 
            onClick={() => setView('New')}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all ${view === 'New' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40' : 'text-slate-400 hover:bg-slate-800'}`}
          >
            <Icons.Dashboard />
            <span className="font-medium">New Orders</span>
          </button>
          <button 
            onClick={() => setView('Return')}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all ${view === 'Return' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40' : 'text-slate-400 hover:bg-slate-800'}`}
          >
            <Icons.Returns />
            <span className="font-medium">Returns</span>
          </button>
        </nav>

        <div className="p-4 bg-slate-800/50 m-4 rounded-xl border border-slate-700">
          <h4 className="text-xs font-bold text-slate-500 mb-2 uppercase flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
            </span>
            AI Insights
          </h4>
          <p className="text-[11px] leading-relaxed text-slate-300 italic whitespace-pre-wrap">
            {aiInsights}
          </p>
        </div>
      </aside>

      {/* Main Content */}
      <main className="ml-64 flex-1 p-8">
        {/* Header Filters */}
        <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4 sticky top-0 z-20 bg-slate-50/90 backdrop-blur-md pb-4 border-b border-slate-200">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">
              {view === 'New' ? 'New / Replacement / Additional' : 'Return Order Cases'}
            </h2>
            <p className="text-sm text-slate-500 font-medium">Monitoring logistics flow across all practice centers.</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex bg-white rounded-lg border border-slate-200 p-1 shadow-sm">
              <input 
                type="date" 
                value={startDate} 
                onChange={(e) => setStartDate(e.target.value)}
                className="px-2 py-1 text-sm text-slate-600 bg-transparent border-none focus:ring-0 cursor-pointer" 
              />
              <span className="px-1 text-slate-300 self-center">to</span>
              <input 
                type="date" 
                value={endDate} 
                onChange={(e) => setEndDate(e.target.value)}
                className="px-2 py-1 text-sm text-slate-600 bg-transparent border-none focus:ring-0 cursor-pointer" 
              />
            </div>

            <select 
              value={deviceFilter}
              onChange={(e) => setDeviceFilter(e.target.value)}
              className="bg-white rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-600 font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              <option value="All">All Devices</option>
              {Object.values(DeviceType).map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
        </header>

        {/* Top Stats Row */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard 
            label={view === 'New' ? "Total Orders" : "Total Returns"} 
            value={stats.totalOrders} 
            subValue="Selected period volume"
            icon={<Icons.Dashboard />}
          />
          <StatCard 
            label="Delivered / Unassigned" 
            value={stats.unassignedDeliveredCount} 
            subValue="Needs patient assignment"
            colorClass={stats.unassignedDeliveredCount > 15 ? "bg-rose-50" : "bg-white"}
            icon={<div className="text-rose-500 font-bold">👤?</div>}
          />
          <StatCard 
            label="In Transit" 
            value={stats.pendingDeliveries} 
            subValue="Currently with carrier"
            icon={<div className="text-blue-500">🚚</div>}
          />
          {view === 'Return' ? (
            <StatCard 
              label="Return Success" 
              value={`${stats.returnPercentage.toFixed(1)}%`} 
              subValue={`${stats.returnedDevicesCount} successful returns`}
              colorClass="bg-emerald-50"
              icon={<div className="text-emerald-500">✓</div>}
            />
          ) : (
             <StatCard 
              label="7+ Day Lag" 
              value={stats.agingAlerts.pendingOver7Days} 
              subValue="Critical shipping delays"
              colorClass={stats.agingAlerts.pendingOver7Days > 0 ? "bg-red-50" : "bg-white"}
              icon={<Icons.Alert />}
            />
          )}
        </section>

        {/* Charts Row 1: Flow & Trends */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Trend Chart (Area Chart) */}
          <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <h3 className="font-bold text-slate-700 mb-6">Order Volume Trend</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats.trendData}>
                  <defs>
                    <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="date" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fontSize: 10, fill: '#94a3b8'}} 
                    minTickGap={30}
                  />
                  <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94a3b8'}} />
                  <Tooltip 
                    contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'}}
                  />
                  <Area type="monotone" dataKey="count" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#colorCount)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Status Donut Chart */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <h3 className="font-bold text-slate-700 mb-6">Status Breakdown</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[entry.name.replace(' ', '') as keyof typeof COLORS] || '#cbd5e1'} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend verticalAlign="bottom" height={36} wrapperStyle={{fontSize: '12px'}} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </section>

        {/* Charts Row 2: Device & Assignment Analysis */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
           {/* Device Distribution Pie */}
           <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <h3 className="font-bold text-slate-700 mb-6">Device Distribution</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={devicePieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {devicePieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* New Assignment Heatmap/Scatter Chart for delivered but unassigned */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <h3 className="font-bold text-slate-700 mb-6 flex justify-between items-center">
              Unassigned Delivered Devices
              <span className="text-[10px] bg-rose-100 text-rose-700 px-2 py-0.5 rounded font-black uppercase">ACTION REQUIRED</span>
            </h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.assignmentData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                  <XAxis type="number" tick={{fontSize: 10}} />
                  <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} width={120} tick={{fontSize: 10, fontWeight: 600}} />
                  <Tooltip 
                    cursor={{fill: '#fff1f2'}}
                    contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'}}
                  />
                  <Legend />
                  <Bar dataKey="unassigned" name="Unassigned (Delivered)" fill="#F43F5E" radius={[0, 4, 4, 0]} />
                  <Bar dataKey="total" name="Total Delivered" fill="#E2E8F0" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </section>

        {/* Charts Row 3: Practice Ranking */}
        <section className="mb-8">
          <PracticeRanking rankings={rankings} />
        </section>

        {/* Lower Grid: Inventory & Critical Alerts */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Inventory Table (Taking 2 cols) */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="font-bold text-slate-700">Stock Management</h3>
              <div className="flex gap-2">
                <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-red-500"></div><span className="text-[10px] text-slate-400 uppercase font-bold">Critical</span></div>
                <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-emerald-500"></div><span className="text-[10px] text-slate-400 uppercase font-bold">Optimal</span></div>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="text-xs text-slate-400 uppercase bg-slate-50 font-semibold">
                  <tr>
                    <th className="px-6 py-3">Device Type</th>
                    <th className="px-6 py-3">In Stock</th>
                    <th className="px-6 py-3">Min/Max Target</th>
                    <th className="px-6 py-3 text-right">Fulfillment</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {MOCK_STOCK.map((stock) => {
                    const isCritical = stock.quantity < stock.minLevel;
                    return (
                      <tr key={stock.deviceType} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4 text-sm font-medium text-slate-700">{stock.deviceType}</td>
                        <td className="px-6 py-4">
                          <span className={`font-bold text-base ${isCritical ? 'text-red-600' : 'text-slate-800'}`}>
                            {stock.quantity}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-xs text-slate-500 font-mono">
                          {stock.minLevel} / {stock.maxLevel}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-3">
                            <div className="h-1.5 w-16 rounded-full bg-slate-100 overflow-hidden">
                              <div 
                                className={`h-full ${isCritical ? 'bg-red-500' : 'bg-emerald-500'}`} 
                                style={{ width: `${Math.min((stock.quantity / stock.maxLevel) * 100, 100)}%` }}
                              ></div>
                            </div>
                            <span className={`text-[10px] font-bold ${isCritical ? 'text-red-500' : 'text-emerald-500'}`}>
                              {isCritical ? 'RESTOCK' : 'OK'}
                            </span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Critical Aging Box */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col">
            <h3 className="font-bold text-slate-700 mb-4">Efficiency Bottlenecks</h3>
            <div className="space-y-4 flex-1">
              <div className={`p-4 rounded-lg border flex items-center space-x-4 ${stats.agingAlerts.pendingOver7Days > 0 ? 'bg-red-50 border-red-100 text-red-700' : 'bg-slate-50 border-slate-100 text-slate-400'}`}>
                <div className="p-3 bg-white rounded-lg shadow-sm">
                  <Icons.Alert />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-tight opacity-70">Carrier Delay</p>
                  <p className="text-xl font-black">{stats.agingAlerts.pendingOver7Days}</p>
                  <p className="text-[9px]">Awaiting pickup > 7d</p>
                </div>
              </div>
              <div className={`p-4 rounded-lg border flex items-center space-x-4 ${stats.unassignedDeliveredCount > 10 ? 'bg-rose-50 border-rose-100 text-rose-700' : 'bg-slate-50 border-slate-100 text-slate-400'}`}>
                 <div className="p-3 bg-white rounded-lg shadow-sm">
                   <div className="text-rose-500 font-bold">👤</div>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-tight opacity-70">Assignment Gap</p>
                  <p className="text-xl font-black">{stats.unassignedDeliveredCount}</p>
                  <p className="text-[9px]">Delivered but idle</p>
                </div>
              </div>
            </div>
            <button className="mt-6 w-full py-2.5 bg-slate-900 text-white rounded-lg text-xs font-bold hover:bg-slate-800 transition-all active:scale-95">
              Sync Patient Registry
            </button>
          </div>
        </section>
      </main>
    </div>
  );
};

export default App;
