export type Value = string | number | boolean | null;
export type Row = { id: number; [key: string]: Value };
export type Choice = { id: number | string; name: string; outcome_id?: number };
export type Section = {
    key: string;
    title: string;
    fields: Record<string, string>;
    rows: Row[];
    choices: Record<string, Choice[]>;
};
export type Document = { id: number; file_name: string; size_bytes: number };
export type Export = {
    id: number;
    stage: string | null;
    format: string;
    status: string;
    created_at: string;
};
export type Program = {
    id: number;
    company_id: number;
    category_id: number;
    name: string;
    pillar_name: string;
    initiator_owner_name: string;
    start_year: number;
    end_year: number;
    description: string;
    boundary_text: string;
    status: string;
};
export type StageProps = {
    program: Program;
    stage: string;
    title: string;
    sections: Section[];
    documents: Document[];
    exports: Export[];
    canEdit: boolean;
    canManageMembers: boolean;
};
