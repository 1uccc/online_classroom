import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { authApi } from '../api/authApi';
import { hasAccessToken, setAccessToken } from '../api/httpClient';

const AuthContext = createContext(null);
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(hasAccessToken);
  const [sessionError, setSessionError] = useState('');
  const generation = useRef(0);
  const logout = useCallback(() => { generation.current++; setAccessToken(null); setUser(null); setSessionError(''); setLoading(false); }, []);

  useEffect(() => {
    const controller = new AbortController();
    const currentGeneration = generation.current;
    if (hasAccessToken()) {
      authApi.me(controller.signal).then(result => {
        if (!controller.signal.aborted && generation.current === currentGeneration && hasAccessToken()) { setUser(result.data); setLoading(false); }
      }).catch(error => {
        if (error.name === 'AbortError' || controller.signal.aborted || generation.current !== currentGeneration) return;
        setSessionError(error.message); setAccessToken(null); setUser(null); setLoading(false);
      });
    }
    const expired = event => { generation.current++; setUser(null); setLoading(false); setSessionError(event.detail || 'Phiên đăng nhập đã kết thúc.'); };
    window.addEventListener('classroom:session-ended', expired);
    return () => { controller.abort(); window.removeEventListener('classroom:session-ended', expired); };
  }, []);

  const login = useCallback(async credentials => {
    const currentGeneration = ++generation.current;
    const { data } = await authApi.login(credentials);
    if (generation.current !== currentGeneration) return null;
    setAccessToken(data.accessToken); setUser(data.user); setSessionError('');
    return data.user;
  }, []);
  const updateProfile = useCallback(async body => {
    const result = await authApi.updateProfile(body); setUser(result.data); return result.data;
  }, []);
  const changePassword = useCallback(async body => {
    const currentGeneration = ++generation.current;
    const result = await authApi.changePassword(body);
    if (generation.current === currentGeneration) {
      setAccessToken(result.data.accessToken); setUser(result.data.user); setSessionError('');
    }
    return result.data;
  }, []);
  const value = useMemo(() => ({ user, loading, login, logout, updateProfile, changePassword, sessionError }), [user, loading, login, logout, updateProfile, changePassword, sessionError]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be inside AuthProvider');
  return context;
}
