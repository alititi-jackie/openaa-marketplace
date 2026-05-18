ALTER TABLE public.job_postings
  ADD COLUMN IF NOT EXISTS salary_unit TEXT;

ALTER TABLE public.job_postings
  ALTER COLUMN salary_unit SET DEFAULT '/小时';

UPDATE public.job_postings
SET salary_unit = '/小时'
WHERE salary_unit IS NULL
   OR btrim(salary_unit) = ''
   OR salary_unit NOT IN ('/小时', '/月薪', '/年薪');

ALTER TABLE public.job_postings
  ALTER COLUMN salary_unit SET NOT NULL;

ALTER TABLE public.job_postings
  DROP CONSTRAINT IF EXISTS job_postings_salary_unit_check;

ALTER TABLE public.job_postings
  ADD CONSTRAINT job_postings_salary_unit_check
  CHECK (salary_unit IN ('/小时', '/月薪', '/年薪'));

ALTER TABLE public.job_postings
  ALTER COLUMN salary_min DROP NOT NULL,
  ALTER COLUMN salary_max DROP NOT NULL;
