// Module-level flag: survives client-side navigation, resets on full page reload.
// The vault modal sets this when credentials are accepted.
let _unlocked = false

export function setVaultUnlocked(): void { _unlocked = true }
export function isVaultUnlocked(): boolean { return _unlocked }
