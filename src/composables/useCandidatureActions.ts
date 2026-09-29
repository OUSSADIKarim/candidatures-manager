// Store mutations + user feedback (toasts with retry). Keeps the store free of UI concerns and
// gives every entry point (detail panel, board drag & drop, "Déplacer vers…") the same behavior.
import { useRouter } from 'vue-router'
import { toast } from 'vue-sonner'
import type { NewCandidature } from '@/api/candidatures'
import { describeError } from '@/lib/errors'
import { useCandidaturesStore } from '@/stores/candidatures'
import type { Candidature } from '@/types/models'

export function useCandidatureActions() {
  const store = useCandidaturesStore()
  const router = useRouter()

  const nameOf = (id: number) => store.getById(id)?.nom ?? 'La candidature'

  async function changeStatus(id: number, statut: string): Promise<void> {
    const nom = nameOf(id)
    const result = await store.updateStatus(id, statut)
    if (result.status === 'saved') {
      toast.success(`${nom} → ${statut}`)
    } else if (result.status === 'failed') {
      toast.error('Statut non modifié', {
        description: `${nom} reste en « ${store.getById(id)?.statut} ». ${describeError(result.error).description}`,
        action: { label: 'Réessayer', onClick: () => changeStatus(id, statut) },
      })
    }
  }

  async function addComment(id: number, payload: { contenu: string; auteur: string }) {
    const result = await store.addComment(id, payload)
    if (result.status === 'failed') {
      // The comment stays in the thread, marked as failed, with its own retry button.
      toast.error("Le commentaire n'a pas pu être envoyé", {
        description: describeError(result.error).description,
      })
    }
  }

  async function retryComment(id: number, commentId: number) {
    const result = await store.retryComment(id, commentId)
    if (result.status === 'failed') {
      toast.error("Nouvel échec de l'envoi", {
        description: describeError(result.error).description,
      })
    }
  }

  async function remove(id: number): Promise<void> {
    const nom = nameOf(id)
    const result = await store.remove(id)
    if (result.status === 'saved') {
      toast.success(`Candidature de ${nom} supprimée`)
    } else if (result.status === 'failed') {
      toast.error('Suppression impossible', {
        description: describeError(result.error).description,
        action: { label: 'Réessayer', onClick: () => remove(id) },
      })
    }
  }

  /** Throws on failure so the form can stay open and show the error. */
  async function create(input: NewCandidature): Promise<Candidature> {
    const created = await store.create(input)
    toast.success(`Candidature de ${created.nom} ajoutée`, {
      action: {
        label: 'Voir',
        onClick: () => router.push({ name: 'candidature-detail', params: { id: created.id } }),
      },
    })
    return created
  }

  return {
    changeStatus,
    addComment,
    retryComment,
    discardComment: store.discardComment,
    remove,
    create,
  }
}
