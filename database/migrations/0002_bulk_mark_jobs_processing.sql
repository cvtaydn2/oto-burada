CREATE OR REPLACE FUNCTION "public"."mark_jobs_processing"("p_job_ids" uuid[]) RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  UPDATE fulfillment_jobs
  SET
    status = 'processing',
    attempts = attempts + 1,
    updated_at = NOW()
  WHERE id = ANY(p_job_ids)
    AND status IN ('pending', 'failed');

  RETURN FOUND;
END;
$$;

ALTER FUNCTION "public"."mark_jobs_processing"("p_job_ids" uuid[]) OWNER TO "postgres";

REVOKE ALL ON FUNCTION "public"."mark_jobs_processing"("p_job_ids" uuid[]) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."mark_jobs_processing"("p_job_ids" uuid[]) TO "service_role";
GRANT ALL ON FUNCTION "public"."mark_jobs_processing"("p_job_ids" uuid[]) TO "authenticated";
