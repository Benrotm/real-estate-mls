-- Migration to clean up duplicate plan_features
-- We want to keep the one with the lowest ID (oldest) or just any single one per (role, plan_name, feature_key)

DELETE FROM public.plan_features a USING (
      SELECT MIN(ctid) as ctid, role, plan_name, feature_key
        FROM public.plan_features 
        GROUP BY role, plan_name, feature_key HAVING COUNT(*) > 1
      ) b
      WHERE a.role = b.role 
      AND a.plan_name = b.plan_name 
      AND a.feature_key = b.feature_key 
      AND a.ctid <> b.ctid;
