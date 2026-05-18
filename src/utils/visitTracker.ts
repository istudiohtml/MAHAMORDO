export function getVisitCount(characterId: string): number {
  if (typeof window === 'undefined') return 1
  const today = new Date().toISOString().split('T')[0]
  const key = `mahamordo_visit_${characterId}_${today}`
  const count = parseInt(localStorage.getItem(key) || '0') + 1
  localStorage.setItem(key, String(count))
  return count
}
