import { request } from './httpClient';
export const courseApi = {
  create: body => request('/courses', { method: 'POST', body }),
  update: (id, body) => request(`/courses/${id}`, { method: 'PATCH', body }),
  status: (id, status) => request(`/courses/${id}/status`, { method: 'PATCH', body: { status } }),
  remove: id => request(`/courses/${id}`, { method: 'DELETE' }),
  enroll: id => request(`/courses/${id}/enrollments`, { method: 'POST' }),
  cancel: id => request(`/courses/${id}/enrollments/me/cancel`, { method: 'PATCH' }),
};
