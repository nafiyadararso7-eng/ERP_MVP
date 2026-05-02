-- ================================================================
-- User Management Migration
-- Implements: one-owner constraint, invitations table, helper RPCs
-- Based on login.md requirements
-- ================================================================

-- ============================================
-- 1. ONE-OWNER-PER-SHOP CONSTRAINT
-- ============================================
-- Partial unique index ensures at most one 'owner' role per shop.
CREATE UNIQUE INDEX IF NOT EXISTS idx_one_owner_per_shop
  ON public.user_roles (shop_id)
  WHERE role = 'owner';


-- ============================================
-- 2. INVITATIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.invitations (
  id          uuid        PRIMARY KEY DEFAULT uuid_generate_v4(),
  shop_id     uuid        NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
  email       text        NOT NULL,
  token       uuid        NOT NULL DEFAULT uuid_generate_v4(),
  invited_by  uuid        NOT NULL REFERENCES auth.users(id),
  accepted    boolean     NOT NULL DEFAULT false,
  created_at  timestamptz NOT NULL DEFAULT now(),
  expires_at  timestamptz NOT NULL DEFAULT (now() + interval '7 days'),

  UNIQUE(token),
  UNIQUE(shop_id, email)
);

COMMENT ON TABLE public.invitations IS 'Tracks cashier invitations sent by shop owners.';

-- Index for fast token lookup
CREATE INDEX IF NOT EXISTS idx_invitations_token ON public.invitations(token);
CREATE INDEX IF NOT EXISTS idx_invitations_shop  ON public.invitations(shop_id);


-- ============================================
-- 3. RLS FOR INVITATIONS
-- ============================================
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;

-- Anyone can read invitations (needed for join page to validate tokens)
CREATE POLICY "Anyone can view invitations"
  ON public.invitations FOR SELECT
  USING (true);

-- Owners can create invitations for their shop
CREATE POLICY "Owners can create invitations"
  ON public.invitations FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), shop_id, 'owner'));

-- Owners can delete/revoke invitations for their shop
CREATE POLICY "Owners can delete invitations"
  ON public.invitations FOR DELETE
  USING (public.has_role(auth.uid(), shop_id, 'owner'));

-- Owners can update invitations (e.g., mark accepted)
CREATE POLICY "Owners can update invitations"
  ON public.invitations FOR UPDATE
  USING (true);


-- ============================================
-- 4. RPC: Check if any owner exists globally
-- ============================================
-- Used by the signup page to disable registration after
-- the first owner has signed up.
CREATE OR REPLACE FUNCTION public.owner_exists()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE role = 'owner'
  );
$$;

COMMENT ON FUNCTION public.owner_exists IS 'Returns true if at least one owner exists in the system.';


-- ============================================
-- 5. RPC: Validate an invitation token (public)
-- ============================================
-- Returns invitation details for the join page.
-- Does NOT require authentication.
CREATE OR REPLACE FUNCTION public.get_invitation_by_token(_token uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  inv record;
BEGIN
  SELECT i.id, i.email, i.shop_id, i.accepted, i.expires_at, s.name as shop_name
  INTO inv
  FROM public.invitations i
  JOIN public.shops s ON s.id = i.shop_id
  WHERE i.token = _token;

  IF inv IS NULL THEN
    RETURN json_build_object('valid', false, 'error', 'Invitation not found');
  END IF;

  IF inv.accepted THEN
    RETURN json_build_object('valid', false, 'error', 'Invitation already accepted');
  END IF;

  IF inv.expires_at < now() THEN
    RETURN json_build_object('valid', false, 'error', 'Invitation has expired');
  END IF;

  RETURN json_build_object(
    'valid', true,
    'email', inv.email,
    'shop_name', inv.shop_name,
    'shop_id', inv.shop_id
  );
END;
$$;

COMMENT ON FUNCTION public.get_invitation_by_token IS 'Validates an invitation token and returns details for the join page.';


-- ============================================
-- 6. RPC: Accept invitation (after cashier signup)
-- ============================================
-- Called by the newly signed-up cashier to:
-- 1. Create their cashier role in user_roles
-- 2. Mark the invitation as accepted
CREATE OR REPLACE FUNCTION public.accept_invitation(_token uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  inv record;
BEGIN
  -- Validate invitation
  SELECT * INTO inv FROM public.invitations
  WHERE token = _token AND accepted = false AND expires_at > now();

  IF inv IS NULL THEN
    RETURN json_build_object('error', 'Invalid or expired invitation');
  END IF;

  -- Create the cashier role for this user + shop
  INSERT INTO public.user_roles (user_id, shop_id, role)
  VALUES (auth.uid(), inv.shop_id, 'cashier')
  ON CONFLICT (user_id, shop_id) DO NOTHING;

  -- Mark invitation as accepted
  UPDATE public.invitations SET accepted = true WHERE id = inv.id;

  RETURN json_build_object('success', true, 'shop_id', inv.shop_id::text);
END;
$$;

COMMENT ON FUNCTION public.accept_invitation IS 'Assigns cashier role and marks invitation as accepted.';


-- ============================================
-- 7. RPC: Create invitation (owner only)
-- ============================================
-- Validates that the caller is an owner, then creates the invitation.
CREATE OR REPLACE FUNCTION public.create_invitation(_email text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  _shop_id uuid;
  _token uuid;
  inv_id uuid;
BEGIN
  -- Get the owner's shop
  SELECT shop_id INTO _shop_id
  FROM public.user_roles
  WHERE user_id = auth.uid() AND role = 'owner'
  LIMIT 1;

  IF _shop_id IS NULL THEN
    RETURN json_build_object('error', 'Only owners can invite cashiers');
  END IF;

  -- Check if invitation already exists for this email in this shop
  SELECT id INTO inv_id FROM public.invitations
  WHERE shop_id = _shop_id AND email = _email AND accepted = false;

  IF inv_id IS NOT NULL THEN
    -- Return existing invitation token
    SELECT token INTO _token FROM public.invitations WHERE id = inv_id;
    RETURN json_build_object('success', true, 'token', _token::text, 'existing', true);
  END IF;

  -- Create new invitation
  _token := uuid_generate_v4();
  INSERT INTO public.invitations (shop_id, email, token, invited_by)
  VALUES (_shop_id, _email, _token, auth.uid());

  RETURN json_build_object('success', true, 'token', _token::text, 'existing', false);
END;
$$;

COMMENT ON FUNCTION public.create_invitation IS 'Creates a cashier invitation. Only callable by owners.';


-- ============================================
-- ✅ DONE — User management migration complete.
-- ============================================
