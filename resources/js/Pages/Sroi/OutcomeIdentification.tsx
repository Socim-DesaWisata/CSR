import StageDataTables from '@/Components/Sroi/StageDataTables';
import StageFrame from '@/Components/Sroi/StageFrame';
import type { StageProps } from '@/Components/Sroi/types';

export default function OutcomeIdentification({
    program,
    sections,
    documents,
    exports,
    canEdit,
}: StageProps) {
    return (
        <StageFrame
            program={program}
            stage="outcome"
            title="Outcome Identification"
            documents={documents}
            exports={exports}
            canEdit={canEdit}
        >
            <StageDataTables
                key={program.id}
                stage="outcome"
                program={program}
                sections={sections}
                canEdit={canEdit}
            />
        </StageFrame>
    );
}
