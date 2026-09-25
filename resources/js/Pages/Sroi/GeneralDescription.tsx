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
            <DescriptionEditor
                program={program}
                isAdmin={isAdmin}
                canEdit={canEdit}
                locations={locations}
                documents={documents}
            />
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
