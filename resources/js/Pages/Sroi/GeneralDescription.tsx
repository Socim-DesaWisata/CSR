import DescriptionEditor from '@/Components/Sroi/DescriptionEditor';
import SectionEditor from '@/Components/Sroi/SectionEditor';
import StageFrame from '@/Components/Sroi/StageFrame';
import type { StageProps } from '@/Components/Sroi/types';
import { usePage } from '@inertiajs/react';

export default function GeneralDescription({
    program,
    sections,
    documents,
    exports,
    canEdit,
    canManageMembers,
}: StageProps) {
    const { auth } = usePage().props as unknown as {
        auth: { user: { role: string } };
    };
    const isAdmin = ['admin', 'superadmin'].includes(auth.user.role);
    const locations = sections.find((section) => section.key === 'locations');
    const members = sections.find((section) => section.key === 'members');

    return (
        <StageFrame
            program={program}
            stage="description"
            title="General Description"
            documents={documents}
            exports={exports}
            canEdit={canEdit}
        >
            {canEdit ? (
                <DescriptionEditor program={program} isAdmin={isAdmin} />
            ) : (
                <div className="rounded-xl border border-slate-200 bg-white p-5">
                    <h2 className="font-bold">Deskripsi Program</h2>
                    <p className="mt-2 whitespace-pre-wrap text-sm">
                        {program.description}
                    </p>
                    <p className="mt-2 whitespace-pre-wrap text-sm text-slate-600">
                        Batas: {program.boundary_text}
                    </p>
                </div>
            )}
            {locations && (
                <SectionEditor
                    section={locations}
                    program={program}
                    canEdit={canEdit}
                />
            )}
            {members && (
                <SectionEditor
                    section={members}
                    program={program}
                    canEdit={canEdit && canManageMembers}
                />
            )}
        </StageFrame>
    );
}
