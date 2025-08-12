import { createClient } from "@supabase/supabase-js"
import { supabaseConfig } from "./secure-config"

export const supabaseData = createClient(
  supabaseConfig.data.url,
  supabaseConfig.data.anonKey
)