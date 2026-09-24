Enum users_role {
  superadmin
  admin
  company
  enumerator
}

Enum submission_template_answer_type {
  "ikm-kepentingan"
  "ikm-kinerja"
  sloi
}

Table companies {
  id bigint [pk, increment]
  name varchar(150) [not null]
  legal_name varchar(200)
  email varchar(191)
  phone varchar(32)
  address text
  status varchar(20) [not null, default: 'active', note: 'active|pending|suspended|deleted']
  created_at timestamp
  updated_at timestamp
  deleted_at timestamp
}

Table users {
  id bigint [pk, increment]
  name varchar(255) [not null]
  email varchar(255) [not null]
  email_verified_at timestamp
  password varchar(255) [not null]
  company_id bigint [ref: > companies.id]
  position varchar(255)
  role users_role [not null, default: 'company']
  phone varchar(30)
  is_active boolean [not null, default: true]
  deleted_at timestamp
  remember_token varchar(100)
  created_at timestamp
  updated_at timestamp

  indexes {
    (email, deleted_at) [unique]
  }
}

Table provinces {
  id bigint [pk, increment]
  code varchar(10) [unique, note: 'kode resmi opsional, contoh: 35']
  name varchar(100) [not null]
  created_at timestamp
  updated_at timestamp

  indexes {
    name
  }
}

Table cities {
  id bigint [pk, increment]
  province_id bigint [not null, ref: > provinces.id]
  code varchar(10) [unique, note: 'kode resmi opsional, contoh: 3578']
  name varchar(100) [not null]
  type varchar(20) [not null, note: 'kabupaten|kota']
  created_at timestamp
  updated_at timestamp

  indexes {
    (province_id, name) [unique]
    province_id
  }
}

Table districts {
  id bigint [pk, increment]
  city_id bigint [not null, ref: > cities.id]
  code varchar(10) [unique, note: 'kode resmi opsional, contoh: 3578010']
  name varchar(100) [not null]
  created_at timestamp
  updated_at timestamp

  indexes {
    (city_id, name) [unique]
    city_id
  }
}

Table villages {
  id bigint [pk, increment]
  district_id bigint [not null, ref: > districts.id]
  code varchar(15) [unique, note: 'kode resmi opsional, contoh: 3578010001']
  name varchar(100) [not null]
  created_at timestamp
  updated_at timestamp

  indexes {
    (district_id, name) [unique]
    district_id
  }
}

Table instrument_templates {
  id bigint [pk, increment]
  type varchar(10) [not null, note: 'IKM|SLOI']
  name varchar(150) [not null]
  version int [not null, default: 1]
  description text
  is_active boolean [not null, default: true]
  published_at timestamp
  created_by bigint [ref: > users.id]
  created_at timestamp
  updated_at timestamp
  deleted_at timestamp

  indexes {
    (type, version, deleted_at) [unique, name: 'inst_temp_type_ver_del_unique']
  }
}

Table template_questions {
  id bigint [pk, increment]
  template_id bigint [not null, ref: > instrument_templates.id]
  category varchar(100)
  code varchar(50) [not null]
  aspect varchar(100) [not null]
  question_text text [not null]
  order_no int [not null, default: 1]
  created_at timestamp [not null, default: `CURRENT_TIMESTAMP`]
  deleted_at timestamp

  indexes {
    (template_id, order_no)
  }
}

Table projects {
  id bigint [pk, increment]
  company_id bigint [not null, ref: > companies.id]
  name varchar(200) [not null]
  description text
  project_code varchar(30) [not null, note: 'contoh PROJ-ABC123']
  status varchar(20) [not null, default: 'draft', note: 'draft|active|closed|archived']
  target_ikm_count int [not null, default: 0]
  target_sloi_count int [not null, default: 0]
  enable_ikm boolean [not null, default: false]
  enable_sloi boolean [not null, default: false]
  ikm_template_id bigint [ref: > instrument_templates.id]
  sloi_template_id bigint [ref: > instrument_templates.id]
  start_date date
  end_date date
  closed_at timestamp
  created_by bigint [ref: > users.id]
  created_at timestamp
  updated_at timestamp
  deleted_at timestamp

  indexes {
    (company_id, project_code, deleted_at) [unique, name: 'proj_comp_code_del_unique']
    (company_id, status)
  }
}

Table project_locations {
  id bigint [pk, increment]
  company_id bigint [not null, ref: > companies.id]
  project_id bigint [not null, ref: > projects.id]
  district_id bigint [not null, ref: > districts.id]
  created_at timestamp
  updated_at timestamp
  deleted_at timestamp

  indexes {
    project_id
    (project_id, district_id, deleted_at) [unique, name: 'proj_loc_dist_del_unique']
  }
}

Table project_enumerator_assignments {
  id bigint [pk, increment]
  company_id bigint [not null, ref: > companies.id]
  project_id bigint [not null, ref: > projects.id]
  enumerator_id bigint [not null, ref: > users.id, note: 'role=enumerator']
  created_at timestamp [not null, default: `CURRENT_TIMESTAMP`]
  deleted_at timestamp

  indexes {
    (project_id, enumerator_id, deleted_at) [unique, name: 'proj_enum_deleted_unique']
  }
}

Table respondents {
  id bigint [pk, increment]
  company_id bigint [not null, ref: > companies.id]
  project_id bigint [not null, ref: > projects.id]
  name varchar(150) [not null]
  address text
  phone varchar(32)
  age int
  gender varchar(10)
  respondent_status varchar(30) [note: 'Ibu rumah tangga, Kepala keluarga, dll']
  education_level varchar(50)
  main_occupation varchar(80)
  monthly_income bigint
  created_by bigint [ref: > users.id]
  created_at timestamp
  updated_at timestamp
  deleted_at timestamp

  indexes {
    (company_id, project_id)
  }
}







Table submissions {
  id bigint [pk, increment]
  company_id bigint [not null, ref: > companies.id]
  project_id bigint [not null, ref: > projects.id]
  assessment_type varchar(10) [not null, note: 'IKM|SLOI']
  respondent_id bigint [ref: > respondents.id, note: 'one to one']
  enumerator_id bigint [not null, ref: > users.id]
  status varchar(20) [not null, default: 'submitted', note: 'submitted|approved|rejected']
  photo_path text [not null, note: 'path/url foto']
  photo_mime varchar(100)
  photo_size_bytes bigint
  latitude decimal(15,10) [not null]
  longitude decimal(15,10) [not null]
  submitted_at timestamp [not null, default: `CURRENT_TIMESTAMP`]
  created_at timestamp [not null, default: `CURRENT_TIMESTAMP`]
  deleted_at timestamp

  indexes {
    (company_id, project_id, assessment_type, submitted_at) [name: 'submissions_company_project_type_submitted_idx']
    (project_id, enumerator_id, submitted_at)
    (project_id, respondent_id)
    (project_id, respondent_id, deleted_at) [unique, name: 'sub_proj_resp_del_unique']
  }
}

Table submission_template_answers {
  id bigint [pk, increment]
  submission_id bigint [not null, ref: > submissions.id]
  type submission_template_answer_type [not null]
  question_id bigint [not null, ref: > template_questions.id]
  value int [note: 'likert 1-5']
  created_at timestamp [not null, default: `CURRENT_TIMESTAMP`]
  deleted_at timestamp
}


Table project_score_snapshots {
  id bigint [pk, increment]
  company_id bigint [not null, ref: > companies.id]
  project_id bigint [not null, ref: > projects.id]
  assessment_type varchar(10) [not null, note: 'IKM|SLOI']
  calculated_at timestamp [not null, default: `CURRENT_TIMESTAMP`]
  total_score decimal(12,4) [not null, default: 0]
  details_json json
  version int [not null, default: 1]
  deleted_at timestamp
}

Table submission_timelines {
  id bigint [pk, increment]
  submission_id bigint [not null, ref: > submissions.id]
  action varchar(20) [not null, note: 'submitted|approved|rejected|revised']
  decided_at timestamp [not null, default: `CURRENT_TIMESTAMP`]
  decided_by bigint [not null, ref: > users.id]
  notes text
  created_at timestamp [not null, default: `CURRENT_TIMESTAMP`]

  indexes {
    (submission_id, decided_at)
  }
}

Table project_descriptive_questions {
  id bigint [pk, increment]
  project_id bigint [not null, ref: > projects.id]
  title varchar(255) [not null]
  created_at timestamp
  updated_at timestamp
  deleted_at timestamp
}

Table submission_descriptive_answers {
  id bigint [pk, increment]
  submission_id bigint [not null, ref: > submissions.id]
  project_descriptive_question_id bigint [not null, ref: > project_descriptive_questions.id]
  answer text [not null]
  created_at timestamp
  updated_at timestamp
  deleted_at timestamp
}
