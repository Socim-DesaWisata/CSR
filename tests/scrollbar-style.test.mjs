import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const styles = readFileSync('resources/css/app.css', 'utf8');

assert.match(
    styles,
    /\*::-webkit-scrollbar\s*\{[^}]*width:\s*5px;[^}]*height:\s*5px;/s,
);
assert.match(
    styles,
    /\*::-webkit-scrollbar-track\s*\{[^}]*background:\s*transparent;/s,
);
assert.match(
    styles,
    /\*::-webkit-scrollbar-thumb\s*\{[^}]*rgba\(100, 116, 139, 0\.32\)/s,
);
assert.match(
    styles,
    /\*::-webkit-scrollbar-thumb:hover\s*\{[^}]*rgba\(100, 116, 139, 0\.55\)/s,
);
assert.match(
    styles,
    /@supports not selector\(::-webkit-scrollbar\)[\s\S]*?scrollbar-width:\s*thin/,
);
