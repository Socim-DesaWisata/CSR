import StageFrame from '@/Components/Sroi/StageFrame';
import type { StageProps } from '@/Components/Sroi/types';

export default function SroiReport({
    program,
    documents,
    exports,
    canEdit,
}: StageProps) {
    return (
        <StageFrame
            program={program}
            stage="report"
            title="SROI Report"
            documents={documents}
            exports={exports}
            canEdit={canEdit}
        />
    );
}
