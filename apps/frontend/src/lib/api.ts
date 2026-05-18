import axios, { AxiosInstance, AxiosError } from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: `${API_URL}/api`,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.client.interceptors.request.use(
      (config) => {
        const token = this.getToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        if (error.response?.status === 401) {
          this.clearToken();
          if (typeof window !== 'undefined') {
            window.location.href = '/login';
          }
        }
        return Promise.reject(error);
      }
    );
  }

  private getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('auth_token');
  }

  private setToken(token: string): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem('auth_token', token);
    }
  }

  private clearToken(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
    }
  }

  async register(phoneNumber: string) {
    const response = await this.client.post('/auth/register', { phoneNumber });
    return response.data;
  }

  async login(phoneNumber: string) {
    const response = await this.client.post('/auth/login', { phoneNumber });
    if (response.data.data?.token) {
      this.setToken(response.data.data.token);
    }
    return response.data;
  }

  async getProfile() {
    const response = await this.client.get('/user/profile');
    return response.data;
  }

  async triggerEmergency(data: {
    audioBuffer: ArrayBuffer;
    gpsCoordinates: { latitude: number; longitude: number; accuracy: number };
  }) {
    const response = await this.client.post('/emergency/trigger', data);
    return response.data;
  }

  async cancelEmergency(eventId: string) {
    const response = await this.client.post(`/emergency/cancel/${eventId}`);
    return response.data;
  }

  async addTrustedContact(contact: { name: string; phoneNumber: string; priority: number }) {
    const response = await this.client.post('/user/trusted-contacts', contact);
    return response.data;
  }

  async post(url: string, data?: any, config?: any) {
    const response = await this.client.post(url, data, config);
    return response;
  }

  async get(url: string) {
    const response = await this.client.get(url);
    return response;
  }
}

export const apiClient = new ApiClient();
