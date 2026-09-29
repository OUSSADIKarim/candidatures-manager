// Domain types mirroring the resources exposed by JSON Server (db.json).

export interface Commentaire {
  id: number
  auteur: string
  date: string // ISO 8601
  contenu: string
}

export interface Candidature {
  id: number
  nom: string
  poste: string
  statut: string
  competences: string[]
  experience: string
  dateCandidature: string // ISO 8601
  email: string
  telephone: string
  cv: string // URL
  lettreMotivation: string
  salaireSouhaite: number
  disponibilite: string
  localisation: string
  commentaires: Commentaire[]
}

export interface Statut {
  id: number
  nom: string
  couleur: string
  ordre: number
}

export interface Poste {
  id: number
  titre: string
  description: string
  competencesRequises: string[]
}

export interface Competence {
  id: number
  nom: string
  categorie: string
}

/** A comment shown before the server confirmed it (optimistic UI). */
export interface PendingCommentaire extends Commentaire {
  syncState: 'pending' | 'failed'
}
