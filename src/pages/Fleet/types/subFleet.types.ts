export interface SubFleetManager {
    id: string;
    userId: string;
    fleetCompanyId: string;
    subFleetId: string;
    role: "manager" | "admin";
    status: "active" | "pending" | "suspended";
    invitedAt: string;
    acceptedAt: string | null;
    lastActive: string | null;
    user: {
        id: string;
        firstName: string;
        lastName: string;
        email: string;
        phoneNumber: string;
    };
}

export interface SubFleet {
    id: string;
    fleetCompanyId: string;
    name: string;
    region: string;
    managerId: string | null;
    status: "active" | "suspended";
    vehicleCount: number;
    driverCount: number;
    createdAt: string;
    updatedAt: string;
    managers: SubFleetManager[];
}

export interface SubFleetStats {
    id: string;
    name: string;
    region: string;
    status: "active" | "suspended";
    vehicleCount: number;
    driverCount: number;
}

export interface CreateSubFleetPayload {
    name: string;
    region: string;
    managerId?: string;
}

export interface UpdateSubFleetPayload {
    name?: string;
    region?: string;
    managerId?: string;
}
