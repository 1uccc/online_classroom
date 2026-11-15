import { request } from './httpClient';
export const assignmentApi = {
  create: (courseId, body) => request(`/courses/${courseId}/assignments`, { method: 'POST', body }),
  update: (courseId, id, body) => request(`/courses/${courseId}/assignments/${id}`, { method: 'PATCH', body }),
  remove: (courseId, id) => request(`/courses/${courseId}/assignments/${id}`, { method: 'DELETE' }),
  submit: (id, body, replace) => request(`/assignments/${id}/submissions${replace ? '/me' : ''}`, { method: replace ? 'PUT' : 'POST', body }),
  grade: (id, body) => request(`/submissions/${id}/grade`, { method: 'PATCH', body }),
};
