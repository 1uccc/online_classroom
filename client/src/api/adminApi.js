import { request } from './httpClient';
export const adminApi = {
  createUser: body => request('/users', { method: 'POST', body }),
  userStatus: (id, isActive) => request(`/users/${id}/status`, { method: 'PATCH', body: { isActive } }),
  resetPassword: (id, newPassword) => request(`/users/${id}/password`, { method: 'PATCH', body: { newPassword } }),
  createCategory: body => request('/categories', { method: 'POST', body }),
  updateCategory: (id, body) => request(`/categories/${id}`, { method: 'PATCH', body }),
  deleteCategory: id => request(`/categories/${id}`, { method: 'DELETE' }),
};
