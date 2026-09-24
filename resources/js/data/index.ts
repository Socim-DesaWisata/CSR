// Data Index File
// Import semua data JSON dari folder ini
// Nanti ketika backend siap, ganti import JSON dengan fetch API

import createProjectData from './createProject.json';
import ikmData from './ikmData.json';
import projectDetailData from './projectDetail.json';
import projectsData from './projects.json';
import sloiData from './sloiData.json';

// Export all data
export {
    createProjectData,
    ikmData,
    projectDetailData,
    projectsData,
    sloiData,
};

// Types untuk data
export interface Project {
    id: string;
    code: string;
    name: string;
    type: 'IKM' | 'SLOI';
    typeLabel: string;
    location: string;
    status: 'active' | 'draft' | 'closed';
    currentResponses: number;
    targetResponses: number;
}

export interface ProjectDetail {
    id: string;
    name: string;
    description: string;
    status: string;
    currentResponses: number;
    targetResponses: number;
    ikmScore: number;
    ikmTrend: string;
    sloiLevel: string;
    sloiProgress: number;
}

export interface Submission {
    id: string;
    dateTime: string;
    respondentType: string;
    impactScore: number;
    status: 'verified' | 'pending';
}

export interface IKMAuditLog {
    time: string;
    enumerator: string;
    enumeratorId: string;
    respondent: string;
    avgScore: number;
    status: 'verified' | 'pending';
    photoUrl: string;
    location: { lat: number; lng: number };
}

export interface SLOIAuditLog {
    id: string;
    group: 'csr' | 'general';
    date: string;
    score: number;
    status: 'verified' | 'pending';
    respondentName: string;
    enumerator: string;
}

export interface AssessmentType {
    id: string;
    icon: string;
    title: string;
    description: string;
}
