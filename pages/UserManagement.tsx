
import React, { useState, useEffect } from 'react';
import { apiService } from '../services/apiService.ts';
import { User, Role } from '../types.ts';

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [newUser, setNewUser] = useState<Partial<User>>({
    username: '',
    password: '',
    role: Role.CRP // Defaulting to the most common field role
  });
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [showAdd, setShowAdd] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setFetching(true);
    const data = await apiService.getAllUsers();
    setUsers(data);
    setFetching(false);
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUser.username || !newUser.password) {
      alert("Please fill in all fields.");
      return;
    }
    
    setLoading(true);
    const success = await apiService.addUser(newUser as User);
    setLoading(false);
    
    if (success) {
      alert("User added successfully to the 'Users' sheet!");
      setNewUser({ username: '', password: '', role: Role.CRP });
      setShowAdd(false);
      fetchUsers();
    } else {
      alert("Failed to add user. Please check your connection.");
    }
  };

  const getRoleBadgeClass = (role: string) => {
    switch (role) {
      case Role.ADMIN: return 'bg-purple-100 text-purple-700 border-purple-200';
      case Role.CLUSTER_FRP: return 'bg-blue-100 text-blue-700 border-blue-200';
      case Role.FRP: return 'bg-indigo-100 text-indigo-700 border-indigo-200';
      case Role.CRP: return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case Role.PROJECT_STAFF: return 'bg-amber-100 text-amber-700 border-amber-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">User Management</h1>
          <p className="text-slate-500">Add staff accounts and manage system access levels.</p>
        </div>
        <button
          onClick={() => setShowAdd(!showAdd)}
          className={`px-6 py-3 rounded-xl font-bold transition-all flex items-center shadow-lg ${
            showAdd ? 'bg-slate-200 text-slate-700' : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-200'
          }`}
        >
          <i className={`fas ${showAdd ? 'fa-times' : 'fa-user-plus'} mr-2`}></i> 
          {showAdd ? 'Cancel' : 'Register New Staff'}
        </button>
      </div>

      {/* Stats Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        {Object.values(Role).map(role => (
          <div key={role} className="bg-white p-4 rounded-2xl border shadow-sm">
            <div className="text-[10px] font-bold text-slate-400 uppercase mb-1">{role}</div>
            <div className="text-xl font-bold text-slate-900">
              {users.filter(u => u.role === role).length}
            </div>
          </div>
        ))}
      </div>

      {showAdd && (
        <div className="bg-white p-8 rounded-3xl shadow-xl border border-indigo-100 mb-8 animate-fadeIn">
          <div className="flex items-center mb-6">
            <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-lg flex items-center justify-center mr-3">
               <i className="fas fa-id-card"></i>
            </div>
            <h2 className="text-xl font-bold text-slate-800">Create New Staff Account</h2>
          </div>
          
          <form onSubmit={handleAddUser} className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-2 tracking-wider">Username / Full Name</label>
              <input
                type="text"
                required
                placeholder="e.g. Ramesh Kumar"
                className="w-full px-4 py-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50"
                value={newUser.username}
                onChange={(e) => setNewUser(u => ({ ...u, username: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-2 tracking-wider">Login Password</label>
              <input
                type="password"
                required
                placeholder="Assign a password"
                className="w-full px-4 py-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50"
                value={newUser.password}
                onChange={(e) => setNewUser(u => ({ ...u, password: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-2 tracking-wider">Staff Category</label>
              <select
                className="w-full px-4 py-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50 font-medium"
                value={newUser.role}
                onChange={(e) => setNewUser(u => ({ ...u, role: e.target.value as Role }))}
              >
                {Object.values(Role).map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="py-3 px-4 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 shadow-lg shadow-emerald-100 transition-all"
            >
              {loading ? <><i className="fas fa-spinner fa-spin mr-2"></i> Adding...</> : 'Save Account'}
            </button>
          </form>
          <p className="mt-4 text-xs text-slate-400 italic">
            Note: New accounts will be immediately added to the "Users" tab in your Google Spreadsheet.
          </p>
        </div>
      )}

      <div className="bg-white rounded-3xl shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 border-b">
                <th className="px-6 py-5 text-xs font-bold text-slate-400 uppercase tracking-widest">Username</th>
                <th className="px-6 py-5 text-xs font-bold text-slate-400 uppercase tracking-widest">Staff Role</th>
                <th className="px-6 py-5 text-xs font-bold text-slate-400 uppercase tracking-widest">Created On</th>
                <th className="px-6 py-5 text-xs font-bold text-slate-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {fetching ? (
                <tr>
                  <td colSpan={4} className="py-20 text-center">
                    <i className="fas fa-circle-notch fa-spin text-3xl text-indigo-600"></i>
                    <p className="mt-2 text-slate-500 text-sm">Fetching user list from Spreadsheet...</p>
                  </td>
                </tr>
              ) : users.length > 0 ? (
                users.map((user, i) => (
                  <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 mr-3 text-xs font-bold">
                          {user.username.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-sm font-bold text-slate-900">{user.username}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${getRoleBadgeClass(user.role)}`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500 font-medium">
                      {user.createdDate ? new Date(user.createdDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '---'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="text-slate-300 hover:text-indigo-600 p-2 transition-colors mr-2">
                        <i className="fas fa-edit"></i>
                      </button>
                      <button className="text-slate-300 hover:text-rose-500 p-2 transition-colors">
                        <i className="fas fa-trash"></i>
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="py-20 text-center text-slate-400 text-sm italic">
                    No users found in the spreadsheet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default UserManagement;
