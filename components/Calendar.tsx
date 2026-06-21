import React from 'react';
import { WorkLog, WorkStatus } from '../types';

interface CalendarProps {
  logs: WorkLog[];
  year: number;
  month: number;
  onDateClick?: (date: Date) => void;
}

const Calendar: React.FC<CalendarProps> = ({ logs, year, month, onDateClick }) => {
  const daysInMonth = new Date(year, month, 0).getDate();
  const firstDayOfMonth = new Date(year, month - 1, 1).getDay();
  
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const blanks = Array.from({ length: firstDayOfMonth }, (_, i) => i);

  const getLogForDay = (day: number) => {
    const targetDateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return [...logs].reverse().find(l => {
      if (!l.date) return false;
      const str = String(l.date).trim();
      const match = str.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
      if (match) {
        const [_, y, m, d] = match;
        const formatted = `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
        return formatted === targetDateStr;
      }
      return false;
    });
  };

  const getStatusColor = (status?: WorkStatus) => {
    switch (status) {
      case WorkStatus.WORKING: return 'bg-emerald-500 text-white';
      case WorkStatus.LEAVE: return 'bg-rose-500 text-white';
      case WorkStatus.HOLIDAY: return 'bg-amber-500 text-white';
      default: return 'bg-white border text-slate-400';
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
      <div className="grid grid-cols-7 border-b">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
          <div key={d} className="py-3 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {blanks.map(b => (
          <div key={`blank-${b}`} className="h-24 sm:h-32 border-b border-r bg-slate-50/50"></div>
        ))}
        {days.map(day => {
          const log = getLogForDay(day);
          return (
            <div
              key={day}
              onClick={() => onDateClick?.(new Date(year, month - 1, day))}
              className="h-24 sm:h-32 border-b border-r p-2 hover:bg-slate-50 cursor-pointer transition-colors relative group"
            >
              <div className="flex justify-between items-start">
                <span className={`text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full ${log ? getStatusColor(log.status) : 'text-slate-700'}`}>
                  {day}
                </span>
                {log && (
                  <div className="hidden sm:block">
                    <span className="text-[10px] font-bold uppercase text-slate-400">
                      {log.status === WorkStatus.WORKING ? 'WRK' : log.status === WorkStatus.LEAVE ? 'LV' : 'HOL'}
                    </span>
                  </div>
                )}
              </div>
              {log && (
                <div className="mt-2 space-y-1">
                  <div className="text-[10px] font-semibold text-slate-800 truncate" title={log.village}>{log.village}</div>
                  <div className="text-[10px] text-slate-500 line-clamp-2" title={log.activity}>{log.activity}</div>
                </div>
              )}
              {!log && <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <i className="fas fa-plus text-slate-300"></i>
              </div>}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Calendar;