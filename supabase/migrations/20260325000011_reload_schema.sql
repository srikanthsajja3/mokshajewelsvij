-- Refresh PostgREST cache to ensure client libraries notice the schema updates
NOTIFY pgrst, 'reload schema';
