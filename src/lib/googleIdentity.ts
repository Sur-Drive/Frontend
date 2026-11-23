
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as
  | string
  | undefined;

const SCRIPT_SRC = "https://accounts.google.com/gsi/client";

type GoogleCredentialResponse = {
  credential?: string;
};

type GooglePromptNotification = {
  isNotDisplayed?: () => boolean;
  getNotDisplayedReason?: () => string;
  isSkippedMoment?: () => boolean;
  getSkippedReason?: () => string;
  isDismissedMoment?: () => boolean;
};

type GoogleIdentityService = {
  accounts: {
    id: {
      initialize: (config: {
        client_id: string;
        callback: (response: GoogleCredentialResponse) => void;
        use_fedcm_for_prompt?: boolean;
      }) => void;
      cancel: () => void;
      prompt: (
        callback?: (notification: GooglePromptNotification) => void,
      ) => void;
    };
  };
};

// Keep GIS typing separate from the existing Google Maps
// declaration of window.google.
function getGoogleIdentityService(): GoogleIdentityService | undefined {
  if (typeof window === "undefined") {
    return undefined;
  }

  const googleObject = window.google as
    | (typeof google & Partial<GoogleIdentityService>)
    | undefined;

  if (!googleObject?.accounts?.id) {
    return undefined;
  }

  return googleObject as typeof google & GoogleIdentityService;
}

let scriptLoadPromise: Promise<void> | null = null;

function loadGsiScript(): Promise<void> {
  if (scriptLoadPromise) {
    return scriptLoadPromise;
  }

  if (typeof window === "undefined") {
    return Promise.reject(
      new Error(
        "Google Identity Services can only load in a browser environment",
      ),
    );
  }

  if (getGoogleIdentityService()) {
    return Promise.resolve();
  }

  scriptLoadPromise = new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");

    script.src = SCRIPT_SRC;
    script.async = true;
    script.defer = true;

    script.onload = () => {
      if (getGoogleIdentityService()) {
        resolve();
      } else {
        scriptLoadPromise = null;
        reject(
          new Error(
            "Google Identity Services loaded but is unavailable",
          ),
        );
      }
    };

    script.onerror = () => {
      scriptLoadPromise = null;
      reject(
        new Error(
          "Failed to load the Google Identity Services script",
        ),
      );
    };

    document.head.appendChild(script);
  });

  return scriptLoadPromise;
}

let pendingResolve: ((idToken: string) => void) | null = null;
let pendingReject: ((error: Error) => void) | null = null;

let initialized = false;
let inFlightPromise: Promise<string> | null = null;

function ensureInitialized(): GoogleIdentityService {
  const googleIdentity = getGoogleIdentityService();

  if (!googleIdentity) {
    throw new Error("Google Identity Services is not available");
  }

  if (!GOOGLE_CLIENT_ID) {
    throw new Error(
      "Missing VITE_GOOGLE_CLIENT_ID — add it to your .env file",
    );
  }

  if (!initialized) {
    googleIdentity.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,

      callback: (response) => {
        if (response?.credential) {
          pendingResolve?.(response.credential);
        } else {
          pendingReject?.(
            new Error("Google did not return a credential"),
          );
        }

        pendingResolve = null;
        pendingReject = null;
      },

      use_fedcm_for_prompt: true,
    });

    initialized = true;
  }

  return googleIdentity;
}

export async function getGoogleIdToken(): Promise<string> {
  if (inFlightPromise) {
    return inFlightPromise;
  }

  const request = (async (): Promise<string> => {
    await loadGsiScript();

    const googleIdentity = ensureInitialized();

    googleIdentity.accounts.id.cancel();

    return new Promise<string>((resolve, reject) => {
      pendingResolve = resolve;
      pendingReject = reject;

      googleIdentity.accounts.id.prompt((notification) => {
        if (notification.isNotDisplayed?.()) {
          const reason =
            notification.getNotDisplayedReason?.() ?? "unknown reason";

          pendingResolve = null;
          pendingReject = null;

          reject(
            new Error(
              `Google Sign-In didn't appear (${reason}). Check VITE_GOOGLE_CLIENT_ID and that this origin is authorized in Google Cloud Console.`,
            ),
          );
          return;
        }

        if (notification.isSkippedMoment?.()) {
          const reason =
            notification.getSkippedReason?.() ?? "unknown reason";

          pendingResolve = null;
          pendingReject = null;

          reject(
            new Error(
              `Google Sign-In was skipped (${reason}). Please try again.`,
            ),
          );
          return;
        }

        if (notification.isDismissedMoment?.()) {
          pendingResolve = null;
          pendingReject = null;

          reject(new Error("Sign-in was cancelled"));
        }
      });
    });
  })();

  inFlightPromise = request;

  try {
    return await request;
  } finally {
    if (inFlightPromise === request) {
      inFlightPromise = null;
    }
  }
}


// const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as
//   | string
//   | undefined;
// const SCRIPT_SRC = "https://accounts.google.com/gsi/client";

// declare global {
//   interface Window {
//     google?: any;
//   }
// }

// let scriptLoadPromise: Promise<void> | null = null;

// function loadGsiScript(): Promise<void> {
//   if (scriptLoadPromise) return scriptLoadPromise;

//   scriptLoadPromise = new Promise((resolve, reject) => {
//     if (typeof window === "undefined") {
//       reject(
//         new Error(
//           "Google Identity Services can only load in a browser environment",
//         ),
//       );
//       return;
//     }

//     if (window.google?.accounts?.id) {
//       resolve();
//       return;
//     }

//     const script = document.createElement("script");
//     script.src = SCRIPT_SRC;
//     script.async = true;
//     script.defer = true;
//     script.onload = () => resolve();
//     script.onerror = () => {
//       scriptLoadPromise = null; // allow a retry on the next call
//       reject(new Error("Failed to load the Google Identity Services script"));
//     };
//     document.head.appendChild(script);
//   });

//   return scriptLoadPromise;
// }

// let pendingResolve: ((idToken: string) => void) | null = null;
// let pendingReject: ((err: Error) => void) | null = null;
// let initialized = false;
// let inFlightPromise: Promise<string> | null = null;

// function ensureInitialized() {
//   if (initialized) return;

//   if (!GOOGLE_CLIENT_ID) {
//     throw new Error("Missing VITE_GOOGLE_CLIENT_ID — add it to your .env file");
//   }

//   window.google.accounts.id.initialize({
//     client_id: GOOGLE_CLIENT_ID,
//     callback: (response: { credential?: string }) => {
//       if (response?.credential) {
//         pendingResolve?.(response.credential);
//       } else {
//         pendingReject?.(new Error("Google did not return a credential"));
//       }
//       pendingResolve = null;
//       pendingReject = null;
//     },
//     // Required for One Tap/prompt() to keep working in browsers that have
//     // phased out third-party cookies (Chrome and others).
//     use_fedcm_for_prompt: true,
//   });

//   initialized = true;
// }

// export async function getGoogleIdToken(): Promise<string> {
//   if (inFlightPromise) return inFlightPromise;

//   inFlightPromise = (async () => {
//     await loadGsiScript();
//     ensureInitialized();

//     window.google.accounts.id.cancel();

//     return new Promise<string>((resolve, reject) => {
//       pendingResolve = resolve;
//       pendingReject = reject;

//       window.google.accounts.id.prompt((notification: any) => {
//         if (notification.isNotDisplayed?.()) {
//           const reason =
//             notification.getNotDisplayedReason?.() ?? "unknown reason";
//           pendingResolve = null;
//           pendingReject = null;
//           reject(
//             new Error(
//               `Google Sign-In didn't appear (${reason}). Check VITE_GOOGLE_CLIENT_ID and that this origin is authorized in Google Cloud Console.`,
//             ),
//           );
//           return;
//         }

//         if (notification.isSkippedMoment?.()) {
//           const reason = notification.getSkippedReason?.() ?? "unknown reason";
//           pendingResolve = null;
//           pendingReject = null;
//           reject(
//             new Error(
//               `Google Sign-In was skipped (${reason}). Please try again.`,
//             ),
//           );
//           return;
//         }

//         if (notification.isDismissedMoment?.()) {
//           pendingResolve = null;
//           pendingReject = null;
//           reject(new Error("Sign-in was cancelled"));
//         }
//       });
//     });
//   })();

//   try {
//     return await inFlightPromise;
//   } finally {
//     inFlightPromise = null;
//   }
// }
