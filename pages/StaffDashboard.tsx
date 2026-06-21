import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../App';
import { apiService } from '../services/apiService';
import { geminiService } from '../services/geminiService';
import { WorkLog, WorkStatus } from '../types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Activity, MapPin, Calendar, FileText, CheckCircle2, ChevronLeft, ChevronRight, TrendingUp } from 'lucide-react';

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

  const workingLogs = logs.filter(l => l.status === WorkStatus.WORKING);
  
  const activityMap = new Map<string, number>();
  workingLogs.forEach(l => {
    if (l.activity && l.activity !== '-') {
      const act = l.activity.trim();
      activityMap.set(act, (activityMap.get(act) || 0) + 1);
    }
  });
  
  const activityData = Array.from(activityMap.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);

  const villageMap = new Map<string, number>();
  workingLogs.forEach(l => {
    if (l.village && l.village !== '-') {
      const vil = l.village.trim().toUpperCase();
      villageMap.set(vil, (villageMap.get(vil) || 0) + 1);
    }
  });
  
  const villageData = Array.from(villageMap.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);

  const COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6'];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 font-sans tracking-tight">Welcome, {auth.user?.username}</h1>
          <p className="text-slate-500">View performance insights, tracking reports, and activity statistics.</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => navigate('/log-work')}
            className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center"
          >
            <Calendar className="mr-2 h-4 w-4" /> Go to Log Work
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-2xl shadow-sm">
              <div className="text-xs font-bold text-emerald-700 uppercase tracking-wider mb-1">Working Days</div>
              <div className="text-3xl font-black text-emerald-900">{stats.working}</div>
            </div>
            <div className="bg-rose-50 border border-rose-100 p-4 rounded-2xl shadow-sm">
              <div className="text-xs font-bold text-rose-700 uppercase tracking-wider mb-1">Leaves Taken</div>
              <div className="text-3xl font-black text-rose-900">{stats.leave}</div>
            </div>
            <div className="bg-amber-50 border border-amber-100 p-4 rounded-2xl shadow-sm">
              <div className="text-xs font-bold text-amber-700 uppercase tracking-wider mb-1">Holidays</div>
              <div className="text-3xl font-black text-amber-900">{stats.holiday}</div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border p-6">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-6 gap-4 border-b pb-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900 flex items-center font-sans tracking-tight">
                  <Activity className="mr-2 h-5 w-5 text-indigo-600" /> Activity Analytics
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">Performance and work logs breakdown for selected period.</p>
              </div>
              
              <div className="flex items-center space-x-1.5 self-start sm:self-auto bg-slate-50 border border-slate-200 p-1 rounded-xl">
                <button 
                  onClick={() => {
                    if (currentMonth === 1) { setCurrentMonth(12); setCurrentYear(y => y - 1); }
                    else setCurrentMonth(m => m - 1);
                  }}
                  className="p-1.5 hover:bg-white rounded-lg transition-all"
                >
                  <ChevronLeft className="h-4 w-4 text-slate-500" />
                </button>
                <span className="font-bold text-slate-700 text-xs min-w-[110px] text-center select-none">
                  {new Date(currentYear, currentMonth - 1).toLocaleString('default', { month: 'short', year: 'numeric' }).toUpperCase()}
                </span>
                <button 
                  onClick={() => {
                    if (currentMonth === 12) { setCurrentMonth(1); setCurrentYear(y => y + 1); }
                    else setCurrentMonth(m => m + 1);
                  }}
                  className="p-1.5 hover:bg-white rounded-lg transition-all"
                >
                  <ChevronRight className="h-4 w-4 text-slate-500" />
                </button>
              </div>
            </div>

            {loading ? (
              <div className="h-64 flex flex-col items-center justify-center space-y-3">
                <i className="fas fa-circle-notch fa-spin text-3xl text-indigo-600"></i>
                <p className="text-xs text-slate-500 font-medium">Analyzing telemetry...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider mb-4 flex items-center">
                    <TrendingUp className="mr-2 h-4 w-4 text-emerald-500" /> Active Tasks Frequency
                  </h3>
                  <div className="h-48">
                    {activityData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={activityData} layout="vertical" margin={{ left: -10, right: 10, top: 0, bottom: 0 }}>
                          <XAxis type="number" hide />
                          <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#64748b', fontWeight: 'bold' }} width={80} />
                          <Tooltip 
                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: 11 }}
                          />
                          <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={12}>
                            {activityData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-full flex items-center justify-center text-slate-400 text-xs italic border border-dashed rounded-xl">
                        No activity data recorded this month
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider flex items-center">
                    <MapPin className="mr-2 h-4 w-4 text-rose-500" /> Visited Villages Summary
                  </h3>
                  {villageData.length > 0 ? (
                    <div className="space-y-3">
                      {villageData.map((v, i) => {
                        const totalVisits = villageData.reduce((acc, curr) => acc + curr.value, 0);
                        const percentage = Math.round((v.value / (totalVisits || 1)) * 100);
                        return (
                          <div key={v.name} className="space-y-1">
                            <div className="flex justify-between text-xs">
                              <span className="font-bold text-slate-700">{v.name}</span>
                              <span className="text-slate-500">{v.value} {v.value === 1 ? 'visit' : 'visits'} ({percentage}%)</span>
                            </div>
                            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                              <div 
                                className="h-full rounded-full transition-all duration-500"
                                style={{ width: `${percentage}%`, backgroundColor: COLORS[i % COLORS.length] }}
                              ></div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="h-44 flex items-center justify-center text-slate-400 text-xs italic border border-dashed rounded-xl">
                      No village visit frequency record
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl shadow-sm border p-6">
            <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center font-sans tracking-tight">
              <CheckCircle2 className="mr-2 h-5 w-5 text-indigo-600" /> Recent Activity Submissions
            </h2>
            {loading ? (
              <div className="text-center py-8 text-slate-400 text-xs">Loading submissions...</div>
            ) : workingLogs.length > 0 ? (
              <div className="divide-y max-h-80 overflow-y-auto pr-2 space-y-4">
                {workingLogs.slice(0, 5).map((log, index) => (
                  <div key={index} className="pt-4 first:pt-0 flex justify-between items-start gap-4">
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-100 text-indigo-700 border border-slate-200">
                          {log.village}
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium">
                          {new Date(log.date).toLocaleDateString('en-GB')}
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-slate-800">{log.activity}</h4>
                      <p className="text-xs text-slate-500 leading-relaxed font-sans line-clamp-2">{log.workDetails}</p>
                    </div>
                    <div className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-100">
                      SUBMITTED
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-10 text-slate-400 text-xs italic border border-dashed rounded-xl">
                No working records reported for this period
              </div>
            )}
          </div>
        </div>

        <div className="space-y-8">
          <div className="bg-white p-6 rounded-2xl shadow-sm border">
            <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center font-sans tracking-tight">
              <FileText className="mr-2 h-5 w-5 text-indigo-500" /> Quick Reports
            </h3>
            <div className="space-y-2">
              <button 
                onClick={() => navigate('/reports')}
                className="w-full text-left px-4 py-3 bg-slate-50 hover:bg-indigo-50 rounded-xl flex items-center group transition-colors border border-slate-100 hover:border-indigo-100"
              >
                <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-lg flex items-center justify-center mr-3 group-hover:bg-indigo-600 group-hover:text-white transition-colors flex-shrink-0">
                  <i className="fas fa-file-alt"></i>
                </div>
                <div>
                  <div className="font-bold text-slate-900 text-sm">Monthly Work Done</div>
                  <div className="text-xs text-slate-500">Generate pdf submission report</div>
                </div>
              </button>
            </div>
          </div>

          <div className="bg-indigo-900 text-white p-6 rounded-2xl shadow-xl shadow-indigo-200 overflow-hidden relative">
            <div className="absolute top-0 right-0 p-4 opacity-10">
                <i className="fas fa-brain text-8xl"></i>
            </div>
            <h3 className="text-lg font-bold mb-4 flex items-center font-sans tracking-tight">
                <i className="fas fa-magic mr-2 text-indigo-400 animate-pulse"></i>
                AI Performance Insights
            </h3>
            {aiAnalysis ? (
              <div className="text-sm leading-relaxed text-indigo-100 bg-white/10 p-4 rounded-xl backdrop-blur-sm">
                {aiAnalysis}
                <button 
                    onClick={() => setAiAnalysis('')}
                    className="mt-4 block text-xs font-bold uppercase tracking-wider text-indigo-300 hover:text-white transition-all underline"
                >
                    Refresh Analysis
                </button>
              </div>
            ) : (
              <div className="text-center py-6">
                <p className="text-sm text-indigo-200 mb-6 font-sans">Let Gemini AI analyze your active logs to provide personalized feedback and stats overview.</p>
                <button
                  disabled={analyzing || !logs.length}
                  onClick={handleAiAnalysis}
                  className={`px-6 py-2.5 bg-white text-indigo-900 rounded-xl font-bold text-sm hover:bg-slate-50 transition-colors shadow-lg ${analyzing || !logs.length ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {analyzing ? <><i className="fas fa-spinner fa-spin mr-2"></i> Analyzing...</> : 'Analyze Performance'}
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
