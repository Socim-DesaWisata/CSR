import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer } from 'vite';

const vite = await createServer({
    appType: 'custom',
    server: { middlewareMode: true },
});

try {
    const { default: StageDataTables } = await vite.ssrLoadModule(
        '/resources/js/Components/Sroi/StageDataTables.tsx',
    );
    const props = {
        stage: 'stakeholder',
        program: { id: 1 },
        canEdit: true,
        sections: [
            {
                key: 'stakeholders',
                title: 'Stakeholder Program',
                fields: {
                    stakeholder_category_list_id:
                        'reference:sroi_stakeholder_category_lists',
                    role_in_program: 'text',
                    included: 'boolean',
                },
                rows: [
                    {
                        id: 1,
                        stakeholder_category_list_id: 1,
                        role_in_program: 'Warga',
                        included: true,
                    },
                ],
                choices: {
                    stakeholder_category_list_id: [{ id: 1, name: 'Keluarga' }],
                },
            },
        ],
    };
    const selectFor = (markup, label) => {
        const element = markup.match(
            new RegExp(`<select[^>]*aria-label="${label} baris 1"[^>]*>`),
        )?.[0];
        assert.ok(element, `Expected editable ${label} select`);
        return element;
    };
    const markup = renderToStaticMarkup(
        React.createElement(StageDataTables, props),
    );

    for (const label of ['Stakeholder Category List Id', 'Included']) {
        const select = selectFor(markup, label);
        assert.match(select, /border-0/);
        assert.match(select, /focus:ring-2/);
        assert.doesNotMatch(select, /border-slate-300/);
    }

    const otherStage = renderToStaticMarkup(
        React.createElement(StageDataTables, { ...props, stage: 'outcome' }),
    );
    assert.match(
        selectFor(otherStage, 'Stakeholder Category List Id'),
        /border-slate-300/,
    );
} finally {
    await vite.close();
}
