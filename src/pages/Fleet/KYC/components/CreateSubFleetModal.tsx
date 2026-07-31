import React, { useState } from "react";
import { X } from "lucide-react";
import { createSubFleet } from "../../../../api/fleet";

interface CreateSubFleetModalProps {
    onClose: () => void;
    onSuccess: () => void;
}

const CreateSubFleetModal: React.FC<CreateSubFleetModalProps> = ({
    onClose,
    onSuccess,
}) => {
    const [formData, setFormData] = useState({
        name: "",
        region: "",
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name || !formData.region) {
            setError("Please fill in all required fields");
            return;
        }

        setLoading(true);
        setError(null);
        try {
            await createSubFleet(formData);
            onSuccess();
            onClose();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="w-full max-w-md rounded-2xl bg-white p-6">
                <div className="flex items-center justify-between">
                    <h3
                        className="text-xl font-bold"
                        style={{ fontFamily: "Outfit", color: "#1F083B" }}
                    >
                        Create Sub-Fleet
                    </h3>
                    <button
                        onClick={onClose}
                        className="rounded-full p-1 hover:bg-gray-100"
                    >
                        <X size={20} style={{ color: "#8E98A8" }} />
                    </button>
                </div>

                <p
                    className="mt-1 text-sm"
                    style={{ fontFamily: "Outfit", color: "#8E98A8" }}
                >
                    Add a new sub-fleet to your organization
                </p>

                <form onSubmit={handleSubmit} className="mt-6">
                    <div className="flex flex-col gap-4">
                        <div>
                            <label
                                className="mb-1 block text-sm font-medium"
                                style={{
                                    color: "#1F083B",
                                    fontFamily: "Outfit",
                                }}
                            >
                                Sub-Fleet Name *
                            </label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        name: e.target.value,
                                    })
                                }
                                placeholder="Enter sub-fleet name"
                                className="w-full rounded-xl border border-[#D1D5DB] px-4 py-3 outline-none transition focus:border-[#6E43A3] focus:ring-1 focus:ring-[#6E43A3]"
                                required
                            />
                        </div>

                        <div>
                            <label
                                className="mb-1 block text-sm font-medium"
                                style={{
                                    color: "#1F083B",
                                    fontFamily: "Outfit",
                                }}
                            >
                                Region *
                            </label>
                            <input
                                type="text"
                                value={formData.region}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        region: e.target.value,
                                    })
                                }
                                placeholder="Enter region (e.g., Lagos, Abuja)"
                                className="w-full rounded-xl border border-[#D1D5DB] px-4 py-3 outline-none transition focus:border-[#6E43A3] focus:ring-1 focus:ring-[#6E43A3]"
                                required
                            />
                        </div>

                        {error && (
                            <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
                                {error}
                            </div>
                        )}

                        <div className="flex gap-4">
                            <button
                                type="button"
                                onClick={onClose}
                                className="flex-1 rounded-xl border border-[#D1D5DB] px-4 py-3 font-medium transition hover:bg-gray-50"
                                style={{
                                    color: "#1F083B",
                                    fontFamily: "Outfit",
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="flex-1 rounded-xl px-4 py-3 font-medium text-white transition hover:opacity-90 disabled:opacity-50"
                                style={{
                                    backgroundColor: "#6E43A3",
                                    fontFamily: "Outfit",
                                }}
                            >
                                {loading ? "Creating..." : "Create Sub-Fleet"}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateSubFleetModal;
