import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const STORAGE_KEY_BASE_URL = '@stalker_api_base_url';

// Production cloud backend hosted on Render
const DEFAULT_URL = 'https://backend-stalker.onrender.com';


class ApiClient {
  constructor() {
    this.baseUrl = DEFAULT_URL;
    this.isLoaded = false;
  }

  async getBaseUrl() {
    if (!this.isLoaded) {
      try {
        if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
          const stored = window.localStorage.getItem(STORAGE_KEY_BASE_URL);
          if (stored) {
            this.baseUrl = stored.trim().replace(/\/+$/, '');
          }
        } else if (AsyncStorage) {
          const stored = await AsyncStorage.getItem(STORAGE_KEY_BASE_URL);
          if (stored) {
            this.baseUrl = stored.trim().replace(/\/+$/, '');
          }
        }
      } catch (err) {
        console.warn('Could not read stored API URL:', err);
      }
      this.isLoaded = true;
    }
    return this.baseUrl;
  }

  async setBaseUrl(newUrl) {
    if (!newUrl) return;
    const cleaned = newUrl.trim().replace(/\/+$/, '');
    this.baseUrl = cleaned;
    try {
      if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(STORAGE_KEY_BASE_URL, cleaned);
      } else if (AsyncStorage) {
        await AsyncStorage.setItem(STORAGE_KEY_BASE_URL, cleaned);
      }
    } catch (err) {
      console.warn('Could not save API URL to storage:', err);
    }
  }

  async request(endpoint, options = {}) {
    const base = await this.getBaseUrl();
    const url = `${base}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...(options.headers || {})
    };

    const config = {
      ...options,
      headers
    };

    try {
      const response = await fetch(url, config);
      const json = await response.json().catch(() => ({}));
      
      if (!response.ok) {
        const errorMsg = json.error || json.message || `Server returned error (${response.status})`;
        throw new Error(errorMsg);
      }
      
      return json;
    } catch (err) {
      if (err.message && (err.message.includes('Network request failed') || err.message.includes('Failed to fetch'))) {
        throw new Error(`Cannot connect to backend server at ${base}. Make sure backend is running (npm run dev in backend folder).`);
      }
      throw err;
    }
  }

  // Health
  async getHealth() {
    return this.request('/api/health');
  }

  // Targets
  async getTargets() {
    return this.request('/api/targets');
  }

  async previewProfile(usernameOrUrl) {
    const encoded = encodeURIComponent(usernameOrUrl.trim());
    return this.request(`/api/leetcode/preview/${encoded}`);
  }

  async addTarget(input, telegramChatId) {
    return this.request('/api/targets', {
      method: 'POST',
      body: JSON.stringify({ input, telegramChatId })
    });
  }

  async removeTarget(id) {
    return this.request(`/api/targets/${id}`, {
      method: 'DELETE'
    });
  }

  async toggleTarget(id) {
    return this.request(`/api/targets/${id}/toggle`, {
      method: 'PATCH'
    });
  }

  async checkSingleTarget(id) {
    return this.request(`/api/targets/${id}/check`, {
      method: 'POST'
    });
  }

  async checkAllTargets() {
    return this.request('/api/targets/check-all', {
      method: 'POST'
    });
  }

  // Activity History
  async getHistory(limit = 50) {
    return this.request(`/api/history?limit=${limit}`);
  }

  // Telegram
  async getTelegramStatus() {
    return this.request('/api/telegram/status');
  }

  async sendTestTelegram(chatId) {
    return this.request('/api/telegram/test', {
      method: 'POST',
      body: JSON.stringify({ chatId })
    });
  }

  // Settings
  async getSettings() {
    return this.request('/api/settings');
  }

  async updateSettings(settings) {
    return this.request('/api/settings', {
      method: 'POST',
      body: JSON.stringify(settings)
    });
  }
}

export const api = new ApiClient();
export default api;
