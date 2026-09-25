import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const layout = readFileSync('resources/js/Layouts/AppLayout.tsx', 'utf8');
const header = readFileSync(
    'resources/js/Components/Company/Header.tsx',
    'utf8',
);
const sidebar = readFileSync(
    'resources/js/Components/Company/Sidebar.tsx',
    'utf8',
);

assert.match(layout, /sidebarCollapsed=\{isSidebarCollapsed\}/);
assert.match(layout, /onToggleSidebar=\{\(\) =>/);
assert.match(layout, /onClick=\{\(\) => setIsSidebarCollapsed\(true\)\}/);
assert.match(header, /aria-controls="app-sidebar"/);
assert.match(header, /aria-expanded=\{!sidebarCollapsed\}/);
assert.match(header, /<MenuButton[\s\S]*auth\.user\.name[\s\S]*<ChevronDown/);
assert.match(header, /<MenuItem>[\s\S]*setShowLogoutModal\(true\)/);
assert.match(header, /router\.post\(route\('logout'\)\)/);
assert.match(sidebar, /collapsed[\s\S]*?'\/img\/LogoTab\.svg'/);
assert.match(sidebar, /space-y-2 px-2 py-5/);
assert.match(sidebar, /fixed bottom-0 left-0 top-20/);
assert.doesNotMatch(sidebar, /showLogoutModal|user\.email|onToggleCollapse/);
