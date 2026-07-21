// Friend-group deterrent, not real security: a 4-digit PIN hashed with
// Web Crypto's SHA-256 before it ever leaves the browser. The `players`
// collection is world-readable (see firestore.rules) so the hash itself is
// visible to anyone in the group — salting with the player's own ID at
// least stops a shared "1234" from hashing identically across players, but
// a 4-digit space is trivially brute-forceable offline regardless. That's
// an accepted tradeoff for "stop your buddy from messing with your picks,"
// not a real auth boundary. See the note in firestore.rules for what a
// properly-enforced version would need (Firebase Auth per player).
export async function hashPasscode(playerId, code) {
  const data = new TextEncoder().encode(`${playerId}:${code}`)
  const digest = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}
