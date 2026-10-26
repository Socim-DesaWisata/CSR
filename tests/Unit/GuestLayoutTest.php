<?php

use Symfony\Component\Process\Process;

test('guest layout renders the home earth video behind auth content', function () {
    $process = new Process(['node', '--input-type=module', '-e', <<<'JS'
import { createServer } from 'vite';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

const server = await createServer({
    configFile: false,
    esbuild: { jsx: 'automatic' },
    server: { middlewareMode: true },
    appType: 'custom',
});
try {
    const { default: Guest } = await server.ssrLoadModule('/resources/js/Layouts/GuestLayout.tsx');
    console.log(renderToStaticMarkup(createElement(Guest, null, 'Auth form content')));
} finally {
    await server.close();
}
JS], dirname(__DIR__, 2));
    $process->mustRun();

    $document = new DOMDocument;
    $document->loadHTML($process->getOutput(), LIBXML_NOERROR | LIBXML_NOWARNING);
    $xpath = new DOMXPath($document);

    expect($xpath->query('//video[@autoplay and @loop and @muted and @playsinline and @aria-hidden="true"]')->length)->toBe(1)
        ->and($xpath->query('//video/source[@src="/img/animation.webm" and @type="video/webm"]')->length)->toBe(1)
        ->and($process->getOutput())->toContain('object-cover', 'hidden', 'lg:flex', 'Auth form content')
        ->not->toContain('LoginPic.png')
        ->and(is_file(dirname(__DIR__, 2).'/public/img/animation.webm'))->toBeTrue();
});
