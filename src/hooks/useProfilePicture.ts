import { useState, useEffect, useCallback } from "react";
import { getProfilePicture } from "../api/profilePictureService";

export const useProfilePicture = (userId: string) => {
    const [profilePicture, setProfilePicture] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const fetchPicture = useCallback(async () => {
        if (!userId) {
            setIsLoading(false);
            return;
        }
        setIsLoading(true);
        try {
            const response = await getProfilePicture(userId);
            if (response && "profilePicture" in response) {
                setProfilePicture(response.profilePicture);
            }
        } catch (error) {
            console.error("Error fetching profile picture:", error);
        } finally {
            setIsLoading(false);
        }
    }, [userId]);

    useEffect(() => {
        fetchPicture();
    }, [fetchPicture]);

    return {
        profilePicture,
        isLoading,
        refetch: fetchPicture,
    };
};
