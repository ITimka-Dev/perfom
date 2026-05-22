const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:3001";

function getAuthToken(): string | null {
  return localStorage.getItem('auth_token');
}

async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getAuthToken();
  
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const url = `${BACKEND_URL}${endpoint}`;
  console.log(`[API] ${options.method || 'GET'} ${url}`, {
    headers: { ...headers, Authorization: token ? 'Bearer ***' : 'none' },
    body: options.body,
  });

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorData;
    try {
      errorData = await response.json();
    } catch (e) {
      errorData = { message: "Unknown error" };
    }
    
    console.error(`[API] Request failed: ${endpoint}`, {
      status: response.status,
      statusText: response.statusText,
      error: errorData,
      requestBody: options.body && typeof options.body === 'string' ? JSON.parse(options.body) : undefined,
    });
    
    // Extract error message from different possible formats
    const errorMessage = 
      errorData.message || 
      errorData.error || 
      (Array.isArray(errorData) ? errorData.map((e: any) => e.message || e).join(', ') : null) ||
      "API request failed";
    
    throw new Error(errorMessage);
  }

  const text = await response.text();
  if (!text) return null as T;
  try {
    return JSON.parse(text) as T;
  } catch {
    console.warn('[API] Failed to parse JSON response:', text.substring(0, 100));
    return null as T;
  }
}

// Auth API
export const authApi = {
  login: (data: { email: string; password: string }) => 
    apiRequest<any>("/auth/login", { method: "POST", body: JSON.stringify(data) }),
  signup: (data: { email: string; password: string; fullName: string }) => 
    apiRequest<any>("/auth/signup", { method: "POST", body: JSON.stringify(data) }),
  getProfile: () => apiRequest<any>("/auth/profile"),
};

// Farm API
export const farmApi = {
  getInventory: () => apiRequest<any[]>("/farm/inventory"),
  getFarmItems: () => apiRequest<any[]>("/farm/items"),
  
  getUserPlants: (zoneId: string) => apiRequest<any[]>(`/farm/plants?zoneId=${zoneId}`),
  plantSeed: (data: { seedItemId: string; zoneId: string; slotIndex: number }) => 
    apiRequest("/farm/plants", { method: "POST", body: JSON.stringify(data) }),
  waterPlant: (plantId: string) => 
    apiRequest(`/farm/plants/${plantId}/water`, { method: "POST" }),
  harvestPlant: (plantId: string) => 
    apiRequest(`/farm/plants/${plantId}/harvest`, { method: "POST" }),

  getFarmAnimals: () => apiRequest<any[]>("/farm/animals"),
  getUserAnimals: () => apiRequest<any[]>("/farm/animals/user"),
  addAnimal: (animalId: string) => 
    apiRequest(`/farm/animals/${animalId}`, { method: "POST" }),
  feedAnimal: (userAnimalId: string) => 
    apiRequest(`/farm/animals/user/${userAnimalId}/feed`, { method: "POST" }),
  collectFromAnimal: (userAnimalId: string) => 
    apiRequest(`/farm/animals/user/${userAnimalId}/collect`, { method: "POST" }),

  getProductionChains: (zoneId?: string) => 
    apiRequest<any[]>(`/farm/production/chains${zoneId ? `?zoneId=${zoneId}` : ""}`),
  getUserProductions: (zoneId: string) => 
    apiRequest<any[]>(`/farm/production/user?zoneId=${zoneId}`),
  startProduction: (data: { chainId: string; zoneId: string; slotIndex: number }) => 
    apiRequest("/farm/production", { method: "POST", body: JSON.stringify(data) }),
  collectProduction: (productionId: string) => 
    apiRequest(`/farm/production/${productionId}/collect`, { method: "POST" }),

  // Boosters
  getZoneBoosters: (zoneId: string) => 
    apiRequest<any[]>(`/farm/boosters?zoneId=${zoneId}`),
  getUserActiveBoosters: () => 
    apiRequest<any[]>(`/farm/boosters/active`),
  activateBooster: (boosterId: string) => 
    apiRequest(`/farm/boosters/${boosterId}/activate`, { method: "POST" }),
};

// Pet API
export const petApi = {
  getUserPet: () => apiRequest<any>("/pet"),
  createPet: (data: { name: string; type: string }) => {
    console.log('[petApi] createPet called with data:', data);
    const body = JSON.stringify(data);
    console.log('[petApi] Request body:', body);
    return apiRequest("/pet", { method: "POST", body });
  },
  feedPet: () => apiRequest("/pet/feed", { method: "POST" }),
  waterPet: () => apiRequest("/pet/water", { method: "POST" }),
  playWithPet: () => apiRequest("/pet/play", { method: "POST" }),
  useItemOnPet: (data: { itemId: string }) => 
    apiRequest("/pet/use-item", { method: "POST", body: JSON.stringify(data) }),
  getShopItems: () => apiRequest<any[]>("/pet/shop"),
  getUserItems: () => apiRequest<any[]>("/pet/items"),
};

// Users API
export const usersApi = {
  getProfile: () => apiRequest<any>("/users/profile"),
  updateProfile: (data: any) => 
    apiRequest("/users/profile", { method: "PUT", body: JSON.stringify(data) }),
  getUserById: (userId: string) => apiRequest<any>(`/users/${userId}`),
  getTeacherSubjects: () => apiRequest<string[]>("/users/teacher/subjects"),
  updateTeacherSubjects: (zoneIds: string[]) =>
    apiRequest("/users/teacher/subjects", { method: "PUT", body: JSON.stringify({ zoneIds }) }),
  getTeacherStats: async () => {
    return apiRequest<any>('/users/teacher/stats');
  },
  getStudentsList: async (params?: {
    page?: number;
    limit?: number;
    zoneId?: string;
    minLevel?: number;
    search?: string;
  }) => {
    const query = new URLSearchParams();
    if (params?.page) query.append('page', params.page.toString());
    if (params?.limit) query.append('limit', params.limit.toString());
    if (params?.zoneId) query.append('zoneId', params.zoneId);
    if (params?.minLevel) query.append('minLevel', params.minLevel.toString());
    if (params?.search) query.append('search', params.search);
    return apiRequest<any>(`/users/teacher/students?${query.toString()}`);
  },
  getSubmissionsByTeacher: async (params?: {
    page?: number;
    limit?: number;
    zoneId?: string;
    status?: 'pending' | 'reviewed' | 'rejected';
    startDate?: string;
    endDate?: string;
    studentId?: string;
  }) => {
    const query = new URLSearchParams();
    if (params?.page) query.append('page', params.page.toString());
    if (params?.limit) query.append('limit', params.limit.toString());
    if (params?.zoneId) query.append('zoneId', params.zoneId);
    if (params?.status) query.append('status', params.status);
    if (params?.startDate) query.append('startDate', params.startDate);
    if (params?.endDate) query.append('endDate', params.endDate);
    if (params?.studentId) query.append('studentId', params.studentId);
    return apiRequest<any>(`/users/teacher/submissions?${query.toString()}`);
  },
};

// Zones API
export const zonesApi = {
  getAllZones: () => apiRequest<any[]>("/zones"),
  getZoneById: (zoneId: string) => apiRequest<any>(`/zones/${zoneId}`),
  getUserProgress: () => apiRequest<any[]>("/progress"),
};

// Tasks API
export const tasksApi = {
  getAllTasks: () => apiRequest<any[]>("/tasks"),
  getTaskById: (taskId: string) => apiRequest<any>(`/tasks/${taskId}`),
  createTask: (data: any) => 
    apiRequest("/tasks", { method: "POST", body: JSON.stringify(data) }),
  updateTask: (taskId: string, data: any) => 
    apiRequest(`/tasks/${taskId}`, { method: "PATCH", body: JSON.stringify(data) }),
  deleteTask: (taskId: string) => 
    apiRequest(`/tasks/${taskId}`, { method: "DELETE" }),
  submitTask: (taskId: string, data: any) => 
    apiRequest(`/tasks/${taskId}/submit`, { method: "POST", body: JSON.stringify(data) }),
  getSubmissions: (taskId: string) => apiRequest<any[]>(`/tasks/${taskId}/submissions`),
  getUserSubmissions: () => apiRequest<any[]>("/tasks/user/submissions"),
  getSubmissionById: (submissionId: string) => apiRequest<any>(`/tasks/submissions/${submissionId}`),
  gradeSubmission: (submissionId: string, data: any) => 
    apiRequest(`/tasks/submissions/${submissionId}/grade`, { method: "PATCH", body: JSON.stringify(data) }),
  
  // Comments
  createComment: (submissionId: string, data: { commentText: string; fileUrls?: string[] }) =>
    apiRequest(`/tasks/submissions/${submissionId}/comments`, { method: "POST", body: JSON.stringify(data) }),
  getComments: (submissionId: string) => apiRequest<any[]>(`/tasks/submissions/${submissionId}/comments`),
  updateComment: (commentId: string, data: { commentText: string }) =>
    apiRequest(`/tasks/comments/${commentId}`, { method: "PATCH", body: JSON.stringify(data) }),
  deleteComment: (commentId: string) =>
    apiRequest(`/tasks/comments/${commentId}`, { method: "DELETE" }),
  
  // Templates
  createTemplate: (data: any) =>
    apiRequest("/tasks/templates", { method: "POST", body: JSON.stringify(data) }),
  getTemplates: () => apiRequest<any[]>("/tasks/templates"),
  updateTemplate: (templateId: string, data: any) =>
    apiRequest(`/tasks/templates/${templateId}`, { method: "PATCH", body: JSON.stringify(data) }),
  deleteTemplate: (templateId: string) =>
    apiRequest(`/tasks/templates/${templateId}`, { method: "DELETE" }),
  
  // Analytics
  getComparativeAnalytics: (params: { zoneIds?: string[]; startDate1?: string; endDate1?: string; startDate2?: string; endDate2?: string }) => {
    const searchParams = new URLSearchParams();
    if (params.zoneIds) params.zoneIds.forEach(id => searchParams.append('zoneIds', id));
    if (params.startDate1) searchParams.append('startDate1', params.startDate1);
    if (params.endDate1) searchParams.append('endDate1', params.endDate1);
    if (params.startDate2) searchParams.append('startDate2', params.startDate2);
    if (params.endDate2) searchParams.append('endDate2', params.endDate2);
    return apiRequest<any>(`/tasks/analytics/comparative?${searchParams.toString()}`);
  },
};

// Achievements API
export const achievementsApi = {
  getAllAchievements: () => apiRequest<any[]>("/achievements"),
  getUserAchievements: () => apiRequest<any[]>("/achievements/user"),
};

// Progress API
export const progressApi = {
  getUserProgress: () => apiRequest<any[]>("/progress/user"),
  getZoneProgress: (zoneId: string) => apiRequest<any>(`/progress/${zoneId}`),
  getLeaderboard: (params?: { zoneId?: string; sortBy?: 'score' | 'achievements' | 'avgGrade' }) => {
    const searchParams = new URLSearchParams();
    if (params?.zoneId) searchParams.append('zoneId', params.zoneId);
    if (params?.sortBy) searchParams.append('sortBy', params.sortBy);
    return apiRequest<any[]>(`/progress/leaderboard?${searchParams.toString()}`);
  },
};

// Groups API
export const groupsApi = {
  getGroups: () => apiRequest<any[]>("/groups"),
  getGroupById: (groupId: string) => apiRequest<any>(`/groups/${groupId}`),
  createGroup: (data: { name: string; description?: string; studentIds?: string[] }) =>
    apiRequest("/groups", { method: "POST", body: JSON.stringify(data) }),
  updateGroup: (groupId: string, data: { name?: string; description?: string }) =>
    apiRequest(`/groups/${groupId}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteGroup: (groupId: string) => apiRequest(`/groups/${groupId}`, { method: "DELETE" }),
  addMembers: (groupId: string, studentIds: string[]) =>
    apiRequest(`/groups/${groupId}/members`, { method: "POST", body: JSON.stringify({ studentIds }) }),
  removeMember: (groupId: string, studentId: string) =>
    apiRequest(`/groups/${groupId}/members/${studentId}`, { method: "DELETE" }),
  assignTask: (groupId: string, data: { taskId: string; dueDate?: string }) =>
    apiRequest(`/groups/${groupId}/tasks`, { method: "POST", body: JSON.stringify(data) }),
  getGroupStats: (groupId: string) => apiRequest<any>(`/groups/${groupId}/stats`),
};

// Monitoring API
export const monitoringApi = {
  getAdminStats: () => apiRequest<any>("/monitoring/admin/stats"),
  getWeeklyReports: () => apiRequest<any[]>("/monitoring/weekly-reports"),
  getWeeklyReport: (weekStart: string) => apiRequest<any>(`/monitoring/weekly-report?weekStart=${weekStart}`),
};

// Storage API
export const storageApi = {
  uploadTaskAttachment: async (taskId: string, file: File) => {
    const token = getAuthToken();
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await fetch(`${BACKEND_URL}/storage/task/${taskId}/upload`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Upload failed' }));
      throw new Error(error.message);
    }
    
    return response.json();
  },
  uploadCommentAttachment: async (submissionId: string, file: File) => {
    const token = getAuthToken();
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await fetch(`${BACKEND_URL}/storage/submission/${submissionId}/upload`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Upload failed' }));
      throw new Error(error.message);
    }
    
    return response.json();
  },
};

// Generic API client for custom requests
export const apiClient = {
  get: <T = any>(endpoint: string) => apiRequest<T>(endpoint, { method: "GET" }),
  post: async <T = any>(endpoint: string, data?: any, config?: { headers?: Record<string, string> }) => {
    // Handle FormData separately (for file uploads)
    if (data instanceof FormData) {
      const token = getAuthToken();
      const headers: Record<string, string> = {
        ...config?.headers,
      };
      
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const response = await fetch(`${BACKEND_URL}${endpoint}`, {
        method: "POST",
        headers,
        body: data,
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: "Upload failed" }));
        throw new Error(error.message);
      }

      return response.json() as Promise<T>;
    }
    
    // Regular JSON requests
    return apiRequest<T>(endpoint, { method: "POST", body: data ? JSON.stringify(data) : undefined });
  },
  put: <T = any>(endpoint: string, data?: any) => 
    apiRequest<T>(endpoint, { method: "PUT", body: data ? JSON.stringify(data) : undefined }),
  patch: <T = any>(endpoint: string, data?: any) => 
    apiRequest<T>(endpoint, { method: "PATCH", body: data ? JSON.stringify(data) : undefined }),
  delete: <T = any>(endpoint: string) => apiRequest<T>(endpoint, { method: "DELETE" }),
};
