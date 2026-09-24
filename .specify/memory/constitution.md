<!--
Sync Impact Report
Version change: unratified scaffold -> 1.0.0
Modified principles: added Authorization and Company Data Isolation; Trustworthy Survey and Assessment Data; Tested Behavior at Trust Boundaries; Consistent Laravel and Inertia Architecture; Small, Maintainable Changes
Added sections: Product Constraints; Delivery Workflow
Removed sections: none
Follow-up TODOs: confirm the original ratification date
-->
# CSR Survey Platform Constitution

## Core Principles

### I. Authorization and Company Data Isolation
Every authenticated route and data operation MUST enforce the user's role and permitted
company/project scope. Requests MUST NOT expose or mutate records outside that scope;
authorization rules MUST be covered by tests. This protects respondent and company data.

### II. Trustworthy Survey and Assessment Data
IKM and SLOI submissions, answers, status changes, and derived scores MUST preserve their
relationships and domain rules. Multi-record writes MUST be atomic, and score outputs MUST
remain traceable to their source submissions and calculation details. Changes to assessment
logic MUST include tests for normal, boundary, and insufficient-data cases.

### III. Tested Behavior at Trust Boundaries
Every behavior change MUST add or update automated Pest coverage for its relevant success and
failure paths. Validation MUST happen at request boundaries; persistence and authorization
invariants MUST be verified at the appropriate application or database layer. Run the narrowest
relevant tests before delivery.

### IV. Consistent Laravel and Inertia Architecture
Server-rendered application pages MUST follow the existing Laravel, Inertia v2, and React
patterns. Use Form Requests for request validation, Eloquent relationships for domain data,
named routes for navigation, and existing components before introducing new abstractions.
This keeps the web experience and server behavior coherent.

### V. Small, Maintainable Changes
Implement the smallest change that satisfies the requirement. Reuse installed dependencies and
existing conventions; new dependencies, architectural layers, or duplicated domain logic require
clear justification. Keep generated build output and unrelated worktree changes out of focused
source changes.

## Product Constraints

The application manages CSR projects, companies, enumerators, respondents, survey instruments,
submissions, and IKM/SLOI assessment results. Preserve these domain relationships and role-based
flows when changing behavior. Treat respondent identity, contact details, photographs, and
location data as sensitive: collect and expose only what the authorized workflow requires.

The established stack is Laravel 12, PHP 8.2+, Inertia v2, React 18, TypeScript, and Tailwind CSS
3, with Pest 4 for tests. Follow the installed project versions and existing structure; do not
change dependencies or introduce a new framework without approval.

## Delivery Workflow

For each change, inspect the affected route, request, service, model, and UI paths; update tests
alongside behavior changes. Run focused Pest tests for backend behavior, `vendor/bin/pint --dirty
--format agent` for PHP changes, and the relevant frontend build or checks for UI changes.
Review the final diff to confirm scope, authorization, data integrity, accessibility, and absence
of unrelated generated artifacts.

## Governance

This constitution governs implementation and review decisions. Amendments MUST update this file
and its version/date metadata. Use semantic versioning: MAJOR for incompatible governance changes,
MINOR for new or materially expanded principles or sections, and PATCH for clarifications that
do not change obligations. The original ratification date is not recorded in the repository and
MUST be confirmed before replacing the explicit TODO. The last-amended date records the date of
the latest approved change.

Every change review MUST check relevant principles, tests, and scope. Exceptions MUST be stated
with rationale and approval in the change discussion; security, authorization, and data integrity
requirements cannot be waived. Keep implementation guidance in the applicable project instructions
and use this constitution as the governance source.

**Version**: 1.0.0 | **Ratified**: TODO(RATIFICATION_DATE): confirm original adoption date | **Last Amended**: 2026-09-24
