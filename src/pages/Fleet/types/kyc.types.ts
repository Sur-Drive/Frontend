export interface CompanyDetails {
    companyName: string;
    industry: string;
    fleetName: string;
    region: string;
    operationsContact: string;
    companyPhone: string;
    briefDescription: string;
}

export interface PlanDetails {
    plan: "free" | "starter" | "pro" | "enterprise";
    numberOfVehicles: number;
}

export interface SubscriptionSummary {
    plan: string;
    vehicles: number;
    pricePerVehicle: number;
    totalCost: number;
}

export type KYCStep = "company" | "plan" | "fleet-size" | "summary";
