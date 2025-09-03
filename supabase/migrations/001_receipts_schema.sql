-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Receipts table with Pakistani context
CREATE TABLE IF NOT EXISTS public.receipts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  image_key TEXT NOT NULL,
  
  -- OCR Results
  ocr_json JSONB,
  ocr_provider TEXT DEFAULT 'gemini',
  retailer TEXT,
  retailer_type TEXT, -- fuel/grocery/restaurant/pharmacy
  purchase_date DATE,
  total_cents INTEGER,
  currency TEXT DEFAULT 'PKR',
  
  -- Pakistani specific
  invoice_number TEXT,
  payment_method TEXT, -- cash/card/jazzcash/easypaisa
  card_last_four TEXT,
  
  -- Duplicate detection
  hash_text TEXT UNIQUE,
  
  -- Status & confidence
  status TEXT CHECK (status IN ('processing','queued','approved','rejected','duplicate')) DEFAULT 'processing',
  confidence REAL DEFAULT 0,
  rejection_reason TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Points ledger
CREATE TABLE IF NOT EXISTS public.points_ledger (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  receipt_id UUID REFERENCES public.receipts(id),
  delta INTEGER NOT NULL,
  reason TEXT NOT NULL,
  promo_id TEXT,
  balance_after INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_receipts_user_created ON public.receipts(user_id, created_at DESC);
CREATE INDEX idx_receipts_status ON public.receipts(status);
CREATE INDEX idx_points_user ON public.points_ledger(user_id, created_at DESC);

-- RLS Policies
ALTER TABLE public.receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.points_ledger ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own receipts" ON public.receipts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own receipts" ON public.receipts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own points" ON public.points_ledger
  FOR SELECT USING (auth.uid() = user_id);

-- Award points function
CREATE OR REPLACE FUNCTION public.award_points_for_receipt(receipt_id UUID)
RETURNS VOID AS $$
DECLARE
  v_user_id UUID;
  v_total_cents INTEGER;
  v_points INTEGER;
  v_current_balance INTEGER;
BEGIN
  -- Get receipt details
  SELECT user_id, total_cents 
  INTO v_user_id, v_total_cents
  FROM public.receipts 
  WHERE id = receipt_id;
  
  -- Calculate points (1 point per 100 PKR)
  v_points := FLOOR(v_total_cents / 100.0);
  
  -- Get current balance
  SELECT COALESCE(SUM(delta), 0) 
  INTO v_current_balance
  FROM public.points_ledger 
  WHERE user_id = v_user_id;
  
  -- Insert points transaction
  INSERT INTO public.points_ledger(
    user_id, receipt_id, delta, reason, balance_after
  ) VALUES (
    v_user_id, receipt_id, v_points, 'Receipt Scan', v_current_balance + v_points
  );
  
  -- Update user profile points
  UPDATE public.users 
  SET loyalty_points = v_current_balance + v_points
  WHERE id = v_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;