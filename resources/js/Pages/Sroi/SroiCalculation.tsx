import StageFrame from '@/Components/Sroi/StageFrame';
import type { StageProps } from '@/Components/Sroi/types';

export default function SroiCalculation({
    program,
    documents,
    exports,
    canEdit,
}: StageProps) {
    return (
        <StageFrame
            program={program}
            stage="calculation"
            title="SROI Calculation"
            documents={documents}
            exports={exports}
            canEdit={canEdit}
        />
    );
}
