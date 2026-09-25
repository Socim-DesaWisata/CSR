import SectionEditor from '@/Components/Sroi/SectionEditor';
import StageFrame from '@/Components/Sroi/StageFrame';
import type { StageProps } from '@/Components/Sroi/types';

export default function ProgramScope({
    program,
    sections,
    documents,
    exports,
    canEdit,
}: StageProps) {
    const scopes = sections.find((section) => section.key === 'scopes');
    const investments = sections.find(
        (section) => section.key === 'investments',
    );
    const investmentyears = sections.find(
        (section) => section.key === 'investment-years',
    );

    return (
        <StageFrame
            program={program}
            stage="scope"
            title="Program Scope"
            documents={documents}
            exports={exports}
            canEdit={canEdit}
        >
            {scopes && (
                <SectionEditor
                    section={scopes}
                    program={program}
                    canEdit={canEdit}
                />
            )}
            {investments && (
                <SectionEditor
                    section={investments}
                    program={program}
                    canEdit={canEdit}
                />
            )}
            {investmentyears && (
                <SectionEditor
                    section={investmentyears}
                    program={program}
                    canEdit={canEdit}
                />
            )}
        </StageFrame>
    );
}
