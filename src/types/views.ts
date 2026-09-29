/** What a results view (list or board) exposes to CandidaturesPage via a template ref. */
export interface ResultsViewHandle {
  refresh: () => void
  loading: boolean
  summary: string
}
