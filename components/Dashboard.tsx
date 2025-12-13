import React, { useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';
import { WorkerStats, Task } from '../types';

interface DashboardProps {
  stats: WorkerStats;
  tasks: Task[];
  onNavigate: (tab: 'dashboard' | 'queue' | 'agents' | 'settings') => void;
}

const Dashboard: React.FC<DashboardProps> = ({ stats, tasks, onNavigate }) => {
  const [showWelcome, setShowWelcome] = useState(true);
  
  // Prepare data for charts
  const hourlyData = [
    { name: '09:00', tasks: 12, earnings: 2.4 },
    { name: '10:00', tasks: 18, earnings: 3.6 },
    { name: '11:00', tasks: 15, earnings: 3.0 },
    { name: '12:00', tasks: 8, earnings: 1.6 },
    { name: '13:00', tasks: 22, earnings: 4.4 },
    { name: '14:00', tasks: 25, earnings: 5.0 },
    { name: '15:00', tasks: 19, earnings: 3.8 },
  ];

  const statusCounts = {
    completed: tasks.filter(t => t.status === 'COMPLETED').length,
    pending: tasks.filter(t => t.status === 'PENDING').length,
    review: tasks.filter(t => t.status === 'REVIEW_QUEUE').length,
    rejected: tasks.filter(t => t.status === 'REJECTED').length,
  };

  const barData = [
    { name: 'Completed', count: statusCounts.completed, fill: '#10b981' }, // emerald-500
    { name: 'Pending', count: statusCounts.pending, fill: '#64748b' },   // slate-500
    { name: 'Review', count: statusCounts.review, fill: '#f59e0b' },     // amber-500
    { name: 'Rejected', count: statusCounts.rejected, fill: '#ef4444' }, // red-500
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Quick Start Messaging Banner */}
      {showWelcome && (
        <div className="bg-indigo-900 rounded-xl p-6 text-white shadow-xl relative overflow-hidden border border-indigo-700/50">
          <div className="absolute top-0 right-0 p-4 z-20">
            <button 
              onClick={() => setShowWelcome(false)} 
              className="text-indigo-300 hover:text-white transition-colors p-1 hover:bg-white/10 rounded-full"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
          
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6 relative z-10">
            <div className="bg-indigo-500/20 p-3 rounded-xl border border-indigo-400/30 backdrop-blur-sm shrink-0">
              <svg className="w-8 h-8 text-indigo-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            
            <div className="flex-1">
              <h3 className="text-lg font-bold text-white mb-1">Welcome to Nexus Ops!</h3>
              <p className="text-indigo-200 text-sm leading-relaxed max-w-2xl">
                Boost your earnings with our AI-assisted workflow. 
                Start by running agents to pre-label data, then simply review their work.
              </p>
              
              <div className="mt-5 flex flex-wrap gap-3">
                <button 
                  onClick={() => onNavigate('agents')} 
                  className="px-4 py-2 bg-white text-indigo-900 rounded-lg text-sm font-bold hover:bg-indigo-50 transition-all shadow-sm flex items-center gap-2 group"
                >
                  <span>1. Run AI Agents</span>
                  <svg className="w-4 h-4 text-indigo-500 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </button>
                <button 
                  onClick={() => onNavigate('queue')} 
                  className="px-4 py-2 bg-indigo-800/50 text-indigo-100 border border-indigo-700 rounded-lg text-sm font-medium hover:bg-indigo-700/50 hover:text-white transition-colors"
                >
                  2. Review Work Queue
                </button>
              </div>
            </div>
          </div>
          
          {/* Decorative background elements */}
          <div className="absolute -top-12 -right-12 w-64 h-64 bg-indigo-600 rounded-full blur-3xl opacity-40 pointer-events-none"></div>
          <div className="absolute -bottom-24 -left-12 w-64 h-64 bg-violet-600 rounded-full blur-3xl opacity-40 pointer-events-none"></div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <p className="text-sm font-medium text-slate-500">Total Earnings</p>
          <p className="text-3xl font-bold text-slate-900 mt-2">${stats.earnings.toFixed(2)}</p>
          <p className="text-xs text-emerald-600 mt-1 font-medium">+12% from yesterday</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <p className="text-sm font-medium text-slate-500">Tasks Completed</p>
          <p className="text-3xl font-bold text-slate-900 mt-2">{stats.tasksCompleted}</p>
          <p className="text-xs text-slate-400 mt-1">Goal: 500/week</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <p className="text-sm font-medium text-slate-500">Hours Worked</p>
          <p className="text-3xl font-bold text-slate-900 mt-2">{stats.hoursWorked.toFixed(1)}h</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <p className="text-sm font-medium text-slate-500">Accuracy Score</p>
          <p className="text-3xl font-bold text-slate-900 mt-2">{(stats.accuracyScore * 100).toFixed(1)}%</p>
          <div className="w-full bg-slate-100 rounded-full h-2 mt-2">
            <div 
              className="bg-indigo-600 h-2 rounded-full" 
              style={{ width: `${stats.accuracyScore * 100}%` }}
            ></div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Throughput & Earnings</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={hourlyData}>
                <defs>
                  <linearGradient id="colorEarnings" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value}`} />
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  itemStyle={{ color: '#1e293b' }}
                />
                <Area type="monotone" dataKey="earnings" stroke="#4f46e5" fillOpacity={1} fill="url(#colorEarnings)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Task Status Distribution</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#e2e8f0" />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} width={80} />
                <Tooltip cursor={{fill: 'transparent'}} contentStyle={{ borderRadius: '8px' }} />
                <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;