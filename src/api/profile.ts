const API_BASE = "https://backend-production-01de.up.railway.app";

export interface DriverProfile {
  id: string;
  licenseNumber: string;
  phoneNumber: string | null;
  dateOfBirth: string;
  address: string | null;
  emergencyContact: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UserProfileResponse {
  id: string;
  phoneNumber: string | null;
  firstName: string;
  lastName: string;
  gender: string;
  dateOfBirth: string;
  occupation: string;
  profilePicture?: string | null;
  role: string;
  isPhoneVerified: boolean;
  hasCompletedOnboarding: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  driverProfile: DriverProfile | null;
}

// ── Update payload ──────────────────────────────────────────

export interface UpdateProfileInput {
  firstName: string;
  lastName: string;
  gender: string;
  dateOfBirth: string;
  occupation: string;
  address: string;
}

function getToken(): string | null {
  return localStorage.getItem("token");
}

function isTokenExpired(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    const exp = payload.exp;
    if (!exp) return false;
    return Date.now() >= exp * 1000;
  } catch {
    return true;
  }
}

function authHeaders(): HeadersInit {
  const token = getToken();

  if (!token) {
    throw new Error("No authentication token found");
  }

  if (isTokenExpired(token)) {
    throw new Error("Session expired. Please log in again.");
  }

  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

// ── Profile picture helpers ─────────────────────────────────
// Stored per user (taken from the JWT) so it survives logout/login but never
// shows one person's photo on another person's account.
function localPicKey(): string {
  try {
    const t = localStorage.getItem("token");
    const payload = t ? JSON.parse(atob(t.split(".")[1])) : {};
    return `profilePictureLocal:${payload.sub ?? payload.id ?? payload.userId ?? "me"}`;
  } catch {
    return "profilePictureLocal:me";
  }
}

const PIC_KEYS = [
  "profilePicture", "profilePictureUrl", "profile_picture", "profilePicUrl",
  "avatar", "avatarUrl", "photo", "photoUrl", "image", "imageUrl",
  "picture", "pictureUrl", "facePhoto", "url",
];

function findPicture(obj: any): string | null {
  if (!obj || typeof obj !== "object") return null;
  for (const k of PIC_KEYS) {
    if (typeof obj[k] === "string" && obj[k]) return obj[k];
  }
  for (const nest of ["data", "user", "driverProfile", "profile"]) {
    const v = findPicture(obj[nest]);
    if (v) return v;
  }
  return null;
}

// Makes sure `profilePicture` is set whatever key the backend uses, and falls
// back to the locally saved copy of the last uploaded photo if the server
// returns none.
function normalizeProfile(raw: any): UserProfileResponse {
  const base = raw?.data && !raw.id ? raw.data : raw;
  const pic = findPicture(raw) ?? localStorage.getItem(localPicKey());
  return { ...base, profilePicture: pic };
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = () => reject(r.error);
    r.readAsDataURL(blob);
  });
}

export async function getUserProfile(): Promise<UserProfileResponse> {
  const res = await fetch(`${API_BASE}/users/profile`, {
    headers: authHeaders(),
  });

  if (res.status === 401) {
    throw new Error("Session expired. Please log in again.");
  }

  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    throw new Error(
      errBody.message || `Failed to fetch profile (${res.status})`,
    );
  }

  const raw = await res.json();
  console.log("[profile] GET /users/profile ->", raw);
  return normalizeProfile(raw);
}

export async function updateUserProfile(
  input: UpdateProfileInput,
): Promise<UserProfileResponse> {
  const res = await fetch(`${API_BASE}/users/profile`, {
    method: "PATCH",
    headers: authHeaders(),
    body: JSON.stringify(input),
  });

  if (res.status === 401) {
    throw new Error("Session expired. Please log in again.");
  }

  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    throw new Error(
      errBody.message || `Failed to update profile (${res.status})`,
    );
  }

  return res.json();
}

// ── Profile picture ─────────────────────────────────────────
// Backend route: POST /users/profile-picture (multipart, field "file").
const PROFILE_PICTURE_PATH = "/users/profile-picture";
const PROFILE_PICTURE_METHOD = "POST";
const PROFILE_PICTURE_FIELD = "file";

export async function uploadProfilePicture(
  file: Blob,
  filename = "profile.jpg",
): Promise<UserProfileResponse> {
  const token = getToken();
  const url = `${API_BASE}${PROFILE_PICTURE_PATH}`;
  console.log("[upload-photo] start", {
    method: PROFILE_PICTURE_METHOD,
    url,
    field: PROFILE_PICTURE_FIELD,
    hasToken: !!token,
    tokenExpired: token ? isTokenExpired(token) : null,
    fileType: file.type,
    fileSizeKB: Math.round(file.size / 1024),
  });

  if (!token) throw new Error("No authentication token found");
  if (isTokenExpired(token)) {
    throw new Error("Session expired. Please log in again.");
  }

  const formData = new FormData();
  formData.append(PROFILE_PICTURE_FIELD, file, filename);

  // No Content-Type here: the browser must add the multipart boundary itself.
  let res: Response;
  try {
    res = await fetch(url, {
      method: PROFILE_PICTURE_METHOD,
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });
  } catch (networkErr) {
    // fetch itself threw: offline, CORS block, DNS, or request aborted.
    console.error("[upload-photo] network/CORS error (no response)", networkErr);
    throw new Error("Network error while uploading. Check your connection.");
  }

  console.log("[upload-photo] response status", res.status, res.statusText);
  // Clone so logging the body doesn't consume it for the code below.
  res
    .clone()
    .text()
    .then((t) => console.log("[upload-photo] response body", t))
    .catch(() => {});

  if (res.status === 401) {
    throw new Error("Session expired. Please log in again.");
  }
  if (res.status === 413) {
    throw new Error("That photo is too large. Please choose a smaller one.");
  }
  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    const msg = Array.isArray(errBody.message)
      ? errBody.message.join("; ")
      : errBody.message;
    throw new Error(msg || `Failed to upload photo (${res.status})`);
  }

  const raw = await res.json().catch(() => ({}));
  console.log("[upload-photo] parsed response", raw);
  // Keep a local copy so the avatar shows even if the server sends no URL.
  try {
    localStorage.setItem(localPicKey(), await blobToDataUrl(file));
  } catch {
    /* storage full or unavailable: ignore */
  }
  return normalizeProfile(raw);
}

// ── Delete account ──────────────────────────────────────────
// NOTE: verify this path/method against your actual backend route —
// adjust if the API uses a different endpoint (e.g. /users/me).

export async function deleteUserAccount(): Promise<void> {
  const res = await fetch(`${API_BASE}/users/profile`, {
    method: "DELETE",
    headers: authHeaders(),
  });

  if (res.status === 401) {
    throw new Error("Session expired. Please log in again.");
  }

  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    throw new Error(
      errBody.message || `Failed to delete account (${res.status})`,
    );
  }
}
