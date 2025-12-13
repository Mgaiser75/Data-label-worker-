import React, { useState, useEffect, useCallback } from 'react';
import { Task, Project, TaskStatus } from '../types';

interface WorkQueueProps {
  tasks: Task[];
  projects: Project[];
  onSubmitLabel: (taskId: string, label: string, timeSpent: number) => void;
}

const WorkQueue: React.FC<WorkQueueProps> = ({ tasks, projects, onSubmitLabel }) => {
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [selectedLabel, setSelectedLabel] = useState<string>('');
  const [startTime, setStartTime] = useState<number>(Date.now());
  const [timer, setTimer] = useState<number>(0);

  // Filter for available tasks
  const queue = tasks.filter(t => t.status === TaskStatus.READY_FOR_HUMAN || t.status === TaskStatus.IN_PROGRESS);

  useEffect(() => {
    let interval: any;
    if (activeTask) {
      interval = setInterval(() => {
        setTimer(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [activeTask]);

  const startTask = (task: Task) => {
    setActiveTask(task);
    setStartTime(Date.now());
    setTimer(0);
    // If AI pre-labeled it, default to that suggestion
    if (task.aiPrediction) {
      setSelectedLabel(task.aiPrediction.label);
    } else {
      setSelectedLabel('');
    }
  };

  const handleSubmit = () => {
    if (!activeTask || !selectedLabel) return;
    const timeSpent = (Date.now() - startTime) / 1000;
    onSubmitLabel(activeTask.id, selectedLabel, timeSpent);
    setActiveTask(null);
  };

  const activeProject = activeTask ? projects.find(p => p.id === activeTask.projectId) : null;

  if (activeTask && activeProject) {
    return (
      <div className="flex h-[calc(100vh-140px)] gap-6">
        {/* Main Workspace */}
        <div className="flex-1 bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
            <div>
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Task ID</span>
              <p className="text-sm font-mono text-slate-700">{activeTask.id}</p>
            </div>
            <div className="flex items-center gap-4">
               <div className="flex flex-col items-end">
                 <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Timer</span>
                 <p className="text-lg font-mono text-indigo-600 font-bold">
                    {Math.floor(timer / 60).toString().padStart(2, '0')}:{(timer % 60).toString().padStart(2, '0')}
                 </p>
               </div>
               <button 
                  onClick={() => setActiveTask(null)}
                  className="text-slate-400 hover:text-slate-600"
               >
                 Skip
               </button>
            </div>
          </div>
          
          <div className="flex-1 p-8 overflow-y-auto custom-scrollbar flex items-center justify-center bg-slate-50/50">
            <div className="max-w-3xl w-full bg-white p-8 rounded-lg shadow-sm border border-slate-200">
               <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Data Content</h3>
               <p className="text-xl leading-relaxed text-slate-800 whitespace-pre-wrap">
                 {activeTask.data.text}
               </p>
            </div>
          </div>

          <div className="p-4 bg-white border-t border-slate-200">
            {activeTask.aiPrediction && (
              <div className="mb-4 bg-indigo-50 border border-indigo-100 rounded-lg p-3 flex items-start gap-3">
                 <div className="mt-0.5">
                   <svg className="w-5 h-5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                   </svg>
                 </div>
                 <div>
                   <p className="text-sm text-indigo-900 font-medium">AI Suggestion: <span className="font-bold">{activeTask.aiPrediction.label}</span></p>
                   <p className="text-xs text-indigo-700 mt-1">{activeTask.aiPrediction.reasoning} (Confidence: {activeTask.aiPrediction.confidence.toFixed(2)})</p>
                 </div>
              </div>
            )}
            
            <div className="flex flex-col gap-2">
              <span className="text-sm font-medium text-slate-700">Select Label:</span>
              <div className="flex flex-wrap gap-2">
                {activeProject.labels.map(label => (
                  <button
                    key={label}
                    onClick={() => setSelectedLabel(label)}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                      selectedLabel === label
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200 ring-2 ring-indigo-600 ring-offset-2'
                        : 'bg-white text-slate-600 border border-slate-300 hover:border-indigo-300 hover:bg-slate-50'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="mt-6 flex justify-end">
               <button
                 onClick={handleSubmit}
                 disabled={!selectedLabel}
                 className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-8 py-3 rounded-lg font-semibold shadow-sm transition-colors"
               >
                 Submit Label
               </button>
            </div>
          </div>
        </div>
        
        {/* Guidelines Sidebar */}
        <div className="w-80 bg-white rounded-xl shadow-sm border border-slate-200 p-6 overflow-y-auto">
           <h3 className="font-bold text-slate-800 mb-4">Project Guidelines</h3>
           <div className="prose prose-sm prose-slate text-sm">
             <p className="whitespace-pre-line text-slate-600">{activeProject.guidelines}</p>
           </div>
           
           <div className="mt-8 pt-6 border-t border-slate-100">
             <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Shortcuts</h4>
             <div className="flex flex-col gap-2 text-xs text-slate-600">
               <div className="flex justify-between"><span>Confirm</span> <kbd className="bg-slate-100 px-1 rounded">Enter</kbd></div>
               <div className="flex justify-between"><span>Skip</span> <kbd className="bg-slate-100 px-1 rounded">Esc</kbd></div>
             </div>
           </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="p-6 border-b border-slate-200 flex justify-between items-center">
        <h2 className="text-lg font-bold text-slate-800">Task Queue</h2>
        <span className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-xs font-bold">
          {queue.length} Available
        </span>
      </div>
      
      {queue.length === 0 ? (
        <div className="p-12 text-center">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-slate-900">All caught up!</h3>
          <p className="text-slate-500 mt-2">No tasks are currently assigned to you. Check back later.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-500">
              <tr>
                <th className="px-6 py-4">Task ID</th>
                <th className="px-6 py-4">Project</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">AI Prediction</th>
                <th className="px-6 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {queue.map(task => {
                const project = projects.find(p => p.id === task.projectId);
                return (
                  <tr key={task.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-mono text-xs">{task.id.slice(0, 8)}...</td>
                    <td className="px-6 py-4 font-medium text-slate-900">{project?.name || 'Unknown'}</td>
                    <td className="px-6 py-4">
                       <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                         <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                         Ready
                       </span>
                    </td>
                    <td className="px-6 py-4">
                      {task.aiPrediction ? (
                        <span className="text-slate-900">{task.aiPrediction.label} <span className="text-slate-400 text-xs">({(task.aiPrediction.confidence * 100).toFixed(0)}%)</span></span>
                      ) : (
                        <span className="text-slate-400 italic">None</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => startTask(task)}
                        className="text-indigo-600 font-medium hover:text-indigo-800"
                      >
                        Start Labeling &rarr;
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default WorkQueue;
