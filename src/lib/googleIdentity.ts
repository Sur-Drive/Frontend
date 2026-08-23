// const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined
// const SCRIPT_SRC = 'https://accounts.google.com/gsi/client'

// declare global {
//   interface Window {
//     google?: any
//   }
// }

// let scriptLoadPromise: Promise<void> | null = null

// function loadGsiScript(): Promise<void> {
//   if (scriptLoadPromise) return scriptLoadPromise

//   scriptLoadPromise = new Promise((resolve, reject) => {
//     if (typeof window === 'undefined') {
//       reject(new Error('Google Identity Services can only load in a browser environment'))
//       return
//     }

//     if (window.google?.accounts?.id) {
//       resolve()
//       return
//     }

//     const script = document.createElement('script')
//     script.src = SCRIPT_SRC
//     script.async = true
//     script.defer = true
//     script.onload = () => resolve()
//     script.onerror = () => {
//       scriptLoadPromise = null // allow a retry on the next call
//       reject(new Error('Failed to load the Google Identity Services script'))
//     }
//     document.head.appendChild(script)
//   })

//   return scriptLoadPromise
// }

// let hiddenButtonEl: HTMLDivElement | null = null
// let pendingResolve: ((idToken: string) => void) | null = null
// let pendingReject: ((err: Error) => void) | null = null
// let initialized = false

// function ensureInitialized() {
//   if (initialized) return

//   if (!GOOGLE_CLIENT_ID) {
//     throw new Error('Missing VITE_GOOGLE_CLIENT_ID — add it to your .env file')
//   }

//   window.google.accounts.id.initialize({
//     client_id: GOOGLE_CLIENT_ID,
//     callback: (response: { credential?: string }) => {
//       if (response?.credential) {
//         pendingResolve?.(response.credential)
//       } else {
//         pendingReject?.(new Error('Google did not return a credential'))
//       }
//       pendingResolve = null
//       pendingReject = null
//     },
//   })

//   hiddenButtonEl = document.createElement('div')
//   hiddenButtonEl.style.position = 'fixed'
//   hiddenButtonEl.style.top = '-9999px'
//   hiddenButtonEl.style.left = '-9999px'
//   document.body.appendChild(hiddenButtonEl)
//   window.google.accounts.id.renderButton(hiddenButtonEl, { type: 'standard' })

//   initialized = true
// }

// /**
//  * Opens the Google account picker and resolves with the ID token
//  * (JWT credential) for the account the user selects. Reject if the
//  * user closes the picker without choosing an account, or if GSI
//  * fails to load/initialize.
//  */
// export async function getGoogleIdToken(): Promise<string> {
//   await loadGsiScript()
//   ensureInitialized()

//   return new Promise<string>((resolve, reject) => {
//     const realButton = hiddenButtonEl?.querySelector('div[role="button"]') as HTMLElement | null

//     if (!realButton) {
//       reject(new Error('Google Sign-In button failed to render'))
//       return
//     }

//     pendingResolve = resolve
//     pendingReject = reject
//     realButton.click()
//   })
// }





const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined
const SCRIPT_SRC = 'https://accounts.google.com/gsi/client'

// `googleMaps.ts` already augments `Window.google` with the strongly-typed
// Maps JS API namespace (`typeof google`). Google Identity Services (GSI)
// hangs its own `accounts.id` API off that same `window.google` object at
// runtime, but that namespace isn't part of the Maps types — so rather than
// re-declaring `Window.google` here (which TS rejects as a conflicting
// merge with googleMaps.ts's declaration), we read it through a narrow
// local type just for the pieces GSI actually uses.
interface GoogleIdentityGlobal {
  accounts: {
    id: {
      initialize: (config: {
        client_id: string
        callback: (response: { credential?: string }) => void
        use_fedcm_for_prompt?: boolean
      }) => void
      cancel: () => void
      prompt: (
        callback: (notification: {
          isNotDisplayed?: () => boolean
          getNotDisplayedReason?: () => string
          isSkippedMoment?: () => boolean
          getSkippedReason?: () => string
          isDismissedMoment?: () => boolean
        }) => void,
      ) => void
    }
  }
}

function getGoogleIdentity(): GoogleIdentityGlobal | undefined {
  return (window as unknown as { google?: GoogleIdentityGlobal }).google
}

let scriptLoadPromise: Promise<void> | null = null

function loadGsiScript(): Promise<void> {
  if (scriptLoadPromise) return scriptLoadPromise

  scriptLoadPromise = new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      reject(new Error('Google Identity Services can only load in a browser environment'))
      return
    }

    if (getGoogleIdentity()?.accounts?.id) {
      resolve()
      return
    }

    const script = document.createElement('script')
    script.src = SCRIPT_SRC
    script.async = true
    script.defer = true
    script.onload = () => resolve()
    script.onerror = () => {
      scriptLoadPromise = null // allow a retry on the next call
      reject(new Error('Failed to load the Google Identity Services script'))
    }
    document.head.appendChild(script)
  })

  return scriptLoadPromise
}

let pendingResolve: ((idToken: string) => void) | null = null
let pendingReject: ((err: Error) => void) | null = null
let initialized = false
let inFlightPromise: Promise<string> | null = null

function ensureInitialized() {
  if (initialized) return

  if (!GOOGLE_CLIENT_ID) {
    throw new Error('Missing VITE_GOOGLE_CLIENT_ID — add it to your .env file')
  }

  getGoogleIdentity()!.accounts.id.initialize({
    client_id: GOOGLE_CLIENT_ID,
    callback: (response: { credential?: string }) => {
      if (response?.credential) {
        pendingResolve?.(response.credential)
      } else {
        pendingReject?.(new Error('Google did not return a credential'))
      }
      pendingResolve = null
      pendingReject = null
    },
    // Required for One Tap/prompt() to keep working in browsers that have
    // phased out third-party cookies (Chrome and others).
    use_fedcm_for_prompt: true,
  })

  initialized = true
}

/**
 * Opens Google's account picker (One Tap / sign-in dialog) and resolves
 * with the ID token (JWT credential) for the account the user selects.
 * Call this directly from a click handler — it needs the user gesture.
 * Rejects if the user dismisses the picker, if the browser/environment
 * blocks it from showing at all (e.g. FedCM disabled, popups blocked,
 * misconfigured client ID/origin), or if GSI fails to load.
 */
export async function getGoogleIdToken(): Promise<string> {
  // Overlapping calls (double-clicks, or a retry fired before the browser
  // finished tearing down the previous one) make the browser throw "Only
  // one navigator.credentials.get request may be outstanding at one time",
  // which prompt() then just reports as a silent "skipped" moment instead
  // of a real error. Reuse the in-flight attempt instead of starting a
  // second, conflicting one.
  if (inFlightPromise) return inFlightPromise

  inFlightPromise = (async () => {
    await loadGsiScript()
    ensureInitialized()

    // Clear out any previous request that didn't fully settle before this
    // one starts — same conflict as above, but for the *first* call after
    // a prior attempt was dismissed/skipped/errored.
    getGoogleIdentity()!.accounts.id.cancel()

    return new Promise<string>((resolve, reject) => {
      pendingResolve = resolve
      pendingReject = reject

      getGoogleIdentity()!.accounts.id.prompt((notification: any) => {
        // Only care about outcomes that mean "no credential is coming" —
        // a successful sign-in resolves via the initialize() callback above,
        // not through this notification.
        if (notification.isNotDisplayed?.()) {
          const reason = notification.getNotDisplayedReason?.() ?? 'unknown reason'
          pendingResolve = null
          pendingReject = null
          reject(
            new Error(
              `Google Sign-In didn't appear (${reason}). Check VITE_GOOGLE_CLIENT_ID and that this origin is authorized in Google Cloud Console.`
            )
          )
          return
        }

        if (notification.isSkippedMoment?.()) {
          const reason = notification.getSkippedReason?.() ?? 'unknown reason'
          pendingResolve = null
          pendingReject = null
          reject(new Error(`Google Sign-In was skipped (${reason}). Please try again.`))
          return
        }

        if (notification.isDismissedMoment?.()) {
          pendingResolve = null
          pendingReject = null
          reject(new Error('Sign-in was cancelled'))
        }
      })
    })
  })()

  try {
    return await inFlightPromise
  } finally {
    inFlightPromise = null
  }
}
