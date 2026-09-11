// AgroShield Database & Backend Configuration
// By default, AgroShield runs securely on the local Flask backend database.
// If you wish to enable cloud sync via Supabase, paste your Supabase URL & Anon Key below.
window.AGROSHIELD_CONFIG = {
    // Optional: Your Supabase Project URL (e.g., "https://your-project-id.supabase.co")
    SUPABASE_URL: "",

    // Optional: Your Supabase Anon Public Key (anon public)
    SUPABASE_KEY: "",

    // Flask Backend API URL (empty string for automatic same-origin requests)
    API_BASE_URL: ""
};

