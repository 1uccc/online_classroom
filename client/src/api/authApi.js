import { request } from './httpClient';
export const authApi = {
  login: body => request('/auth/login', { method: 'POST', body }),
  register: body => request('/auth/register', { method: 'POST', body }),
  me: signal => request('/auth/me', { signal }),
  updateProfile: body => request('/auth/me', { method: 'PATCH', body }),
};
