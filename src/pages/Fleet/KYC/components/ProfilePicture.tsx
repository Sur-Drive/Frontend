import React, { useState, useRef, useEffect } from "react";
import { Camera, X, Upload, Trash2, Loader2 } from "lucide-react";
import {
    type ProfilePictureResponse,
    getProfilePicture,
    uploadProfilePicture,
    deleteProfilePicture,
    getUserInitials,
    getUserAvatarColor,
} from "../../../../api/profilePictureService";

interface ProfilePictureProps {
    userId: string;
    currentPicture?: string | null;
    firstName?: string;
    lastName?: string;
    size?: "sm" | "md" | "lg" | "xl";
    allowUpload?: boolean;
    allowDelete?: boolean;
    onUploadSuccess?: (data: ProfilePictureResponse) => void;
    onDeleteSuccess?: () => void;
    className?: string;
    showUploadButton?: boolean;
    showDeleteButton?: boolean;
    loading?: boolean;
}

const ProfilePicture: React.FC<ProfilePictureProps> = ({
    userId,
    currentPicture,
    firstName,
    lastName,
    size = "md",
    allowUpload = true,
    allowDelete = true,
    onUploadSuccess,
    onDeleteSuccess,
    className = "",
    showUploadButton = false,
    showDeleteButton = false,
    loading: externalLoading = false,
}) => {
    const [internalLoading, setInternalLoading] = useState(false);
    const loading = externalLoading || internalLoading;
    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [profilePicture, setProfilePicture] = useState<string | null>(
        currentPicture || null, // Initialize with prop
    );
    const [uploading, setUploading] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [showUploadModal, setShowUploadModal] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const sizeConfig = {
        sm: "w-10 h-10",
        md: "w-16 h-16",
        lg: "w-24 h-24",
        xl: "w-32 h-32",
    };

    const iconSize = {
        sm: 16,
        md: 20,
        lg: 24,
        xl: 28,
    };

    // Update internal state when currentPicture prop changes
    useEffect(() => {
        setProfilePicture(currentPicture || null);
    }, [currentPicture]);

    useEffect(() => {
        if (userId && !currentPicture) {
            fetchProfilePicture();
        }
    }, [userId, currentPicture]);

    const fetchProfilePicture = async () => {
        if (!userId) return;
        setInternalLoading(true);
        try {
            const response = await getProfilePicture(userId);
            if (response && "profilePicture" in response) {
                setProfilePicture(response.profilePicture);
            }
        } catch (error) {
            console.error("Error fetching profile picture:", error);
        } finally {
            setInternalLoading(false);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const allowedTypes = [
            "image/jpeg",
            "image/png",
            "image/gif",
            "image/webp",
        ];
        if (!allowedTypes.includes(file.type)) {
            alert("Please upload a valid image (JPEG, PNG, GIF, or WEBP)");
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            alert("File size too large. Maximum size is 5MB.");
            return;
        }

        setFile(file);
        setPreview(URL.createObjectURL(file));
    };

    const handleUpload = async () => {
        if (!file) return;
        setUploading(true);
        try {
            const response = (await uploadProfilePicture(
                file,
                userId,
            )) as ProfilePictureResponse;
            if (response?.profilePicture) {
                setProfilePicture(response.profilePicture); // Update internal state
            }
            setShowUploadModal(false);
            setFile(null);
            setPreview(null);
            if (fileInputRef.current) fileInputRef.current.value = "";
            onUploadSuccess?.(response);
        } catch (error) {
            console.error("Upload error:", error);
            alert("Failed to upload profile picture");
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm("Remove profile picture?")) return;
        setDeleting(true);
        try {
            await deleteProfilePicture(userId);
            setProfilePicture(null); // Clear internal state
            onDeleteSuccess?.();
        } catch (error) {
            console.error("Delete error:", error);
            alert("Failed to remove profile picture");
        } finally {
            setDeleting(false);
        }
    };

    const renderAvatar = () => {
        const imageSrc = preview || profilePicture; // Use internal state

        if (loading) {
            return (
                <div
                    className={`${sizeConfig[size]} bg-gray-100 rounded-full flex items-center justify-center`}
                >
                    <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
                </div>
            );
        }

        if (imageSrc) {
            return (
                <img
                    src={imageSrc}
                    alt="Profile"
                    className={`${sizeConfig[size]} object-cover rounded-full`}
                />
            );
        }

        return (
            <div
                className={`${sizeConfig[size]} rounded-full flex items-center justify-center text-white font-semibold`}
                style={{ backgroundColor: getUserAvatarColor(userId) }}
            >
                {getUserInitials(firstName, lastName)}
            </div>
        );
    };

    return (
        <>
            <div className={`relative inline-block ${className}`}>
                <div
                    className={`relative rounded-full overflow-hidden ${sizeConfig[size]} ${allowUpload ? "cursor-pointer" : ""}`}
                    onClick={() => allowUpload && setShowUploadModal(true)}
                >
                    {renderAvatar()}
                    {allowUpload && !loading && (
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition">
                            <Camera
                                size={iconSize[size]}
                                className="text-white"
                            />
                        </div>
                    )}
                </div>

                {showUploadButton && allowUpload && (
                    <button
                        onClick={() => setShowUploadModal(true)}
                        className="absolute -bottom-1 -right-1 p-1.5 rounded-full bg-purple-600 text-white hover:bg-purple-700 transition shadow-md"
                    >
                        <Camera size={14} />
                    </button>
                )}

                {showDeleteButton && allowDelete && profilePicture && (
                    <button
                        onClick={handleDelete}
                        disabled={deleting}
                        className="absolute -top-1 -right-1 p-1 rounded-full bg-red-500 text-white hover:bg-red-600 transition shadow-md"
                    >
                        {deleting ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                            <Trash2 size={12} />
                        )}
                    </button>
                )}
            </div>

            {/* Upload Modal */}
            {showUploadModal && (
                <div
                    className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
                    onClick={() => setShowUploadModal(false)}
                >
                    <div
                        className="bg-white rounded-2xl p-6 max-w-md w-full mx-4"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-bold">
                                Update Profile Picture
                            </h3>
                            <button onClick={() => setShowUploadModal(false)}>
                                <X size={20} />
                            </button>
                        </div>

                        <div className="flex justify-center mb-4">
                            <div className="relative w-32 h-32 rounded-full overflow-hidden border-2 border-gray-200">
                                {preview ? (
                                    <img
                                        src={preview}
                                        alt="Preview"
                                        className="w-full h-full object-cover"
                                    />
                                ) : profilePicture ? (
                                    <img
                                        src={profilePicture}
                                        alt="Current"
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div
                                        className="w-full h-full flex items-center justify-center text-white text-2xl font-semibold"
                                        style={{
                                            backgroundColor:
                                                getUserAvatarColor(userId),
                                        }}
                                    >
                                        {getUserInitials(firstName, lastName)}
                                    </div>
                                )}
                            </div>
                        </div>

                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleFileChange}
                            className="hidden"
                            id="profile-upload-input"
                        />
                        <label
                            htmlFor="profile-upload-input"
                            className="flex items-center justify-center gap-2 w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-purple-500 transition"
                        >
                            <Upload className="w-5 h-5 text-gray-400" />
                            <span className="text-sm text-gray-600">
                                {file ? file.name : "Choose an image"}
                            </span>
                        </label>

                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={() => setShowUploadModal(false)}
                                className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 transition"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleUpload}
                                disabled={!file || uploading}
                                className={`flex-1 px-4 py-2.5 rounded-xl text-white transition flex items-center justify-center gap-2 ${
                                    !file || uploading
                                        ? "bg-gray-400 cursor-not-allowed"
                                        : "bg-purple-600 hover:bg-purple-700"
                                }`}
                            >
                                {uploading ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Uploading...
                                    </>
                                ) : (
                                    "Upload"
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default ProfilePicture;
