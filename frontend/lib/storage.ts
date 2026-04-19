// Login is disabled for the demo: always return the seeded demo user_id=1.
// The backend lifespan ensures this user + default settings exist.
export const DEMO_USER_ID = 1

export function getUserId(): number {
  return DEMO_USER_ID
}
