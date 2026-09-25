import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer } from 'vite';

const vite = await createServer({
    appType: 'custom',
    server: { middlewareMode: true },
});

try {
    const { OutcomeTable } = await vite.ssrLoadModule(
        '/resources/js/Pages/Sroi/OutcomeIdentification.tsx',
    );
    const markup = renderToStaticMarkup(
        React.createElement(OutcomeTable, {
            program: { id: 1 },
            canEdit: true,
            section: {
                key: 'outcomes',
                title: 'Outcome Program',
                fields: {
                    stakeholder_id: 'reference:sroi_program_stakeholders',
                    outcome_category_id: 'reference:sroi_outcome_categories',
                    name: 'string',
                    description: 'text',
                    relevant: 'boolean',
                    significant: 'boolean',
                    material: 'boolean',
                    materiality_reason: 'text',
                    materiality_explanation: 'text?',
                },
                rows: [
                    {
                        id: 1,
                        stakeholder_id: 1,
                        outcome_category_id: 2,
                        name: 'Sanitasi layak',
                        description: 'Uraian outcome',
                        relevant: true,
                        significant: true,
                        material: true,
                        materiality_reason: 'Berkaitan langsung',
                        materiality_explanation: 'Penjelasan',
                    },
                ],
                choices: {
                    stakeholder_id: [{ id: 1, name: 'Penerima Manfaat' }],
                    outcome_category_id: [{ id: 2, name: 'Kesehatan' }],
                },
            },
        }),
    );

    assert.equal((markup.match(/<table\b/g) ?? []).length, 1);
    assert.match(markup, /Uji Materialitas/);
    assert.match(markup, /Wrap Text: On/);
    assert.match(markup, /Next table sroi/);
    assert.match(markup, /<textarea[^>]*aria-label="Outcome baris 1"/);
    assert.doesNotMatch(markup, /Indikator Outcome|Proksi Finansial/);
    for (const tag of markup.match(/<(?:input|select|textarea)\b[^>]*>/g) ??
        []) {
        assert.match(tag, /border-0/, `Input with border: ${tag}`);
    }
} finally {
    await vite.close();
}
