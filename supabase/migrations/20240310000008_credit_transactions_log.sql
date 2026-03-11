-- Credit transaction audit log for usage monitoring
CREATE TABLE IF NOT EXISTS credit_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action text NOT NULL,  -- 'generate', 'rewrite', 'chat', 'outline', 'seed-pages', 'refresh'
  amount int NOT NULL,   -- negative = spend, positive = refresh
  balance_after int,     -- snapshot of balance after transaction
  metadata jsonb DEFAULT '{}',  -- e.g. { "input_tokens": 500, "output_tokens": 1500 }
  created_at timestamptz DEFAULT now()
);

-- Index for querying user transactions and daily aggregates
CREATE INDEX idx_credit_transactions_user_created
  ON credit_transactions (user_id, created_at DESC);

-- Index for monitoring: find heavy users
CREATE INDEX idx_credit_transactions_created
  ON credit_transactions (created_at DESC);

-- Update spend_credit to also log the transaction
CREATE OR REPLACE FUNCTION spend_credit(p_user_id uuid, p_amount int, p_action text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_balance int;
BEGIN
  UPDATE credits
  SET balance = balance - p_amount
  WHERE user_id = p_user_id AND balance >= p_amount
  RETURNING balance INTO new_balance;

  IF NOT FOUND THEN
    RETURN false;
  END IF;

  -- Log the transaction
  INSERT INTO credit_transactions (user_id, action, amount, balance_after)
  VALUES (p_user_id, p_action, -p_amount, new_balance);

  RETURN true;
END;
$$;

-- Update refresh_credits_for_plan to also log the refresh
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

  -- Log the refresh
  INSERT INTO credit_transactions (user_id, action, amount, balance_after)
  VALUES (p_user_id, 'refresh', credit_amount, credit_amount);
END;
$$;

-- RLS: users can only read their own transactions
ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own transactions"
  ON credit_transactions FOR SELECT
  USING (auth.uid() = user_id);

-- View for monitoring: daily AI call counts per user (for admin queries)
CREATE OR REPLACE VIEW daily_user_ai_usage AS
SELECT
  user_id,
  date_trunc('day', created_at) AS day,
  count(*) AS total_calls,
  sum(abs(amount)) AS total_credits_spent,
  array_agg(DISTINCT action) AS actions_used
FROM credit_transactions
WHERE amount < 0  -- only spending, not refreshes
GROUP BY user_id, date_trunc('day', created_at);
