import { ApiError } from '@/api/http'

export interface ErrorDisplay {
  title: string
  description: string
}

/** User-facing wording for an API failure. */
export function describeError(error: unknown): ErrorDisplay {
  if (!(error instanceof ApiError)) {
    return { title: 'Une erreur inattendue est survenue', description: String(error) }
  }
  switch (error.kind) {
    case 'network':
      return {
        title: 'Serveur injoignable',
        description: 'Vérifiez votre connexion et que JSON Server est lancé (pnpm api).',
      }
    case 'timeout':
      return {
        title: 'Le serveur ne répond pas',
        description: 'La requête a dépassé le délai autorisé. Réessayez dans un instant.',
      }
    case 'not_found':
      return {
        title: 'Élément introuvable',
        description: "Cet élément n'existe pas ou a été supprimé.",
      }
    case 'server':
      return {
        title: 'Erreur du serveur',
        description: `Le serveur a rencontré un problème (${error.status}). Réessayez plus tard.`,
      }
    default:
      return { title: 'Requête refusée', description: error.message }
  }
}
