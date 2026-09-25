import SectionEditor from '@/Components/Sroi/SectionEditor';
import StageFrame from '@/Components/Sroi/StageFrame';
import type { StageProps } from '@/Components/Sroi/types';

export default function Lfa({
    program,
    sections,
    documents,
    exports,
    canEdit,
}: StageProps) {
    const nodes = sections.find((section) => section.key === 'nodes');

    return (
        <StageFrame
            program={program}
            stage="lfa"
            title="LFA"
            documents={documents}
            exports={exports}
            canEdit={canEdit}
        >
            {nodes && (
                <SectionEditor
                    section={nodes}
                    program={program}
                    canEdit={canEdit}
                />
            )}
        </StageFrame>
    );
}
