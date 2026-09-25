import StageDataTables from '@/Components/Sroi/StageDataTables';
import StageFrame from '@/Components/Sroi/StageFrame';
import type { StageProps } from '@/Components/Sroi/types';

export default function Roadmap({
    program,
    sections,
    documents,
    exports,
    canEdit,
}: StageProps) {
    return (
        <StageFrame
            program={program}
            stage="roadmap"
            title="Roadmap"
            documents={documents}
            exports={exports}
            canEdit={canEdit}
        >
            <StageDataTables
                key={program.id}
                stage="roadmap"
                program={program}
                sections={sections}
                canEdit={canEdit}
            />
        </StageFrame>
    );
}
