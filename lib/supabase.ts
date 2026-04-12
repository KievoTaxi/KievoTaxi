import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://iaqkbjipooxnerkkwqvq.supabase.co'
const supabaseKey = 'sb_publishable_-ziHBrVdJrqJ5ShEjn2_AA_a5HUbuT9'

export const supabase = createClient(supabaseUrl, supabaseKey)