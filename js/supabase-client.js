const SUPABASE_URL = 'https://jcquwnoimpkjyyfxwiwr.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpjcXV3bm9pbXBranl5Znh3aXdyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQwODA5MzIsImV4cCI6MjA5OTY1NjkzMn0.pJNml-X0DOPt9r5AvVPCwBqluMDVyDRtBJVG-9fUkG0'

const { createClient } = supabase
const db = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
