
import { User, WorkLog, Role, WorkStatus } from '../types';

/**
 * GOOGLE APPS SCRIPT BACKEND
 * URL provided by the user is now active.
 */
const GAS_WEBAPP_URL: string = "https://script.google.com/macros/s/AKfycbxIvWtP7mohEMsKpqlyN4xnsu_9m6BOj2TblT63ldMftgCVxbrRQs9ee0jmuxdbcu3wmg/exec"; 

// Mock mode is disabled if URL is present
const isMockMode = !GAS_WEBAPP_URL || GAS_WEBAPP_URL.trim() === "" || GAS_WEBAPP_URL.includes("REPLACE_WITH_ID");

export const apiService = {
  async login(username: string, password: string): Promise<User | null> {
    if (isMockMode) {
      if (username === 'admin' && password === 'admin') {
        return { username: 'admin', role: Role.ADMIN };
      }
      const mockUsers = JSON.parse(localStorage.getItem('mock_users') || '[]');
      const user = mockUsers.find((u: any) => u.username === username && u.password === password);
      return user ? { username: user.username, role: user.role } : null;
    }

    try {
      const resp = await fetch(`${GAS_WEBAPP_URL}?action=login&username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`, {
        method: 'GET',
        mode: 'cors',
        cache: 'no-cache'
      });
      if (!resp.ok) throw new Error("Network response was not ok");
      const data = await resp.json();
      return data.success ? data.user : null;
    } catch (err) {
      console.error("Login Error:", err);
      return null;
    }
  },

  async logWork(log: WorkLog): Promise<boolean> {
    if (isMockMode) {
      const logs = JSON.parse(localStorage.getItem('mock_logs') || '[]');
      logs.push({ ...log, timestamp: new Date().toISOString() });
      localStorage.setItem('mock_logs', JSON.stringify(logs));
      return true;
    }

    try {
      // Add timestamp if not present
      const payload = {
        action: 'logWork',
        ...log,
        timestamp: new Date().toISOString()
      };

      const resp = await fetch(GAS_WEBAPP_URL, {
        method: 'POST',
        mode: 'no-cors', // Using no-cors is often more reliable for simple GAS POSTs to avoid preflight issues
        body: JSON.stringify(payload)
      });
      
      // Since 'no-cors' doesn't allow reading response, we assume success if no error is thrown
      // If you need to read the response, you must ensure GAS has proper CORS headers.
      return true; 
    } catch (err) {
      console.error("Log Work Submission Error:", err);
      return false;
    }
  },

  async getAttendance(username: string, month: number, year: number): Promise<WorkLog[]> {
    if (isMockMode) {
      const logs = JSON.parse(localStorage.getItem('mock_logs') || '[]');
      return logs.filter((l: WorkLog) => {
        const d = new Date(l.date);
        return l.username === username && (d.getMonth() + 1) === month && d.getFullYear() === year;
      });
    }

    try {
      const resp = await fetch(`${GAS_WEBAPP_URL}?action=getAttendance&username=${encodeURIComponent(username)}&month=${month}&year=${year}`);
      const data = await resp.json();
      return data.logs || [];
    } catch (err) {
      console.error("Fetch Attendance Error:", err);
      return [];
    }
  },

  async getAllLogs(): Promise<WorkLog[]> {
    if (isMockMode) {
      return JSON.parse(localStorage.getItem('mock_logs') || '[]');
    }
    try {
      const resp = await fetch(`${GAS_WEBAPP_URL}?action=getAllLogs`);
      const data = await resp.json();
      return data.logs || [];
    } catch (err) {
      console.error("Fetch All Logs Error:", err);
      return [];
    }
  },

  async addUser(user: User): Promise<boolean> {
    if (isMockMode) {
      const users = JSON.parse(localStorage.getItem('mock_users') || '[]');
      users.push({ ...user, createdDate: new Date().toISOString() });
      localStorage.setItem('mock_users', JSON.stringify(users));
      return true;
    }
    try {
      const resp = await fetch(GAS_WEBAPP_URL, {
        method: 'POST',
        body: JSON.stringify({ action: 'addUser', ...user })
      });
      const data = await resp.json();
      return data.success;
    } catch (err) {
      console.error("Add User Error:", err);
      return false;
    }
  },

  async getAllUsers(): Promise<User[]> {
    if (isMockMode) {
      const users = JSON.parse(localStorage.getItem('mock_users') || '[]');
      return [{ username: 'admin', role: Role.ADMIN }, ...users];
    }
    try {
      const resp = await fetch(`${GAS_WEBAPP_URL}?action=getUsers`);
      const data = await resp.json();
      return data.users || [];
    } catch (err) {
      console.error("Fetch Users Error:", err);
      return [{ username: 'admin', role: Role.ADMIN }];
    }
  }
};
