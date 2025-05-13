import axios from 'axios';
import { AuthResponse, LoginRequest, Note, NoteRequest, RegisterRequest, UpdateNoteRequest, UpdateUserRequest, User } from '@/types';
import Cookies from 'js-cookie';

// Make sure we normalize the API_URL to not have a trailing slash
const rawApiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';
const API_URL = rawApiUrl.endsWith('/') ? rawApiUrl.slice(0, -1) : rawApiUrl;

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor
api.interceptors.request.use(
  (config) => {
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Helper to get token (try cookie first, then localStorage)
const getToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  
  try {
    const cookieToken = Cookies.get('access_token');
    if (cookieToken) return cookieToken;
    
    const lsToken = localStorage.getItem('access_token');
    return lsToken;
  } catch (error) {
    return null;
  }
};

// Request interceptor to add auth token
api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth services
export const authService = {
  login: async (credentials: LoginRequest): Promise<AuthResponse> => {
    try {
      // Convert to FormData for OAuth2 password flow
      const formData = new URLSearchParams();
      formData.append('username', credentials.username);
      formData.append('password', credentials.password);
      
      // Add recaptcha token if available
      if (credentials.recaptcha_token) {
        formData.append('recaptcha_token', credentials.recaptcha_token);
      }
      
      // Use application/x-www-form-urlencoded for the login endpoint
      const response = await api.post<AuthResponse>('/auth/login', formData.toString(), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });
      
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  register: async (userData: RegisterRequest): Promise<User> => {
    try {
      // Create a standard JSON object for registration
      const registerData = {
        username: userData.username,
        email: userData.email,
        password: userData.password
      };
      
      // Only add full_name if it exists and isn't empty
      if (userData.full_name) {
        (registerData as any).full_name = userData.full_name;
      }
      
      // Add recaptcha token if available
      if (userData.recaptcha_token) {
        (registerData as any).recaptcha_token = userData.recaptcha_token;
      }
      
      const response = await api.post<User>('/users', registerData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
};

// User services
export const userService = {
  getCurrentUser: async (): Promise<User> => {
    const response = await api.get<User>('/users/me');
    return response.data;
  },
  updateUser: async (userData: UpdateUserRequest): Promise<User> => {
    const response = await api.put<User>('/users/me', userData);
    return response.data;
  },
  deleteUser: async (): Promise<void> => {
    // Get the current token for blacklisting after account deletion
    const token = getToken();
    
    // First, delete the user account
    await api.delete('/users/me');
    
    // If the delete was successful, try to blacklist the token
    if (token) {
      try {
        // This call might fail if the user is already deleted, but that's okay
        await api.post('/auth/logout', { token });
      } catch (error) {
        console.error('Failed to blacklist token, but user deletion was successful:', error);
      }
    }
  },
};

// Quick test function to check backend connectivity
export const testBackendConnection = async () => {
  try {
    // Try the root endpoint first
    try {
      const response = await axios.get(`${API_URL}/`);
      return true;
    } catch (rootError) {
      // Try a known API endpoint as fallback
      try {
        const token = localStorage.getItem('access_token');
        
        if (!token) {
          return false;
        }
        
        // Try the notes endpoint which should exist
        const response = await axios.get(`${API_URL}/notes`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        return true;
      } catch (apiError) {
        // One more try - API version endpoint (may work without auth)
        try {
          const response = await axios.get(`${API_URL.replace('/api/v1', '')}`);
          return false;
        } catch (serverError) {
          return false;
        }
      }
    }
  } catch (error) {
    return false;
  }
};

// Helper function to prepare note data for API with special boolean handling
const prepareNoteForAPI = (note: Partial<NoteRequest | UpdateNoteRequest>) => {
  const requestData: Record<string, any> = {};
  
  // Ensure all fields are properly formatted
  Object.entries(note).forEach(([key, value]) => {
    if (value !== undefined) {
      if (key === 'is_encrypted') {
        // Send is_encrypted as a boolean, not a string
        requestData[key] = value;
      } else if (typeof value === 'string') {
        // Ensure all strings are properly trimmed
        requestData[key] = value.trim();
      } else {
        requestData[key] = value;
      }
    } else if (key === 'encryption_password' && !note.is_encrypted) {
      // Explicitly set encryption_password to null when not encrypting
      requestData[key] = null;
    }
  });
  
  return requestData;
};

// Note services with optimized URL handling
export const noteService = {
  getNotes: async (skip = 0, limit = 10): Promise<Note[]> => {
    const response = await api.get<Note[]>(`/notes?skip=${skip}&limit=${limit}`);
    return response.data;
  },
  getNote: async (id: string, decryptPassword?: string): Promise<Note> => {
    try {
      let url = `/notes/${id}`;
      
      // Only append decrypt_password if it's provided and not empty
      if (decryptPassword && decryptPassword.trim()) {
        // Properly encode the password in case it contains special characters
        const encodedPassword = encodeURIComponent(decryptPassword.trim());
        url = `/notes/${id}?decrypt_password=${encodedPassword}`;
      }
      
      const response = await api.get<Note>(url);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  createNote: async (note: NoteRequest): Promise<Note> => {
    try {
      // Properly prepare the note data with all fields
      const createData: Record<string, any> = {
        title: note.title.trim(),
        content: note.content.trim(),
        is_encrypted: note.is_encrypted
      };
      
      // Only include encryption_password if the note is encrypted
      if (note.is_encrypted && note.encryption_password) {
        createData.encryption_password = note.encryption_password;
      }
      
      const response = await api.post<Note>('/notes', createData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  updateNote: async (id: string, note: UpdateNoteRequest): Promise<Note> => {
    try {
      // Prepare update data with proper type conversions
      const requestData = prepareNoteForAPI(note);
      
      const response = await api.put<Note>(`/notes/${id}`, requestData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  deleteNote: async (id: string): Promise<void> => {
    await api.delete(`/notes/${id}`);
  },
  recreateNote: async (
    id: string, 
    note: NoteRequest, 
    deleteOriginal: boolean = true,
    decryptPassword?: string
  ): Promise<Note> => {
    try {
      // Build URL with query parameters
      let url = `/notes/${id}/recreate?delete_original=${deleteOriginal}`;
      if (decryptPassword) {
        url += `&decrypt_password=${encodeURIComponent(decryptPassword)}`;
      }
      
      const response = await api.post<Note>(url, note);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
};

export default api; 