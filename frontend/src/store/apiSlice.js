import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

const baseUrl = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';

const baseQuery = fetchBaseQuery({
    baseUrl,
    prepareHeaders: (headers) => {
        const token = localStorage.getItem('token');
        if (token) {
            headers.set('Authorization', `Bearer ${token}`);
        }
        // Add platform header for all requests
        headers.set('platform', 'web');
        return headers;
    },
});

const baseQueryWithReauth = async (args, api, extraOptions) => {
    let result = await baseQuery(args, api, extraOptions);
    const url = typeof args === 'string' ? args : args.url;
    
    // If we get a 401 Unauthorized and it's not the login endpoint
    if (result.error && result.error.status === 401 && url !== '/api/sign-in') {
        window.dispatchEvent(new Event('auth:unauthorized'));
    }
    
    return result;
};

export const apiSlice = createApi({
    reducerPath: 'api',
    baseQuery: baseQueryWithReauth,
    tagTypes: [
        'User', 'Staff', 'Company', 'CompanyRequest', 'Manager', 'Stats', 'Task', 
        'TaskComment', 'TaskDocument', 'TaskChat', 'LeaveType', 'LeavePolicy', 
        'WorkSchedule', 'Attendance', 'Position', 'Overtime', 'Leave', 'Thread', 
        'Message', 'Team', 'Holiday', 'EmployeeSalary', 'Faq', 'LiveLocation'
    ],
    endpoints: (builder) => ({
        // Auth endpoints
        login: builder.mutation({
            query: (credentials) => ({
                url: '/api/sign-in',
                method: 'POST',
                body: credentials,
            }),
        }),
        signup: builder.mutation({
            query: (formData) => ({
                url: '/api/user-add',
                method: 'POST',
                body: formData,
                // Don't set Content-Type — browser sets it automatically for FormData
                formData: true,
            }),
            invalidatesTags: ['Manager', 'User'],
        }),
        logoutUser: builder.mutation({
            query: () => ({
                url: '/api/logout',
                method: 'POST',
            }),
        }),
        forgotPassword: builder.mutation({
            query: (body) => ({
                url: '/api/forgot-password',
                method: 'POST',
                body,
            }),
        }),
        verifyOtp: builder.mutation({
            query: (body) => ({
                url: '/api/verify-otp',
                method: 'POST',
                body,
            }),
        }),
        resetPassword: builder.mutation({
            query: (body) => ({
                url: '/api/reset-password',
                method: 'POST',
                body,
            }),
        }),

        // User endpoints
        getUsers: builder.query({
            query: () => '/users/list',
            providesTags: ['User'],
        }),
        createUser: builder.mutation({
            query: (userData) => ({
                url: '/users/create',
                method: 'POST',
                body: userData,
            }),
            invalidatesTags: ['User'],
        }),
        updateUser: builder.mutation({
            query: ({ id, ...userData }) => ({
                url: `/users/${id}`,
                method: 'PUT',
                body: userData,
            }),
            invalidatesTags: ['User'],
        }),
        deleteUser: builder.mutation({
            query: (id) => ({
                url: `/users/${id}`,
                method: 'DELETE',
            }),
            invalidatesTags: ['User'],
        }),

        // Staff endpoints
        getStaff: builder.query({
            query: (companyId) => `/staff/list${companyId ? `?companyId=${companyId}` : ''}`,
            providesTags: ['Staff'],
        }),
        createStaff: builder.mutation({
            query: (staffData) => ({
                url: '/staff/create',
                method: 'POST',
                body: staffData,
            }),
            invalidatesTags: ['Staff'],
        }),
        updateStaff: builder.mutation({
            query: ({ id, ...staffData }) => ({
                url: `/staff/${id}`,
                method: 'PUT',
                body: staffData,
            }),
            invalidatesTags: ['Staff'],
        }),
        deleteStaff: builder.mutation({
            query: (id) => ({
                url: `/staff/${id}`,
                method: 'DELETE',
            }),
            invalidatesTags: ['Staff'],
        }),

        // Company endpoints
        getCompanies: builder.query({
            query: () => '/api/v1/company/list',
            providesTags: ['Company'],
        }),
        getCompanyById: builder.query({
            query: (id) => `/companies/${id}`,
            providesTags: (result, error, id) => [{ type: 'Company', id }],
        }),
        deleteCompany: builder.mutation({
            query: (id) => ({
                url: `/api/v1/company/delete/${id}`,
                method: 'DELETE',
            }),
            invalidatesTags: ['Company'],
        }),

        // Roles & Permissions endpoints
        getRoles: builder.query({
            query: () => '/api/v1/roles/',
            providesTags: ['Role'],
        }),
        createRole: builder.mutation({
            query: (body) => ({
                url: '/api/v1/roles',
                method: 'POST',
                body,
            }),
            invalidatesTags: ['Role'],
        }),
        deleteRole: builder.mutation({
            query: (id) => ({
                url: `/api/v1/roles/delete/${id}`,
                method: 'DELETE',
            }),
            invalidatesTags: ['Role'],
        }),
        getPermissions: builder.query({
            query: () => '/api/v1/permissions',
            providesTags: ['Permission'],
        }),
        saveRolePermissions: builder.mutation({
            query: ({ roleId, permissions }) => ({
                url: `/api/v1/roles/${roleId}/permissions`,
                method: 'POST',
                body: { permissions },
            }),
            invalidatesTags: ['Role', 'Permission'],
        }),
        getNationalities: builder.query({
            query: () => '/api/v1/nationalities',
            providesTags: ['Nationality'],
        }),
        getUsersByRole: builder.query({
            query: ({ roleId, companyId }) => `/api/v1/users?role_id=${roleId}&company_id=${companyId}`,
            providesTags: ['User'],
        }),

        // Company Requests endpoints
        getCompanyRequests: builder.query({
            query: ({ status } = {}) => `/company-requests/list${status ? `?status=${status}` : ''}`,
            providesTags: ['CompanyRequest'],
        }),
        approveCompanyRequest: builder.mutation({
            query: ({ id, adminId }) => ({
                url: `/company-requests/${id}/approve`,
                method: 'POST',
                body: { adminId },
            }),
            invalidatesTags: ['CompanyRequest', 'User', 'Company'],
        }),
        rejectCompanyRequest: builder.mutation({
            query: ({ id, adminId, reason }) => ({
                url: `/company-requests/${id}/reject`,
                method: 'POST',
                body: { adminId, reason },
            }),
            invalidatesTags: ['CompanyRequest'],
        }),
        createAndApproveCompany: builder.mutation({
            query: (formData) => ({
                url: '/api/v1/company/save',
                method: 'POST',
                body: formData,
            }),
            invalidatesTags: ['CompanyRequest', 'User', 'Company'],
        }),

        // Stats endpoints
        getStats: builder.query({
            query: () => '/stats/overview',
            providesTags: ['Stats'],
        }),

        // Manager endpoints
        getManagers: builder.query({
            query: (companyId) => `/managers/list?companyId=${companyId}`,
            providesTags: ['Manager'],
        }),
        getUserFetch: builder.query({
            query: ({ company_id, role } = {}) => {
                const p = new URLSearchParams();
                if (company_id) p.append('company_id', company_id);
                if (role)       p.append('role', role);
                return `/api/user-fetch?${p.toString()}`;
            },
            providesTags: ['Manager', 'User'],
        }),
        getMyCreatedUsers: builder.query({
            query: ({ company_id, created_by_user }) =>
                `/api/company/${company_id}/my-created-users?created_by_user=${created_by_user}&company_id=${company_id}`,
            providesTags: ['User'],
        }),
        updateCreatedBy: builder.mutation({
            query: ({ user_id, created_by_user }) => ({
                url: '/api/users/update-created-by',
                method: 'POST',
                body: { user_id, created_by_user },
            }),
            invalidatesTags: ['User', 'Manager'],
        }),
        createManager: builder.mutation({
            query: (managerData) => ({
                url: '/managers/create',
                method: 'POST',
                body: managerData,
            }),
            invalidatesTags: ['Manager', 'User'],
        }),
        updateManager: builder.mutation({
            query: ({ id, ...managerData }) => ({
                url: `/managers/${id}`,
                method: 'PUT',
                body: managerData,
            }),
            invalidatesTags: ['Manager'],
        }),
        deleteManager: builder.mutation({
            query: ({ id, companyId }) => ({
                url: `/managers/${id}`,
                method: 'DELETE',
                body: { companyId },
            }),
            invalidatesTags: ['Manager'],
        }),

        // Task endpoints  ─── all using /api/v1/tasks-admin ───────────────

        getTasks: builder.query({
            query: ({ companyId, staffId, status }) => {
                const params = new URLSearchParams();
                if (companyId) params.append('company_id', companyId);
                if (staffId) params.append('user_id', staffId);
                if (status) params.append('status', status);
                return `/api/v1/tasks-admin?${params.toString()}`;
            },
            providesTags: ['Task'],
        }),
        getTaskById: builder.query({
            query: (id) => `/tasks/${id}`,
            providesTags: (result, error, id) => [{ type: 'Task', id }],
        }),
        createTask: builder.mutation({
            query: (taskData) => ({
                url: '/tasks/create',
                method: 'POST',
                body: taskData,
            }),
            invalidatesTags: ['Task'],
        }),


        getAdminTasks: builder.query({
            query: ({ company_id }) =>
                `/api/v1/tasks-admin?company_id=${company_id}`,
            providesTags: ['Task'],
        }),
        getAssignedTasks: builder.query({
            query: () => `/api/v1/tasks-admin/tasks/assigned`,
            providesTags: ['Task'],
        }),
        createAdminTask: builder.mutation({
            // Also used for update: include `id` in body to update an existing task
            query: (taskData) => ({
                url: '/api/v1/tasks-admin/add-update',
                method: 'POST',
                body: taskData,
            }),
            invalidatesTags: ['Task'],
        }),
        assignTask: builder.mutation({
            query: ({ taskId, company_id, user_ids }) => ({
                url: `/api/v1/tasks/${taskId}/assign`,
                method: 'POST',
                body: { company_id, user_ids },
            }),
            invalidatesTags: ['Task'],
        }),
        assignTeamTask: builder.mutation({
            query: ({ taskId, team_id }) => ({
                url: `/api/v1/tasks/${taskId}/assign-team`,
                method: 'POST',
                body: { team_id },
            }),
            invalidatesTags: ['Task'],
        }),
        unassignTask: builder.mutation({
            query: ({ taskId, user_ids }) => ({
                url: `/api/v1/tasks/${taskId}/unassign`,
                method: 'POST',
                body: { user_ids },
            }),
            invalidatesTags: ['Task'],
        }),
        updateTask: builder.mutation({
            query: ({ id, ...taskData }) => ({
                url: `/tasks/${id}`,
                method: 'PUT',
                body: taskData,
            }),
            invalidatesTags: ['Task'],
        }),
        deleteTask: builder.mutation({
            query: (id) => ({
                url: `/tasks/${id}`,
                method: 'DELETE',
            }),
            invalidatesTags: ['Task'],
        }),
        updateTaskStatus: builder.mutation({
            query: ({ id, status }) => ({
                url: `/tasks/${id}/status`,
                method: 'PATCH',
                body: { status },
            }),
            invalidatesTags: ['Task'],
        }),

        // Task Comments
        getTaskComments: builder.query({
            query: (taskId) => `/tasks/${taskId}/comments`,
            providesTags: (result, error, taskId) => [{ type: 'TaskComment', id: taskId }],
        }),
        addTaskComment: builder.mutation({
            query: ({ taskId, userId, message }) => ({
                url: `/tasks/${taskId}/comments`,
                method: 'POST',
                body: { userId, message },
            }),
            invalidatesTags: (result, error, { taskId }) => [{ type: 'TaskComment', id: taskId }],
        }),
        deleteTaskComment: builder.mutation({
            query: ({ taskId, commentId }) => ({
                url: `/tasks/${taskId}/comments/${commentId}`,
                method: 'DELETE',
            }),
            invalidatesTags: (result, error, { taskId }) => [{ type: 'TaskComment', id: taskId }],
        }),

        // Task Documents
        getTaskDocuments: builder.query({
            query: (taskId) => `/tasks/${taskId}/documents`,
            providesTags: (result, error, taskId) => [{ type: 'TaskDocument', id: taskId }],
        }),
        uploadTaskDocument: builder.mutation({
            query: ({ taskId, formData }) => ({
                url: `/tasks/${taskId}/documents`,
                method: 'POST',
                body: formData,
            }),
            invalidatesTags: (result, error, { taskId }) => [{ type: 'TaskDocument', id: taskId }],
        }),
        deleteTaskDocument: builder.mutation({
            query: ({ taskId, docId }) => ({
                url: `/tasks/${taskId}/documents/${docId}`,
                method: 'DELETE',
            }),
            invalidatesTags: (result, error, { taskId }) => [{ type: 'TaskDocument', id: taskId }],
        }),

        // Task Chat
        getTaskChat: builder.query({
            query: (taskId) => `/tasks/${taskId}/chat`,
            providesTags: (result, error, taskId) => [{ type: 'TaskChat', id: taskId }],
        }),
        sendTaskChatMessage: builder.mutation({
            query: ({ taskId, userId, message }) => ({
                url: `/tasks/${taskId}/chat`,
                method: 'POST',
                body: { userId, message },
            }),
            invalidatesTags: (result, error, { taskId }) => [{ type: 'TaskChat', id: taskId }],
        }),

        // My Tasks per user — GET /api/v1/my-tasks?company_id=&user_id=
        getMyTasks: builder.query({
            query: ({ company_id, user_id, status, q } = {}) => {
                const p = new URLSearchParams();
                if (company_id) p.append('company_id', company_id);
                if (user_id)    p.append('user_id', user_id);
                if (status)     p.append('status', status);
                if (q)          p.append('q', q);
                return `/api/v1/my-tasks?${p.toString()}`;
            },
            providesTags: ['Task'],
        }),
        // Task Action — POST /api/v1/tasks/{id}/action  {action, note}
        taskAction: builder.mutation({
            query: ({ taskId, action, note }) => ({
                url: `/api/v1/tasks/${taskId}/action`,
                method: 'POST',
                body: { action, note },
            }),
            invalidatesTags: ['Task'],
        }),
        // Task Feedback (comment + optional file) — POST /api/v1/tasks/{id}/feedback
        taskFeedback: builder.mutation({
            query: ({ taskId, comment, file }) => {
                const fd = new FormData();
                fd.append('comment', comment);
                if (file) fd.append('file', file);
                return { url: `/api/v1/tasks/${taskId}/feedback`, method: 'POST', body: fd };
            },
            invalidatesTags: ['Task'],
        }),

        // ── Leave Types ── GET / POST / DELETE ──────────────────────────
        getLeaveTypes: builder.query({
            query: () => '/api/v1/leave-types',
            providesTags: ['LeaveType'],
        }),
        addUpdateLeaveType: builder.mutation({
            query: (body) => ({
                url: '/api/v1/leave-types/add-update',
                method: 'POST',
                body,
            }),
            invalidatesTags: ['LeaveType'],
        }),
        deleteLeaveType: builder.mutation({
            query: (id) => ({
                url: `/api/v1/leave-types/${id}`,
                method: 'DELETE',
            }),
            invalidatesTags: ['LeaveType'],
        }),

        // ── Leave Policies ── GET / POST ─────────────────────────────────
        getLeavePolicies: builder.query({
            query: ({ company_id, year, role_id, name } = {}) => {
                const p = new URLSearchParams();
                if (company_id) p.append('company_id', company_id);
                if (year)       p.append('year', year);
                if (role_id)    p.append('role_id', role_id);
                if (name)       p.append('name', name);
                return `/api/v1/leave-policies?${p.toString()}`;
            },
            providesTags: ['LeavePolicy'],
        }),
        addUpdateLeavePolicy: builder.mutation({
            query: (body) => ({
                url: '/api/v1/leave-policies/add-update',
                method: 'POST',
                body,
            }),
            invalidatesTags: ['LeavePolicy'],
        }),

        // ── Work Schedules ── POST ───────────────────────────────────────
        addUpdateWorkSchedule: builder.mutation({
            query: (body) => ({
                url: '/api/v1/work-schedules/add-update',
                method: 'POST',
                body,
            }),
            invalidatesTags: ['WorkSchedule'],
        }),

        // Stats endpoints
        getDashboardSummary: builder.query({
            query: (companyId) => {
                const p = new URLSearchParams();
                if (companyId) p.append('company_id', companyId);
                return `/api/v1/dashboard/summary?${p.toString()}`;
            },
            providesTags: ['Stats'],
        }),
        getSuperAdminOverview: builder.query({
            query: () => '/stats/superadmin/overview',
            providesTags: ['Stats'],
        }),
        getCompanyDashboard: builder.query({
            query: (companyId) => `/stats/company/${companyId}/dashboard`,
            providesTags: (result, error, companyId) => [{ type: 'Stats', id: companyId }],
        }),
        getDashboardStats: builder.query({
            query: ({ companyId, role }) => ({
                url: '/stats/dashboard',
                params: { companyId, role },
            }),
            providesTags: ['Stats'],
        }),

        // ── Attendance endpoints ─────────────────────────────────────────
        getAllAttendances: builder.query({
            query: ({ date } = {}) => {
                const p = new URLSearchParams();
                if (date) p.append('date', date);
                return `/api/v1/attendances/all?${p.toString()}`;
            },
            providesTags: ['Attendance'],
        }),
        getAttendanceReport: builder.query({
            query: ({ range, from, to, company_id } = {}) => {
                const p = new URLSearchParams();
                if (range) p.append('range', range);
                if (from)  p.append('from', from);
                if (to)    p.append('to', to);
                if (company_id) p.append('company_id', company_id);
                return `/api/v1/attendances/report?${p.toString()}`;
            },
            providesTags: ['Attendance'],
        }),
        getAttendanceExportUrl: builder.query({
            query: ({ range, from, to } = {}) => {
                const p = new URLSearchParams();
                if (range) p.append('range', range);
                if (from)  p.append('from', from);
                if (to)    p.append('to', to);
                return `/api/v1/attendances/my-attendance/report/export?${p.toString()}`;
            },
        }),

        // ── Positions ────────────────────────────────────────────────────────
        getPositions: builder.query({
            query: () => '/api/v1/positions',
            providesTags: ['Position'],
        }),
        getPositionById: builder.query({
            query: (id) => `/api/v1/positions/show/${id}`,
            providesTags: (result, error, id) => [{ type: 'Position', id }],
        }),
        createPosition: builder.mutation({
            query: (body) => ({
                url: '/api/v1/positions/store',
                method: 'POST',
                body,
            }),
            invalidatesTags: ['Position'],
        }),
        updatePosition: builder.mutation({
            query: ({ id, ...body }) => ({
                url: `/api/v1/positions/update/${id}`,
                method: 'POST',
                body,
            }),
            invalidatesTags: ['Position'],
        }),
        deletePosition: builder.mutation({
            query: (id) => ({
                url: `/api/v1/positions/delete/${id}`,
                method: 'DELETE',
            }),
            invalidatesTags: ['Position'],
        }),
        changePositionStatus: builder.mutation({
            query: ({ id, status }) => ({
                url: `/api/v1/positions/change-status/${id}`,
                method: 'POST',
                body: { status },
            }),
            invalidatesTags: ['Position'],
        }),

        // ── Overtimes ────────────────────────────────────────────────────────
        getOvertimes: builder.query({
            query: () => '/api/v1/overtimes',
            providesTags: ['Overtime'],
        }),
        createOvertime: builder.mutation({
            query: (body) => ({
                url: '/api/v1/overtimes/add',
                method: 'POST',
                body,
            }),
            invalidatesTags: ['Overtime'],
        }),

        // ── Leaves (Global & Admin) ──────────────────────────────────────────
        getLeaves: builder.query({
            query: () => '/api/v1/leaves',
            providesTags: ['Leave'],
        }),
        applyLeaveGlobal: builder.mutation({
            query: (body) => ({
                url: '/api/v1/leaves/apply',
                method: 'POST',
                body,
            }),
            invalidatesTags: ['Leave'],
        }),
        leaveRequestAction: builder.mutation({
            query: ({ id, action, note }) => ({
                url: `/api/v1/leave-requests/${id}/action`,
                method: 'POST',
                body: { action, note },
            }),
            invalidatesTags: ['Leave'],
        }),

        // ── My Leaves (Employee Dashboard) ───────────────────────────────────
        getMyLeavesSummary: builder.query({
            query: () => '/api/v1/my-leaves/summary',
            providesTags: ['Leave'],
        }),
        getMyLeavesHistory: builder.query({
            query: () => '/api/v1/my-leaves/history',
            providesTags: ['Leave'],
        }),
        applyMyLeave: builder.mutation({
            query: (body) => ({
                url: '/api/v1/my-leaves/apply',
                method: 'POST',
                body,
            }),
            invalidatesTags: ['Leave'],
        }),

        // ── Block / Unblock ──────────────────────────────────────────────────
        blockUserById: builder.mutation({
            query: (body) => ({ url: '/api/v1/block', method: 'POST', body }),
            invalidatesTags: ['User', 'Staff', 'Manager'],
        }),
        unblockUserById: builder.mutation({
            query: (body) => ({ url: '/api/v1/unblock', method: 'DELETE', body }),
            invalidatesTags: ['User', 'Staff', 'Manager'],
        }),
        blockUserInPath: builder.mutation({
            query: (userId) => ({ url: `/api/v1/users/${userId}/block`, method: 'POST' }),
            invalidatesTags: ['User', 'Staff', 'Manager'],
        }),
        unblockUserInPath: builder.mutation({
            query: (userId) => ({ url: `/api/v1/users/${userId}/block`, method: 'DELETE' }),
            invalidatesTags: ['User', 'Staff', 'Manager'],
        }),

        // ── Threads & Messages (Chat) ────────────────────────────────────────
        getThreads: builder.query({
            query: () => '/api/v1/threads',
            providesTags: ['Thread'],
        }),
        createDirectThread: builder.mutation({
            query: (body) => ({ url: '/api/v1/threads/direct', method: 'POST', body }),
            invalidatesTags: ['Thread'],
        }),
        createGroupThread: builder.mutation({
            query: (body) => ({ url: '/api/v1/threads/group', method: 'POST', body }),
            invalidatesTags: ['Thread'],
        }),
        addThreadMembers: builder.mutation({
            query: ({ threadId, user_ids }) => ({ url: `/api/v1/threads/${threadId}/members`, method: 'POST', body: { user_ids } }),
            invalidatesTags: ['Thread'],
        }),
        leaveThread: builder.mutation({
            query: (threadId) => ({ url: `/api/v1/threads/${threadId}/leave`, method: 'POST' }),
            invalidatesTags: ['Thread'],
        }),
        getThreadMembers: builder.query({
            query: (threadId) => `/api/v1/threads/${threadId}/members`,
            providesTags: ['User', 'Thread'],
        }),
        promoteThreadAdmin: builder.mutation({
            query: ({ threadId, user_id }) => ({ url: `/api/v1/threads/${threadId}/admins`, method: 'POST', body: { user_id } }),
            invalidatesTags: ['Thread'],
        }),
        demoteThreadAdminId: builder.mutation({
            query: ({ threadId, userId }) => ({ url: `/api/v1/threads/${threadId}/admins/${userId}`, method: 'DELETE' }),
            invalidatesTags: ['Thread'],
        }),
        demoteThreadAdmin: builder.mutation({
            query: ({ threadId, user_id }) => ({ url: `/api/v1/threads/${threadId}/admins`, method: 'DELETE', body: { user_id } }),
            invalidatesTags: ['Thread'],
        }),
        getMessages: builder.query({
            query: (threadId) => `/api/v1/threads/${threadId}/messages`,
            providesTags: ['Message'],
        }),
        sendMessage: builder.mutation({
            query: ({ threadId, formData }) => ({ url: `/api/v1/threads/${threadId}/messages`, method: 'POST', body: formData }),
            invalidatesTags: ['Message', 'Thread'],
        }),
        deleteMessage: builder.mutation({
            query: (messageId) => ({ url: `/api/v1/messages/${messageId}`, method: 'DELETE' }),
            invalidatesTags: ['Message'],
        }),
        markThreadRead: builder.mutation({
            query: (threadId) => ({ url: `/api/v1/threads/${threadId}/read`, method: 'POST' }),
            invalidatesTags: ['Thread', 'Message'],
        }),
        getMessageReads: builder.query({
            query: (messageId) => `/api/v1/messages/${messageId}/reads`,
            providesTags: ['Message'],
        }),

        // ── Teams ────────────────────────────────────────────────────────────
        getTeams: builder.query({
            query: () => '/api/v1/teams/fetch',
            providesTags: ['Team'],
        }),
        addUpdateTeam: builder.mutation({
            query: (body) => ({ url: '/api/v1/teams/add-update', method: 'POST', body }),
            invalidatesTags: ['Team'],
        }),
        deleteTeam: builder.mutation({
            query: (teamId) => ({ url: `/api/v1/teams/${teamId}`, method: 'DELETE' }),
            invalidatesTags: ['Team'],
        }),

        // ── Holiday Calendar ─────────────────────────────────────────────────
        getHolidayCalendarsYear: builder.query({
            query: ({ company_id, year } = {}) => {
                const p = new URLSearchParams();
                if (company_id) p.append('company_id', company_id);
                if (year) p.append('year', year);
                return `/api/v1/holiday-calendars/year?${p.toString()}`;
            },
            providesTags: ['Holiday'],
        }),
        addUpdateHoliday: builder.mutation({
            query: (body) => ({ url: '/api/v1/holiday-calendars/holidays/add-update', method: 'POST', body }),
            invalidatesTags: ['Holiday'],
        }),
        deleteHoliday: builder.mutation({
            query: (body) => ({ url: '/api/v1/holiday-calendars/holidays/delete', method: 'DELETE', body }),
            invalidatesTags: ['Holiday'],
        }),

        // ── Leave Balances ───────────────────────────────────────────────────
        generateLeaveBalances: builder.mutation({
            query: (body) => ({ url: '/api/v1/leave-balances/generate', method: 'POST', body }),
            invalidatesTags: ['LeavePolicy', 'Leave'],
        }),

        // ── Employee Salaries ────────────────────────────────────────────────
        getEmployeeSalaries: builder.query({
            query: () => '/api/v1/employee-salaries',
            providesTags: ['EmployeeSalary'],
        }),
        getEmployeeSalaryById: builder.query({
            query: (id) => `/api/v1/employee-salaries/${id}`,
            providesTags: (result, error, id) => [{ type: 'EmployeeSalary', id }],
        }),
        addUpdateEmployeeSalary: builder.mutation({
            query: (body) => ({ url: '/api/v1/employee-salaries/add-update', method: 'POST', body }),
            invalidatesTags: ['EmployeeSalary'],
        }),
        deleteEmployeeSalary: builder.mutation({
            query: (id) => ({ url: `/api/v1/employee-salaries/${id}`, method: 'DELETE' }),
            invalidatesTags: ['EmployeeSalary'],
        }),
        getSalarySlipPdfUrl: builder.query({
            query: ({ id } = {}) => `/api/v1/salary-slip/pdf?id=${id}`,
        }),
        getSalarySlipPdfRangeUrl: builder.query({
            query: ({ from, to } = {}) => `/api/v1/salary-slip/pdf-range?from=${from}&to=${to}`,
        }),

        // ── Live Location ────────────────────────────────────────────────────
        pingLocation: builder.mutation({
            query: (body) => ({ url: '/api/v1/live/location/ping', method: 'POST', body }),
            invalidatesTags: ['LiveLocation'],
        }),
        getMyLocation: builder.query({
            query: () => '/api/v1/live/location/me',
            providesTags: ['LiveLocation'],
        }),
        getCompanyLocations: builder.query({
            query: () => '/api/v1/live/location/company',
            providesTags: ['LiveLocation'],
        }),
        getUserLocation: builder.query({
            query: (userId) => `/api/v1/live/location/user/${userId}`,
            providesTags: ['LiveLocation'],
        }),

        // ── FAQs ─────────────────────────────────────────────────────────────
        getFaqsUser: builder.query({
            query: () => '/api/v1/faqs',
            providesTags: ['Faq'],
        }),
        getFaqsAdmin: builder.query({
            query: () => '/api/v1/admin/faqs', // Assuming admin prefix based on context
            providesTags: ['Faq'],
        }),
        addUpdateFaq: builder.mutation({
            query: (body) => ({ url: '/api/v1/faqs/add-update', method: 'POST', body }),
            invalidatesTags: ['Faq'],
        }),
        getFaqById: builder.query({
            query: (id) => `/api/v1/faqs/${id}`,
            providesTags: (result, error, id) => [{ type: 'Faq', id }],
        }),
        deleteFaq: builder.mutation({
            query: (id) => ({ url: `/api/v1/faqs/${id}`, method: 'DELETE' }),
            invalidatesTags: ['Faq'],
        }),
        toggleFaq: builder.mutation({
            query: (id) => ({ url: `/api/v1/faqs/${id}/toggle`, method: 'POST' }),
            invalidatesTags: ['Faq'],
        }),
        
        // ── Additional Items ─────────────────────────────────────────────────
        getMyCalendarSummary: builder.query({
            query: ({ month, year, company_id }) => `/api/v1/my-calendar/summary?month=${month}&year=${year}&company_id=${company_id}`,
        }),
        markAttendance: builder.mutation({
            query: (body) => ({ url: '/api/v1/attendances/mark', method: 'POST', body }),
            invalidatesTags: ['Attendance'],
        }),
        getAttendanceDateDetail: builder.query({
            query: ({ date, company_id }) => `/api/v1/attendances/date-detail?date=${date}&company_id=${company_id}`,
            providesTags: ['Attendance'],
        }),
        getAttendanceHistory: builder.query({
            query: ({ month, year, company_id }) => `/api/v1/attendances/history?month=${month}&year=${year}&company_id=${company_id}`,
            providesTags: ['Attendance'],
        }),
    }),
});

export const {
    // Auth
    useLoginMutation,
    useSignupMutation,
    useLogoutUserMutation,
    useForgotPasswordMutation,
    useVerifyOtpMutation,
    useResetPasswordMutation,
    useGetNationalitiesQuery,
    useGetUsersByRoleQuery,

    // Users
    useGetUsersQuery,
    useCreateUserMutation,
    useUpdateUserMutation,
    useDeleteUserMutation,

    // Staff
    useGetStaffQuery,
    useCreateStaffMutation,
    useUpdateStaffMutation,
    useDeleteStaffMutation,

    // Companies
    useGetCompaniesQuery,
    useGetCompanyByIdQuery,
    useDeleteCompanyMutation,

    // Company Requests
    useGetCompanyRequestsQuery,
    useApproveCompanyRequestMutation,
    useRejectCompanyRequestMutation,
    useCreateAndApproveCompanyMutation,

    // Stats
    useGetDashboardSummaryQuery,
    useGetSuperAdminOverviewQuery,
    useGetCompanyDashboardQuery,
    useGetDashboardStatsQuery,

    // Roles & Permissions
    useGetRolesQuery,
    useCreateRoleMutation,
    useDeleteRoleMutation,
    useGetPermissionsQuery,
    useSaveRolePermissionsMutation,

    // Managers
    useGetManagersQuery,
    useGetUserFetchQuery,
    useGetMyCreatedUsersQuery,
    useUpdateCreatedByMutation,
    useCreateManagerMutation,
    useUpdateManagerMutation,
    useDeleteManagerMutation,

    // Tasks  ── /api/v1/tasks-admin ──
    useGetTasksQuery,
    useGetTaskByIdQuery,
    useCreateTaskMutation,
    useGetAdminTasksQuery,
    useGetAssignedTasksQuery,
    useCreateAdminTaskMutation,
    useAssignTaskMutation,
    useAssignTeamTaskMutation,
    useUnassignTaskMutation,
    useUpdateTaskMutation,
    useDeleteTaskMutation,
    useUpdateTaskStatusMutation,

    // Task Comments
    useGetTaskCommentsQuery,
    useAddTaskCommentMutation,
    useDeleteTaskCommentMutation,

    // Task Documents
    useGetTaskDocumentsQuery,
    useUploadTaskDocumentMutation,
    useDeleteTaskDocumentMutation,

    // Task Chat
    useGetTaskChatQuery,
    useSendTaskChatMessageMutation,

    // My Tasks / Action / Feedback
    useGetMyTasksQuery,
    useTaskActionMutation,
    useTaskFeedbackMutation,

    // Leave Types
    useGetLeaveTypesQuery,
    useAddUpdateLeaveTypeMutation,
    useDeleteLeaveTypeMutation,

    // Leave Policies
    useGetLeavePoliciesQuery,
    useAddUpdateLeavePolicyMutation,

    // Work Schedules
    useAddUpdateWorkScheduleMutation,

    // Attendance
    useGetAllAttendancesQuery,
    useGetAttendanceReportQuery,
    useGetAttendanceExportUrlQuery,

    // NEW EXPORTS 
    // Positions
    useGetPositionsQuery,
    useGetPositionByIdQuery,
    useCreatePositionMutation,
    useUpdatePositionMutation,
    useDeletePositionMutation,
    useChangePositionStatusMutation,

    // Overtimes
    useGetOvertimesQuery,
    useCreateOvertimeMutation,

    // Leaves
    useGetLeavesQuery,
    useApplyLeaveGlobalMutation,
    useLeaveRequestActionMutation,
    useGetMyLeavesSummaryQuery,
    useGetMyLeavesHistoryQuery,
    useApplyMyLeaveMutation,
    useGenerateLeaveBalancesMutation,

    // Block/Unblock
    useBlockUserByIdMutation,
    useUnblockUserByIdMutation,
    useBlockUserInPathMutation,
    useUnblockUserInPathMutation,

    // Threads/Messages
    useGetThreadsQuery,
    useCreateDirectThreadMutation,
    useCreateGroupThreadMutation,
    useAddThreadMembersMutation,
    useLeaveThreadMutation,
    useGetThreadMembersQuery,
    usePromoteThreadAdminMutation,
    useDemoteThreadAdminIdMutation,
    useDemoteThreadAdminMutation,
    useGetMessagesQuery,
    useSendMessageMutation,
    useDeleteMessageMutation,
    useMarkThreadReadMutation,
    useGetMessageReadsQuery,

    // Teams
    useGetTeamsQuery,
    useAddUpdateTeamMutation,
    useDeleteTeamMutation,

    // Holiday Calendars
    useGetHolidayCalendarsYearQuery,
    useAddUpdateHolidayMutation,
    useDeleteHolidayMutation,

    // Employee Salaries
    useGetEmployeeSalariesQuery,
    useGetEmployeeSalaryByIdQuery,
    useAddUpdateEmployeeSalaryMutation,
    useDeleteEmployeeSalaryMutation,
    useGetSalarySlipPdfUrlQuery,
    useGetSalarySlipPdfRangeUrlQuery,

    // Live Location
    usePingLocationMutation,
    useGetMyLocationQuery,
    useGetCompanyLocationsQuery,
    useGetUserLocationQuery,

    // FAQs
    useGetFaqsUserQuery,
    useGetFaqsAdminQuery,
    useAddUpdateFaqMutation,
    useGetFaqByIdQuery,
    useDeleteFaqMutation,
    useToggleFaqMutation,

    // Misc
    useGetMyCalendarSummaryQuery,
    useMarkAttendanceMutation,
    useGetAttendanceDateDetailQuery,
    useGetAttendanceHistoryQuery,
} = apiSlice;

