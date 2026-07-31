// src/pages/Manager/ManagerSettings.tsx
import React, { useState, useEffect } from "react";
import {
    User,
    Camera,
    Edit,
    Mail,
    Bell,
    Shield,
    Phone,
    Lock,
    Eye,
    EyeOff,
    Save,
    X,
    CheckCircle,
    MapPin,
    Briefcase,
} from "lucide-react";
import ManagerSidebar from "./ManagerSidebar";

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

    // Password form
    const [passwordForm, setPasswordForm] = useState({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
    });

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
            <div className="p-8">
                <h1
                    className="text-2xl font-bold text-[#1F083B] mb-6"
                    style={{ fontFamily: "Outfit" }}
                >
                    Settings
                </h1>

                <div className="grid grid-cols-3 gap-6">
                    {/* Left Column */}
                    <div className="col-span-1 space-y-6">
                        {/* Profile Avatar */}
                        <div className="bg-white rounded-xl p-6 text-center">
                            <div className="relative inline-block">
                                <div className="w-24 h-24 rounded-full bg-[#EDE8F4] flex items-center justify-center text-[#6E43A3] text-3xl font-bold mx-auto">
                                    {getInitials(
                                        user?.firstName || "",
                                        user?.lastName || "",
                                    )}
                                </div>
                                <button className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-[#6E43A3] text-white flex items-center justify-center hover:opacity-90 transition">
                                    <Camera size={16} />
                                </button>
                            </div>
                            <h3
                                className="mt-3 font-semibold text-[#1F083B]"
                                style={{ fontFamily: "Outfit" }}
                            >
                                {user?.firstName} {user?.lastName}
                            </h3>
                            <p
                                className="text-sm text-[#8E98A8]"
                                style={{ fontFamily: "Outfit" }}
                            >
                                {user?.role === "fleet_manager"
                                    ? "Fleet Manager"
                                    : user?.role || "User"}
                            </p>
                            {manager?.subFleet && (
                                <div className="mt-2 inline-flex items-center gap-1 px-3 py-1 bg-[#6E43A310] rounded-full">
                                    <MapPin
                                        size={12}
                                        className="text-[#6E43A3]"
                                    />
                                    <span
                                        className="text-xs text-[#6E43A3]"
                                        style={{ fontFamily: "Outfit" }}
                                    >
                                        {manager.subFleet.name}
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* Personal Information */}
                        <div className="bg-white rounded-xl p-6">
                            <div className="flex justify-between items-center mb-4">
                                <h3
                                    className="font-semibold text-[#1F083B]"
                                    style={{ fontFamily: "Outfit" }}
                                >
                                    Personal Information
                                </h3>
                                <button
                                    onClick={() =>
                                        setEditingPersonal(!editingPersonal)
                                    }
                                    className="text-[#6E43A3] hover:opacity-80 transition"
                                >
                                    <Edit size={18} />
                                </button>
                            </div>

                            {editingPersonal ? (
                                <div className="space-y-4">
                                    <div>
                                        <label
                                            className="text-xs text-[#8E98A8]"
                                            style={{ fontFamily: "Outfit" }}
                                        >
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
                                            className="w-full px-3 py-2 border border-[#E0E5EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6E43A3]"
                                            style={{ fontFamily: "Outfit" }}
                                        />
                                    </div>
                                    <div>
                                        <label
                                            className="text-xs text-[#8E98A8]"
                                            style={{ fontFamily: "Outfit" }}
                                        >
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
                                            className="w-full px-3 py-2 border border-[#E0E5EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6E43A3]"
                                            style={{ fontFamily: "Outfit" }}
                                        />
                                    </div>
                                    <button
                                        onClick={handleUpdateProfile}
                                        disabled={isSubmitting}
                                        className="w-full bg-[#6E43A3] text-white px-4 py-2 rounded-lg hover:opacity-90 transition disabled:opacity-50 flex items-center justify-center gap-2"
                                        style={{ fontFamily: "Outfit" }}
                                    >
                                        <Save size={16} />
                                        Save Changes
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    <div>
                                        <p
                                            className="text-xs text-[#8E98A8]"
                                            style={{ fontFamily: "Outfit" }}
                                        >
                                            Full Name
                                        </p>
                                        <p
                                            className="text-sm font-medium text-[#1F083B]"
                                            style={{ fontFamily: "Outfit" }}
                                        >
                                            {user?.firstName} {user?.lastName}
                                        </p>
                                    </div>
                                    <div>
                                        <p
                                            className="text-xs text-[#8E98A8]"
                                            style={{ fontFamily: "Outfit" }}
                                        >
                                            Email
                                        </p>
                                        <p
                                            className="text-sm font-medium text-[#1F083B]"
                                            style={{ fontFamily: "Outfit" }}
                                        >
                                            {user?.email || "Not specified"}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Column */}
                    <div className="col-span-2 space-y-6">
                        {/* Notification Settings */}
                        <div className="bg-white rounded-xl p-6">
                            <h3
                                className="font-semibold text-[#1F083B] mb-4"
                                style={{ fontFamily: "Outfit" }}
                            >
                                Notification Settings
                            </h3>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p
                                            className="text-sm font-medium text-[#1F083B]"
                                            style={{ fontFamily: "Outfit" }}
                                        >
                                            Email notifications
                                        </p>
                                        <p
                                            className="text-xs text-[#8E98A8]"
                                            style={{ fontFamily: "Outfit" }}
                                        >
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
                                        className={`w-12 h-6 rounded-full transition relative ${
                                            notifications.emailNotifications
                                                ? "bg-[#6E43A3]"
                                                : "bg-[#D1D5DB]"
                                        }`}
                                    >
                                        <div
                                            className={`w-5 h-5 rounded-full bg-white absolute top-0.5 transition ${
                                                notifications.emailNotifications
                                                    ? "right-0.5"
                                                    : "left-0.5"
                                            }`}
                                        />
                                    </button>
                                </div>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p
                                            className="text-sm font-medium text-[#1F083B]"
                                            style={{ fontFamily: "Outfit" }}
                                        >
                                            Push Notifications
                                        </p>
                                        <p
                                            className="text-xs text-[#8E98A8]"
                                            style={{ fontFamily: "Outfit" }}
                                        >
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
                                        className={`w-12 h-6 rounded-full transition relative ${
                                            notifications.pushNotifications
                                                ? "bg-[#6E43A3]"
                                                : "bg-[#D1D5DB]"
                                        }`}
                                    >
                                        <div
                                            className={`w-5 h-5 rounded-full bg-white absolute top-0.5 transition ${
                                                notifications.pushNotifications
                                                    ? "right-0.5"
                                                    : "left-0.5"
                                            }`}
                                        />
                                    </button>
                                </div>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p
                                            className="text-sm font-medium text-[#1F083B]"
                                            style={{ fontFamily: "Outfit" }}
                                        >
                                            SOS alerts
                                        </p>
                                        <p
                                            className="text-xs text-[#8E98A8]"
                                            style={{ fontFamily: "Outfit" }}
                                        >
                                            Immediate push + SMS when a driver
                                            triggers SOS.
                                        </p>
                                    </div>
                                    <button
                                        onClick={() =>
                                            toggleNotification("sosAlerts")
                                        }
                                        className={`w-12 h-6 rounded-full transition relative ${
                                            notifications.sosAlerts
                                                ? "bg-[#6E43A3]"
                                                : "bg-[#D1D5DB]"
                                        }`}
                                    >
                                        <div
                                            className={`w-5 h-5 rounded-full bg-white absolute top-0.5 transition ${
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
                        <div className="bg-white rounded-xl p-6">
                            <h3
                                className="font-semibold text-[#1F083B] mb-4"
                                style={{ fontFamily: "Outfit" }}
                            >
                                Sub-Fleet Information
                            </h3>
                            {manager?.subFleet ? (
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p
                                            className="text-xs text-[#8E98A8]"
                                            style={{ fontFamily: "Outfit" }}
                                        >
                                            Sub-Fleet Name
                                        </p>
                                        <p
                                            className="text-sm font-medium text-[#1F083B]"
                                            style={{ fontFamily: "Outfit" }}
                                        >
                                            {manager.subFleet.name}
                                        </p>
                                    </div>
                                    <div>
                                        <p
                                            className="text-xs text-[#8E98A8]"
                                            style={{ fontFamily: "Outfit" }}
                                        >
                                            Region
                                        </p>
                                        <p
                                            className="text-sm font-medium text-[#1F083B]"
                                            style={{ fontFamily: "Outfit" }}
                                        >
                                            {manager.subFleet.region ||
                                                "Not specified"}
                                        </p>
                                    </div>
                                    {manager.company && (
                                        <div className="col-span-2">
                                            <p
                                                className="text-xs text-[#8E98A8]"
                                                style={{ fontFamily: "Outfit" }}
                                            >
                                                Company
                                            </p>
                                            <p
                                                className="text-sm font-medium text-[#1F083B]"
                                                style={{ fontFamily: "Outfit" }}
                                            >
                                                {manager.company.name}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <p
                                    className="text-sm text-[#8E98A8]"
                                    style={{ fontFamily: "Outfit" }}
                                >
                                    No sub-fleet assigned
                                </p>
                            )}
                        </div>

                        {/* Security Settings */}
                        <div className="bg-white rounded-xl p-6">
                            <h3
                                className="font-semibold text-[#1F083B] mb-4"
                                style={{ fontFamily: "Outfit" }}
                            >
                                Security Settings
                            </h3>
                            <button
                                onClick={() => setShowPasswordModal(true)}
                                className="flex items-center gap-3 px-4 py-3 border border-[#E0E5EB] rounded-lg hover:bg-[#F8F8F8] transition w-full"
                            >
                                <Lock size={18} className="text-[#6E43A3]" />
                                <span
                                    className="text-sm font-medium text-[#1F083B]"
                                    style={{ fontFamily: "Outfit" }}
                                >
                                    Update Password
                                </span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Change Password Modal */}
            {showPasswordModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4">
                        <div className="flex justify-between items-center mb-4">
                            <h3
                                className="text-2xl font-bold text-[#1F083B]"
                                style={{ fontFamily: "Outfit" }}
                            >
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
                                className="text-[#5B646F] hover:text-[#1F083B] transition"
                            >
                                <X size={24} />
                            </button>
                        </div>
                        <div className="h-px w-full bg-[#E5E7EB] mb-6" />

                        <div className="space-y-4">
                            <div>
                                <label
                                    className="text-sm font-medium text-[#1F083B]"
                                    style={{ fontFamily: "Outfit" }}
                                >
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
                                        className="w-full px-4 py-3 border border-[#E0E5EB] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#6E43A3]"
                                        style={{ fontFamily: "Outfit" }}
                                        placeholder="Enter current password"
                                    />
                                    <button
                                        onClick={() =>
                                            setShowPassword(!showPassword)
                                        }
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8E98A8]"
                                    >
                                        {showPassword ? (
                                            <EyeOff size={20} />
                                        ) : (
                                            <Eye size={20} />
                                        )}
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label
                                    className="text-sm font-medium text-[#1F083B]"
                                    style={{ fontFamily: "Outfit" }}
                                >
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
                                        className="w-full px-4 py-3 border border-[#E0E5EB] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#6E43A3]"
                                        style={{ fontFamily: "Outfit" }}
                                        placeholder="Enter new password"
                                    />
                                    <button
                                        onClick={() =>
                                            setShowNewPassword(!showNewPassword)
                                        }
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8E98A8]"
                                    >
                                        {showNewPassword ? (
                                            <EyeOff size={20} />
                                        ) : (
                                            <Eye size={20} />
                                        )}
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label
                                    className="text-sm font-medium text-[#1F083B]"
                                    style={{ fontFamily: "Outfit" }}
                                >
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
                                        className="w-full px-4 py-3 border border-[#E0E5EB] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#6E43A3]"
                                        style={{ fontFamily: "Outfit" }}
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
                                            <EyeOff size={20} />
                                        ) : (
                                            <Eye size={20} />
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
                                className="w-full bg-[#6E43A3] text-white px-6 py-3 rounded-xl hover:opacity-90 transition disabled:opacity-50 flex items-center justify-center gap-2"
                                style={{ fontFamily: "Outfit" }}
                            >
                                {isSubmitting ? (
                                    <>
                                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
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

            {/* Success Modal */}
            {showSuccessModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 text-center">
                        <div className="w-16 h-16 rounded-full bg-[#D6F5DA] flex items-center justify-center mx-auto mb-4">
                            <CheckCircle size={32} className="text-[#267F50]" />
                        </div>
                        <h3
                            className="text-2xl font-bold text-[#1F083B] mb-2"
                            style={{ fontFamily: "Outfit" }}
                        >
                            Success!
                        </h3>
                        <p
                            className="text-[#5B646F] mb-6"
                            style={{ fontFamily: "Outfit" }}
                        >
                            {successMessage}
                        </p>
                        <button
                            onClick={() => {
                                setShowSuccessModal(false);
                                setSuccessMessage("");
                            }}
                            className="w-full bg-[#6E43A3] text-white px-6 py-3 rounded-xl hover:opacity-90 transition"
                            style={{ fontFamily: "Outfit" }}
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
