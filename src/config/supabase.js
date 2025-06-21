import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://uronuibgogisbfzwrqnn.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVyb251aWJnb2dpc2JmendycW5uIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAyMzk2NTYsImV4cCI6MjA2NTgxNTY1Nn0.vJRRf_ugQWMopRklFaRruFZXWhL3PitAQXQd2DTvlJQ'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
