/*
  # Create investment_opportunities table

  1. New Tables
    - `investment_opportunities`
      - `id` (uuid, primary key)
      - `name` (text, required)
      - `description` (text, optional)
      - `return_rate` (numeric, optional)
      - `risk_level` (text, optional)
      - `is_active` (boolean, default true)
      - `is_archived` (boolean, default false)
      - `status` (text, optional)
      - `category` (text, optional)
      - `min_investment` (numeric, optional)
      - `summary` (text, optional)
      - `details_content` (text, optional)
      - `deep_analysis` (text, optional)
      - `assets_linked` (jsonb, optional)
      - `author_id` (uuid, optional)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `investment_opportunities` table
    - Add policy for public read access to active opportunities
    - Add policy for authenticated users to manage via auth check
*/

CREATE TABLE IF NOT EXISTS public.investment_opportunities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  return_rate numeric,
  risk_level text,
  is_active boolean DEFAULT true,
  is_archived boolean DEFAULT false,
  status text,
  category text,
  min_investment numeric,
  summary text,
  details_content text,
  deep_analysis text,
  assets_linked jsonb,
  author_id uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz
);

ALTER TABLE public.investment_opportunities ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read active opportunities
CREATE POLICY "Anyone can read active opportunities"
  ON public.investment_opportunities
  FOR SELECT
  USING (is_active = true);

-- Policy: Authenticated users can insert, update, delete
CREATE POLICY "Authenticated users can manage opportunities"
  ON public.investment_opportunities
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);
