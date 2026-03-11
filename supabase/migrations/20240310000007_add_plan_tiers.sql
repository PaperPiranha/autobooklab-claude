-- Add new plan tiers: 'creator' and 'business'
-- The plan column on subscriptions is text, so we just need to ensure
-- the refresh_credits_for_plan RPC handles the new values.

-- Update the refresh_credits_for_plan function to handle 5 tiers
CREATE OR REPLACE FUNCTION refresh_credits_for_plan(p_user_id uuid, p_plan text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  credit_amount int;
BEGIN
  CASE p_plan
    WHEN 'starter' THEN credit_amount := 75;
    WHEN 'creator' THEN credit_amount := 200;
    WHEN 'pro' THEN credit_amount := 500;
    WHEN 'business' THEN credit_amount := 1500;
    ELSE credit_amount := 10;  -- free
  END CASE;

  INSERT INTO credits (user_id, balance)
  VALUES (p_user_id, credit_amount)
  ON CONFLICT (user_id) DO UPDATE SET balance = credit_amount;
END;
$$;
