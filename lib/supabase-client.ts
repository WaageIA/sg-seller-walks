import { createClient } from "@supabase/supabase-js"

const supabaseDataUrl = "https://onslmqspgpdgaryylohk.supabase.co"
const supabaseDataKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9uc2xtcXNwZ3BkZ2FyeXlsb2hrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA3MTc5MTIsImV4cCI6MjA2NjI5MzkxMn0.7vk-mIwxe0CI5yimmjlvmEkvhKil7wxviQbO0cpjiGg"

export const supabaseData = createClient(supabaseDataUrl, supabaseDataKey)
