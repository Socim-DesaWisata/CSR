// Types for Admin Dashboard
export interface Company {
    id: number;
    name: string;
    status: 'active' | 'pending' | 'suspended' | 'deleted';
    projects_count: number;
    users_count: number;
}

export interface User {
    id: number;
    name: string;
    email: string;
    role: 'superadmin' | 'admin' | 'company' | 'enumerator';
    is_active: boolean;
    company?: { name: string };
}

export interface Project {
    id: number;
    name: string;
    project_code: string;
    status: 'draft' | 'active' | 'closed' | 'archived';
    company: { name: string };
    submissions_count: number;
    target_ikm_count: number;
    target_sloi_count: number;
}

export interface DashboardStats {
    totalCompanies: number;
    activeCompanies: number;
    totalUsers: number;
    totalEnumerators: number;
    totalProjects: number;
    activeProjects: number;
    totalSubmissions: number;
    totalRespondents: number;
    pendingSubmissions: number;
    approvedSubmissions: number;
    rejectedSubmissions: number;
    trends: {
        companiesGrowth: number;
        usersGrowth: number;
        projectsGrowth: number;
        submissionsGrowth: number;
    };
}

export interface SubmissionTrend {
    date: string;
    ikm: number;
    sloi: number;
}

export interface RecentActivity {
    id: number;
    type: 'submission' | 'project' | 'company' | 'user';
    action: string;
    description: string;
    time: string;
    user?: string;
}

export interface ChartDataItem {
    status: string;
    count: number;
}

export interface SubmissionTypeData {
    type: string;
    count: number;
}

export interface ProvinceData {
    name: string;
    count: number;
}
