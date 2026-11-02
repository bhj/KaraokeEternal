// Orders each user's items into turns: each turn goes to the user who has
// gone the longest since their last turn (per playedUserIds, then the turns
// given here), and users who haven't had one go first. Ties go to the user
// that comes first in `lists`. Neither input is modified.
export default function roundRobin<T> (lists: Map<number, T[]>, playedUserIds: number[]): T[] {
  const remaining = new Map<number, T[]>()
  for (const [userId, items] of lists) {
    if (items.length) remaining.set(userId, [...items])
  }

  const turns = [...playedUserIds]
  const ordered: T[] = []

  while (remaining.size) {
    let max = -1
    let maxUserId = -1

    for (const userId of remaining.keys()) {
      const idx = turns.lastIndexOf(userId)
      const distance = idx === -1 ? Infinity : turns.length - idx

      if (distance > max) {
        max = distance
        maxUserId = userId
      }
    }

    const items = remaining.get(maxUserId)!
    ordered.push(items.shift()!)
    if (!items.length) remaining.delete(maxUserId)

    turns.push(maxUserId)
  }

  return ordered
}
