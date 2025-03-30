import api from './api/index';

// Get event by ID
export const getEventById = (id: string | number) => api.event.getEventById(id);
// Get event api
export const eventAPI = api.event;

// Reexport all types
export * from './api/index';
export default api;
