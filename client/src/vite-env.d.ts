/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_ANON_KEY?: string;
  readonly VITE_CONTACT_EMAIL?: string;
  readonly VITE_ORS_API_KEY?: string;
  readonly VITE_VITRIN_MODU?: string;
  readonly VITE_DEMO?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
