import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../App';
import { apiService } from '../services/apiService';
import { WorkStatus, WorkLog } from '../types';

const LogWorkForm: React.FC = () => {
  const { auth } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as { initialDate?: string };

  const [formData, setFormData] = useState<Partial<WorkLog>>({
    date: state?.initialDate || new Date().toISOString().split('T')[0],
    username: auth.user?.username || '',
    village: '',
    activity: '',
    workDetails: '',
    status: WorkStatus.WORKING,
    reason: '',
    location: '',
    photoUrl: ''
  });

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(false);

  useEffect(() => {
    // Capture GPS location on mount
    if ("geolocation" in navigator) {
      setGettingLocation(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const locStr = `${position.coords.latitude}, ${position.coords.longitude}`;
          setFormData(prev => ({ ...prev, location: locStr }));
          setGettingLocation(false);
        },
        (error) => {
          console.warn("Location access denied or unavailable:", error);
          setGettingLocation(false);
        }
      );
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.status !== WorkStatus.WORKING && !formData.reason) {
      alert("Please provide a reason for Leave/Holiday");
      return;
    }

    setLoading(true);
    // Ensure all spreadsheet fields are present
    const submissionData: WorkLog = {
      date: formData.date || '',
      username: formData.username || '',
      village: formData.status === WorkStatus.WORKING ? (formData.village || '-') : '-',
      activity: formData.status === WorkStatus.WORKING ? (formData.activity || '-') : '-',
      workDetails: formData.status === WorkStatus.WORKING ? (formData.workDetails || '-') : '-',
      status: formData.status as WorkStatus,
      reason: formData.reason || '-',
      location: formData.location || 'Not Captured',
      photoUrl: formData.photoUrl || '-',
      timestamp: new Date().toISOString()
    };

    const isSuccess = await apiService.logWork(submissionData);
    setLoading(false);

    if (isSuccess) {
      setSuccess(true);
      setTimeout(() => navigate('/dashboard'), 2000);
    } else {
      alert("Error logging work. Please check your connection and try again.");
    }
  };

  if (success) {
    return (
      <div className="max-w-md mx-auto mt-20 p-10 bg-white rounded-3xl shadow-xl border text-center">
        <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 text-4xl">
          <i className="fas fa-check"></i>
        </div>
        <h2 className="text-2xl font-bold text-slate-900">Work Logged Successfully!</h2>
        <p className="text-slate-500 mt-2">Redirecting you back to dashboard...</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <div className="bg-white rounded-3xl shadow-xl border overflow-hidden">
        <div className="bg-indigo-600 px-8 py-6 text-white flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">New Work Entry</h1>
            <p className="opacity-80">Log your daily activities and field movements.</p>
          </div>
          <div className="text-right">
             <div className={`text-[10px] font-bold px-2 py-1 rounded bg-white/20 flex items-center ${gettingLocation ? 'animate-pulse' : ''}`}>
               <i className={`fas fa-map-marker-alt mr-1 ${formData.location ? 'text-emerald-400' : 'text-rose-300'}`}></i>
               {gettingLocation ? 'Locating...' : (formData.location ? 'Location Ready' : 'GPS Off')}
             </div>
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wide">Work Status</label>
              <div className="flex space-x-2">
                {[WorkStatus.WORKING, WorkStatus.LEAVE, WorkStatus.HOLIDAY].map(s => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setFormData(f => ({ ...f, status: s }))}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all border-2 ${
                      formData.status === s 
                      ? (s === WorkStatus.WORKING ? 'bg-emerald-500 border-emerald-500 text-white' : s === WorkStatus.LEAVE ? 'bg-rose-500 border-rose-500 text-white' : 'bg-amber-500 border-amber-500 text-white')
                      : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wide">Date</label>
              <input
                type="date"
                required
                className="w-full px-4 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                value={formData.date}
                onChange={(e) => setFormData(f => ({ ...f, date: e.target.value }))}
              />
            </div>
          </div>

          {formData.status === WorkStatus.WORKING ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wide">Village Name</label>
                  <input
                    type="text"
                    required
                    className="w-full px-4 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="E.g. Tandur"
                    value={formData.village}
                    onChange={(e) => setFormData(f => ({ ...f, village: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wide">Activity Type</label>
                  <input
                    type="text"
                    required
                    className="w-full px-4 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="E.g. Soil Testing"
                    value={formData.activity}
                    onChange={(e) => setFormData(f => ({ ...f, activity: e.target.value }))}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wide">Detailed Description</label>
                <textarea
                  required
                  rows={4}
                  className="w-full px-4 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Describe your work done today in detail..."
                  value={formData.workDetails}
                  onChange={(e) => setFormData(f => ({ ...f, workDetails: e.target.value }))}
                ></textarea>
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wide">Reason for {formData.status}</label>
              <textarea
                required
                rows={3}
                className="w-full px-4 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder={`Please explain why you are taking a ${formData.status}...`}
                value={formData.reason}
                onChange={(e) => setFormData(f => ({ ...f, reason: e.target.value }))}
              ></textarea>
            </div>
          )}

          <div className="pt-6 border-t flex space-x-4">
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="flex-1 py-3 px-4 border border-slate-300 rounded-xl text-slate-600 font-bold hover:bg-slate-50 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`flex-[2] py-3 px-4 bg-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all ${loading ? 'opacity-70' : ''}`}
            >
              {loading ? <><i className="fas fa-spinner fa-spin mr-2"></i> Submitting...</> : 'Submit Log'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LogWorkForm;