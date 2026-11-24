/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_LIFF_ID: string;
  readonly VITE_LIFF_REDIRECT_URI: string;
  readonly VITE_LINE_NOTIFY_CLIENT_ID: string;
  readonly VITE_API_URL: string;
  readonly VITE_RECORDS_PATH: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
