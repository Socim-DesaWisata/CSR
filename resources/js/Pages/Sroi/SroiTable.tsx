import StageDataTables from '@/Components/Sroi/StageDataTables';
import StageFrame from '@/Components/Sroi/StageFrame';
import type { StageProps } from '@/Components/Sroi/types';

export default function SroiTable({
    program,
    sections,
    documents,
    exports,
    canEdit,
}: StageProps) {
    return (
        <StageFrame
            program={program}
            stage="table"
            title="SROI Table"
            documents={documents}
            exports={exports}
            canEdit={canEdit}
        >
            <StageDataTables
                key={program.id}
                stage="table"
                program={program}
                sections={sections}
                canEdit={canEdit}
            />
        </StageFrame>
    );
}
