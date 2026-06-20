
import { User, WorkLog, Role, WorkStatus, GalleryItem } from '../types';

// Web App URL 1: Main Application Personnel System (Login, Daily Diaries, Attendance reports, User Registry)
// Connecting to your spreadsheet: 'Application_Vikarabad'
const GAS_MAIN_WEBAPP_URL: string = "https://script.google.com/macros/s/AKfycbxIvWtP7mohEMsKpqlyN4xnsu_9m6BOj2TblT63ldMftgCVxbrRQs9ee0jmuxdbcu3wmg/exec"; 

// Web App URL 2: Field Photograph Gallery System (Google Drive Link registry)
// Point this to your second spreadsheet / web app URL!
const GAS_GALLERY_WEBAPP_URL: string = "https://script.google.com/macros/s/AKfycbzv5HI5j3TtqsyRvGc2OFCr0QVJ3iPQVuZbWtvD0J_CyuxCAiHqx6ybmFt0mXFlpI4iQA/exec"; 

const isMockModeMain = !GAS_MAIN_WEBAPP_URL || GAS_MAIN_WEBAPP_URL.trim() === "" || GAS_MAIN_WEBAPP_URL.includes("REPLACE_WITH_ID") || GAS_MAIN_WEBAPP_URL.includes("REPLACE_WITH_YOUR");
const isMockModeGallery = !GAS_GALLERY_WEBAPP_URL || GAS_GALLERY_WEBAPP_URL.trim() === "" || GAS_GALLERY_WEBAPP_URL.includes("REPLACE_WITH_ID") || GAS_GALLERY_WEBAPP_URL.includes("REPLACE_WITH_YOUR");

export const apiService = {
  // Helper for mock user logins
  getMockUser(username: string, password?: string): User | null {
    if (username === 'admin' && (!password || password === 'admin')) {
      return { username: 'admin', role: Role.ADMIN };
    }
    const mockUsers = JSON.parse(localStorage.getItem('mock_users') || '[]');
    const user = mockUsers.find((u: any) => u.username === username && (!password || u.password === password));
    return user ? { username: user.username, role: user.role } : null;
  },

  async login(username: string, password: string): Promise<User | null> {
    if (isMockModeMain) {
      return this.getMockUser(username, password);
    }

    try {
      const resp = await fetch(`${GAS_MAIN_WEBAPP_URL}?action=login&username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`, {
        method: 'GET',
        mode: 'cors',
        cache: 'no-cache'
      });
      if (!resp.ok) throw new Error("Network response was not ok");
      const data = await resp.json();
      return data.success ? data.user : null;
    } catch (err) {
      console.warn("Login call failed. Recovering using local offline user state store:", err);
      return this.getMockUser(username, password);
    }
  },

  async logWork(log: WorkLog): Promise<boolean> {
    if (isMockModeMain) {
      const logs = JSON.parse(localStorage.getItem('mock_logs') || '[]');
      logs.push({ ...log, timestamp: new Date().toISOString() });
      localStorage.setItem('mock_logs', JSON.stringify(logs));
      return true;
    }

    try {
      const payload = {
        action: 'logWork',
        ...log,
        timestamp: new Date().toISOString()
      };

      await fetch(GAS_MAIN_WEBAPP_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8'
        },
        body: JSON.stringify(payload)
      });
      
      return true; 
    } catch (err) {
      console.warn("Log work submission failed, backing up to local storage log stream:", err);
      const logs = JSON.parse(localStorage.getItem('mock_logs') || '[]');
      logs.push({ ...log, timestamp: new Date().toISOString() });
      localStorage.setItem('mock_logs', JSON.stringify(logs));
      return true;
    }
  },

  async getAttendance(username: string, month: number, year: number): Promise<WorkLog[]> {
    if (isMockModeMain) {
      const logs = JSON.parse(localStorage.getItem('mock_logs') || '[]');
      return logs.filter((l: WorkLog) => {
        const d = new Date(l.date);
        return l.username === username && (d.getMonth() + 1) === month && d.getFullYear() === year;
      });
    }

    try {
      const resp = await fetch(`${GAS_MAIN_WEBAPP_URL}?action=getAttendance&username=${encodeURIComponent(username)}&month=${month}&year=${year}`);
      const data = await resp.json();
      return (data.logs || []).map((l: any) => ({
        ...l,
        username: l.username || username,
        date: l.date ? new Date(l.date).toISOString().split('T')[0] : ''
      }));
    } catch (err) {
      console.warn("Fetch attendance online query reached a connection limit. Reading offline backup logs:", err);
      const logs = JSON.parse(localStorage.getItem('mock_logs') || '[]');
      return logs.filter((l: WorkLog) => {
        const d = new Date(l.date);
        return l.username === username && (d.getMonth() + 1) === month && d.getFullYear() === year;
      });
    }
  },

  async getAllLogs(): Promise<WorkLog[]> {
    if (isMockModeMain) {
      return JSON.parse(localStorage.getItem('mock_logs') || '[]');
    }
    try {
      const resp = await fetch(`${GAS_MAIN_WEBAPP_URL}?action=getAllLogs`);
      const data = await resp.json();
      return (data.logs || []).map((l: any) => ({
        ...l,
        date: l.date ? new Date(l.date).toISOString().split('T')[0] : ''
      }));
    } catch (err) {
      console.warn("Log synchronization online stream paused. Sourcing local workspace backup logs:", err);
      return JSON.parse(localStorage.getItem('mock_logs') || '[]');
    }
  },

  async addUser(user: User): Promise<boolean> {
    if (isMockModeMain) {
      const users = JSON.parse(localStorage.getItem('mock_users') || '[]');
      users.push({ ...user, createdDate: new Date().toISOString() });
      localStorage.setItem('mock_users', JSON.stringify(users));
      return true;
    }
    try {
      const resp = await fetch(GAS_MAIN_WEBAPP_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8'
        },
        body: JSON.stringify({ action: 'addUser', ...user })
      });
      const data = await resp.json();
      return data.success;
    } catch (err) {
      console.warn("Adding user online operation failed, registering locally:", err);
      const users = JSON.parse(localStorage.getItem('mock_users') || '[]');
      users.push({ ...user, createdDate: new Date().toISOString() });
      localStorage.setItem('mock_users', JSON.stringify(users));
      return true;
    }
  },

  async getAllUsers(): Promise<User[]> {
    if (isMockModeMain) {
      const users = JSON.parse(localStorage.getItem('mock_users') || '[]');
      return [{ username: 'admin', role: Role.ADMIN }, ...users];
    }
    try {
      const resp = await fetch(`${GAS_MAIN_WEBAPP_URL}?action=getUsers`);
      const data = await resp.json();
      return data.users || [];
    } catch (err) {
      console.warn("User registry offline fallback engaged:", err);
      const users = JSON.parse(localStorage.getItem('mock_users') || '[]');
      return [{ username: 'admin', role: Role.ADMIN }, ...users];
    }
  },

  async getGallery(): Promise<GalleryItem[]> {
    if (isMockModeGallery) {
      const saved = localStorage.getItem('mock_gallery');
      if (saved) return JSON.parse(saved);
      const defaultItems = [
        { imageUrl: 'https://picsum.photos/seed/soil/400/300', activity: 'Soil Testing', village: 'Mominpet', date: '2024-03-15' },
        { imageUrl: 'https://picsum.photos/seed/training/400/300', activity: 'Training Session', village: 'Vikarabad', date: '2024-03-12' },
        { imageUrl: 'https://picsum.photos/seed/crops/400/300', activity: 'Plantation', village: 'Pargi', date: '2024-03-10' },
        { imageUrl: 'https://picsum.photos/seed/meeting/400/300', activity: 'Meeting', village: 'Tandur', date: '2024-03-08' },
        { imageUrl: 'https://picsum.photos/seed/survey/400/300', activity: 'Survey', village: 'Dharur', date: '2024-03-05' },
        { imageUrl: 'https://picsum.photos/seed/farm/400/300', activity: 'Soil Testing', village: 'Pargi', date: '2024-03-01' },
      ];
      localStorage.setItem('mock_gallery', JSON.stringify(defaultItems));
      return defaultItems;
    }
    try {
      const resp = await fetch(`${GAS_GALLERY_WEBAPP_URL}?action=getGallery`);
      const data = await resp.json();
      return data.gallery || [];
    } catch (err) {
      console.warn("Fetch Gallery Network Error. Falling back to Offline State / Mock Gallery until script is deployed with 'getGallery' support:", err);
      const saved = localStorage.getItem('mock_gallery');
      if (saved) return JSON.parse(saved);
      const defaultItems = [
        { imageUrl: 'https://picsum.photos/seed/soil/400/300', activity: 'Soil Testing', village: 'Mominpet', date: '2024-03-15' },
        { imageUrl: 'https://picsum.photos/seed/training/400/300', activity: 'Training Session', village: 'Vikarabad', date: '2024-03-12' },
        { imageUrl: 'https://picsum.photos/seed/crops/400/300', activity: 'Plantation', village: 'Pargi', date: '2024-03-10' },
        { imageUrl: 'https://picsum.photos/seed/meeting/400/300', activity: 'Meeting', village: 'Tandur', date: '2024-03-08' },
        { imageUrl: 'https://picsum.photos/seed/survey/400/300', activity: 'Survey', village: 'Dharur', date: '2024-03-05' },
        { imageUrl: 'https://picsum.photos/seed/farm/400/300', activity: 'Soil Testing', village: 'Pargi', date: '2024-03-01' },
      ];
      localStorage.setItem('mock_gallery', JSON.stringify(defaultItems));
      return defaultItems;
    }
  },

  async uploadGallery(items: { base64: string; fileName: string; description: string; village: string; activity: string }[]): Promise<boolean> {
    if (isMockModeGallery) {
      const gallery = JSON.parse(localStorage.getItem('mock_gallery') || '[]');
      const newItems = items.map(item => ({
        imageUrl: item.base64,
        activity: item.activity || 'Field Progress',
        village: item.village || 'Vikarabad',
        date: new Date().toISOString().split('T')[0],
        description: item.description || ''
      }));
      localStorage.setItem('mock_gallery', JSON.stringify([...newItems, ...gallery]));
      return true;
    }
    try {
      const resp = await fetch(GAS_GALLERY_WEBAPP_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8'
        },
        body: JSON.stringify({
          action: 'uploadGallery',
          items: items.map(item => ({
            base64: item.base64,
            fileName: item.fileName,
            description: item.description,
            village: item.village,
            activity: item.activity
          }))
        })
      });
      const data = await resp.json();
      return data.success;
    } catch (err) {
      console.error("Upload Gallery Photos Error:", err);
      return false;
    }
  }
};
