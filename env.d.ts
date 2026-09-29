/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** JSON Server base URL. Defaults to http://localhost:3000. */
  readonly VITE_API_URL?: string
}

declare module 'vue-router' {
  interface RouteMeta {
    title?: string
  }
}

export {}
