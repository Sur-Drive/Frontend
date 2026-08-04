import { api } from "../lib/apiClient";

export interface ProfilePictureResponse {
    userId: string;
    profilePicture: string;
}

export interface UserProfile {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
    profilePicture?: string | null;
}

// Get profile picture for a user
export const getProfilePicture = (userId?: string) => {
    return api.get<ProfilePictureResponse>("/users/profile-picture", {
        params: userId ? { userId } : undefined,
    });
};

// Upload profile picture - using FormData
export const uploadProfilePicture = (file: File, userId?: string) => {
    const formData = new FormData();
    formData.append("file", file);
    if (userId) {
        formData.append("userId", userId);
    }

    // For FormData, axios automatically sets Content-Type to multipart/form-data
    return api.post<ProfilePictureResponse>("/users/profile-picture", formData);
};

// Delete profile picture
export const deleteProfilePicture = (userId?: string) => {
    return api.delete<void>("/users/profile-picture", {
        params: userId ? { userId } : undefined,
    });
};

// Utility function to get profile picture URL with fallback
export const getProfilePictureUrl = (
    profilePicture?: string | null,
    defaultAvatar?: string,
): string => {
    if (profilePicture) {
        return profilePicture;
    }
    return defaultAvatar || "/default-avatar.png";
};

// Utility to get user initials for avatar fallback
export const getUserInitials = (
    firstName?: string,
    lastName?: string,
): string => {
    if (!firstName && !lastName) return "??";
    const first = firstName?.[0] || "";
    const last = lastName?.[0] || "";
    return `${first}${last}`.toUpperCase();
};

// Utility to get consistent color for user avatar
export const getUserAvatarColor = (userId?: string): string => {
    const colors = [
        "#6E43A3", // Purple
        "#2E7D32", // Green
        "#1565C0", // Blue
        "#C62828", // Red
        "#F2A618", // Orange
        "#00838F", // Teal
        "#4A148C", // Dark Purple
        "#37474F", // Dark Blue Gray
        "#E65100", // Deep Orange
        "#00695C", // Deep Teal
        "#4527A0", // Deep Purple
        "#283593", // Indigo
    ];

    if (!userId) return colors[0];

    // Use userId to get consistent color for same user
    const index =
        userId.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0) %
        colors.length;
    return colors[index];
};
