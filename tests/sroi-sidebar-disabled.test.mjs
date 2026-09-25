import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer } from 'vite';

const vite = await createServer({
    appType: 'custom',
    server: { middlewareMode: true },
});

try {
    const { default: Sidebar } = await vite.ssrLoadModule(
        '/resources/js/Components/Company/Sidebar.tsx',
    );
    const render = (currentRoute, collapsed = false) =>
        renderToStaticMarkup(
            React.createElement(Sidebar, {
                currentRoute,
                collapsed,
                user: { role: 'admin' },
            }),
        );
    const item = (markup, label) => {
        const tag = markup.match(
            new RegExp(`<[^>]+aria-label="${label}"[^>]*>`),
        )?.[0];
        assert.ok(tag, `Menu ${label} tidak ditemukan`);
        return tag;
    };
    const stageLabels = [
        'SROI Report',
        'General Description',
        'Theory of Change',
        'LFA',
        'Roadmap',
        'Program Scope',
        'Stakeholder Identification',
        'Outcome Identification',
        'SROI Table',
        'SROI Calculation',
    ];

    for (const markup of [
        render('/sroi/program'),
        render('/sroi'),
        render('/sroi/program', true),
    ]) {
        for (const label of stageLabels) {
            const tag = item(markup, label);
            assert.match(tag, /^<span /);
            assert.match(tag, /aria-disabled="true"/);
            assert.match(tag, /opacity-/);
            assert.doesNotMatch(tag, /href=/);
        }
        for (const label of ['Dashboard', 'Program List']) {
            assert.match(item(markup, label), /^<a /);
        }
        assert.match(markup, /href="\/sroi\/catalog"/);
    }

    const selected = render('/sroi/program/42/theory-of-change');
    for (const label of stageLabels) {
        const tag = item(selected, label);
        assert.match(tag, /^<a /);
        assert.match(tag, /href="\/sroi\/program\/42\//);
        assert.doesNotMatch(tag, /aria-disabled/);
    }
    assert.match(item(render('/dashboard'), 'SROI'), /^<a /);
} finally {
    await vite.close();
}
