

import type {
    CreateSubFleetPayload,
    UpdateSubFleetPayload,
} from "../pages/Fleet/types/subFleet.types";

const API_BASE = "https://backend-production-01de.up.railway.app";

export async function getSubFleets() {
    const token = localStorage.getItem("token");

    const res = await fetch(`${API_BASE}/fleet/sub-fleets`, {
        method: "GET",
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to get sub-fleets");
    }

    return res.json();
}

export async function getSubFleetDetails(id: string) {
    const token = localStorage.getItem("token");

    const res = await fetch(`${API_BASE}/fleet/sub-fleets/${id}`, {
        method: "GET",
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to get sub-fleet details");
    }

    return res.json();
}

export async function getSubFleetStatus(id: string) {
    const token = localStorage.getItem("token");

    const res = await fetch(`${API_BASE}/fleet/sub-fleets/${id}/status`, {
        method: "GET",
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to get sub-fleet status");
    }

    return res.json();
}

export async function createSubFleet(payload: CreateSubFleetPayload) {
    const token = localStorage.getItem("token");

    const res = await fetch(`${API_BASE}/fleet/sub-fleets`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
    });

    if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to create sub-fleet");
    }

    return res.json();
}

export async function updateSubFleet(
    id: string,
    payload: UpdateSubFleetPayload,
) {
    const token = localStorage.getItem("token");

    const res = await fetch(`${API_BASE}/fleet/sub-fleets/${id}`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
    });

    if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to update sub-fleet");
    }

    return res.json();
}

export async function suspendSubFleet(id: string) {
    const token = localStorage.getItem("token");

    const res = await fetch(`${API_BASE}/fleet/sub-fleets/${id}/suspend`, {
        method: "PATCH",
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to suspend sub-fleet");
    }

    return res.json();
}

export async function reactivateSubFleet(id: string) {
    const token = localStorage.getItem("token");

    const res = await fetch(`${API_BASE}/fleet/sub-fleets/${id}/reactivate`, {
        method: "PATCH",
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to reactivate sub-fleet");
    }

    return res.json();
}

export async function deleteSubFleet(id: string) {
    const token = localStorage.getItem("token");

    const res = await fetch(`${API_BASE}/fleet/sub-fleets/${id}`, {
        method: "DELETE",
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to delete sub-fleet");
    }

    return res.json();
}
