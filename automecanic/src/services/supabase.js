import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://noqknvwnejvauxzsbdsy.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5vcWtudnduZWp2YXV4enNiZHN5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgyMTU5MjUsImV4cCI6MjEwMzc5MTkyNX0.SykG0Bxp02bcVA0g0SuJD7MtweTySsm-YjESN15Xb10'

export const supabase = createClient(supabaseUrl, supabaseKey)