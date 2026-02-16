
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../App.tsx';
import { apiService } from '../services/apiService.ts';
import { geminiService } from '../services/geminiService.ts';
import { WorkLog, WorkStatus } from '../types.ts';
import Calendar from '../components/Calendar.tsx';

const StaffDashboard: React.FC = () => {
  const { auth } = useAuth();
  const navigate = useNavigate();
  const [logs, setLogs] = useState<WorkLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [aiAnalysis, setAiAnalysis] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1);
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());

  useEffect(() => {
    fetchLogs();
  }, [currentMonth, currentYear]);

  const fetchLogs = async () => {
    if (!auth.user) return;
    try {
      setLoading(true);
      const data = await apiService.getAttendance(auth.user.username, currentMonth, currentYear);
      setLogs(data || []);
    } catch (err) {
      console.error("Failed to fetch logs:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAiAnalysis = async () => {
    if (!logs.length || !auth.user) return;
    setAnalyzing(true);
    const result = await geminiService.analyzeWorkLogs(logs, auth.user.username);
    setAiAnalysis(result);
    setAnalyzing(false);
  };

  const stats = {
    working: logs.filter(l => l.status === WorkStatus.WORKING).length,
    leave: logs.filter(l => l.status === WorkStatus.LEAVE).length,
    holiday: logs.filter(l => l.status === WorkStatus.HOLIDAY).length,
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Welcome, {auth.user?.username}</h1>
          <p className="text-slate-500">Track your attendance and manage work logs here.</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => navigate('/log-work')}
            className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all"
          >
            <i className="fas fa-plus mr-2"></i> Log Work
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-2xl">
              <div className="text-sm font-bold text-emerald-700 uppercase">Working</div>
              <div className="text-2xl font-black text-emerald-900">{stats.working}</div>
            </div>
            <div className="bg-rose-50 border border-rose-100 p-4 rounded-2xl">
              <div className="text-sm font-bold text-rose-700 uppercase">Leave</div>
              <div className="text-2xl font-black text-rose-900">{stats.leave}</div>
            </div>
            <div className="bg-amber-50 border border-amber-100 p-4 rounded-2xl">
              <div className="text-sm font-bold text-amber-700 uppercase">Holiday</div>
              <div className="text-2xl font-black text-amber-900">{stats.holiday}</div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-slate-900">Calendar View</h2>
              <div className="flex space-x-2">
                <button 
                    onClick={() => {
                        if (currentMonth === 1) { setCurrentMonth(12); setCurrentYear(y => y - 1); }
                        else setCurrentMonth(m => m - 1);
                    }}
                    className="p-2 hover:bg-slate-100 rounded-lg"
                >
                  <i className="fas fa-chevron-left text-slate-400"></i>
                </button>
                <span className="font-bold text-slate-700 min-w-[120px] text-center">
                  {new Date(currentYear, currentMonth - 1).toLocaleString('default', { month: 'long', year: 'numeric' })}
                </span>
                <button 
                    onClick={() => {
                        if (currentMonth === 12) { setCurrentMonth(1); setCurrentYear(y => y + 1); }
                        else setCurrentMonth(m => m + 1);
                    }}
                    className="p-2 hover:bg-slate-100 rounded-lg"
                >
                  <i className="fas fa-chevron-right text-slate-400"></i>
                </button>
              </div>
            </div>
            {loading ? (
              <div className="h-64 flex items-center justify-center">
                <i className="fas fa-circle-notch fa-spin text-4xl text-indigo-600"></i>
              </div>
            ) : (
              <Calendar 
                logs={logs} 
                year={currentYear} 
                month={currentMonth} 
                onDateClick={(d) => navigate('/log-work', { state: { initialDate: d.toISOString().split('T')[0] } })} 
              />
            )}
          </div>
        </div>

        <div className="space-y-8">
          <div className="bg-white p-6 rounded-2xl shadow-sm border">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Quick Links</h3>
            <div className="space-y-2">
              <button 
                onClick={() => navigate('/reports')}
                className="w-full text-left px-4 py-3 bg-slate-50 hover:bg-indigo-50 rounded-xl flex items-center group transition-colors"
              >
                <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-lg flex items-center justify-center mr-3 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                  <i className="fas fa-file-alt"></i>
                </div>
                <div>
                  <div className="font-bold text-slate-900">Workdone Report</div>
                  <div className="text-xs text-slate-500">Generate monthly PDF</div>
                </div>
              </button>
            </div>
          </div>

          <div className="bg-indigo-900 text-white p-6 rounded-2xl shadow-xl shadow-indigo-200 overflow-hidden relative">
            <div className="absolute top-0 right-0 p-4 opacity-10">
                <i className="fas fa-brain text-8xl"></i>
            </div>
            <h3 className="text-lg font-bold mb-4 flex items-center">
                <i className="fas fa-magic mr-2 text-indigo-400"></i>
                AI Performance Insights
            </h3>
            {aiAnalysis ? (
              <div className="text-sm leading-relaxed text-indigo-100 bg-white/10 p-4 rounded-xl backdrop-blur-sm">
                {aiAnalysis}
                <button 
                    onClick={() => setAiAnalysis('')}
                    className="mt-4 block text-xs font-bold uppercase tracking-wider text-indigo-300 hover:text-white"
                >
                    Refresh Analysis
                </button>
              </div>
            ) : (
              <div className="text-center py-6">
                <p className="text-sm text-indigo-200 mb-6">Let Gemini AI analyze your logs to provide personalized feedback and suggestions.</p>
                <button
                  disabled={analyzing || !logs.length}
                  onClick={handleAiAnalysis}
                  className={`px-6 py-2 bg-white text-indigo-900 rounded-lg font-bold text-sm hover:bg-indigo-50 transition-colors ${analyzing || !logs.length ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {analyzing ? <><i className="fas fa-spinner fa-spin mr-2"></i> Analyzing...</> : 'Analyze My Work'}
                </button>
                {!logs.length && <p className="mt-2 text-[10px] text-indigo-300 italic">No logs available for this month to analyze.</p>}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StaffDashboard;
