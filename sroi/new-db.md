Project sroi_database {
  database_type: 'MySQL'
  Note: 'SaaS multi-organisasi. FK tenant memakai organization_id untuk mencegah relasi lintas tenant.'
}

Enum organization_status {
  active
  suspended
}

Enum user_status {
  active
  disabled
}

Enum member_status {
  invited
  active
  disabled
}

Enum assessment_type {
  evaluative
  forecast
  both
}

Enum period_type {
  evaluative
  forecast
}

Enum program_status {
  draft
  active
  archived
}

Enum participation_type {
  collaborator
  reviewer
}

Enum lfa_level {
  goal
  purpose
  output
  activity
}

Enum investment_type {
  cash
  in_kind
  time
}

Enum run_status {
  complete
  invalidated
}

Enum export_type {
  full
  executive_summary
  quantitative
  qualitative
  stage_export
}

Enum export_format {
  docx
  xlsx
}

Enum export_status {
  queued
  ready
  failed
}

Enum audit_action {
  create
  update
  archive
  calculate
  export
}

Enum catalog_kind {
  sector
  program_category
  stakeholder_category
  stakeholder_category_list
  outcome_category
}

Table organizations {
  id bigint [pk, increment]
  name varchar(200) [not null]
  slug varchar(100) [not null, unique]
  status organization_status [not null, default: 'active']
  timezone varchar(64) [not null, default: 'Asia/Jakarta']
  created_at timestamp [not null, default: `CURRENT_TIMESTAMP`]
  updated_at timestamp [not null, default: `CURRENT_TIMESTAMP`]
  deleted_at timestamp
}

Table users {
  id bigint [pk, increment]
  full_name varchar(200) [not null]
  email varchar(254) [not null, unique, note: 'Normalisasi email sebelum simpan dan bandingkan.']
  password_hash varchar(255) [note: 'Hash saja; jangan simpan password asli.']
  email_verified_at timestamp
  is_platform_admin boolean [not null, default: false]
  status user_status [not null, default: 'active']
  last_login_at timestamp
  created_at timestamp [not null, default: `CURRENT_TIMESTAMP`]
  updated_at timestamp [not null, default: `CURRENT_TIMESTAMP`]
  deleted_at timestamp
}

Table auth_identities {
  id bigint [pk, increment]
  user_id bigint [not null]
  provider varchar(40) [not null, note: 'Contoh: google.']
  provider_subject varchar(255) [not null]
  email_at_provider varchar(254)
  last_login_at timestamp
  created_at timestamp [not null, default: `CURRENT_TIMESTAMP`]

  indexes {
    (provider, provider_subject) [unique]
    user_id
  }
}

Table password_reset_tokens {
  id bigint [pk, increment]
  user_id bigint [not null]
  token_hash char(64) [not null, unique, note: 'Simpan hash token; token mentah hanya dikirim kepada pengguna.']
  expires_at timestamp [not null]
  used_at timestamp
  created_at timestamp [not null, default: `CURRENT_TIMESTAMP`]

  indexes {
    (user_id, expires_at)
  }
}

Table roles {
  id bigint [pk, increment]
  organization_id bigint [not null]
  code varchar(40) [not null]
  name varchar(100) [not null]
  is_system boolean [not null, default: false]
  created_at timestamp [not null, default: `CURRENT_TIMESTAMP`]
  updated_at timestamp [not null, default: `CURRENT_TIMESTAMP`]

  indexes {
    (organization_id, id) [unique]
    (organization_id, code) [unique]
  }
}

Table organization_members {
  id bigint [pk, increment]
  organization_id bigint [not null]
  user_id bigint [not null]
  role_id bigint [not null]
  status member_status [not null, default: 'invited']
  joined_at timestamp
  created_at timestamp [not null, default: `CURRENT_TIMESTAMP`]
  updated_at timestamp [not null, default: `CURRENT_TIMESTAMP`]

  indexes {
    (organization_id, id) [unique]
    (organization_id, user_id) [unique]
  }
}

Table catalog_templates {
  id bigint [pk, increment]
  kind catalog_kind [not null]
  code varchar(40) [not null]
  name varchar(200) [not null]
  parent_template_id bigint
  active boolean [not null, default: true]
  created_at timestamp [not null, default: `CURRENT_TIMESTAMP`]
  updated_at timestamp [not null, default: `CURRENT_TIMESTAMP`]

  indexes {
    (kind, code) [unique]
  }
}

Table sectors {
  id bigint [pk, increment]
  organization_id bigint [not null]
  code varchar(40) [not null]
  name varchar(200) [not null]
  source_template_id bigint
  active boolean [not null, default: true]
  created_at timestamp [not null, default: `CURRENT_TIMESTAMP`]
  updated_at timestamp [not null, default: `CURRENT_TIMESTAMP`]

  indexes {
    (organization_id, id) [unique]
    (organization_id, code) [unique]
  }
}

Table provinces {
  id bigint [pk, increment]
  code varchar(20) [not null, unique, note: 'Kode wilayah Kemendagri; simpan sebagai teks.']
  name varchar(150) [not null]
  active boolean [not null, default: true]
  created_at timestamp [not null, default: `CURRENT_TIMESTAMP`]
  updated_at timestamp [not null, default: `CURRENT_TIMESTAMP`]
}

Table cities {
  id bigint [pk, increment]
  province_id bigint [not null]
  code varchar(20) [not null, unique]
  name varchar(150) [not null]
  active boolean [not null, default: true]
  created_at timestamp [not null, default: `CURRENT_TIMESTAMP`]
  updated_at timestamp [not null, default: `CURRENT_TIMESTAMP`]

  indexes {
    (province_id, id) [unique]
  }
}

Table districts {
  id bigint [pk, increment]
  city_id bigint [not null]
  code varchar(20) [not null, unique]
  name varchar(150) [not null]
  active boolean [not null, default: true]
  created_at timestamp [not null, default: `CURRENT_TIMESTAMP`]
  updated_at timestamp [not null, default: `CURRENT_TIMESTAMP`]

  indexes {
    (city_id, id) [unique]
  }
}

Table sub_districts {
  id bigint [pk, increment]
  district_id bigint [not null]
  code varchar(20) [not null, unique]
  name varchar(150) [not null]
  active boolean [not null, default: true]
  created_at timestamp [not null, default: `CURRENT_TIMESTAMP`]
  updated_at timestamp [not null, default: `CURRENT_TIMESTAMP`]

  indexes {
    (district_id, id) [unique]
  }
}

Table locations {
  id bigint [pk, increment]
  organization_id bigint [not null]
  country_code char(2) [not null]
  province_id bigint
  city_id bigint
  district_id bigint
  sub_district_id bigint
  address varchar(255)
  postal_code varchar(10)
  latitude decimal(10,7)
  longitude decimal(10,7)
  created_at timestamp [not null, default: `CURRENT_TIMESTAMP`]
  updated_at timestamp [not null, default: `CURRENT_TIMESTAMP`]

  checks {
    `city_id IS NULL OR province_id IS NOT NULL` [name: 'chk_location_city_parent']
    `district_id IS NULL OR city_id IS NOT NULL` [name: 'chk_location_district_parent']
    `sub_district_id IS NULL OR district_id IS NOT NULL` [name: 'chk_location_sub_district_parent']
  }

  indexes {
    (organization_id, id) [unique]
    (organization_id, country_code, province_id, city_id)
  }
}

Table companies {
  id bigint [pk, increment]
  organization_id bigint [not null]
  sector_id bigint
  headquarters_location_id bigint
  name varchar(200) [not null]
  created_at timestamp [not null, default: `CURRENT_TIMESTAMP`]
  updated_at timestamp [not null, default: `CURRENT_TIMESTAMP`]
  deleted_at timestamp

  indexes {
    (organization_id, id) [unique]
    (organization_id, name)
  }
}

Table company_members {
  id bigint [pk, increment]
  organization_id bigint [not null]
  company_id bigint [not null]
  user_id bigint
  name varchar(200) [not null]
  email varchar(254)
  position varchar(150)
  created_at timestamp [not null, default: `CURRENT_TIMESTAMP`]
  updated_at timestamp [not null, default: `CURRENT_TIMESTAMP`]

  indexes {
    (organization_id, id) [unique]
    (organization_id, company_id)
  }
}

Table program_categories {
  id bigint [pk, increment]
  organization_id bigint [not null]
  code varchar(40) [not null, note: 'Rumpun program; contoh ID atau PE.']
  name varchar(200) [not null]
  source_template_id bigint
  active boolean [not null, default: true]
  created_at timestamp [not null, default: `CURRENT_TIMESTAMP`]
  updated_at timestamp [not null, default: `CURRENT_TIMESTAMP`]

  indexes {
    (organization_id, id) [unique]
    (organization_id, code) [unique]
  }
}

Table stakeholder_categories {
  id bigint [pk, increment]
  organization_id bigint [not null]
  program_category_id bigint [not null]
  code varchar(40) [not null]
  name varchar(200) [not null]
  source_template_id bigint
  active boolean [not null, default: true]
  created_at timestamp [not null, default: `CURRENT_TIMESTAMP`]
  updated_at timestamp [not null, default: `CURRENT_TIMESTAMP`]

  indexes {
    (organization_id, id) [unique]
    (organization_id, program_category_id, id) [unique]
    (organization_id, program_category_id, code) [unique]
  }
}

Table stakeholder_category_lists {
  id bigint [pk, increment]
  organization_id bigint [not null]
  program_category_id bigint [not null]
  stakeholder_category_id bigint [not null]
  code varchar(40) [not null]
  name varchar(200) [not null]
  source_template_id bigint
  active boolean [not null, default: true]
  created_at timestamp [not null, default: `CURRENT_TIMESTAMP`]
  updated_at timestamp [not null, default: `CURRENT_TIMESTAMP`]

  indexes {
    (organization_id, id) [unique]
    (organization_id, stakeholder_category_id, code) [unique]
    (organization_id, program_category_id, id) [unique]
  }
}

Table outcome_categories {
  id bigint [pk, increment]
  organization_id bigint [not null]
  program_category_id bigint [not null]
  code varchar(40) [not null]
  name varchar(200) [not null]
  source_template_id bigint
  active boolean [not null, default: true]
  created_at timestamp [not null, default: `CURRENT_TIMESTAMP`]
  updated_at timestamp [not null, default: `CURRENT_TIMESTAMP`]

  indexes {
    (organization_id, id) [unique]
    (organization_id, program_category_id, id) [unique]
    (organization_id, program_category_id, code) [unique]
  }
}

Table programs {
  id bigint [pk, increment]
  organization_id bigint [not null]
  public_number bigint
  company_id bigint [not null]
  category_id bigint [not null]
  name varchar(255) [not null]
  pillar_name varchar(200) [not null, note: 'Bidang/pilar adalah teks bebas di form.']
  initiator_owner_name varchar(200) [not null]
  start_year smallint [not null]
  end_year smallint [not null]
  description text [not null]
  boundary_text text
  status program_status [not null, default: 'draft']
  created_by bigint [not null]
  created_at timestamp [not null, default: `CURRENT_TIMESTAMP`]
  updated_at timestamp [not null, default: `CURRENT_TIMESTAMP`]
  deleted_at timestamp

  checks {
    `start_year <= end_year` [name: 'chk_program_year_range']
  }

  indexes {
    (organization_id, id) [unique]
    (organization_id, id, category_id) [unique]
    (organization_id, public_number) [unique]
    (organization_id, status, created_at)
  }
}

Table program_locations {
  id bigint [pk, increment]
  organization_id bigint [not null]
  program_id bigint [not null]
  province_id bigint [not null]
  city_id bigint [not null]
  district_id bigint [not null]
  sub_district_id bigint [not null]
  location_name varchar(200) [not null]
  manager_name varchar(200) [not null]
  address varchar(255) [not null]
  postal_code varchar(10)
  latitude decimal(10,7)
  longitude decimal(10,7)
  sort_order int [not null, default: 0]
  created_at timestamp [not null, default: `CURRENT_TIMESTAMP`]
  updated_at timestamp [not null, default: `CURRENT_TIMESTAMP`]

  indexes {
    (organization_id, id) [unique]
    (organization_id, program_id, id) [unique]
  }
}

Table program_members {
  id bigint [pk, increment]
  organization_id bigint [not null]
  program_id bigint [not null]
  member_id bigint [not null]
  participation participation_type [not null, default: 'collaborator']
  created_at timestamp [not null, default: `CURRENT_TIMESTAMP`]
  updated_at timestamp [not null, default: `CURRENT_TIMESTAMP`]

  indexes {
    (organization_id, id) [unique]
    (organization_id, program_id, member_id, participation) [unique]
  }
}

Table program_documents {
  id bigint [pk, increment]
  organization_id bigint [not null]
  program_id bigint [not null]
  stage varchar(40) [not null]
  file_name varchar(255) [not null]
  object_key varchar(500) [not null]
  mime_type varchar(100) [not null]
  size_bytes bigint [not null]
  sha256 char(64) [not null]
  uploaded_by bigint [not null]
  created_at timestamp [not null, default: `CURRENT_TIMESTAMP`]
  updated_at timestamp [not null, default: `CURRENT_TIMESTAMP`]

  indexes {
    (organization_id, id) [unique]
    (organization_id, object_key) [unique]
    (organization_id, program_id)
  }
}

Table theory_of_change_conditions {
  id bigint [pk, increment]
  organization_id bigint [not null]
  program_id bigint [not null]
  sort_order int [not null, default: 0]
  initial_condition text [not null]
  intervention text [not null]
  expected_condition text [not null]
  created_at timestamp [not null, default: `CURRENT_TIMESTAMP`]
  updated_at timestamp [not null, default: `CURRENT_TIMESTAMP`]

  indexes {
    (organization_id, id) [unique]
    (organization_id, program_id, sort_order) [unique]
    (organization_id, program_id, id) [unique]
  }
}

Table theory_of_change_flows {
  id bigint [pk, increment]
  organization_id bigint [not null]
  program_id bigint [not null]
  sort_order int [not null, default: 0]
  input_text text [not null]
  activity_text text [not null]
  output_text text [not null]
  outcome_text text [not null]
  impact_text text [not null]
  created_at timestamp [not null, default: `CURRENT_TIMESTAMP`]
  updated_at timestamp [not null, default: `CURRENT_TIMESTAMP`]

  indexes {
    (organization_id, id) [unique]
    (organization_id, program_id, sort_order) [unique]
    (organization_id, program_id, id) [unique]
  }
}

Table lfa_nodes {
  id bigint [pk, increment]
  organization_id bigint [not null]
  program_id bigint [not null]
  parent_id bigint
  level lfa_level [not null]
  code varchar(40)
  element text [not null]
  indicator text
  verification_source text
  assumptions text
  sort_order int [not null, default: 0]
  created_at timestamp [not null, default: `CURRENT_TIMESTAMP`]
  updated_at timestamp [not null, default: `CURRENT_TIMESTAMP`]

  indexes {
    (organization_id, id) [unique]
    (organization_id, program_id, id) [unique]
    (organization_id, program_id, level, sort_order)
  }
}

Table roadmap_items {
  id bigint [pk, increment]
  organization_id bigint [not null]
  program_id bigint [not null]
  lfa_activity_id bigint [not null]
  sort_order int [not null, default: 0]
  created_at timestamp [not null, default: `CURRENT_TIMESTAMP`]
  updated_at timestamp [not null, default: `CURRENT_TIMESTAMP`]

  indexes {
    (organization_id, id) [unique]
    (organization_id, program_id, id) [unique]
    (organization_id, program_id, sort_order)
  }
}

Table roadmap_targets {
  id bigint [pk, increment]
  organization_id bigint [not null]
  program_id bigint [not null]
  roadmap_item_id bigint [not null]
  year smallint [not null]
  target_quantity decimal(20,6) [not null]
  unit varchar(100) [not null]
  created_at timestamp [not null, default: `CURRENT_TIMESTAMP`]
  updated_at timestamp [not null, default: `CURRENT_TIMESTAMP`]

  checks {
    `target_quantity >= 0` [name: 'chk_roadmap_target_nonnegative']
  }

  indexes {
    (organization_id, id) [unique]
    (organization_id, roadmap_item_id, year) [unique]
  }
}

Table program_scopes {
  id bigint [pk, increment]
  organization_id bigint [not null]
  program_id bigint [not null]
  assessment_type assessment_type [not null]
  evaluative_start_year smallint
  evaluative_end_year smallint
  forecast_start_year smallint
  forecast_end_year smallint
  scope_text text [not null]
  created_at timestamp [not null, default: `CURRENT_TIMESTAMP`]
  updated_at timestamp [not null, default: `CURRENT_TIMESTAMP`]

  indexes {
    (organization_id, id) [unique]
    (organization_id, program_id) [unique]
  }
}

Table program_investments {
  id bigint [pk, increment]
  organization_id bigint [not null]
  program_id bigint [not null]
  investor_name varchar(200) [not null]
  contribution_type investment_type [not null]
  form varchar(150) [not null]
  currency_code char(3) [not null, default: 'IDR']
  sort_order int [not null, default: 0]
  created_at timestamp [not null, default: `CURRENT_TIMESTAMP`]
  updated_at timestamp [not null, default: `CURRENT_TIMESTAMP`]

  indexes {
    (organization_id, id) [unique]
    (organization_id, program_id, id) [unique]
    (organization_id, program_id)
  }
}

Table program_investment_years {
  id bigint [pk, increment]
  organization_id bigint [not null]
  program_id bigint [not null]
  investment_id bigint [not null]
  year smallint [not null]
  amount decimal(20,2) [not null]
  created_at timestamp [not null, default: `CURRENT_TIMESTAMP`]
  updated_at timestamp [not null, default: `CURRENT_TIMESTAMP`]

  checks {
    `amount >= 0` [name: 'chk_investment_nonnegative']
  }

  indexes {
    (organization_id, id) [unique]
    (organization_id, investment_id, year) [unique]
  }
}

Table program_stakeholders {
  id bigint [pk, increment]
  organization_id bigint [not null]
  program_id bigint [not null]
  program_category_id bigint [not null]
  stakeholder_category_list_id bigint [not null]
  role_in_program text [not null]
  included boolean [not null, default: true]
  inclusion_reason text [not null]
  sort_order int [not null, default: 0]
  created_at timestamp [not null, default: `CURRENT_TIMESTAMP`]
  updated_at timestamp [not null, default: `CURRENT_TIMESTAMP`]

  indexes {
    (organization_id, id) [unique]
    (organization_id, program_id, id) [unique]
    (organization_id, program_id, stakeholder_category_list_id) [unique]
    (organization_id, program_id, included)
  }
}

Table program_outcomes {
  id bigint [pk, increment]
  organization_id bigint [not null]
  program_id bigint [not null]
  program_category_id bigint [not null]
  stakeholder_id bigint [not null]
  outcome_category_id bigint
  name varchar(255) [not null]
  description text [not null]
  relevant boolean [not null]
  significant boolean [not null]
  material boolean [not null]
  materiality_reason text
  materiality_explanation text
  sort_order int [not null, default: 0]
  created_at timestamp [not null, default: `CURRENT_TIMESTAMP`]
  updated_at timestamp [not null, default: `CURRENT_TIMESTAMP`]

  indexes {
    (organization_id, id) [unique]
    (organization_id, program_id, id) [unique]
    (organization_id, program_id, stakeholder_id, material)
  }
}

Table outcome_indicators {
  id bigint [pk, increment]
  organization_id bigint [not null]
  outcome_id bigint [not null]
  name varchar(255) [not null]
  unit varchar(100)
  evidence text
  evidence_source text
  sort_order int [not null, default: 0]
  created_at timestamp [not null, default: `CURRENT_TIMESTAMP`]
  updated_at timestamp [not null, default: `CURRENT_TIMESTAMP`]

  indexes {
    (organization_id, id) [unique]
    (organization_id, outcome_id, id) [unique]
  }
}

Table financial_proxies {
  id bigint [pk, increment]
  organization_id bigint [not null]
  outcome_id bigint [not null]
  approach varchar(255) [not null]
  description text
  source text [not null]
  unit varchar(100) [not null]
  unit_value decimal(20,4) [not null]
  currency_code char(3) [not null, default: 'IDR']
  created_at timestamp [not null, default: `CURRENT_TIMESTAMP`]
  updated_at timestamp [not null, default: `CURRENT_TIMESTAMP`]

  checks {
    `unit_value >= 0` [name: 'chk_proxy_nonnegative']
  }

  indexes {
    (organization_id, id) [unique]
    (organization_id, outcome_id, id) [unique]
  }
}

Table outcome_impact_years {
  id bigint [pk, increment]
  organization_id bigint [not null]
  outcome_id bigint [not null]
  indicator_id bigint [not null]
  financial_proxy_id bigint [not null]
  period_type period_type [not null]
  year smallint [not null]
  quantity decimal(20,6) [not null]
  deadweight_pct decimal(7,4) [not null, default: 0]
  displacement_pct decimal(7,4) [not null, default: 0]
  attribution_pct decimal(7,4) [not null, default: 0]
  dropoff_pct decimal(7,4) [not null, default: 0]
  deadweight_reason text
  displacement_reason text
  attribution_reason text
  dropoff_reason text
  updated_by bigint [not null]
  created_at timestamp [not null, default: `CURRENT_TIMESTAMP`]
  updated_at timestamp [not null, default: `CURRENT_TIMESTAMP`]

  checks {
    `quantity >= 0` [name: 'chk_impact_quantity_nonnegative']
    `deadweight_pct >= 0 AND deadweight_pct <= 100` [name: 'chk_deadweight_range']
    `displacement_pct >= 0 AND displacement_pct <= 100` [name: 'chk_displacement_range']
    `attribution_pct >= 0 AND attribution_pct <= 100` [name: 'chk_attribution_range']
    `dropoff_pct >= 0 AND dropoff_pct <= 100` [name: 'chk_dropoff_range']
  }

  indexes {
    (organization_id, id) [unique]
    (organization_id, outcome_id, period_type, year) [unique]
    (organization_id, outcome_id, indicator_id)
    (organization_id, outcome_id, financial_proxy_id)
  }
}

Table sroi_methods {
  id bigint [pk, increment]
  code varchar(40) [not null]
  version varchar(40) [not null]
  description text [not null]
  active boolean [not null, default: true]
  created_at timestamp [not null, default: `CURRENT_TIMESTAMP`]

  indexes {
    (code, version) [unique]
  }
}

Table sroi_runs {
  id bigint [pk, increment]
  organization_id bigint [not null]
  program_id bigint [not null]
  method_id bigint [not null]
  base_year smallint [not null]
  discount_rate_pct decimal(7,4) [not null]
  currency_code char(3) [not null, default: 'IDR']
  status run_status [not null, default: 'complete']
  total_present_value decimal(20,2) [not null]
  total_investment decimal(20,2) [not null]
  ratio decimal(20,6)
  created_by bigint [not null]
  created_at timestamp [not null, default: `CURRENT_TIMESTAMP`]

  checks {
    `discount_rate_pct >= 0` [name: 'chk_discount_nonnegative']
    `total_investment >= 0` [name: 'chk_run_investment_nonnegative']
  }

  indexes {
    (organization_id, id) [unique]
    (organization_id, program_id, id) [unique]
    (organization_id, program_id, created_at)
  }
}

Table sroi_run_outcome_years {
  id bigint [pk, increment]
  organization_id bigint [not null]
  program_id bigint [not null]
  run_id bigint [not null]
  outcome_id bigint [not null]
  period_type period_type [not null]
  year smallint [not null]
  stakeholder_name varchar(200) [not null]
  outcome_name varchar(255) [not null]
  indicator_name varchar(255) [not null]
  indicator_unit varchar(100)
  evidence text
  evidence_source text
  proxy_approach varchar(255) [not null]
  proxy_source text [not null]
  proxy_unit varchar(100) [not null]
  quantity decimal(20,6) [not null]
  proxy_unit_value decimal(20,4) [not null]
  deadweight_pct decimal(7,4) [not null]
  displacement_pct decimal(7,4) [not null]
  attribution_pct decimal(7,4) [not null]
  dropoff_pct decimal(7,4) [not null]
  adjustment_reasons json
  gross_value decimal(20,2) [not null]
  adjusted_value decimal(20,2) [not null]
  discount_factor decimal(20,10) [not null]
  present_value decimal(20,2) [not null]
  created_at timestamp [not null, default: `CURRENT_TIMESTAMP`]

  indexes {
    (organization_id, id) [unique]
    (organization_id, run_id, outcome_id, period_type, year) [unique]
  }
}

Table sroi_run_investment_years {
  id bigint [pk, increment]
  organization_id bigint [not null]
  program_id bigint [not null]
  run_id bigint [not null]
  investment_id bigint [not null]
  year smallint [not null]
  investor_name varchar(200) [not null]
  contribution_type investment_type [not null]
  form varchar(150) [not null]
  amount decimal(20,2) [not null]
  created_at timestamp [not null, default: `CURRENT_TIMESTAMP`]

  indexes {
    (organization_id, id) [unique]
    (organization_id, run_id, investment_id, year) [unique]
  }
}

Table sroi_run_yearly_totals {
  id bigint [pk, increment]
  organization_id bigint [not null]
  run_id bigint [not null]
  period_type period_type [not null]
  year smallint [not null]
  total_present_value decimal(20,2) [not null]
  total_investment decimal(20,2) [not null]
  ratio decimal(20,6)
  created_at timestamp [not null, default: `CURRENT_TIMESTAMP`]

  indexes {
    (organization_id, id) [unique]
    (organization_id, run_id, period_type, year) [unique]
  }
}

Table report_exports {
  id bigint [pk, increment]
  organization_id bigint [not null]
  program_id bigint [not null]
  run_id bigint
  report_type export_type [not null]
  stage varchar(40)
  format export_format [not null]
  status export_status [not null, default: 'queued']
  object_key varchar(500)
  error_message text
  requested_by bigint [not null]
  created_at timestamp [not null, default: `CURRENT_TIMESTAMP`]
  updated_at timestamp [not null, default: `CURRENT_TIMESTAMP`]
  completed_at timestamp

  indexes {
    (organization_id, id) [unique]
    (organization_id, object_key) [unique]
    (organization_id, program_id, created_at)
  }
}

Table audit_logs {
  id bigint [pk, increment]
  organization_id bigint [not null]
  actor_user_id bigint
  entity_type varchar(60) [not null]
  entity_id bigint [not null]
  action audit_action [not null]
  before_state json
  after_state json
  occurred_at timestamp [not null, default: `CURRENT_TIMESTAMP`]

  indexes {
    (organization_id, id) [unique]
    (organization_id, entity_type, entity_id, occurred_at)
  }
}

Ref: auth_identities.user_id > users.id
Ref: password_reset_tokens.user_id > users.id
Ref: roles.organization_id > organizations.id
Ref: organization_members.organization_id > organizations.id
Ref: organization_members.user_id > users.id
Ref: organization_members.(organization_id, role_id) > roles.(organization_id, id)
Ref: catalog_templates.parent_template_id > catalog_templates.id
Ref: sectors.organization_id > organizations.id
Ref: sectors.source_template_id > catalog_templates.id
Ref: cities.province_id > provinces.id
Ref: districts.city_id > cities.id
Ref: sub_districts.district_id > districts.id
Ref: locations.organization_id > organizations.id
Ref: locations.province_id > provinces.id
Ref: locations.(province_id, city_id) > cities.(province_id, id)
Ref: locations.(city_id, district_id) > districts.(city_id, id)
Ref: locations.(district_id, sub_district_id) > sub_districts.(district_id, id)
Ref: companies.(organization_id, sector_id) > sectors.(organization_id, id)
Ref: companies.(organization_id, headquarters_location_id) > locations.(organization_id, id)
Ref: company_members.(organization_id, company_id) > companies.(organization_id, id)
Ref: company_members.(organization_id, user_id) > organization_members.(organization_id, user_id)
Ref: company_members.organization_id > organizations.id
Ref: program_categories.organization_id > organizations.id
Ref: program_categories.source_template_id > catalog_templates.id
Ref: stakeholder_categories.(organization_id, program_category_id) > program_categories.(organization_id, id)
Ref: stakeholder_categories.source_template_id > catalog_templates.id
Ref: stakeholder_category_lists.(organization_id, program_category_id, stakeholder_category_id) > stakeholder_categories.(organization_id, program_category_id, id)
Ref: stakeholder_category_lists.source_template_id > catalog_templates.id
Ref: stakeholder_category_lists.organization_id > organizations.id
Ref: outcome_categories.(organization_id, program_category_id) > program_categories.(organization_id, id)
Ref: outcome_categories.source_template_id > catalog_templates.id
Ref: programs.(organization_id, company_id) > companies.(organization_id, id)
Ref: programs.(organization_id, category_id) > program_categories.(organization_id, id)
Ref: programs.created_by > users.id
Ref: programs.organization_id > organizations.id
Ref: program_locations.(organization_id, program_id) > programs.(organization_id, id)
Ref: program_locations.province_id > provinces.id
Ref: program_locations.(province_id, city_id) > cities.(province_id, id)
Ref: program_locations.(city_id, district_id) > districts.(city_id, id)
Ref: program_locations.(district_id, sub_district_id) > sub_districts.(district_id, id)
Ref: program_members.(organization_id, program_id) > programs.(organization_id, id)
Ref: program_members.(organization_id, member_id) > organization_members.(organization_id, id)
Ref: program_documents.(organization_id, program_id) > programs.(organization_id, id)
Ref: program_documents.uploaded_by > users.id
Ref: theory_of_change_conditions.(organization_id, program_id) > programs.(organization_id, id)
Ref: theory_of_change_flows.(organization_id, program_id) > programs.(organization_id, id)
Ref: lfa_nodes.(organization_id, program_id) > programs.(organization_id, id)
Ref: lfa_nodes.(organization_id, program_id, parent_id) > lfa_nodes.(organization_id, program_id, id)
Ref: roadmap_items.(organization_id, program_id) > programs.(organization_id, id)
Ref: roadmap_items.(organization_id, program_id, lfa_activity_id) > lfa_nodes.(organization_id, program_id, id)
Ref: roadmap_targets.(organization_id, program_id, roadmap_item_id) > roadmap_items.(organization_id, program_id, id)
Ref: program_scopes.(organization_id, program_id) > programs.(organization_id, id)
Ref: program_investments.(organization_id, program_id) > programs.(organization_id, id)
Ref: program_investment_years.(organization_id, program_id, investment_id) > program_investments.(organization_id, program_id, id)
Ref: program_stakeholders.(organization_id, program_id, program_category_id) > programs.(organization_id, id, category_id)
Ref: program_stakeholders.(organization_id, program_category_id, stakeholder_category_list_id) > stakeholder_category_lists.(organization_id, program_category_id, id)
Ref: program_outcomes.(organization_id, program_id, program_category_id) > programs.(organization_id, id, category_id)
Ref: program_outcomes.(organization_id, program_id, stakeholder_id) > program_stakeholders.(organization_id, program_id, id)
Ref: program_outcomes.(organization_id, program_category_id, outcome_category_id) > outcome_categories.(organization_id, program_category_id, id)
Ref: outcome_indicators.(organization_id, outcome_id) > program_outcomes.(organization_id, id)
Ref: financial_proxies.(organization_id, outcome_id) > program_outcomes.(organization_id, id)
Ref: outcome_impact_years.(organization_id, outcome_id, indicator_id) > outcome_indicators.(organization_id, outcome_id, id)
Ref: outcome_impact_years.(organization_id, outcome_id, financial_proxy_id) > financial_proxies.(organization_id, outcome_id, id)
Ref: outcome_impact_years.updated_by > users.id
Ref: sroi_runs.(organization_id, program_id) > programs.(organization_id, id)
Ref: sroi_runs.method_id > sroi_methods.id
Ref: sroi_runs.created_by > users.id
Ref: sroi_run_outcome_years.(organization_id, program_id, run_id) > sroi_runs.(organization_id, program_id, id)
Ref: sroi_run_outcome_years.(organization_id, program_id, outcome_id) > program_outcomes.(organization_id, program_id, id)
Ref: sroi_run_investment_years.(organization_id, program_id, run_id) > sroi_runs.(organization_id, program_id, id)
Ref: sroi_run_investment_years.(organization_id, program_id, investment_id) > program_investments.(organization_id, program_id, id)
Ref: sroi_run_yearly_totals.(organization_id, run_id) > sroi_runs.(organization_id, id)
Ref: report_exports.(organization_id, program_id) > programs.(organization_id, id)
Ref: report_exports.(organization_id, program_id, run_id) > sroi_runs.(organization_id, program_id, id)
Ref: report_exports.requested_by > users.id
Ref: audit_logs.organization_id > organizations.id
Ref: audit_logs.actor_user_id > users.id
