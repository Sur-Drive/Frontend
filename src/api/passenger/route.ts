// src/api/passenger/route.ts

export interface RouteCoordinates {
  lat: number;
  lng: number;
}

export interface IPlanRoutePayload {
  origin: RouteCoordinates;
  destination: RouteCoordinates;
}

export async function planRoute(
  payload: IPlanRoutePayload,
  accessToken: string,
): Promise<unknown> {
  const response = await fetch(
    "https://backend-production-01de.up.railway.app/route/plan",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(payload),
    },
  );

  if (!response.ok) {
    throw new Error(
      `Route planning failed (${response.status})`,
    );
  }

  return response.json();
}