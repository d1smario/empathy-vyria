-- =====================================================
-- FIX RLS POLICIES - Remove infinite recursion
-- =====================================================

-- Drop problematic policies
DROP POLICY IF EXISTS "Coaches can view linked athletes" ON public.athletes;
DROP POLICY IF EXISTS "Athletes can view own data" ON public.athletes;
DROP POLICY IF EXISTS "Athletes can update own data" ON public.athletes;
DROP POLICY IF EXISTS "Athletes can insert own data" ON public.athletes;

-- Recreate athletes policies without recursion
CREATE POLICY "Athletes can view own data" ON public.athletes
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Athletes can update own data" ON public.athletes
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Athletes can insert own data" ON public.athletes
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Fixed coach policy - no longer references athletes table in subquery
CREATE POLICY "Coaches can view linked athletes" ON public.athletes
  FOR SELECT USING (
    user_id IN (
      SELECT athlete_id FROM public.coach_athlete_links
      WHERE coach_id = auth.uid()
      AND status = 'active'
    )
  );

-- Fix athlete_constraints policies
DROP POLICY IF EXISTS "Athletes can view own constraints" ON public.athlete_constraints;
DROP POLICY IF EXISTS "Athletes can manage own constraints" ON public.athlete_constraints;

CREATE POLICY "Athletes can view own constraints" ON public.athlete_constraints
  FOR SELECT USING (
    athlete_id IN (SELECT id FROM public.athletes WHERE user_id = auth.uid())
  );

CREATE POLICY "Athletes can insert own constraints" ON public.athlete_constraints
  FOR INSERT WITH CHECK (
    athlete_id IN (SELECT id FROM public.athletes WHERE user_id = auth.uid())
  );

CREATE POLICY "Athletes can update own constraints" ON public.athlete_constraints
  FOR UPDATE USING (
    athlete_id IN (SELECT id FROM public.athletes WHERE user_id = auth.uid())
  );

CREATE POLICY "Athletes can delete own constraints" ON public.athlete_constraints
  FOR DELETE USING (
    athlete_id IN (SELECT id FROM public.athletes WHERE user_id = auth.uid())
  );

-- Fix empathy_indices policies
DROP POLICY IF EXISTS "Athletes can view own indices" ON public.empathy_indices;
DROP POLICY IF EXISTS "Athletes can manage own indices" ON public.empathy_indices;

CREATE POLICY "Athletes can view own indices" ON public.empathy_indices
  FOR SELECT USING (
    athlete_id IN (SELECT id FROM public.athletes WHERE user_id = auth.uid())
  );

CREATE POLICY "Athletes can insert own indices" ON public.empathy_indices
  FOR INSERT WITH CHECK (
    athlete_id IN (SELECT id FROM public.athletes WHERE user_id = auth.uid())
  );

CREATE POLICY "Athletes can update own indices" ON public.empathy_indices
  FOR UPDATE USING (
    athlete_id IN (SELECT id FROM public.athletes WHERE user_id = auth.uid())
  );
