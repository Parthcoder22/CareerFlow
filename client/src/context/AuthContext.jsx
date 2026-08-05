// ============================================
// Authentication Context
// ============================================
// Provides auth state (user, token, loading) to the entire app.
// Uses React Context + useReducer for state management.

import { createContext, useContext, useReducer, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

// Auth state reducer
const authReducer = (state, action) => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: true };
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        loading: false,
      };
    case 'LOAD_USER':
      return {
        ...state,
        user: action.payload,
        isAuthenticated: true,
        loading: false,
      };
    case 'LOGOUT':
      return {
        user: null,
        token: null,
        isAuthenticated: false,
        loading: false,
      };
    case 'SET_ERROR':
      return { ...state, loading: false };
    default:
      return state;
  }
};

const initialState = {
  user: null,
  token: localStorage.getItem('careerflow_token'),
  isAuthenticated: false,
  loading: true,
};

export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Load user on mount if token exists
  useEffect(() => {
    const loadUser = async () => {
      const token = localStorage.getItem('careerflow_token');
      if (!token) {
        dispatch({ type: 'LOGOUT' });
        return;
      }

      try {
        const { data } = await authAPI.getMe();
        dispatch({ type: 'LOAD_USER', payload: data.user });
      } catch (error) {
        localStorage.removeItem('careerflow_token');
        localStorage.removeItem('careerflow_user');
        dispatch({ type: 'LOGOUT' });
      }
    };

    loadUser();
  }, []);

  const login = async (credentials) => {
    dispatch({ type: 'SET_LOADING' });
    try {
      const { data } = await authAPI.login(credentials);
      localStorage.setItem('careerflow_token', data.token);
      localStorage.setItem('careerflow_user', JSON.stringify(data.user));
      dispatch({ type: 'LOGIN_SUCCESS', payload: data });
      return data;
    } catch (error) {
      dispatch({ type: 'SET_ERROR' });
      throw error;
    }
  };

  const signup = async (userData) => {
    dispatch({ type: 'SET_LOADING' });
    try {
      const { data } = await authAPI.signup(userData);
      localStorage.setItem('careerflow_token', data.token);
      localStorage.setItem('careerflow_user', JSON.stringify(data.user));
      dispatch({ type: 'LOGIN_SUCCESS', payload: data });
      return data;
    } catch (error) {
      dispatch({ type: 'SET_ERROR' });
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('careerflow_token');
    localStorage.removeItem('careerflow_user');
    dispatch({ type: 'LOGOUT' });
  };

  const updateUser = (user) => {
    dispatch({ type: 'LOAD_USER', payload: user });
  };

  return (
    <AuthContext.Provider value={{
      ...state,
      login,
      signup,
      logout,
      updateUser,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
