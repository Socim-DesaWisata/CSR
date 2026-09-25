import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const frame = readFileSync('resources/js/Components/Sroi/StageFrame.tsx', 'utf8');
const description = readFileSync('resources/js/Components/Sroi/DescriptionEditor.tsx', 'utf8');
const locations = readFileSync('resources/js/Components/Sroi/SectionEditor.tsx', 'utf8');

assert.doesNotMatch(frame, /Ekspor Data Tahap|Dokumen Pendukung|sroi\.exports\.store/);
assert.match(description, /type="file"/);
assert.match(description, /sroi\.documents\.download/);
assert.match(locations, /<Modal show=\{open\}/);
