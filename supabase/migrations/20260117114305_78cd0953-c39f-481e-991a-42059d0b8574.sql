-- Create rate limiting table with window_id for grouping
CREATE TABLE public.rate_limits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  identifier TEXT NOT NULL,
  endpoint TEXT NOT NULL,
  window_id TEXT NOT NULL,
  request_count INTEGER NOT NULL DEFAULT 1,
  window_start TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(identifier, endpoint, window_id)
);

-- Create index for cleanup queries
CREATE INDEX idx_rate_limits_window_start ON public.rate_limits (window_start);

-- Enable RLS but allow service role full access
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

-- No public access - only service role can access this table
CREATE POLICY "Service role only" ON public.rate_limits
  FOR ALL USING (false);

-- Create function to check and increment rate limit
CREATE OR REPLACE FUNCTION public.check_rate_limit(
  p_identifier TEXT,
  p_endpoint TEXT,
  p_max_requests INTEGER DEFAULT 60,
  p_window_minutes INTEGER DEFAULT 1
)
RETURNS TABLE(allowed BOOLEAN, current_count INTEGER, reset_at TIMESTAMP WITH TIME ZONE)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_window_id TEXT;
  v_window_start TIMESTAMP WITH TIME ZONE;
  v_current_count INTEGER;
  v_reset_at TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Calculate window ID based on epoch minutes
  v_window_id := floor(extract(epoch from now()) / (p_window_minutes * 60))::TEXT;
  v_window_start := now();
  v_reset_at := to_timestamp((floor(extract(epoch from now()) / (p_window_minutes * 60)) + 1) * (p_window_minutes * 60));
  
  -- Try to insert or update the rate limit record
  INSERT INTO public.rate_limits (identifier, endpoint, window_id, request_count, window_start)
  VALUES (p_identifier, p_endpoint, v_window_id, 1, v_window_start)
  ON CONFLICT (identifier, endpoint, window_id)
  DO UPDATE SET request_count = rate_limits.request_count + 1
  RETURNING request_count INTO v_current_count;
  
  -- Return the result
  RETURN QUERY SELECT 
    v_current_count <= p_max_requests,
    v_current_count,
    v_reset_at;
END;
$$;

-- Create cleanup function to remove old rate limit records
CREATE OR REPLACE FUNCTION public.cleanup_rate_limits()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM public.rate_limits
  WHERE window_start < now() - interval '1 hour';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;