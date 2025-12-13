import React, { useState, useEffect, useRef } from 'react';
import { Task, TaskStatus, AgentState } from '../types';

interface AgentOrchestratorProps {
  tasks: Task[];
  agentState: AgentState;
  onRunAgents: () => void;
  onRunBrowserAgent: (useGrounding: boolean) => void;
  isProcessing: boolean;
  browserActive: boolean;
  browserLogs: string[];
}

const AgentOrchestrator: React.FC<AgentOrchestratorProps> = ({ 
  tasks, 
  agentState, 
  onRunAgents, 
  onRunBrowserAgent,
  isProcessing,
  browserActive,
  browserLogs
}) => {
  const pendingTasks = tasks.filter(t => t.status === TaskStatus.PENDING).length;
  const preLabeledTasks = tasks.filter(t => t.status === TaskStatus.PRE_LABELING || (t.status === TaskStatus.READY_FOR_HUMAN && t.aiPrediction)).length;
  
  const [useGrounding, setUseGrounding] = useState(false);
  const logsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [browserLogs, agentState.logs]);

  return (
    <div className="space-y-6">
      
      {/* Top Section: Autonomous Acquisition */}
      <div className="bg-slate-900 rounded-xl shadow-lg border border-slate-700 overflow-hidden text-white">
         <div className="p-4 bg-slate-800 border-b border-slate-700 flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span className="ml-2 font-mono text-sm text-slate-400">Autonomous Browser Agent - v2.5.0</span>
            </div>
            
            <div className="flex items-center gap-4">
               {/* Grounding Toggle */}
               <label className="flex items-center cursor-pointer group">
                  <div className="relative">
                    <input 
                      type="checkbox" 
                      className="sr-only" 
                      checked={useGrounding} 
                      onChange={(e) => setUseGrounding(e.target.checked)} 
                      disabled={browserActive}
                    />
                    <div className={`block w-10 h-6 rounded-full transition-colors ${useGrounding ? 'bg-emerald-500' : 'bg-slate-600'}`}></div>
                    <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${useGrounding ? 'translate-x-4' : ''}`}></div>
                  </div>
                  <div className="ml-3 text-xs font-medium text-slate-300 group-hover:text-white transition-colors">
                    Demo Mode: Live Grounding
                    <div className="text-[10px] text-slate-500">Find real-world work via Search</div>
                  </div>
               </label>

               <button 
                  onClick={() => onRunBrowserAgent(useGrounding)}
                  disabled={browserActive}
                  className={`px-4 py-1.5 rounded text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${
                    browserActive 
                    ? 'bg-emerald-500/20 text-emerald-400 animate-pulse cursor-not-allowed'
                    : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-900/50'
                  }`}
               >
                  {browserActive ? (
                    <>
                      <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                      Scouting...
                    </>
                  ) : 'Launch Scout'}
               </button>
            </div>
         </div>
         
         <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Visualizer */}
            <div className="bg-slate-950 rounded-lg border border-slate-800 p-4 relative min-h-[200px] flex flex-col">
               <div className="flex items-center gap-2 mb-4 border-b border-slate-800 pb-2">
                 <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                 <input 
                    type="text" 
                    disabled 
                    value={browserActive ? (useGrounding ? "https://www.google.com/search?q=trending+labeling+jobs" : "https://platform.scale.com/marketplace") : "about:blank"} 
                    className="bg-transparent text-xs font-mono text-slate-500 w-full focus:outline-none" 
                 />
               </div>
               
               {browserActive ? (
                 <div className="flex-1 flex items-center justify-center flex-col gap-4">
                    <div className="relative w-16 h-16">
                      <div className="absolute inset-0 border-4 border-indigo-500/30 rounded-full"></div>
                      <div className="absolute inset-0 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <svg className="w-6 h-6 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      </div>
                    </div>
                    <div className="text-center">
                      <p className="text-emerald-400 font-mono text-sm font-bold">
                        {useGrounding ? 'SEARCHING LIVE WEB' : 'INTERACTING WITH PLATFORM'}
                      </p>
                      <p className="text-slate-500 text-xs mt-1">
                        {useGrounding ? 'Analyzing market trends via Gemini...' : 'Simulating clicks & navigation...'}
                      </p>
                    </div>
                 </div>
               ) : (
                 <div className="flex-1 flex items-center justify-center text-slate-600 flex-col gap-2">
                    <span className="font-mono text-sm">Waiting for command...</span>
                    {useGrounding && <span className="text-[10px] text-emerald-500/50 uppercase tracking-widest border border-emerald-900/50 px-2 py-0.5 rounded">Grounding Active</span>}
                 </div>
               )}
            </div>
            
            {/* Terminal Logs */}
            <div className="font-mono text-xs h-[200px] overflow-y-auto custom-scrollbar">
               {browserLogs.length === 0 ? (
                 <span className="text-slate-600">No recent activity.</span>
               ) : (
                 browserLogs.map((log, i) => (
                   <div key={i} className="mb-1.5 text-slate-300 border-l-2 border-slate-700 pl-2 break-all">
                     <span className="text-indigo-500 opacity-50 mr-2">{new Date().toLocaleTimeString()}</span>
                     {log.startsWith('http') ? (
                       <a href={log} target="_blank" rel="noopener noreferrer" className="text-blue-400 underline hover:text-blue-300">{log}</a>
                     ) : log}
                   </div>
                 ))
               )}
               <div ref={logsEndRef} />
            </div>
         </div>
      </div>

      {/* Workflow Diagram */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-200 flex justify-between items-center">
          <div>
            <h2 className="text-lg font-bold text-slate-800">Pipeline Visualization</h2>
            <p className="text-sm text-slate-500">Real-time status of data processing agents.</p>
          </div>
          <div className="flex gap-4 text-sm">
             <div className="flex flex-col items-center">
                <span className="font-bold text-slate-800">{pendingTasks}</span>
                <span className="text-slate-500 text-xs">Pending</span>
             </div>
             <div className="flex flex-col items-center">
                <span className="font-bold text-slate-800">{preLabeledTasks}</span>
                <span className="text-slate-500 text-xs">Pre-Labeled</span>
             </div>
          </div>
        </div>

        <div className="p-6 relative">
             <svg className="w-full h-[300px]" viewBox="0 0 800 300">
               <defs>
                 <marker id="arrow" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto" markerUnits="strokeWidth">
                   <path d="M0,0 L0,6 L9,3 z" fill="#94a3b8" />
                 </marker>
                 <linearGradient id="nodeGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#ffffff" />
                    <stop offset="100%" stopColor="#f8fafc" />
                 </linearGradient>
               </defs>

               {/* Acquisition Node (New) */}
               <g transform="translate(20, 100)">
                 <rect width="130" height="70" rx="6" fill={browserActive ? '#dcfce7' : 'url(#nodeGradient)'} stroke={browserActive ? '#10b981' : '#cbd5e1'} strokeWidth="2" filter="drop-shadow(0 4px 3px rgb(0 0 0 / 0.05))"/>
                 <text x="65" y="40" textAnchor="middle" className="font-bold text-xs fill-slate-700">Browser Agent</text>
               </g>

               <line x1="150" y1="135" x2="190" y2="135" stroke="#94a3b8" strokeWidth="2" markerEnd="url(#arrow)" strokeDasharray="5,5" className={browserActive ? 'animate-pulse' : ''} />

               {/* Intake Node */}
               <g transform="translate(190, 100)">
                 <rect width="130" height="70" rx="6" fill={isProcessing && agentState.currentTask?.includes('intake') ? '#bfdbfe' : 'url(#nodeGradient)'} stroke="#94a3b8" strokeWidth="2" filter="drop-shadow(0 4px 3px rgb(0 0 0 / 0.05))"/>
                 <text x="65" y="40" textAnchor="middle" className="font-bold text-xs fill-slate-700">Intake Agent</text>
               </g>

               <line x1="320" y1="135" x2="360" y2="135" stroke="#94a3b8" strokeWidth="2" markerEnd="url(#arrow)" />

               {/* Pre-Label Node */}
               <g transform="translate(360, 100)">
                 <rect width="130" height="70" rx="6" fill={isProcessing && agentState.currentTask?.includes('prelabel') ? '#bfdbfe' : 'url(#nodeGradient)'} stroke="#94a3b8" strokeWidth="2" filter="drop-shadow(0 4px 3px rgb(0 0 0 / 0.05))"/>
                 <text x="65" y="40" textAnchor="middle" className="font-bold text-xs fill-slate-700">Pre-Label Agent</text>
               </g>

               <line x1="490" y1="135" x2="530" y2="135" stroke="#94a3b8" strokeWidth="2" markerEnd="url(#arrow)" />

               {/* Routing Node */}
               <g transform="translate(530, 100)">
                 <rect width="130" height="70" rx="6" fill={isProcessing && agentState.currentTask?.includes('routing') ? '#bfdbfe' : 'url(#nodeGradient)'} stroke="#94a3b8" strokeWidth="2" filter="drop-shadow(0 4px 3px rgb(0 0 0 / 0.05))"/>
                 <text x="65" y="40" textAnchor="middle" className="font-bold text-xs fill-slate-700">Routing Agent</text>
               </g>

               {/* Arrow Split */}
               <path d="M660 135 L690 135 L690 60 L710 60" fill="none" stroke="#94a3b8" strokeWidth="2" markerEnd="url(#arrow)" />
               <path d="M660 135 L690 135 L690 210 L710 210" fill="none" stroke="#94a3b8" strokeWidth="2" markerEnd="url(#arrow)" />

               {/* Human Node */}
               <g transform="translate(710, 30)">
                 <rect width="80" height="60" rx="6" fill="#ecfdf5" stroke="#10b981" strokeWidth="2" />
                 <text x="40" y="35" textAnchor="middle" className="font-bold text-[10px] fill-emerald-800">Human</text>
               </g>

               {/* Review Node */}
               <g transform="translate(710, 180)">
                 <rect width="80" height="60" rx="6" fill="#fffbeb" stroke="#f59e0b" strokeWidth="2" />
                 <text x="40" y="35" textAnchor="middle" className="font-bold text-[10px] fill-amber-800">Review</text>
               </g>
               
             </svg>
        </div>

        {/* Processing Control */}
        <div className="bg-slate-50 p-4 border-t border-slate-200 flex justify-between items-center">
           <div className="flex flex-col">
              <span className="text-xs font-bold text-slate-500 uppercase">Internal Batch Processor</span>
              <span className="text-xs text-slate-400">Processes pending items into labeling queue</span>
           </div>
           <button
              onClick={onRunAgents}
              disabled={isProcessing || pendingTasks === 0}
              className={`py-2 px-6 rounded-lg font-semibold flex items-center gap-2 transition-all ${
                 isProcessing || pendingTasks === 0
                 ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                 : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm'
              }`}
            >
              {isProcessing ? 'Processing Batch...' : `Process ${pendingTasks} Items`}
            </button>
        </div>
      </div>
    </div>
  );
};

export default AgentOrchestrator;