// src/services/classroom.service.js
import apiClient from './apiClient';

export const classroomService = {
  search: (params) => apiClient.get('/classrooms/search', { params }),
  discover: (params) => apiClient.get('/classrooms/discover', { params }),
  getDetail: (classroomId) => apiClient.get(`/classrooms/${classroomId}`),
  create: (data) => apiClient.post('/classrooms', data),
  update: (classroomId, data) => apiClient.patch(`/classrooms/${classroomId}`, data),
  requestEarlyEnd: (classroomId, data) => apiClient.post(`/classrooms/${classroomId}/early-end`, data),
  uploadMedia: (classroomId, formData) =>
    apiClient.post(`/classrooms/${classroomId}/media`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  voteEarlyEnd: (classroomId, data) => apiClient.post(`/classrooms/${classroomId}/vote-early-end`, data),
  getEnrolledStudents: (classroomId, params) =>
    apiClient.get(`/classrooms/${classroomId}/students`, { params }),
  report: (classroomId, data) => apiClient.post(`/classrooms/${classroomId}/report`, data),

  // ── Doubts ──
  createDoubt: (classroomId, data) => apiClient.post(`/classrooms/${classroomId}/doubts`, data),
  getDoubts: (classroomId, params) => apiClient.get(`/classrooms/${classroomId}/doubts`, { params }),
  getDoubtDetail: (classroomId, doubtId) => apiClient.get(`/classrooms/${classroomId}/doubts/${doubtId}`),
  answerDoubt: (classroomId, doubtId, data) =>
    apiClient.patch(`/classrooms/${classroomId}/doubts/${doubtId}/answer`, data),
  upvoteDoubt: (classroomId, doubtId) => apiClient.post(`/classrooms/${classroomId}/doubts/${doubtId}/upvote`),
  closeDoubt: (classroomId, doubtId) => apiClient.patch(`/classrooms/${classroomId}/doubts/${doubtId}/close`),

  // ── Materials ──
  uploadMaterial: (classroomId, formData) =>
    apiClient.post(`/classrooms/${classroomId}/materials`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  getMaterials: (classroomId, params) => apiClient.get(`/classrooms/${classroomId}/materials`, { params }),
  deleteMaterial: (classroomId, materialId) =>
    apiClient.delete(`/classrooms/${classroomId}/materials/${materialId}`),

  // ── Announcements ──
  createAnnouncement: (classroomId, data) => apiClient.post(`/classrooms/${classroomId}/announcements`, data),
  getAnnouncements: (classroomId, params) =>
    apiClient.get(`/classrooms/${classroomId}/announcements`, { params }),
  deleteAnnouncement: (classroomId, announcementId) =>
    apiClient.delete(`/classrooms/${classroomId}/announcements/${announcementId}`),

  // ── Assignments ──
  createAssignment: (classroomId, data) => apiClient.post(`/classrooms/${classroomId}/assignments`, data),
  updateAssignment: (classroomId, assignmentId, data) =>
    apiClient.patch(`/classrooms/${classroomId}/assignments/${assignmentId}`, data),
  getAssignments: (classroomId, params) => apiClient.get(`/classrooms/${classroomId}/assignments`, { params }),
  getAssignmentDetail: (classroomId, assignmentId) =>
    apiClient.get(`/classrooms/${classroomId}/assignments/${assignmentId}`),
  submitAssignment: (classroomId, assignmentId, formData) =>
    apiClient.post(`/classrooms/${classroomId}/assignments/${assignmentId}/submit`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  gradeSubmission: (classroomId, assignmentId, data) =>
    apiClient.patch(`/classrooms/${classroomId}/assignments/${assignmentId}/grade`, data),

  // ── Polls ──
  createPoll: (classroomId, data) => apiClient.post(`/classrooms/${classroomId}/polls`, data),
  getPolls: (classroomId, params) => apiClient.get(`/classrooms/${classroomId}/polls`, { params }),
  getPollDetail: (classroomId, pollId) => apiClient.get(`/classrooms/${classroomId}/polls/${pollId}`),
  votePoll: (classroomId, pollId, data) => apiClient.post(`/classrooms/${classroomId}/polls/${pollId}/vote`, data),
  closePoll: (classroomId, pollId) => apiClient.patch(`/classrooms/${classroomId}/polls/${pollId}/close`),

  // ── Extra classes ──
  requestExtraClass: (classroomId, data) => apiClient.post(`/classrooms/${classroomId}/extra-classes`, data),
  getExtraClasses: (classroomId, params) =>
    apiClient.get(`/classrooms/${classroomId}/extra-classes`, { params }),

  // ── Tests (teacher authoring, classroom-scoped) ──
  createTest: (classroomId, data) => apiClient.post(`/classrooms/${classroomId}/tests`, data),
  listClassroomTests: (classroomId, params) => apiClient.get(`/classrooms/${classroomId}/tests`, { params }),
};

export default classroomService;
