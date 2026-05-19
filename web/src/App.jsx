import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Compass, LayoutGrid, Activity, ShieldCheck, Box, Sparkles, 
  Search, ChevronRight, Terminal, Settings, Play, Check, X, Menu, FolderInput, RefreshCw,
  Cpu, Zap, Globe, Package, GitBranch, TerminalSquare, AlertCircle, Plus, History, Clock, ExternalLink,
  ZapOff, BrainCircuit, BarChart3, ListChecks
} from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

// --- Constants ---
const VIEWS = {
  NAVIGATOR: 'navigator',
  TASKS: 'tasks',
  STUDIO: 'studio',
  ARCHITECT: 'architect',
  AI: 'ai',
  SETTINGS: 'settings'
};

// --- Services ---
const api = {
  getProjects: () => fetch('/api/projects').then(r => r.json()),
  getTasks: () => fetch('/api/tasks').then(r => r.json()),
  getAudit: () => fetch('/api/audit').then(r => r.json()),
  runCommand: (projectId, commandId) => fetch('/api/run', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ projectId, commandId })
  }).then(r => r.json()),
  killTask: (taskId) => fetch('/api/kill', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ taskId })
  }).then(r => r.json()),
  updateConfig: (rootPath) => fetch('/api/config', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ rootPath })
  }).then(r => r.json()),
  scaffold: (template, name, targetPath) => fetch('/api/scaffold', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ template, name, targetPath })
  }).then(r => r.json()),
  aiAnalyze: (projectId) => fetch('/api/ai-analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ projectId })
  }).then(r => r.json())
};

// --- Framer Motion Presets ---
const slideUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
  transition: { duration: 0.4, ease: [0.4, 0, 0.2, 1] }
};

// --- Components ---

const GlassCard = ({ children, className, onClick }) => (
  <motion.div 
    whileHover={{ scale: 1.01, backgroundColor: 'rgba(255,255,255,0.04)' }}
    whileTap={{ scale: 0.99 }}
    onClick={onClick}
    className={cn(
      "glass p-6 rounded-[28px] border border-white/[0.08] shadow-2xl relative overflow-hidden transition-all duration-300",
      className
    )}
  >
    {children}
  </motion.div>
);

const NavItem = ({ icon: Icon, label, active, onClick }) => (
  <button 
    onClick={onClick}
    className={cn(
      "relative flex items-center gap-4 px-6 py-4 rounded-[20px] transition-all duration-500 group",
      active ? "text-white" : "text-neutral-500 hover:text-neutral-200"
    )}
  >
    {active && (
      <motion.div 
        layoutId="nav-bg"
        className="absolute inset-0 bg-white/[0.06] rounded-[20px] border border-white/[0.05] shadow-inner"
        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
      />
    )}
    <Icon className={cn("w-5 h-5 z-10 transition-transform group-hover:scale-110", active ? "text-cyan-400" : "text-neutral-600")} />
    <span className="text-sm font-bold z-10 tracking-tight">{label}</span>
  </button>
);

export default function App() {
  const [currentView, setCurrentView] = useState(VIEWS.NAVIGATOR);
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [auditData, setAuditData] = useState([]);
  const [logs, setLogs] = useState({});
  const [loading, setLoading] = useState(true);
  const [auditing, setAuditing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [rootPath, setRootPath] = useState('');
  const [newRootPath, setNewRootPath] = useState('');
  
  // Scaffolding State
  const [scaffoldName, setScaffoldName] = useState('my-new-project');
  const [scaffoldTemplate, setScaffoldTemplate] = useState('nextjs');
  const [scaffolding, setScaffolding] = useState(false);

  // AI State
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);

  const ws = useRef(null);

  useEffect(() => {
    refreshAll();
    connectWS();
    // Auto-audit on first load of studio
    return () => ws.current?.close();
  }, []);

  useEffect(() => {
    if (currentView === VIEWS.STUDIO && auditData.length === 0) {
      runAudit();
    }
  }, [currentView]);

  const refreshAll = () => {
    setLoading(true);
    api.getProjects().then(data => { setProjects(data); setLoading(false); });
    api.getTasks().then(setTasks);
  };

  const runAudit = () => {
    setAuditing(true);
    api.getAudit().then(data => {
      setAuditData(data);
      setAuditing(false);
    });
  };

  const handleScaffold = async () => {
    setScaffolding(true);
    try {
      const res = await api.scaffold(scaffoldTemplate, scaffoldName, rootPath);
      alert(res.message);
      refreshAll();
    } catch (err) {
      alert(`Scaffolding failed: ${err.message}`);
    } finally {
      setScaffolding(false);
    }
  };

  const runAIAnalysis = async () => {
    if (!selectedProject) return;
    setAnalyzing(true);
    try {
      const res = await api.aiAnalyze(selectedProject.id);
      setAiAnalysis(res);
    } catch (err) {
      alert(`AI Analysis failed: ${err.message}`);
    } finally {
      setAnalyzing(false);
    }
  };

  const connectWS = () => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    ws.current = new WebSocket(`${protocol}//${window.location.host}`);
    ws.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'output') {
        setLogs(prev => ({
          ...prev,
          [data.taskId]: (prev[data.taskId] || '') + data.chunk
        }));
      }
      if (data.type === 'task_end') refreshAll();
      if (data.type === 'task_start') refreshAll();
    };
  };

  const filteredProjects = useMemo(() => {
    if (!searchQuery) return projects;
    const q = searchQuery.toLowerCase();
    return projects.filter(p => p.name.toLowerCase().includes(q) || p.type.toLowerCase().includes(q));
  }, [projects, searchQuery]);

  const getProjectById = (id) => projects.find(p => p.id === id);

  return (
    <div className="flex h-screen w-full p-4 lg:p-6 gap-6 bg-[#050505] selection:bg-cyan-500/30 overflow-hidden">
      
      {/* Sidebar */}
      <aside className="w-80 flex flex-col gap-6 h-full shrink-0">
        <header className="px-4 py-2 flex items-center gap-4">
          <div className="w-12 h-12 rounded-[20px] bg-gradient-to-br from-magenta-600 to-cyan-500 p-[1px]">
            <div className="w-full h-full bg-[#050505] rounded-[19px] flex items-center justify-center shadow-2xl">
              <Compass className="w-6 h-6 text-white animate-pulse-slow" />
            </div>
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tighter text-white uppercase italic leading-tight">Project Compass</h1>
            <p className="text-[9px] font-black tracking-[0.3em] text-neutral-600 uppercase">Omni-Upgrade v5.0</p>
          </div>
        </header>

        <nav className="flex flex-col gap-1">
          <NavItem icon={LayoutGrid} label="Navigator" active={currentView === VIEWS.NAVIGATOR} onClick={() => setCurrentView(VIEWS.NAVIGATOR)} />
          <NavItem icon={Activity} label="Task Manager" active={currentView === VIEWS.TASKS} onClick={() => setCurrentView(VIEWS.TASKS)} />
          <NavItem icon={ShieldCheck} label="Omni-Studio" active={currentView === VIEWS.STUDIO} onClick={() => setCurrentView(VIEWS.STUDIO)} />
          <NavItem icon={Box} label="Architect" active={currentView === VIEWS.ARCHITECT} onClick={() => setCurrentView(VIEWS.ARCHITECT)} />
          <NavItem icon={Sparkles} label="AI Horizon" active={currentView === VIEWS.AI} onClick={() => setCurrentView(VIEWS.AI)} />
          <NavItem icon={Settings} label="Settings" active={currentView === VIEWS.SETTINGS} onClick={() => setCurrentView(VIEWS.SETTINGS)} />
        </nav>

        <section className="flex-1 glass rounded-[32px] flex flex-col gap-4 p-4 overflow-hidden border-white/[0.03]">
          <div className="relative px-2">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-600" />
            <input 
              type="text" 
              placeholder="Search Workspace..." 
              className="w-full bg-white/[0.03] border border-white/[0.05] rounded-2xl py-3.5 pl-12 pr-4 text-[11px] font-bold focus:outline-none focus:border-cyan-500/40 transition-all placeholder:text-neutral-700"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex-1 overflow-y-auto pr-1 space-y-1.5 custom-scroll">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 opacity-20 gap-4">
                <RefreshCw className="w-6 h-6 animate-spin" />
              </div>
            ) : filteredProjects.map(p => (
              <button 
                key={p.id} 
                onClick={() => { setSelectedProject(p); setCurrentView(VIEWS.NAVIGATOR); }}
                className={cn(
                  "w-full flex items-center gap-4 p-3.5 rounded-2xl transition-all border group",
                  selectedProject?.id === p.id 
                    ? "bg-white/[0.06] border-white/[0.1] shadow-xl" 
                    : "border-transparent hover:bg-white/[0.03]"
                )}
              >
                <span className="text-2xl grayscale group-hover:grayscale-0 transition-all">{p.icon}</span>
                <div className="text-left overflow-hidden flex-1">
                  <h3 className={cn("text-[11px] font-bold truncate", selectedProject?.id === p.id ? "text-cyan-400" : "text-neutral-400 group-hover:text-neutral-200")}>{p.name}</h3>
                  <p className="text-[8px] font-black tracking-widest text-neutral-600 uppercase">{p.type}</p>
                </div>
                <ChevronRight className={cn("w-3 h-3 transition-all", selectedProject?.id === p.id ? "text-cyan-500 translate-x-0" : "text-neutral-800 -translate-x-2 opacity-0 group-hover:opacity-100 group-hover:translate-x-0")} />
              </button>
            ))}
          </div>
        </section>
      </aside>

      {/* Main Content */}
      <main className="flex-1 relative flex flex-col gap-6 overflow-hidden min-w-0">
        <AnimatePresence mode="wait">
          
          {/* Navigator View */}
          {currentView === VIEWS.NAVIGATOR && (
            <motion.div key="nav" {...slideUp} className="flex-1 flex flex-col gap-6 overflow-hidden">
              {selectedProject ? (
                <>
                  <header className="glass p-8 lg:p-12 rounded-[48px] flex justify-between items-center relative overflow-hidden group shadow-[0_0_80px_rgba(0,0,0,0.4)] shrink-0">
                    <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/[0.02] to-magenta-500/[0.02] opacity-0 group-hover:opacity-100 transition-opacity duration-1000"></div>
                    <div className="relative z-10 flex items-center gap-6 lg:gap-10 overflow-hidden">
                      <motion.span 
                        initial={{ scale: 0.8 }} 
                        animate={{ scale: 1 }} 
                        className="text-6xl lg:text-8xl drop-shadow-2xl shrink-0"
                      >
                        {selectedProject.icon}
                      </motion.span>
                      <div className="overflow-hidden">
                        <h2 className="text-4xl lg:text-6xl font-black tracking-tighter text-white uppercase italic leading-none truncate">{selectedProject.name}</h2>
                        <div className="flex gap-4 mt-4">
                          <span className="px-5 py-1.5 glass rounded-full text-[10px] font-black text-cyan-400 border-cyan-400/20 tracking-[0.2em] uppercase">{selectedProject.type}</span>
                          {selectedProject.git?.available && (
                            <span className="flex items-center gap-2 px-5 py-1.5 glass rounded-full text-[10px] font-black text-green-500 border-green-500/20 tracking-[0.1em] uppercase">
                              <GitBranch className="w-3 h-3" /> {selectedProject.git.branch}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="relative z-10 flex gap-4 shrink-0 ml-4">
                      <button onClick={() => setCurrentView(VIEWS.AI)} className="p-4 lg:p-6 glass rounded-[28px] hover:bg-white/10 text-magenta-400 hover:text-white transition-all shadow-xl"><Sparkles className="w-6 h-6" /></button>
                      <button className="p-4 lg:p-6 glass rounded-[28px] hover:bg-white/10 text-neutral-400 hover:text-white transition-all shadow-xl"><TerminalSquare className="w-6 h-6" /></button>
                    </div>
                  </header>

                  <div className="flex-1 flex gap-6 overflow-hidden">
                    <section className="w-80 lg:w-96 flex flex-col gap-6 shrink-0">
                      <GlassCard className="flex-1 overflow-y-auto custom-scroll p-8 lg:p-10">
                        <div className="flex justify-between items-center mb-10">
                          <h3 className="text-[10px] font-black text-neutral-500 uppercase tracking-[0.4em]">Engine Atlas</h3>
                          <Zap className="w-3 h-3 text-cyan-500 animate-pulse" />
                        </div>
                        <div className="space-y-4">
                          {Object.entries(selectedProject.commands || {}).map(([id, cmd]) => (
                            <motion.button 
                              key={id}
                              whileHover={{ x: 5, backgroundColor: 'rgba(255,255,255,0.06)' }}
                              onClick={() => api.runCommand(selectedProject.id, id)}
                              className="w-full text-left p-6 rounded-[24px] bg-white/[0.03] border border-white/[0.04] group transition-all"
                            >
                              <div className="flex justify-between items-center mb-2">
                                <span className="text-sm font-black text-neutral-200 group-hover:text-cyan-400 transition-colors uppercase italic">{cmd.label}</span>
                                <div className="w-8 h-8 rounded-full bg-white/[0.05] flex items-center justify-center group-hover:bg-cyan-500 group-hover:text-black transition-all">
                                  <Play className="w-3 h-3 ml-0.5" />
                                </div>
                              </div>
                              <p className="text-[10px] text-neutral-600 font-mono tracking-tighter truncate opacity-60 group-hover:opacity-100 transition-opacity">{(cmd.command || []).join(' ')}</p>
                            </motion.button>
                          ))}
                        </div>
                      </GlassCard>
                    </section>

                    <section className="flex-1 glass rounded-[48px] overflow-hidden flex flex-col bg-black/60 border-white/[0.04] shadow-[0_40px_100px_rgba(0,0,0,0.6)]">
                      <div className="p-6 lg:p-8 border-b border-white/[0.04] flex justify-between items-center bg-white/[0.01] shrink-0">
                        <div className="flex items-center gap-6">
                          <div className="flex gap-2">
                            <div className="w-2.5 h-2.5 rounded-full bg-red-500/40 border border-red-500/60 shadow-[0_0_10px_rgba(239,68,68,0.2)]"></div>
                            <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/40 border border-yellow-500/60"></div>
                            <div className="w-2.5 h-2.5 rounded-full bg-green-500/40 border border-green-500/60"></div>
                          </div>
                          <span className="text-[10px] font-black text-neutral-600 tracking-[0.3em] uppercase">Telemetry Log Feed</span>
                        </div>
                        <button onClick={() => setLogs({})} className="text-[10px] font-black text-neutral-600 hover:text-white tracking-widest uppercase transition-colors">Wipe Buffer</button>
                      </div>
                      <div className="flex-1 p-8 lg:p-10 overflow-y-auto log-container text-[11px] leading-relaxed custom-scroll font-medium">
                        {Object.keys(logs).length > 0 ? (
                          Object.entries(logs).map(([tid, log]) => (
                            <div key={tid} className="mb-10 animate-in fade-in slide-in-from-left-4 duration-700">
                              <div className="flex items-center gap-3 mb-4">
                                <span className="w-8 h-px bg-cyan-500/30"></span>
                                <span className="text-[10px] font-black text-cyan-400 tracking-widest uppercase italic opacity-60">Session {tid}</span>
                              </div>
                              <div className="text-neutral-400 pl-4 border-l border-white/[0.05] whitespace-pre-wrap">{log}</div>
                            </div>
                          ))
                        ) : (
                          <div className="h-full flex flex-col items-center justify-center opacity-10">
                            <Terminal className="w-20 h-20 mb-8 stroke-[1px]" />
                            <p className="text-sm font-black tracking-[0.3em] uppercase italic">Stationary Horizon</p>
                          </div>
                        )}
                      </div>
                    </section>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-20">
                  <motion.div 
                    initial={{ rotate: -20, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    className="w-48 h-48 glass rounded-[60px] flex items-center justify-center mb-16 relative group cursor-pointer shadow-2xl"
                  >
                    <div className="absolute inset-0 bg-cyan-400/20 blur-[100px] rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-1000"></div>
                    <Compass className="w-24 h-24 text-neutral-800 group-hover:text-cyan-400 transition-all duration-700 stroke-[1px]" />
                  </motion.div>
                  <h2 className="text-5xl font-black tracking-tighter text-white uppercase italic leading-tight">Global Workspace<br/>Mapped & Ready</h2>
                  <p className="mt-8 max-w-sm text-neutral-500 text-sm font-medium leading-relaxed uppercase tracking-tighter">
                    Select a project DNA from the navigator to reveal the bridge between terminal logic and browser orchestration.
                  </p>
                </div>
              )}
            </motion.div>
          )}

          {/* Tasks View */}
          {currentView === VIEWS.TASKS && (
            <motion.div key="tasks" {...slideUp} className="flex-1 flex flex-col gap-10 p-10 overflow-hidden">
              <header className="flex justify-between items-end shrink-0">
                <div>
                  <h2 className="text-5xl font-black text-white uppercase italic tracking-tighter leading-none">Orbit Control</h2>
                  <p className="text-neutral-600 text-[11px] font-black uppercase tracking-[0.4em] mt-3">Live background orchestration</p>
                </div>
                <button onClick={refreshAll} className="p-5 glass rounded-[24px] hover:bg-white/10 text-neutral-400 hover:text-white transition-all"><RefreshCw className="w-6 h-6" /></button>
              </header>
              <div className="flex-1 overflow-y-auto custom-scroll space-y-6 pr-6 pb-20">
                {tasks.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center opacity-10">
                    <Activity className="w-32 h-32 mb-10 stroke-[0.5px]" />
                    <span className="text-3xl font-black uppercase tracking-[0.5em] italic">Workspace Silence</span>
                  </div>
                ) : tasks.map(task => {
                  const project = getProjectById(task.projectId);
                  return (
                    <GlassCard key={task.id} className="flex flex-col items-stretch gap-6 p-8 hover:border-cyan-500/20">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-8">
                          <div className={cn(
                            "w-16 h-16 rounded-[24px] flex items-center justify-center shadow-2xl relative",
                            task.status === 'running' ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/30" : 
                            task.status === 'success' ? "bg-green-500/10 text-green-400 border border-green-500/30" :
                            "bg-red-500/10 text-red-400 border border-red-500/30"
                          )}>
                            {task.status === 'running' && <div className="absolute inset-0 bg-cyan-400/10 blur-xl animate-pulse rounded-full"></div>}
                            {task.status === 'running' ? <Activity className="w-8 h-8 animate-pulse" /> :
                             task.status === 'success' ? <Check className="w-8 h-8" /> : <X className="w-8 h-8" />}
                          </div>
                          <div>
                            <div className="flex items-center gap-3">
                               <h3 className="text-2xl font-black text-white uppercase italic leading-none">{task.label}</h3>
                               <span className={cn(
                                 "px-3 py-0.5 rounded text-[8px] font-black uppercase tracking-widest",
                                 task.status === 'running' ? "bg-cyan-500/20 text-cyan-400" :
                                 task.status === 'success' ? "bg-green-500/20 text-green-400" :
                                 "bg-red-500/20 text-red-400"
                               )}>{task.status}</span>
                            </div>
                            <div className="flex items-center gap-4 mt-2">
                               <span className="flex items-center gap-1.5 text-[9px] font-black text-neutral-500 uppercase tracking-widest">
                                 <Box className="w-3 h-3" /> {project?.name || 'Unknown Project'}
                               </span>
                               <span className="flex items-center gap-1.5 text-[9px] font-black text-neutral-600 uppercase tracking-widest">
                                 <Clock className="w-3 h-3" /> {new Date(task.startTime).toLocaleTimeString()}
                               </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-3">
                          <button 
                            onClick={() => { setSelectedProject(project); setCurrentView(VIEWS.NAVIGATOR); }}
                            className="p-4 glass rounded-2xl text-neutral-400 hover:text-white hover:bg-white/5 transition-all"
                          >
                            <ExternalLink className="w-5 h-5" />
                          </button>
                          {task.status === 'running' && (
                            <button onClick={() => api.killTask(task.id).then(refreshAll)} className="px-6 py-4 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-2xl text-[9px] font-black text-red-500 uppercase tracking-widest transition-all">Kill</button>
                          )}
                        </div>
                      </div>
                      <div className="bg-black/40 rounded-2xl p-4 font-mono text-[10px] text-neutral-500 max-h-32 overflow-y-auto border border-white/[0.03] custom-scroll">
                         <div className="whitespace-pre-wrap">{logs[task.id] || task.output || 'No output buffered...'}</div>
                      </div>
                    </GlassCard>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* Studio View - Reliable Audit */}
          {currentView === VIEWS.STUDIO && (
            <motion.div key="studio" {...slideUp} className="flex-1 p-10 lg:p-16 flex flex-col gap-12 overflow-hidden">
               <header className="flex justify-between items-end shrink-0">
                <div>
                  <h2 className="text-6xl font-black text-white uppercase italic tracking-tighter leading-none">Omni-Studio</h2>
                  <p className="text-neutral-600 text-[11px] font-black uppercase tracking-[0.4em] mt-4">High-fidelity runtime telemetry</p>
                </div>
                <button 
                  onClick={runAudit} 
                  disabled={auditing}
                  className={cn(
                    "px-12 py-6 rounded-[30px] text-xs font-black tracking-[0.3em] uppercase transition-all shadow-2xl flex items-center gap-4",
                    auditing ? "bg-white/5 text-neutral-600" : "bg-white text-black hover:scale-105 active:scale-95"
                  )}
                >
                  {auditing && <RefreshCw className="w-4 h-4 animate-spin" />}
                  {auditing ? 'Synchronizing...' : 'Execute Audit'}
                </button>
              </header>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 overflow-y-auto custom-scroll pr-4 pb-20">
                {(auditData.length > 0 ? auditData : [
                  { name: 'Node.js', icon: '🟢', status: 'ready' },
                  { name: 'Python', icon: '🐍', status: 'ready' },
                  { name: 'Rust', icon: '🦀', status: 'ready' },
                  { name: 'Go', icon: '🐹', status: 'ready' },
                  { name: 'Java', icon: '☕', status: 'ready' },
                  { name: 'PHP', icon: '🐘', status: 'ready' },
                  { name: 'Ruby', icon: '💎', status: 'ready' },
                  { name: '.NET', icon: '🔷', status: 'ready' }
                ]).map((r, idx) => (
                  <motion.div 
                    key={r.name} 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: idx * 0.05 }}
                    className="glass p-10 rounded-[40px] border border-white/[0.06] hover:border-white/[0.15] group hover:bg-white/[0.04] transition-all cursor-default"
                  >
                     <div className="flex justify-between items-start mb-10">
                        <span className="text-6xl grayscale group-hover:grayscale-0 transition-all duration-700 group-hover:scale-110">{r.icon}</span>
                        <div className={cn(
                          "px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border shadow-inner",
                          r.status === 'online' ? "bg-green-500/10 text-green-500 border-green-500/20" : "bg-neutral-500/10 text-neutral-600 border-neutral-500/10"
                        )}>
                          {r.status || 'Ready'}
                        </div>
                     </div>
                     <h4 className="text-3xl font-black text-white uppercase italic leading-none truncate">{r.name}</h4>
                     <p className="text-[11px] text-neutral-600 font-bold tracking-tight uppercase mt-4 mb-8">System Runtime Infrastructure</p>
                     
                     <div className="p-6 bg-black/40 border border-white/[0.04] rounded-[24px] flex flex-col gap-2 group-hover:border-white/[0.1] transition-all">
                        <div className="flex justify-between items-center">
                           <span className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">Version Telemetry</span>
                           <span className="text-[11px] font-mono font-bold text-cyan-400 truncate max-w-[120px]">{r.version || '0.0.0'}</span>
                        </div>
                        {r.activeBin && (
                          <div className="flex justify-between items-center opacity-40">
                             <span className="text-[8px] font-black text-neutral-600 uppercase tracking-widest">Active Binary</span>
                             <span className="text-[9px] font-mono font-bold text-neutral-500">{r.activeBin}</span>
                          </div>
                        )}
                     </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Architect View */}
          {currentView === VIEWS.ARCHITECT && (
            <motion.div key="arch" {...slideUp} className="flex-1 p-10 lg:p-24 flex flex-col gap-12 overflow-hidden">
               <header className="flex justify-between items-end shrink-0">
                <div>
                  <h2 className="text-6xl font-black text-white uppercase italic tracking-tighter leading-none">Project Architect</h2>
                  <p className="text-neutral-600 text-[11px] font-black uppercase tracking-[0.4em] mt-4">Scaffold new project ecosystems</p>
                </div>
                <div className="w-16 h-16 glass rounded-2xl flex items-center justify-center border border-magenta-500/20">
                  <Box className="w-8 h-8 text-magenta-500" />
                </div>
              </header>

              <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-8 overflow-y-auto custom-scroll pr-4 pb-20">
                <section className="glass p-10 lg:p-12 rounded-[60px] border border-white/[0.04] flex flex-col gap-10 bg-white/[0.01]">
                   <div>
                     <h3 className="text-4xl font-black text-white uppercase italic mb-2">Construction Specs</h3>
                     <p className="text-neutral-500 text-xs font-medium uppercase tracking-tight">Define your project identity</p>
                   </div>
                   
                   <div className="space-y-6">
                      <div className="flex flex-col gap-3">
                         <label className="text-[10px] font-black text-neutral-600 uppercase tracking-widest ml-2">Project Name</label>
                         <input 
                            type="text" 
                            className="w-full bg-white/[0.03] border border-white/[0.08] rounded-[24px] py-6 px-8 text-sm font-bold focus:outline-none focus:border-magenta-500/40 transition-all"
                            value={scaffoldName}
                            onChange={(e) => setScaffoldName(e.target.value)}
                         />
                      </div>

                      <div className="flex flex-col gap-3">
                         <label className="text-[10px] font-black text-neutral-600 uppercase tracking-widest ml-2">Template Architecture</label>
                         <div className="grid grid-cols-2 gap-3">
                            {[
                              { id: 'nextjs', name: 'Next.js', icon: '🧭' },
                              { id: 'react-vite', name: 'React + Vite', icon: '⚛️' },
                              { id: 'rust', name: 'Rust Binary', icon: '🦀' },
                              { id: 'go', name: 'Go Module', icon: '🐹' },
                              { id: 'django', name: 'Django', icon: '🌿' },
                              { id: 'python-basic', name: 'Python Basic', icon: '🐍' }
                            ].map(t => (
                              <button 
                                key={t.id}
                                onClick={() => setScaffoldTemplate(t.id)}
                                className={cn(
                                  "p-6 rounded-[24px] border transition-all flex flex-col items-center gap-2 group",
                                  scaffoldTemplate === t.id 
                                    ? "bg-magenta-500/10 border-magenta-500/40 text-white" 
                                    : "bg-white/[0.02] border-white/[0.05] text-neutral-500 hover:bg-white/[0.05]"
                                )}
                              >
                                <span className="text-3xl group-hover:scale-110 transition-transform">{t.icon}</span>
                                <span className="text-[10px] font-black uppercase tracking-widest">{t.name}</span>
                              </button>
                            ))}
                         </div>
                      </div>
                   </div>

                   <button 
                      onClick={handleScaffold}
                      disabled={scaffolding}
                      className={cn(
                        "w-full py-8 rounded-[30px] text-xs font-black tracking-[0.4em] uppercase transition-all shadow-2xl flex items-center justify-center gap-4",
                        scaffolding ? "bg-white/5 text-neutral-600" : "bg-magenta-500 text-white hover:scale-[1.02] active:scale-95 shadow-magenta-500/20"
                      )}
                   >
                      {scaffolding ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
                      {scaffolding ? 'Constructing DNA...' : 'Execute Scaffolding'}
                   </button>
                </section>

                <section className="flex flex-col gap-6">
                   <GlassCard className="p-10 border-magenta-500/10 bg-magenta-500/[0.01]">
                      <h4 className="text-xl font-black text-magenta-400 uppercase italic mb-4">Architectural Guidance</h4>
                      <p className="text-neutral-400 text-xs font-medium leading-relaxed uppercase tracking-tighter">
                        Project Architect leverages the system's native scaffolding engines. Ensure the relevant binaries (NPM, Cargo, etc.) are online in Omni-Studio before initialization.
                      </p>
                   </GlassCard>
                   <div className="flex-1 glass rounded-[40px] border-white/[0.04] p-10 flex flex-col items-center justify-center text-center opacity-40 grayscale group hover:grayscale-0 transition-all shrink-0 min-h-[300px]">
                      <Globe className="w-16 h-16 text-neutral-800 mb-6 group-hover:text-cyan-400" />
                      <p className="text-[10px] font-black uppercase tracking-[0.2em]">Remote Repository Integration<br/>Coming in v5.1</p>
                   </div>
                </section>
              </div>
            </motion.div>
          )}

          {/* AI Horizon - High Fidelity Implementation */}
          {currentView === VIEWS.AI && (
            <motion.div key="ai" {...slideUp} className="flex-1 flex flex-col gap-12 p-10 lg:p-16 overflow-hidden">
               <header className="flex justify-between items-end shrink-0">
                <div>
                  <h2 className="text-6xl font-black text-white uppercase italic tracking-tighter leading-none">AI Horizon</h2>
                  <p className="text-neutral-600 text-[11px] font-black uppercase tracking-[0.4em] mt-4 italic">Automated Architectural Intelligence</p>
                </div>
                <div className="w-16 h-16 glass rounded-2xl flex items-center justify-center border border-magenta-500/20">
                  <BrainCircuit className="w-8 h-8 text-magenta-500" />
                </div>
              </header>

              <div className="flex-1 flex flex-col lg:flex-row gap-8 overflow-hidden">
                <section className="w-full lg:w-[450px] flex flex-col gap-6 shrink-0">
                  <GlassCard className="p-10 flex flex-col gap-10 bg-magenta-500/[0.02] border-magenta-500/10">
                     <div>
                        <h3 className="text-3xl font-black text-white uppercase italic leading-tight">Neural DNA Analysis</h3>
                        <p className="text-neutral-500 text-[10px] font-black uppercase tracking-widest mt-2">Target: {selectedProject?.name || 'No Project Selected'}</p>
                     </div>
                     
                     <div className="p-8 bg-black/40 border border-white/5 rounded-[32px] flex flex-col items-center justify-center text-center py-12">
                        {selectedProject ? (
                          <>
                            <Sparkles className={cn("w-16 h-16 text-magenta-500 mb-8", analyzing && "animate-pulse")} />
                            <button 
                              onClick={runAIAnalysis}
                              disabled={analyzing}
                              className={cn(
                                "px-10 py-5 rounded-[24px] text-[10px] font-black uppercase tracking-[0.3em] transition-all",
                                analyzing ? "bg-white/5 text-neutral-600" : "bg-magenta-500 text-white hover:scale-105"
                              )}
                            >
                              {analyzing ? 'Scanning...' : 'Execute Neural Scan'}
                            </button>
                          </>
                        ) : (
                          <div className="opacity-20 flex flex-col items-center">
                            <ZapOff className="w-12 h-12 mb-6" />
                            <p className="text-[10px] font-black uppercase tracking-widest">Lock Target in Navigator</p>
                          </div>
                        )}
                     </div>

                     <div className="space-y-4">
                        <div className="flex items-center gap-4 text-neutral-500">
                           <BarChart3 className="w-4 h-4 text-magenta-500" />
                           <span className="text-[10px] font-black uppercase tracking-widest">Health Score: {aiAnalysis?.health || '--'}%</span>
                        </div>
                        <div className="flex items-center gap-4 text-neutral-500">
                           <ListChecks className="w-4 h-4 text-magenta-500" />
                           <span className="text-[10px] font-black uppercase tracking-widest">Insights Found: {aiAnalysis?.recommendations?.length || '0'}</span>
                        </div>
                     </div>
                  </GlassCard>
                </section>

                <section className="flex-1 glass rounded-[48px] bg-black/40 border-white/[0.04] p-10 lg:p-12 overflow-y-auto custom-scroll relative">
                  <AnimatePresence mode="wait">
                    {aiAnalysis ? (
                      <motion.div key="result" {...fadeIn} className="space-y-16">
                         <div className="space-y-8">
                            <h4 className="text-5xl font-black text-white uppercase italic tracking-tighter leading-tight">Executive Summary</h4>
                            <p className="text-neutral-400 text-xl font-medium leading-relaxed uppercase tracking-tighter border-l-[3px] border-magenta-500 pl-10 py-2">{aiAnalysis.summary}</p>
                         </div>

                         <div className="space-y-10">
                            <h4 className="text-2xl font-black text-magenta-400 uppercase italic tracking-widest">Neural Recommendations</h4>
                            <div className="grid grid-cols-1 gap-6">
                               {aiAnalysis.recommendations.map((rec, i) => (
                                 <motion.div 
                                    key={i} 
                                    initial={{ x: -30, opacity: 0 }} 
                                    animate={{ x: 0, opacity: 1 }} 
                                    transition={{ delay: i * 0.12 }}
                                    className="p-8 bg-white/[0.03] border border-white/[0.08] rounded-[32px] flex items-center gap-8 group hover:bg-white/[0.06] transition-all hover:scale-[1.01]"
                                 >
                                    <div className="w-12 h-12 rounded-full bg-magenta-500/10 flex items-center justify-center text-magenta-500 font-black text-sm border border-magenta-500/20">{i+1}</div>
                                    <span className="text-sm font-bold text-neutral-200 uppercase tracking-tight">{rec}</span>
                                 </motion.div>
                               ))}
                            </div>
                         </div>

                         <div className="pt-10 opacity-20">
                            <p className="text-[9px] font-black uppercase tracking-widest italic">Timestamp: {new Date(aiAnalysis.timestamp).toLocaleString()}</p>
                         </div>
                      </motion.div>
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center text-center opacity-10">
                         <BrainCircuit className="w-40 h-40 mb-12 stroke-[0.5px]" />
                         <p className="text-2xl font-black uppercase tracking-[0.5em] italic leading-relaxed">Awaiting Neural Sequence</p>
                      </div>
                    )}
                  </AnimatePresence>
                </section>
              </div>
            </motion.div>
          )}

          {/* Settings View */}
          {currentView === VIEWS.SETTINGS && (
            <motion.div key="set" {...slideUp} className="flex-1 p-10 lg:p-24 flex flex-col gap-16 overflow-y-auto custom-scroll">
              <header className="shrink-0">
                <h2 className="text-6xl lg:text-8xl font-black text-white uppercase italic tracking-tighter leading-none">Core Station</h2>
                <p className="text-neutral-600 text-[11px] font-black uppercase tracking-[0.5em] mt-6 italic">Configuration & system telemetry</p>
              </header>
              
              <section className="glass p-10 lg:p-16 rounded-[60px] border border-white/[0.04] shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/[0.03] blur-[150px] -mr-48 -mt-48 transition-all group-hover:blur-[100px]"></div>
                <div className="relative z-10 flex flex-col gap-12">
                  <div>
                    <h3 className="text-3xl lg:text-4xl font-black text-white uppercase italic mb-4">Workspace Root</h3>
                    <p className="text-neutral-500 text-sm font-medium uppercase tracking-tight">Current scanning coordinate for project discovery</p>
                  </div>
                  <div className="flex flex-col lg:flex-row gap-6">
                    <div className="flex-1 relative group/input">
                      <FolderInput className="absolute left-8 top-1/2 -translate-y-1/2 w-6 h-6 text-neutral-700 group-focus-within/input:text-cyan-400 transition-colors" />
                      <input 
                        type="text" 
                        placeholder="Absolute System Path..." 
                        className="w-full bg-white/[0.03] border border-white/[0.06] rounded-[30px] py-7 pl-20 pr-8 text-sm font-bold focus:outline-none focus:border-cyan-500/40 transition-all focus:bg-white/[0.05]"
                        value={newRootPath}
                        onChange={(e) => setNewRootPath(e.target.value)}
                      />
                    </div>
                    <button 
                      onClick={() => api.updateConfig(newRootPath).then(refreshAll)}
                      className="px-14 py-7 bg-cyan-500 text-black rounded-[30px] text-xs font-black tracking-[0.3em] uppercase hover:scale-105 transition-all shadow-xl shadow-cyan-500/20"
                    >
                      Update Origin
                    </button>
                  </div>
                  <div className="p-10 bg-black/40 border border-white/[0.04] rounded-[32px] flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="flex flex-col gap-2 overflow-hidden">
                       <span className="text-[10px] font-black text-neutral-600 uppercase tracking-[0.3em]">Telemetry Target</span>
                       <span className="text-sm font-mono text-cyan-400 font-bold truncate">{rootPath || '/mnt/ramdisk/project-compass'}</span>
                    </div>
                    <Globe className="w-8 h-8 text-neutral-800 shrink-0" />
                  </div>
                </div>
              </section>
            </motion.div>
          )}

        </AnimatePresence>
      </main>

    </div>
  );
}
