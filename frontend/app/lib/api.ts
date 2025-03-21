// services/api.ts
// Re-export from the new structure for backward compatibility
import api from './api/index';

// Functions for direct access
export const getEventById = (id: string | number) => api.event.getEventById(id);
export const eventAPI = api.event;

// Re-export everything
export * from './api/index';
export default api;
