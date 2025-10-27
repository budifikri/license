// api/client.ts
const API_BASE_URL = process.env.VITE_API_BASE_URL || (typeof window !== 'undefined' ? '/api' : 'http://localhost:5000/api');

// Add authentication headers to requests
const getAuthHeaders = () => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  
  // Add JWT token if available in local storage
  const token = localStorage.getItem('accessToken');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return headers;
};

export interface ApiResponse<T> {
  data?: T;
  error?: string;
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    console.log(`API CALL: GET ${this.baseUrl}/${endpoint}`);
    try {
      const headers = getAuthHeaders();
      // For GET requests, we don't need Content-Type header
      delete headers['Content-Type'];
      const response = await fetch(`${this.baseUrl}/${endpoint}`, {
        method: 'GET',
        headers
      });
      console.log(`API RESPONSE: GET ${this.baseUrl}/${endpoint}`, response.status);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      console.log(`API SUCCESS: GET ${this.baseUrl}/${endpoint}`, Array.isArray(data) ? `${data.length} items` : data);
      return { data };
    } catch (error) {
      console.error(`API ERROR: GET ${this.baseUrl}/${endpoint}`, error);
      return { error: (error as Error).message };
    }
  }

  async post<T>(endpoint: string, data: any): Promise<ApiResponse<T>> {
    console.log(`API CALL: POST ${this.baseUrl}/${endpoint}`, data);
    try {
      const headers = getAuthHeaders();
      const response = await fetch(`${this.baseUrl}/${endpoint}`, {
        method: 'POST',
        headers,
        body: JSON.stringify(data),
      });
      console.log(`API RESPONSE: POST ${this.baseUrl}/${endpoint}`, response.status);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const result = await response.json();
      console.log(`API SUCCESS: POST ${this.baseUrl}/${endpoint}`, result);
      return { data: result };
    } catch (error) {
      console.error(`API ERROR: POST ${this.baseUrl}/${endpoint}`, error);
      return { error: (error as Error).message };
    }
  }

  async put<T>(endpoint: string, data: any): Promise<ApiResponse<T>> {
    console.log(`API CALL: PUT ${this.baseUrl}/${endpoint}`, data);
    try {
      const headers = getAuthHeaders();
      const response = await fetch(`${this.baseUrl}/${endpoint}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(data),
      });
      console.log(`API RESPONSE: PUT ${this.baseUrl}/${endpoint}`, response.status);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const result = await response.json();
      console.log(`API SUCCESS: PUT ${this.baseUrl}/${endpoint}`, result);
      return { data: result };
    } catch (error) {
      console.error(`API ERROR: PUT ${this.baseUrl}/${endpoint}`, error);
      return { error: (error as Error).message };
    }
  }

  async delete(endpoint: string): Promise<ApiResponse<void>> {
    console.log(`API CALL: DELETE ${this.baseUrl}/${endpoint}`);
    try {
      const headers = getAuthHeaders();
      // For DELETE requests, we don't need Content-Type header if no body
      delete headers['Content-Type'];
      const response = await fetch(`${this.baseUrl}/${endpoint}`, {
        method: 'DELETE',
        headers
      });
      console.log(`API RESPONSE: DELETE ${this.baseUrl}/${endpoint}`, response.status);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      console.log(`API SUCCESS: DELETE ${this.baseUrl}/${endpoint}`);
      return { data: undefined };
    } catch (error) {
      console.error(`API ERROR: DELETE ${this.baseUrl}/${endpoint}`, error);
      return { error: (error as Error).message };
    }
  }
}

export const apiClient = new ApiClient(API_BASE_URL);