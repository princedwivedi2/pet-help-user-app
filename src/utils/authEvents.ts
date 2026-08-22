// Module-level singletons so client.ts can signal auth events without importing React.

/** Called by client.ts when a 401 is received — should clear auth state. */
let _unauthorizedHandler: (() => void) | null = null
export function setUnauthorizedHandler(fn: () => void) { _unauthorizedHandler = fn }
export function fireUnauthorized() { _unauthorizedHandler?.() }

/** Called by AuthProvider.signOut — should navigate to Auth.Login. */
let _postSignOutNav: (() => void) | null = null
export function setPostSignOutNav(fn: () => void) { _postSignOutNav = fn }
export function firePostSignOutNav() { _postSignOutNav?.() }
