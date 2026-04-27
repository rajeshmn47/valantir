import axios from 'axios';

const API = axios.create({ baseURL: 'http://localhost:5000/api' });
// Profiles
export const getProfile = (id) => API.get(`/profile/${id}`);
export const searchProfiles = (query) => API.get(`/profile/searchprofiles?q=${query}`);
export const createProfile = (data) => API.post('/profile', data);
export const updateProfile = (id, data) => API.put(`/profile/${id}`, data);
export const getAllProfiles = () => API.get('/profile/allprofiles');
// Match
export const matchProfiles = (profileId1, profileId2) => API.post('/match', { profileId1, profileId2 });

// Cases
export const getCases = () => API.get('/cases');
export const getCase = (id) => API.get(`/cases/${id}`);
export const createCase = (data) => API.post('/cases', data);
export const addProfileToCase = (caseId, profileId) => API.post(`/cases/${caseId}/profiles`, { profileId });
export const addNoteToCase = (caseId, text, tags) => API.post(`/cases/${caseId}/notes`, { text, tags });

// Upload
export const uploadPDF = (file) => {
  const formData = new FormData();
  formData.append('pdf', file);
  return API.post('/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
};

// Relationships
export const getRelationships = (profileId) => API.get(`/relationships/${profileId}`);
export const createRelationship = (data) => API.post('/relationships', data);