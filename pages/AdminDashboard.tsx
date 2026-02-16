
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../services/apiService';
import { WorkLog, User, WorkStatus } from '../types';
import Calendar from '../components/Calendar';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [logs, setLogs] = useState<WorkLog[]>([]);
  const [allLogs, setAllLogs] = useState<WorkLog[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (selectedUser) {
      filterLogsForUser();
    }
  }, [selectedUser, month, year, allLogs]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      const [userData, logData] = await Promise.all([
        apiService.getAllUsers(),
        apiService.getAllLogs()
      ]);
      
      const validUsers = userData || [];
      const validLogs = logData || [];
      
      setUsers(validUsers);
      setAllLogs(validLogs);
      
      if (validUsers.length > 0) {
        setSelectedUser(validUsers[0].username);
      }
    } catch (err) {
      console.error("Dashboard failed to load:", err);
    } finally {
      setLoading(false);
    }
  };

  const filterLogsForUser = () => {
    const filtered = allLogs.filter(l => {
      const d = new Date(l.date);
      const isSameMonth = (d.getMonth() + 1) === month;
      const isSameYear = d.getFullYear() === year;
      const isSameUser = l.username.toLowerCase() === selectedUser.toLowerCase();
      return isSameUser && isSameMonth && isSameYear;
    });
    setLogs(filtered);
  };

  const stats = {
    working: logs.filter(l => l.status === WorkStatus.WORKING).length,
    leave: logs.filter(l => l.status === WorkStatus.LEAVE).length,
    holiday: logs.filter(l => l.status === WorkStatus.HOLIDAY).length,
    total: logs.length
  };

  const activityData = Array.from(
    logs.filter(l => l.status === WorkStatus.WORKING).reduce((acc, curr) => {
      acc.set(curr.activity, (acc.get(curr.activity) || 0) + 1);
      return acc;
    }, new Map<string, number>())
  ).map(([name, value]) => ({ name, value }));

  const COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Operations Monitor</h1>
          <p className="text-slate-500">Consolidated view of field staff attendance and activities.</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => navigate('/admin/users')}
            className="px-6 py-2.5 bg-emerald-600 text-white rounded-xl font-bold shadow-lg shadow-emerald-100 hover:bg-emerald-700 transition-all flex items-center"
          >
            <i className="fas fa-user-plus mr-2"></i> Add New User
          </button>
          <button
            onClick={() => navigate('/log-work')}
            className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all"
          >
            <i className="fas fa-plus mr-2"></i> Log Work
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border space-y-4">
            <h3 className="font-bold text-slate-900 uppercase text-xs tracking-wider border-b pb-2">Filter View</h3>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-2">Staff Member</label>
              <select
                className="w-full px-4 py-2 border rounded-xl outline-none"
                value={selectedUser}
                onChange={(e) => setSelectedUser(e.target.value)}
              >
                {users.map(u => <option key={u.username} value={u.username}>{u.username}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-2">Month</label>
                <select
                  className="w-full px-4 py-2 border rounded-xl outline-none text-sm"
                  value={month}
                  onChange={(e) => setMonth(Number(e.target.value))}
                >
                  {Array.from({ length: 12 }, (_, i) => (
                    <option key={i + 1} value={i + 1}>
                      {new Date(0, i).toLocaleString('default', { month: 'short' })}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-2">Year</label>
                <select
                  className="w-full px-4 py-2 border rounded-xl outline-none text-sm"
                  value={year}
                  onChange={(e) => setYear(Number(e.target.value))}
                >
                  {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border">
            <h3 className="font-bold text-slate-900 uppercase text-xs tracking-wider mb-4">Summary Stats</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-500">Working Days</span>
                <span className="font-bold text-emerald-600">{stats.working}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-500">Leaves</span>
                <span className="font-bold text-rose-600">{stats.leave}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-500">Holidays</span>
                <span className="font-bold text-amber-600">{stats.holiday}</span>
              </div>
              <div className="pt-2 border-t flex justify-between items-center">
                <span className="text-sm font-bold text-slate-900">Total Users</span>
                <button 
                  onClick={() => navigate('/admin/users')}
                  className="font-bold text-indigo-600 hover:underline"
                >
                  {users.length}
                </button>
              </div>
            </div>
          </div>

          <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-xl shadow-slate-200">
            <h3 className="font-bold uppercase text-xs tracking-widest text-slate-400 mb-4">Quick Actions</h3>
            <button
              onClick={() => navigate('/admin/users')}
              className="w-full py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all flex items-center justify-center font-bold mb-3"
            >
              <i className="fas fa-users-cog mr-2 text-indigo-400"></i> Manage Users
            </button>
            <button
              onClick={() => navigate('/reports')}
              className="w-full py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all flex items-center justify-center font-bold"
            >
              <i className="fas fa-chart-pie mr-2 text-emerald-400"></i> View Reports
            </button>
          </div>
        </div>

        <div className="lg:col-span-3 space-y-8">
          <div className="bg-white rounded-2xl shadow-sm border p-6">
            <h2 className="text-xl font-bold text-slate-900 mb-6">Attendance for {selectedUser}</h2>
            {loading ? (
                <div className="h-64 flex items-center justify-center">
                    <i className="fas fa-circle-notch fa-spin text-3xl text-indigo-600"></i>
                </div>
            ) : (
                <Calendar logs={logs} year={year} month={month} />
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white p-6 rounded-2xl shadow-sm border">
              <h3 className="font-bold text-slate-900 mb-6">Activity Breakdown</h3>
              <div className="h-64">
                {activityData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={activityData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
                        <Tooltip 
                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        />
                        <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                            {activityData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="h-full flex items-center justify-center text-slate-400 text-sm italic">
                        No activity data recorded this month
                    </div>
                )}
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border overflow-hidden">
                <h3 className="font-bold text-slate-900 mb-4">Latest Logs</h3>
                <div className="space-y-3 overflow-y-auto max-h-64">
                    {logs.length > 0 ? logs.slice().sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((l, i) => (
                        <div key={i} className="p-3 bg-slate-50 rounded-xl border-l-4 border-indigo-500">
                            <div className="flex justify-between">
                                <span className="text-xs font-bold text-indigo-700">{new Date(l.date).toLocaleDateString()}</span>
                                <span className="text-[10px] uppercase font-bold text-slate-400">{l.village}</span>
                            </div>
                            <div className="text-sm font-semibold text-slate-900 mt-1">{l.activity}</div>
                        </div>
                    )) : (
                        <div className="text-center py-10 text-slate-400 text-sm">No recent logs.</div>
                    )}
                </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
