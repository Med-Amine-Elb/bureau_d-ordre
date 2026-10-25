# Persistence fixes and deferred uploads — 2026-10-22

## Scope

User requested recipient/signature persistence fixes and hiding uploads while upload requirements remain undecided. No upload backend, schema changes or deployment were requested for this change.

Baseline HEAD: 925a4897cfa64b06db9ba85cccce93ff43599e08. Existing changes in power.config.json, pages/bo/Dashboard.tsx and pages/bo/RemiseCheque.tsx were preserved. Generated clients and .power metadata were not modified.

## Implemented

- The adapter writes new_personne_a_livrer to the Dataverse column new_person_to_deliver and new_fournisseur_signe to new_supplier_signed. Reads populate both naming variants for existing screens. Canonical names take precedence if both aliases are supplied. Explicit false and empty strings are preserved; unrelated partial updates omit these columns.
- DOCUMENT_UPLOADS_ENABLED=false in src/lib/features.ts hides the BO document upload section and prescriber simulated BR/attachment area. Prescriber validation no longer requires the hidden upload. Keep this flag false until real storage/retrieval is implemented and tested; enabling it alone does not implement uploads.
- Agency remittance omits empty scan values, avoiding accidental clearing of an existing receipt URL.

## Evidence

| Check | Result |
| --- | --- |
| npm test | Passed: 5 files, 41 tests; exit 0. Eight new contract/mapping tests cover recipient create/read, recipient clearing, signature true/false, alias precedence and unrelated partial updates. Generated-service calls are mocked. |
| npm run build | Passed: TypeScript and Vite; exit 0. Existing ClientGlobalContext and bundle-size warnings remain. |
| Local rendered BO form | Selected Facture, Avoir, Acompte and Courrier at http://localhost:3000/#/bo/dossiers/nouveau. Each had 0 input[type=file] elements and no Documents Requis section. No record submission performed. |
| Targeted ESLint | 18 errors and 3 warnings on existing any types, unused catch variables, empty catches and effect dependencies in the four modified screens. No errors in the new feature flag or test file. |
| Live Dataverse refresh | Pending: available Power Apps browser session is at Microsoft sign-in. Mocked contract tests do not prove live server persistence. |
| Prescriber validation in browser | Pending with a live dossier. Build and source review cover upload gating. |

## Remaining checks

In authenticated Local Play, save and reopen a TEST courrier to verify its recipient. Complete a TEST agency remittance and refresh to verify signature persistence in the admin audit. Check a status-40 prescriber dossier can be validated without an upload. No live records were created or changed during this work, and nothing was published.

The unrelated late-draft rule, treasury field issues and broader lint cleanup remain outside this change.

## Admin reference management — 2026-10-22

User requested managing suppliers, GBM companies and directions from the admin page.

- Admin → Tables de Référence now includes Sociétés GBM and Directions, alongside the existing supplier and agency sections. The new sections support search, create, edit, activate/deactivate, required name/code validation, save-pending protection, retry and visible errors. Dialogs reuse the existing Radix dialog for keyboard focus and dismissal.
- Company writes use new_name/new_code/new_is_active. Direction writes use new_name/new_code/new_isactive. Partial status updates do not alter ownership, names/codes or existing relationships. No company-direction association editor or schema change was introduced.
- Existing supplier saves retain the new_tax_id mapping, now accurately labelled Identifiant fiscal rather than an automatically generated code. Supplier/agency save forms disable resubmission while pending. Failed SDK results are not reported as success.
- The dossier form now loads reference requests independently with Promise.allSettled. An error loading users or linked dossiers no longer discards successful supplier/company/direction results. A visible error identifies failed lists, and Actualiser les listes reloads them.
- Active supplier/company/direction rows are offered for new choices; an inactive reference already selected on an edited dossier remains visible. Newly saved active references become available when opening the dossier form or refreshing its lists.
- Generated models/services and previous user changes remain preserved. All writes still use the authenticated account's Dataverse permissions; the current simulated application role selector does not grant permissions.

Verification: npm test passed 57 tests across 7 files (16 new tests for reference contracts and isolated dropdown loading); targeted ESLint passed for the new component, admin page, creation page, loader and tests. Final npm run build passed (exit 0), with the pre-existing ClientGlobalContext/bundle warnings. Local browser checks confirmed all four reference sections, company/direction creation dialogs, required fields, default active status, keyboard dismissal and supplier form labels. A mouse-click timeout during preview was recovered via Escape; no record submission was attempted.

Live Dataverse create/edit/read-after-refresh and production sharing/permissions remain unverified because the available Power Apps browser session requires Microsoft sign-in. No reference records were created by the agent and no deployment was performed.

## Complete reference business forms — 2026-10-22

User requested professional forms reflecting the additional supplier, company and direction columns, rather than name/code-only forms.

### Confirmed local schema and implementation

- Inspected the existing generated models and `.power/schemas/dataverse` snapshots; did not change schema or generated files. This is local metadata evidence, not a fresh inspection of the live environment.
- Suppliers: raison sociale (`new_name`), identifiant fiscal (`new_tax_id`, existing UI alias `new_code`), adresse, ville, e-mail, téléphone, agence (`new_Branch@odata.bind` to `new_branchs`) and active flag (`new_isactive`). Contact values are read back into edit forms and displayed in the supplier list. GUIDs moved out of the main list into the read-only information section.
- Directions: name, code, company relationship (`new_Company@odata.bind` to `new_companies`) and `new_isactive`. The UI preserves an existing inactive/unavailable selection and does not clear a relationship when its options fail to load.
- Companies: the available snapshot has only `new_name`, `new_code` and `new_is_active` as business columns. No address, fiscal or contact columns were invented. If the live table has additional custom columns, refresh/inspect its generated contract before exposing them.
- Create/update adapters whitelist writable fields. Undefined relationship input preserves the existing association; explicit removal sends the single-valued navigation property as null. Status-only updates leave contacts, ownership and relationships alone. Create payloads omit IDs and system-managed ownership/state columns despite generated create types requiring some of them.
- Shared form validation follows local metadata lengths: names 850, codes/tax IDs 100, address/city/e-mail 100 and phone 20 characters. Required values are trimmed; optional contacts can be cleared; invalid email and malformed relationship IDs are rejected. No unconfirmed country-specific fiscal or phone rules were added.
- The product-design skill guided grouped identification/contact/assignment/activity sections, fixed visible headers/action bars, scrollable field areas, keyboard-focus restoration and save-pending protection. The Dataverse skill kept system columns out of writable payloads. IDs and created/modified timestamps are shown read-only when editing; missing timestamps are explicitly labelled unavailable.
- Related-reference loading has loading/error/retry feedback. Failed saves retain entered values. Existing brand/UI components and the inactive-reference policy are preserved.

Reference implementation guidance: [Microsoft code-app Dataverse integration](https://learn.microsoft.com/en-us/power-apps/developer/code-apps/how-to/connect-to-dataverse) and [single-valued relationship association/removal](https://learn.microsoft.com/en-us/power-apps/developer/data-platform/webapi/associate-disassociate-entities-using-web-api).

### Verification and remaining live checks

- Final `npm test`: exit 0, **81 tests / 8 files**. Twenty-four added cases cover metadata limits, supplier contacts and read-back mappings, company/direction relationships, explicit clearing versus omission, invalid email/lookup IDs, field boundaries and omission of system fields. Generated clients are mocked; these are contract/unit tests, not live persistence proof.
- Final `npm run build`: exit 0, TypeScript and Vite passed. Pre-existing ClientGlobalContext script and large-bundle warnings remain. An initial test-only Node filesystem import failed the browser TypeScript configuration; it was replaced by Vite raw metadata imports before the successful final checks.
- Focused ESLint: exit 0 for the three reference components, the admin page, validation adapter and reference tests. React review covered hook usage, local state isolation, cache invalidation, pending states, labels and focus; no hosting/framework changes were introduced.
- Local browser, 1280×720: inspected all three creation forms; entered synthetic supplier contact data without saving; confirmed required-name native validation blocks submission and invalid email has a type mismatch; reopening starts with clean supplier fields. Direction creation shows the company selector. Escape/cancel dismissal and direction focus restoration were observed. Supplier focus initially returned to the page body; retaining the actual opening button from the click event fixed this, and the final check observed focus on « Ajouter un Fournisseur » with zero open dialogs. Supplier and company option requests remain pending outside an authenticated Power Apps runtime.
- Preview screenshots saved in the chat workspace: `supplier-form-preview.jpg` and `direction-form-preview.jpg`. Synthetic contact values in the screenshot were never saved as records.
- **Not live-verified:** create/edit/read-after-refresh, actual lookup binding/removal, audit-date retrieval, inactive selected records, connector errors and non-admin permissions in target environment `c3e38cf7-73d8-e320-a581-ac4d5ad39849`. The available Power Apps browser tab requires Microsoft sign-in. Test these with designated development records before publication.
- No deployment, schema change, privilege change or live record mutation was performed. Previous unrelated user edits remain preserved.
