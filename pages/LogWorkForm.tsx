import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../App';
import { apiService } from '../services/apiService';
import { WorkStatus, WorkLog } from '../types';
import Calendar from '../components/Calendar';
import { ArrowLeft, CalendarDays } from 'lucide-react';

const LogWorkForm: React.FC = () => {
  const { auth } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as { initialDate?: string };

  const [view, setView] = useState<'calendar' | 'form'>('calendar');
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1);
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [isEditing, setIsEditing] = useState(false);

  const getTodayLocalDateStr = () => {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const [formData, setFormData] = useState<Partial<WorkLog>>({
    date: state?.initialDate || getTodayLocalDateStr(),
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
  const [existingLogs, setExistingLogs] = useState<WorkLog[]>([]);
  const [fetchingLogs, setFetchingLogs] = useState(true);

  // Load state and location if provided
  useEffect(() => {
    if (state?.initialDate) {
      const checkAndLoadStateDate = async () => {
        const formattedTarget = getFormattedDate(state.initialDate);
        if (formattedTarget) {
          const data = await apiService.getAllLogs();
          const userLogs = data.filter((l: WorkLog) => l.username.toLowerCase() === auth.user?.username.toLowerCase());
          setExistingLogs(userLogs);
          const found = [...userLogs].reverse().find((l: WorkLog) => getFormattedDate(l.date) === formattedTarget);
          if (found) {
            setFormData({
              date: formattedTarget,
              username: auth.user?.username || '',
              village: found.village || '',
              activity: found.activity || '',
              workDetails: found.workDetails || '',
              status: found.status || WorkStatus.WORKING,
              reason: found.reason || '',
              location: found.location || '',
              photoUrl: found.photoUrl || ''
            });
            setIsEditing(true);
          } else {
            setFormData(prev => ({ ...prev, date: formattedTarget }));
            setIsEditing(false);
          }
          setView('form');
        }
      };
      checkAndLoadStateDate();
    }
  }, [state, auth.user]);

  const loadLogs = async () => {
    if (!auth.user) return;
    try {
      setFetchingLogs(true);
      const data = await apiService.getAllLogs();
      const userLogs = data.filter((l: WorkLog) => l.username.toLowerCase() === auth.user?.username.toLowerCase());
      setExistingLogs(userLogs);
    } catch (err) {
      console.error("Error loading existing logs:", err);
    } finally {
      setFetchingLogs(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, [auth.user]);

  const getFormattedDate = (dateStr?: string) => {
    if (!dateStr) return '';
    const match = String(dateStr).trim().match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
    if (match) {
      const [_, y, m, d] = match;
      return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
    }
    return dateStr;
  };

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

  const handleDateClick = (d: Date) => {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const formattedDate = `${yyyy}-${mm}-${dd}`;

    const exLog = [...existingLogs].reverse().find(log => getFormattedDate(log.date) === formattedDate);

    if (exLog) {
      setFormData({
        date: formattedDate,
        username: auth.user?.username || '',
        village: exLog.village || '',
        activity: exLog.activity || '',
        workDetails: exLog.workDetails || '',
        status: exLog.status || WorkStatus.WORKING,
        reason: exLog.reason || '',
        location: exLog.location || formData.location || '',
        photoUrl: exLog.photoUrl || ''
      });
      setIsEditing(true);
    } else {
      setFormData({
        date: formattedDate,
        username: auth.user?.username || '',
        village: '',
        activity: '',
        workDetails: '',
        status: WorkStatus.WORKING,
        reason: '',
        location: formData.location || '',
        photoUrl: ''
      });
      setIsEditing(false);
    }
    setView('form');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.status !== WorkStatus.WORKING && !formData.reason) {
      alert("Please provide a reason for Leave/Holiday");
      return;
    }

    setLoading(true);
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
      await loadLogs();
      setTimeout(() => {
        setSuccess(false);
        setView('calendar');
      }, 2000);
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
        <p className="text-slate-500 mt-2">Returning to your calendar view...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {view === 'calendar' ? (
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 font-sans tracking-tight">Daily Work Logs & Attendance</h1>
              <p className="text-slate-500">Select any day on the calendar below to log your work, report details, or edit your entry.</p>
            </div>
            
            <div className="flex space-x-2 bg-slate-100 p-1 rounded-xl shadow-sm">
              <button 
                onClick={() => {
                  if (currentMonth === 1) { setCurrentMonth(12); setCurrentYear(y => y - 1); }
                  else setCurrentMonth(m => m - 1);
                }}
                className="p-2 hover:bg-white rounded-lg transition-all"
              >
                <i className="fas fa-chevron-left text-slate-500"></i>
              </button>
              <span className="font-bold text-slate-700 min-w-[130px] text-center py-1.5 px-3 select-none">
                {new Date(currentYear, currentMonth - 1).toLocaleString('default', { month: 'long', year: 'numeric' })}
              </span>
              <button 
                onClick={() => {
                  if (currentMonth === 12) { setCurrentMonth(1); setCurrentYear(y => y + 1); }
                  else setCurrentMonth(m => m + 1);
                }}
                className="p-2 hover:bg-white rounded-lg transition-all"
              >
                <i className="fas fa-chevron-right text-slate-500"></i>
              </button>
            </div>
          </div>

          <div className="bg-white rounded-3xl shadow-xl border overflow-hidden p-6">
            {fetchingLogs ? (
              <div className="h-96 flex flex-col items-center justify-center space-y-4">
                <i className="fas fa-circle-notch fa-spin text-4xl text-indigo-600"></i>
                <p className="text-slate-500 font-medium font-sans">Fetching your attendance details...</p>
              </div>
            ) : (
              <Calendar 
                logs={existingLogs} 
                year={currentYear} 
                month={currentMonth} 
                onDateClick={handleDateClick} 
              />
            )}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-3xl shadow-xl border overflow-hidden max-w-2xl mx-auto">
          <div className="bg-indigo-600 px-8 py-6 text-white shadow-md">
            <button 
              type="button" 
              onClick={() => setView('calendar')}
              className="flex items-center text-white/90 hover:text-white font-bold text-sm mb-4 transition-all"
            >
              <ArrowLeft className="h-4 w-4 mr-2" /> Back to Calendar
            </button>
            
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold">
                  {isEditing ? 'Update Work Entry' : 'New Work Entry'}
                </h1>
                <p className="opacity-80 text-sm mt-1">
                  {isEditing ? `Modifying log for ${formData.date}` : `Logging details for ${formData.date}`}
                </p>
              </div>
              <div className="text-right">
                <div className={`text-[10px] uppercase font-bold px-3 py-1.5 rounded-full bg-white/20 flex items-center ${gettingLocation ? 'animate-pulse' : ''}`}>
                  <i className={`fas fa-map-marker-alt mr-1.5 ${formData.location ? 'text-emerald-400' : 'text-rose-300'}`}></i>
                  {gettingLocation ? 'Locating...' : (formData.location ? 'Location Ready' : 'GPS Off')}
                </div>
              </div>
            </div>
          </div>
          
          <form onSubmit={handleSubmit} className="p-8 space-y-6">
            {isEditing && (
              <div className="p-4 bg-indigo-50 border border-indigo-150 rounded-2xl text-indigo-850 text-sm flex items-start gap-3 shadow-inner">
                <CalendarDays className="h-5 w-5 text-indigo-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-bold">Overwriting Existing Log</p>
                  <p className="text-xs text-indigo-600 mt-1">
                    An attendance/work entry already exists for this date. Saving this form will replace your old submission for the monthly report.
                  </p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Work Status</label>
                <div className="flex space-x-2">
                  {[WorkStatus.WORKING, WorkStatus.LEAVE, WorkStatus.HOLIDAY].map(s => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setFormData(f => ({ ...f, status: s }))}
                      className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all border-2 ${
                        formData.status === s 
                        ? (s === WorkStatus.WORKING ? 'bg-emerald-500 border-emerald-500 text-white shadow-md' : s === WorkStatus.LEAVE ? 'bg-rose-500 border-rose-500 text-white shadow-md' : 'bg-amber-500 border-amber-500 text-white shadow-md')
                        : 'bg-slate-50 border-slate-200 text-slate-500 hover:border-slate-300'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Date</label>
                <input
                  type="date"
                  required
                  disabled
                  className="w-full px-4 py-2.5 border rounded-xl outline-none bg-slate-100 text-slate-500 font-medium cursor-not-allowed border-slate-200 shadow-sm"
                  value={formData.date}
                />
              </div>
            </div>

            {formData.status === WorkStatus.WORKING ? (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Village Name</label>
                    <input
                      type="text"
                      required
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium text-slate-800"
                      placeholder="E.g. Vikarabad"
                      value={formData.village}
                      onChange={(e) => setFormData(f => ({ ...f, village: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Activity Type</label>
                    <input
                      type="text"
                      required
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium text-slate-800"
                      placeholder="E.g. Farmer Meeting"
                      value={formData.activity}
                      onChange={(e) => setFormData(f => ({ ...f, activity: e.target.value }))}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Detailed Description</label>
                  <textarea
                    required
                    rows={4}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium text-slate-800"
                    placeholder="Describe your work done today in detail..."
                    value={formData.workDetails}
                    onChange={(e) => setFormData(f => ({ ...f, workDetails: e.target.value }))}
                  ></textarea>
                </div>
              </div>
            ) : (
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Reason for {formData.status}</label>
                <textarea
                  required
                  rows={3}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium text-slate-800"
                  placeholder={`Provide a short explanation why you are selecting ${formData.status}...`}
                  value={formData.reason}
                  onChange={(e) => setFormData(f => ({ ...f, reason: e.target.value }))}
                ></textarea>
              </div>
            )}

            <div className="pt-6 border-t flex space-x-4">
              <button
                type="button"
                onClick={() => setView('calendar')}
                className="flex-1 py-3 px-4 border border-slate-300 rounded-xl text-slate-600 font-bold hover:bg-slate-50 transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className={`flex-[2] py-3 px-4 bg-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all ${
                  loading ? 'opacity-50 cursor-not-allowed bg-indigo-400 shadow-none' : ''
                }`}
              >
                {loading ? (
                  <><i className="fas fa-spinner fa-spin mr-2"></i> Saving...</>
                ) : (
                  'Submit Logs'
                )}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default LogWorkForm;
