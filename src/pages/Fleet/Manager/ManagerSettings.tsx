import React, { useState, useEffect } from "react";
import {
    Edit,
    Lock,
    Eye,
    EyeOff,
    Save,
    X,
    CheckCircle,
    MapPin,
} from "lucide-react";
import ManagerSidebar from "./ManagerSidebar";
import { useProfilePicture } from "../../../hooks/useProfilePicture";
import ProfilePicture from "../KYC/components/ProfilePicture";

const API_BASE = "https://backend-production-01de.up.railway.app";

interface UserProfile {
    id: string;
    firstName: string;
    lastName: string;
    email?: string;
    phoneNumber: string | null;
    gender: string | null;
    dateOfBirth: string | null;
    occupation: string | null;
    role: string;
    isPhoneVerified: boolean;
    hasCompletedOnboarding: boolean;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

interface ManagerProfile {
    id: string;
    userId: string;
    fleetCompanyId: string;
    subFleetId: string;
    role: string;
    status: string;
    user?: {
        id: string;
        firstName: string;
        lastName: string;
        email: string;
        phoneNumber: string;
    };
    subFleet?: {
        id: string;
        name: string;
        region: string;
    };
    company?: {
        id: string;
        name: string;
        fleetName: string;
    };
    joinedAt?: string;
}

interface NotificationSettings {
    emailNotifications: boolean;
    pushNotifications: boolean;
    sosAlerts: boolean;
}

const ManagerSettings: React.FC = () => {
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<UserProfile | null>(null);
    const [manager, setManager] = useState<ManagerProfile | null>(null);
    const [notifications, setNotifications] = useState<NotificationSettings>({
        emailNotifications: true,
        pushNotifications: true,
        sosAlerts: true,
    });
    const [editingPersonal, setEditingPersonal] = useState(false);
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [successMessage, setSuccessMessage] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    // Personal info form
    const [personalForm, setPersonalForm] = useState({
        firstName: "",
        lastName: "",
    });

    // Handle profile picture upload success
    const handleProfilePictureUpload = (data: {
        userId: string;
        profilePicture: string;
    }) => {
        // Update user state with new profile picture
        setUser((prev) => ({
            ...prev!,
            profilePicture: data.profilePicture,
        }));
        refetch(); // Refetch after upload

        setSuccessMessage("Profile picture updated successfully!");
        setShowSuccessModal(true);
    };

    // Handle profile picture delete
    const handleProfilePictureDelete = () => {
        setUser((prev) => ({
            ...prev!,
            profilePicture: null,
        }));
    };

    // Password form
    const [passwordForm, setPasswordForm] = useState({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
    });

    const {
        profilePicture,
        isLoading: pictureLoading,
        refetch,
    } = useProfilePicture(user?.id || "");

    // Fetch data
    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem("token");

            // Fetch manager profile first (contains email)
            const managerResponse = await fetch(`${API_BASE}/manager/profile`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
            });

            if (managerResponse.ok) {
                const managerData = await managerResponse.json();
                setManager(managerData);

                // Set user data from manager profile
                if (managerData.user) {
                    setUser({
                        id: managerData.user.id,
                        firstName: managerData.user.firstName || "",
                        lastName: managerData.user.lastName || "",
                        email: managerData.user.email || "",
                        phoneNumber: managerData.user.phoneNumber || null,
                        gender: null,
                        dateOfBirth: null,
                        occupation: null,
                        role: "fleet_manager",
                        isPhoneVerified: false,
                        hasCompletedOnboarding: true,
                        isActive: true,
                        createdAt: "",
                        updatedAt: "",
                    });

                    setPersonalForm({
                        firstName: managerData.user.firstName || "",
                        lastName: managerData.user.lastName || "",
                    });
                }
            }

            // Also fetch user profile if needed for additional info
            const userResponse = await fetch(`${API_BASE}/users/profile`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
            });

            if (userResponse.ok) {
                const userData = await userResponse.json();
                setUser((prev) => ({
                    ...prev!,
                    gender: userData.gender || null,
                    dateOfBirth: userData.dateOfBirth || null,
                    occupation: userData.occupation || null,
                    isPhoneVerified: userData.isPhoneVerified || false,
                }));
            }
        } catch (error) {
            console.error("Error fetching data:", error);
        } finally {
            setLoading(false);
        }
    };

    // Update profile - only first and last name
    const handleUpdateProfile = async () => {
        try {
            setIsSubmitting(true);
            const token = localStorage.getItem("token");

            const response = await fetch(`${API_BASE}/users/profile`, {
                method: "PATCH",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    firstName: personalForm.firstName,
                    lastName: personalForm.lastName,
                }),
            });

            if (!response.ok) {
                throw new Error("Failed to update profile");
            }

            const data = await response.json();

            // Update user state with new data
            setUser((prev) => ({
                ...prev!,
                firstName: data.firstName,
                lastName: data.lastName,
            }));

            // Also update manager user data
            setManager((prev) => ({
                ...prev!,
                user: {
                    ...prev!.user!,
                    firstName: data.firstName,
                    lastName: data.lastName,
                },
            }));

            setEditingPersonal(false);
            setSuccessMessage("Profile updated successfully!");
            setShowSuccessModal(true);
        } catch (error) {
            console.error("Error updating profile:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    // Change password
    const handleChangePassword = async () => {
        if (passwordForm.newPassword !== passwordForm.confirmPassword) {
            alert("Passwords do not match");
            return;
        }

        try {
            setIsSubmitting(true);
            const token = localStorage.getItem("token");

            const response = await fetch(`${API_BASE}/auth/change-password`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    currentPassword: passwordForm.currentPassword,
                    newPassword: passwordForm.newPassword,
                    confirmPassword: passwordForm.confirmPassword,
                }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || "Failed to change password");
            }

            setShowPasswordModal(false);
            setPasswordForm({
                currentPassword: "",
                newPassword: "",
                confirmPassword: "",
            });
            setSuccessMessage("Password changed successfully!");
            setShowSuccessModal(true);
        } catch (error: any) {
            console.error("Error changing password:", error);
            alert(error.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    // Toggle notification
    const toggleNotification = (key: keyof NotificationSettings) => {
        setNotifications((prev) => ({
            ...prev,
            [key]: !prev[key],
        }));
    };

    const getInitials = (firstName: string, lastName: string) => {
        return (
            `${firstName?.[0] || ""}${lastName?.[0] || ""}`.toUpperCase() || "U"
        );
    };

    // Format date
    const formatDate = (dateString: string | null) => {
        if (!dateString) return "Not specified";
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
            });
        } catch {
            return "Not specified";
        }
    };

    if (loading) {
        return (
            <ManagerSidebar>
                <div className="flex items-center justify-center min-h-[600px]">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#6E43A3] mx-auto" />
                        <p
                            className="mt-4 text-[#8E98A8]"
                            style={{ fontFamily: "Outfit" }}
                        >
                            Loading settings...
                        </p>
                    </div>
                </div>
            </ManagerSidebar>
        );
    }

    return (
        <ManagerSidebar>
            <div className="p-3 sm:p-4 md:p-6 lg:p-8">
                <h1 className="mb-4 text-xl font-bold text-[#1F083B] sm:mb-6 sm:text-2xl">
                    Settings
                </h1>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-3 md:gap-6">
                    {/* Left Column */}
                    <div className="space-y-4 md:col-span-1">
                        {/* Profile Avatar */}
                        <div className="rounded-xl bg-white p-4 text-center shadow-sm sm:p-6">
                            <div className="relative inline-block">
                                <ProfilePicture
                                    userId={user?.id || ""}
                                    firstName={user?.firstName}
                                    lastName={user?.lastName}
                                    currentPicture={profilePicture}
                                    size="xl"
                                    allowUpload={true}
                                    allowDelete={true}
                                    showUploadButton={true}
                                    showDeleteButton={false}
                                    loading={pictureLoading}
                                    className="mx-auto"
                                    onUploadSuccess={handleProfilePictureUpload}
                                    onDeleteSuccess={handleProfilePictureDelete}
                                />
                            </div>
                            <h3 className="mt-3 font-semibold text-[#1F083B]">
                                {user?.firstName} {user?.lastName}
                            </h3>
                            <p className="text-sm text-[#8E98A8]">
                                {user?.role === "fleet_manager"
                                    ? "Fleet Manager"
                                    : user?.role || "User"}
                            </p>
                            {manager?.subFleet && (
                                <div className="mt-2 inline-flex items-center gap-1 rounded-full bg-[#6E43A310] px-3 py-1">
                                    <MapPin
                                        size={12}
                                        className="text-[#6E43A3]"
                                    />
                                    <span className="text-xs text-[#6E43A3]">
                                        {manager.subFleet.name}
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* Personal Information */}
                        <div className="rounded-xl bg-white p-4 shadow-sm sm:p-6">
                            <div className="mb-4 flex items-center justify-between">
                                <h3 className="font-semibold text-[#1F083B]">
                                    Personal Information
                                </h3>
                                <button
                                    onClick={() =>
                                        setEditingPersonal(!editingPersonal)
                                    }
                                    className="text-[#6E43A3] transition hover:opacity-80"
                                >
                                    <Edit size={18} />
                                </button>
                            </div>

                            {editingPersonal ? (
                                <div className="space-y-3 sm:space-y-4">
                                    <div>
                                        <label className="text-xs text-[#8E98A8]">
                                            First Name
                                        </label>
                                        <input
                                            type="text"
                                            value={personalForm.firstName}
                                            onChange={(e) =>
                                                setPersonalForm((prev) => ({
                                                    ...prev,
                                                    firstName: e.target.value,
                                                }))
                                            }
                                            className="w-full rounded-lg border border-[#E0E5EB] px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#6E43A3]"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs text-[#8E98A8]">
                                            Last Name
                                        </label>
                                        <input
                                            type="text"
                                            value={personalForm.lastName}
                                            onChange={(e) =>
                                                setPersonalForm((prev) => ({
                                                    ...prev,
                                                    lastName: e.target.value,
                                                }))
                                            }
                                            className="w-full rounded-lg border border-[#E0E5EB] px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#6E43A3]"
                                        />
                                    </div>
                                    <button
                                        onClick={handleUpdateProfile}
                                        disabled={isSubmitting}
                                        className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#6E43A3] px-4 py-2 text-white transition hover:opacity-90 disabled:opacity-50"
                                    >
                                        <Save size={16} />
                                        Save Changes
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    <div>
                                        <p className="text-xs text-[#8E98A8]">
                                            Full Name
                                        </p>
                                        <p className="text-sm font-medium text-[#1F083B]">
                                            {user?.firstName} {user?.lastName}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-[#8E98A8]">
                                            Email
                                        </p>
                                        <p className="text-sm font-medium text-[#1F083B]">
                                            {user?.email || "Not specified"}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Column */}
                    <div className="space-y-4 md:col-span-2">
                        {/* Notification Settings */}
                        <div className="rounded-xl bg-white p-4 shadow-sm sm:p-6">
                            <h3 className="mb-4 font-semibold text-[#1F083B]">
                                Notification Settings
                            </h3>
                            <div className="space-y-4">
                                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-[#1F083B]">
                                            Email notifications
                                        </p>
                                        <p className="text-xs text-[#8E98A8]">
                                            Receive important updates in your
                                            inbox.
                                        </p>
                                    </div>
                                    <button
                                        onClick={() =>
                                            toggleNotification(
                                                "emailNotifications",
                                            )
                                        }
                                        className={`relative h-6 w-12 rounded-full transition ${
                                            notifications.emailNotifications
                                                ? "bg-[#6E43A3]"
                                                : "bg-[#D1D5DB]"
                                        }`}
                                    >
                                        <div
                                            className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition ${
                                                notifications.emailNotifications
                                                    ? "right-0.5"
                                                    : "left-0.5"
                                            }`}
                                        />
                                    </button>
                                </div>
                                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-[#1F083B]">
                                            Push Notifications
                                        </p>
                                        <p className="text-xs text-[#8E98A8]">
                                            Get real-time alerts when action is
                                            needed.
                                        </p>
                                    </div>
                                    <button
                                        onClick={() =>
                                            toggleNotification(
                                                "pushNotifications",
                                            )
                                        }
                                        className={`relative h-6 w-12 rounded-full transition ${
                                            notifications.pushNotifications
                                                ? "bg-[#6E43A3]"
                                                : "bg-[#D1D5DB]"
                                        }`}
                                    >
                                        <div
                                            className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition ${
                                                notifications.pushNotifications
                                                    ? "right-0.5"
                                                    : "left-0.5"
                                            }`}
                                        />
                                    </button>
                                </div>
                                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-[#1F083B]">
                                            SOS alerts
                                        </p>
                                        <p className="text-xs text-[#8E98A8]">
                                            Immediate push + SMS when a driver
                                            triggers SOS.
                                        </p>
                                    </div>
                                    <button
                                        onClick={() =>
                                            toggleNotification("sosAlerts")
                                        }
                                        className={`relative h-6 w-12 rounded-full transition ${
                                            notifications.sosAlerts
                                                ? "bg-[#6E43A3]"
                                                : "bg-[#D1D5DB]"
                                        }`}
                                    >
                                        <div
                                            className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition ${
                                                notifications.sosAlerts
                                                    ? "right-0.5"
                                                    : "left-0.5"
                                            }`}
                                        />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Sub-Fleet Information */}
                        <div className="rounded-xl bg-white p-4 shadow-sm sm:p-6">
                            <h3 className="mb-4 font-semibold text-[#1F083B]">
                                Sub-Fleet Information
                            </h3>
                            {manager?.subFleet ? (
                                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
                                    <div>
                                        <p className="text-xs text-[#8E98A8]">
                                            Sub-Fleet Name
                                        </p>
                                        <p className="text-sm font-medium text-[#1F083B]">
                                            {manager.subFleet.name}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-[#8E98A8]">
                                            Region
                                        </p>
                                        <p className="text-sm font-medium text-[#1F083B]">
                                            {manager.subFleet.region ||
                                                "Not specified"}
                                        </p>
                                    </div>
                                    {manager.company && (
                                        <div className="col-span-1 sm:col-span-2">
                                            <p className="text-xs text-[#8E98A8]">
                                                Company
                                            </p>
                                            <p className="text-sm font-medium text-[#1F083B]">
                                                {manager.company.name}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <p className="text-sm text-[#8E98A8]">
                                    No sub-fleet assigned
                                </p>
                            )}
                        </div>

                        {/* Security Settings */}
                        <div className="rounded-xl bg-white p-4 shadow-sm sm:p-6">
                            <h3 className="mb-4 font-semibold text-[#1F083B]">
                                Security Settings
                            </h3>
                            <button
                                onClick={() => setShowPasswordModal(true)}
                                className="flex w-full items-center gap-3 rounded-lg border border-[#E0E5EB] px-4 py-3 transition hover:bg-[#F8F8F8]"
                            >
                                <Lock size={18} className="text-[#6E43A3]" />
                                <span className="text-sm font-medium text-[#1F083B]">
                                    Update Password
                                </span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Change Password Modal - Mobile Friendly */}
            {showPasswordModal && (
                <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 backdrop-blur-sm sm:items-center">
                    <div className="w-full max-w-md rounded-2xl bg-white p-4 shadow-xl sm:p-6 md:p-8 max-h-[90vh] overflow-y-auto">
                        <div className="mb-4 flex items-start justify-between gap-4">
                            <h3 className="text-xl font-bold text-[#1F083B] sm:text-2xl">
                                Change Password
                            </h3>
                            <button
                                onClick={() => {
                                    setShowPasswordModal(false);
                                    setPasswordForm({
                                        currentPassword: "",
                                        newPassword: "",
                                        confirmPassword: "",
                                    });
                                }}
                                className="flex-shrink-0 rounded-lg p-1 text-[#5B646F] transition hover:bg-gray-100 hover:text-[#1F083B]"
                            >
                                <X size={20} className="sm:size-[24px]" />
                            </button>
                        </div>
                        <div className="mb-4 h-px w-full bg-[#E5E7EB] sm:mb-6" />

                        <div className="space-y-4">
                            <div>
                                <label className="text-sm font-medium text-[#1F083B]">
                                    Current Password
                                </label>
                                <div className="relative">
                                    <input
                                        type={
                                            showPassword ? "text" : "password"
                                        }
                                        value={passwordForm.currentPassword}
                                        onChange={(e) =>
                                            setPasswordForm((prev) => ({
                                                ...prev,
                                                currentPassword: e.target.value,
                                            }))
                                        }
                                        className="h-12 w-full rounded-xl border border-[#E0E5EB] px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#6E43A3] sm:h-14 sm:text-base"
                                        placeholder="Enter current password"
                                    />
                                    <button
                                        onClick={() =>
                                            setShowPassword(!showPassword)
                                        }
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8E98A8]"
                                    >
                                        {showPassword ? (
                                            <EyeOff
                                                size={18}
                                                className="sm:size-[20px]"
                                            />
                                        ) : (
                                            <Eye
                                                size={18}
                                                className="sm:size-[20px]"
                                            />
                                        )}
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="text-sm font-medium text-[#1F083B]">
                                    New Password
                                </label>
                                <div className="relative">
                                    <input
                                        type={
                                            showNewPassword
                                                ? "text"
                                                : "password"
                                        }
                                        value={passwordForm.newPassword}
                                        onChange={(e) =>
                                            setPasswordForm((prev) => ({
                                                ...prev,
                                                newPassword: e.target.value,
                                            }))
                                        }
                                        className="h-12 w-full rounded-xl border border-[#E0E5EB] px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#6E43A3] sm:h-14 sm:text-base"
                                        placeholder="Enter new password"
                                    />
                                    <button
                                        onClick={() =>
                                            setShowNewPassword(!showNewPassword)
                                        }
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8E98A8]"
                                    >
                                        {showNewPassword ? (
                                            <EyeOff
                                                size={18}
                                                className="sm:size-[20px]"
                                            />
                                        ) : (
                                            <Eye
                                                size={18}
                                                className="sm:size-[20px]"
                                            />
                                        )}
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="text-sm font-medium text-[#1F083B]">
                                    Confirm Password
                                </label>
                                <div className="relative">
                                    <input
                                        type={
                                            showConfirmPassword
                                                ? "text"
                                                : "password"
                                        }
                                        value={passwordForm.confirmPassword}
                                        onChange={(e) =>
                                            setPasswordForm((prev) => ({
                                                ...prev,
                                                confirmPassword: e.target.value,
                                            }))
                                        }
                                        className="h-12 w-full rounded-xl border border-[#E0E5EB] px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#6E43A3] sm:h-14 sm:text-base"
                                        placeholder="Confirm new password"
                                    />
                                    <button
                                        onClick={() =>
                                            setShowConfirmPassword(
                                                !showConfirmPassword,
                                            )
                                        }
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8E98A8]"
                                    >
                                        {showConfirmPassword ? (
                                            <EyeOff
                                                size={18}
                                                className="sm:size-[20px]"
                                            />
                                        ) : (
                                            <Eye
                                                size={18}
                                                className="sm:size-[20px]"
                                            />
                                        )}
                                    </button>
                                </div>
                            </div>

                            <button
                                onClick={handleChangePassword}
                                disabled={
                                    !passwordForm.currentPassword ||
                                    !passwordForm.newPassword ||
                                    !passwordForm.confirmPassword ||
                                    isSubmitting
                                }
                                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#6E43A3] px-6 py-3 text-white transition hover:opacity-90 disabled:opacity-50"
                            >
                                {isSubmitting ? (
                                    <>
                                        <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                        Updating...
                                    </>
                                ) : (
                                    <>
                                        <Lock size={18} />
                                        Update Password
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Success Modal - Mobile Friendly */}
            {showSuccessModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
                    <div className="w-full max-w-md rounded-2xl bg-white p-6 text-center shadow-xl sm:p-8">
                        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#D6F5DA]">
                            <CheckCircle size={32} className="text-[#267F50]" />
                        </div>
                        <h3 className="mb-2 text-xl font-bold text-[#1F083B] sm:text-2xl">
                            Success!
                        </h3>
                        <p className="mb-6 text-sm text-[#5B646F]">
                            {successMessage}
                        </p>
                        <button
                            onClick={() => {
                                setShowSuccessModal(false);
                                setSuccessMessage("");
                            }}
                            className="w-full rounded-xl bg-[#6E43A3] px-6 py-3 text-white transition hover:opacity-90"
                        >
                            Done
                        </button>
                    </div>
                </div>
            )}
        </ManagerSidebar>
    );
};

export default ManagerSettings;
