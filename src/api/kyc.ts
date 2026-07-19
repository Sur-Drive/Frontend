const API_BASE = "https://backend-production-01de.up.railway.app";

export interface CreateCompanyPayload {
    companyName: string;
    industry: string;
    fleetName: string;
    region: string;
    operationsContact: string;
    companyPhone: string;
    briefDescription: string;
    numberOfVehicles: number;
    plan: string;
}

export interface UpdateCompanyPayload {
    plan?: string;
    numberOfVehicles?: number;
}

export async function createCompany(payload: CreateCompanyPayload) {
    const token = localStorage.getItem("token");

    const res = await fetch(`${API_BASE}/fleet/company`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
    });

    if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to create company");
    }

    return res.json();
}

export async function getCompany() {
    const token = localStorage.getItem("token");

    const res = await fetch(`${API_BASE}/fleet/company`, {
        method: "GET",
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to get company");
    }

    return res.json();
}

export async function updateCompany(payload: UpdateCompanyPayload) {
    const token = localStorage.getItem("token");

    const res = await fetch(`${API_BASE}/fleet/company`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
    });

    if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to update company");
    }

    return res.json();
}

export const initializePayment = async (plan: string, amount: number) => {
    const token = localStorage.getItem("token");
    const response = await fetch(`${API_BASE}/payment/initialize`, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ plan, amount }),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to initialize payment");
    }

    return response.json();
};

export async function submitKYC() {
    const token = localStorage.getItem("token");

    const res = await fetch(`${API_BASE}/fleet/company/kyc`, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to submit KYC");
    }

    return res.json();
}
