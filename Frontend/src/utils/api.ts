/**
 * File konfigurasi API Frontend.
 * Menggunakan Fetch API bawaan (tanpa perlu install axios).
 * File ini akan otomatis menambahkan Base URL dan JWT Token ke setiap request.
 */

const BASE_URL = (import.meta as any).env.VITE_API_URL || 'http://localhost:5000';

type FetchOptions = RequestInit & {
  data?: any;
};

export const api = {
  /**
   * Fungsi core untuk melakukan fetching.
   */
  async request(endpoint: string, options: FetchOptions = {}) {
    const url = `${BASE_URL}${endpoint}`;
    
    // Ambil token dari localStorage (sesuaikan dengan nama key yang dipakai Frontend Anda)
    const token = localStorage.getItem('divexplore_token');

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...((options.headers as Record<string, string>) || {}),
    };

    // Jika token ada, selipkan ke dalam Authorization header
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const config: RequestInit = {
      ...options,
      headers,
    };

    // Jika ada payload data, ubah jadi string JSON
    if (options.data) {
      config.body = JSON.stringify(options.data);
    }

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Terjadi kesalahan pada server');
      }

      return data;
    } catch (error: any) {
      console.error(`[API Error] ${endpoint}:`, error.message);
      throw error;
    }
  },

  // Shorthand methods
  get(endpoint: string, options?: FetchOptions) {
    return this.request(endpoint, { ...options, method: 'GET' });
  },
  
  post(endpoint: string, data?: any, options?: FetchOptions) {
    return this.request(endpoint, { ...options, method: 'POST', data });
  },
  
  put(endpoint: string, data?: any, options?: FetchOptions) {
    return this.request(endpoint, { ...options, method: 'PUT', data });
  },
  
  delete(endpoint: string, options?: FetchOptions) {
    return this.request(endpoint, { ...options, method: 'DELETE' });
  }
};