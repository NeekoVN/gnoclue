// src/services/report.ts
import { IReport, IReportWithDetails, IReportsResponse, ReportEntityType, ReportReason } from '../types/report';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001/api';

// Get auth token from localStorage
const getAuthToken = (): string | null => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('token');
  }
  return null;
};

// Get headers with auth token
const getAuthHeaders = (): HeadersInit => {
  const token = getAuthToken();
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  };
};

// Create a new report
export const createReport = async (
  reportedEntityType: ReportEntityType,
  reportedEntityId: string,
  reason: ReportReason,
  description?: string
): Promise<IReport> => {
  const response = await fetch(`${API_BASE_URL}/reports`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({
      reportedEntityType,
      reportedEntityId,
      reason,
      description,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to create report');
  }

  return response.json();
};

// Get my reports
export const getMyReports = async (
  page: number = 1,
  limit: number = 20
): Promise<IReportsResponse> => {
  const response = await fetch(
    `${API_BASE_URL}/reports/my-reports?page=${page}&limit=${limit}`,
    {
      headers: getAuthHeaders(),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch reports');
  }

  return response.json();
};

// Get a specific report by ID
export const getReportById = async (reportId: string): Promise<IReportWithDetails> => {
  const response = await fetch(`${API_BASE_URL}/reports/${reportId}`, {
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch report');
  }

  return response.json();
};

// Admin: Get all reports
export const getAllReports = async (
  page: number = 1,
  limit: number = 20,
  status?: string
): Promise<IReportsResponse> => {
  const queryParams = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    ...(status && { status }),
  });

  const response = await fetch(
    `${API_BASE_URL}/admin/reports?${queryParams}`,
    {
      headers: getAuthHeaders(),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch reports');
  }

  return response.json();
};

// Admin: Update report status
export const updateReportStatus = async (
  reportId: string,
  status: 'reviewing' | 'resolved' | 'dismissed',
  reviewNotes?: string
): Promise<IReport> => {
  const response = await fetch(`${API_BASE_URL}/admin/reports/${reportId}/status`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify({ status, reviewNotes }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to update report status');
  }

  return response.json();
};
