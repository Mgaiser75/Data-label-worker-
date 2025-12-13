import React, { useState, useEffect } from 'react';
import { Task, Project, UserRole, TaskStatus, ProjectType, WorkerStats, AgentState } from './types';
import Dashboard from './components/Dashboard';
import WorkQueue from './components/WorkQueue';
import AgentOrchestrator from './components/AgentOrchestrator';
import { preLabelTask, checkApiKey, scoutForWork, scoutWorkWithGrounding } from './services/geminiService';

// --- MOCK DATA ---
const MOCK_PROJECTS: Project[] = [
  {
    id: 'p1',
    name: 'Customer Feedback Sentiment',
    type: ProjectType.SENTIMENT_ANALYSIS,
    description: 'Classify support tickets as Positive, Negative, or Neutral.',
    labels: ['Positive', 'Negative', 'Neutral'],
    guidelines: 'Read the customer email carefully. Sarcasm should be marked Negative.',
    hourlyRate: 15.0
  },
  {
    id: 'p2',
    name: 'Tech News Classification',
    type: ProjectType.TEXT_CLASSIFICATION,
    description: 'Categorize news headlines into topics.',
    labels: ['AI/ML', 'Crypto', 'Hardware', 'Software', 'Business'],
    guidelines: 'Focus on the main subject of the headline.',
    hourlyRate: 12.5
  }
];

const INITIAL_TASKS: Task[] = [
  { id: 't1', projectId: 'p1', data: { text: 'I absolutely love this product, it saved me hours!' }, status: TaskStatus.READY_FOR_HUMAN, createdAt: Date.now(), updatedAt: Date.now() },
  { id: 't2', projectId: 'p1', data: { text: 'The refund process is a nightmare. Avoid.' }, status: TaskStatus.PENDING, createdAt: Date.now(), updatedAt: Date.now() },
  { id: 't3', projectId: 'p2', data: { text: 'NVIDIA announces new Blackwell GPU architecture.' }, status: TaskStatus.PENDING, createdAt: Date.now(), updatedAt: Date.now() },
  { id: 't4', projectId: 'p2', data: { text: 'Bitcoin surges past $90k in record rally.' }, status: TaskStatus.PENDING, createdAt: Date.now(), updatedAt: Date.now() },
];

const INITIAL_STATS: WorkerStats = {
  tasksCompleted: 423,
  hoursWorked: 32.5,
  earnings: 487.50,
  accuracyScore: 0.96
};

// --- APP COMPONENT ---

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'queue' | 'agents' | 'settings'>('dashboard');
  const [tasks, setTasks] = useState<Task[]>(INITIAL_TASKS);
  const [projects, setProjects] = useState<Project[]>(MOCK_PROJECTS);
  const [stats, setStats] = useState<WorkerStats>(INITIAL_STATS);
  const [apiKeyMissing, setApiKeyMissing] = useState(false);
  const [browserActive, setBrowserActive] = useState(false);
  const [browserLogs, setBrowserLogs] = useState<string[]>([]);
  
  // Agent State
  const [agentState, setAgentState] = useState<AgentState>({
    isProcessing: false,
    logs: [],
  });

  useEffect(() => {
    if (!checkApiKey()) {
      setApiKeyMissing(true);
    }
  }, []);

  const addLog = (msg: string) => {
    setAgentState(prev => ({ ...prev, logs: [msg, ...prev.logs].slice(0, 50) }));
  };

  const addBrowserLog = (msg: string) => {
     setBrowserLogs(prev => [...prev, msg].slice(-20));
  };

  // --- BROWSER AGENT LOGIC ---
  const runBrowserAgent = async (useGrounding: boolean) => {
    if (browserActive) return;
    setBrowserActive(true);
    setBrowserLogs(['Initializing agent...', 'Checking network status...']);

    try {
      if (useGrounding) {
         addBrowserLog('Mode: LIVE GROUNDING (Searching Web)');
         addBrowserLog('Connecting to Google Search via Gemini Tool...');
         
         const { project, tasks: newTasks, logs, sourceUrls } = await scoutWorkWithGrounding();
         
         logs.forEach(l => addBrowserLog(`> ${l}`));
         if (sourceUrls && sourceUrls.length > 0) {
            addBrowserLog('SOURCES FOUND:');
            sourceUrls.forEach(url => addBrowserLog(url));
         }

         setProjects(prev => [...prev, project]);
         setTasks(prev => [...prev, ...newTasks]);
         addBrowserLog(`SUCCESS: Contract secured for "${project.name}"`);

      } else {
         // Simulated Mode
         addBrowserLog('Mode: SIMULATION (Fast)');
         // Fake logs for simulation
         const simLogs = [
            'Navigating to platform.scale.com...',
            'Login successful. Session ID: 99a-2b',
            'Scanning marketplace...',
            'Found matching contract: NLP-Batch-24',
            'Auto-accepting terms...',
            'Downloading JSONL payload...'
         ];
         
         for (const log of simLogs) {
            await new Promise(r => setTimeout(r, 800));
            addBrowserLog(`> ${log}`);
         }

         const { project, tasks: newTasks } = await scoutForWork();
         setProjects(prev => [...prev, project]);
         setTasks(prev => [...prev, ...newTasks]);
         addBrowserLog(`SUCCESS: Contract secured for "${project.name}"`);
      }

    } catch (error) {
      addBrowserLog(`ERROR: ${error}`);
      addLog(`[Browser Agent] Failed: ${error}`);
    } finally {
      setBrowserActive(false);
    }
  };

  // --- INTERNAL AGENT LOGIC (SIMULATED LANGGRAPH) ---
  const runAgentWorkflow = async () => {
    setAgentState(prev => ({ ...prev, isProcessing: true }));
    addLog('[System] Starting Batch Processing Workflow...');

    try {
      // 1. Intake Agent
      setAgentState(prev => ({ ...prev, currentTask: 'intake' }));
      const pending = tasks.filter(t => t.status === TaskStatus.PENDING);
      
      if (pending.length === 0) {
        addLog('[Intake Agent] No pending tasks found.');
        setAgentState(prev => ({ ...prev, isProcessing: false, currentTask: undefined }));
        return;
      }

      addLog(`[Intake Agent] Found ${pending.length} tasks. Validating schema...`);
      await new Promise(r => setTimeout(r, 1000)); // Simulate delay
      addLog(`[Intake Agent] Schema check passed. Assigning Batch ID: BATCH-${Date.now().toString().slice(-4)}`);

      // 2. Pre-Label Agent
      setAgentState(prev => ({ ...prev, currentTask: 'prelabel' }));
      const updatedTasks = [...tasks];
      
      for (const task of pending) {
        addLog(`[Pre-Label Agent] Processing Task ${task.id}...`);
        
        try {
          const project = projects.find(p => p.id === task.projectId);
          if (project) {
             const aiResult = await preLabelTask(task, project);
             
             // Update task in local state
             const taskIndex = updatedTasks.findIndex(t => t.id === task.id);
             if (taskIndex !== -1) {
               updatedTasks[taskIndex] = {
                 ...updatedTasks[taskIndex],
                 status: TaskStatus.READY_FOR_HUMAN, // Move to human queue
                 aiPrediction: aiResult,
                 updatedAt: Date.now()
               };
             }
             addLog(`[Pre-Label Agent] Task ${task.id} -> Predicted: ${aiResult.label} (${(aiResult.confidence * 100).toFixed(0)}%)`);
          }
        } catch (e) {
          addLog(`[Pre-Label Agent] Error processing ${task.id}: ${e}`);
        }
        
        // Update UI incrementally
        setTasks([...updatedTasks]);
      }

      // 3. Routing Agent
      setAgentState(prev => ({ ...prev, currentTask: 'routing' }));
      addLog(`[Routing Agent] Assigning ${pending.length} tasks to worker queue.`);
      await new Promise(r => setTimeout(r, 800));

      addLog('[System] Batch complete.');
      setAgentState(prev => ({ ...prev, isProcessing: false, currentTask: undefined }));

    } catch (error) {
       addLog(`[System] Critical Workflow Error: ${error}`);
       setAgentState(prev => ({ ...prev, isProcessing: false, error: String(error) }));
    }
  };

  const handleTaskSubmission = (taskId: string, label: string, timeSpent: number) => {
    setTasks(prev => prev.map(t => {
      if (t.id === taskId) {
        return {
          ...t,
          status: TaskStatus.COMPLETED, // Simple flow for demo, usually goes to REVIEW
          humanLabel: {
            label,
            timestamp: Date.now(),
            userId: 'user-1',
            timeSpentSeconds: timeSpent
          }
        };
      }
      return t;
    }));

    // Update stats
    setStats(prev => ({
      ...prev,
      tasksCompleted: prev.tasksCompleted + 1,
      hoursWorked: prev.hoursWorked + (timeSpent / 3600),
      earnings: prev.earnings + 0.50 // Mock earnings per task
    }));
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="bg-indigo-600 w-8 h-8 rounded-lg flex items-center justify-center">
                 <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                 </svg>
              </div>
              <span className="font-bold text-xl tracking-tight text-slate-800">Nexus Ops</span>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-slate-900">Alex Walker</p>
                <p className="text-xs text-slate-500">Sr. Labeler • Level 3</p>
              </div>
              <div className="h-8 w-8 rounded-full bg-indigo-100 border border-indigo-200 flex items-center justify-center text-indigo-700 font-bold">
                AW
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {apiKeyMissing && (
           <div className="mb-6 bg-amber-50 border border-amber-200 rounded-lg p-4 flex gap-3 text-amber-800">
              <svg className="w-5 h-5 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
              <div>
                <p className="font-bold text-sm">Gemini API Key Missing</p>
                <p className="text-sm mt-1">AI Agents will not function. Please add <code className="bg-amber-100 px-1 rounded">API_KEY</code> to your environment variables or metadata.</p>
              </div>
           </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex space-x-1 bg-slate-200/50 p-1 rounded-xl mb-8 w-fit">
          {[
            { id: 'dashboard', label: 'Dashboard' },
            { id: 'queue', label: 'Work Queue' },
            { id: 'agents', label: 'Command Center' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Views */}
        <div className="transition-all duration-300">
          {activeTab === 'dashboard' && (
            <Dashboard 
              stats={stats} 
              tasks={tasks} 
              onNavigate={(tab) => setActiveTab(tab)} 
            />
          )}
          {activeTab === 'queue' && <WorkQueue tasks={tasks} projects={projects} onSubmitLabel={handleTaskSubmission} />}
          {activeTab === 'agents' && (
            <AgentOrchestrator 
              tasks={tasks} 
              agentState={agentState} 
              onRunAgents={runAgentWorkflow} 
              onRunBrowserAgent={runBrowserAgent}
              isProcessing={agentState.isProcessing} 
              browserActive={browserActive}
              browserLogs={browserLogs}
            />
          )}
        </div>
      </main>
    </div>
  );
};

export default App;