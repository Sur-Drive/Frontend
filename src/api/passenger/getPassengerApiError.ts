export function getPassengerApiError(
  error: unknown,
  fallback = "Something went wrong. Please try again.",
): string {
  if (
    error instanceof Error &&
    error.message.trim()
  ) {
    return error.message;
  }

  if (
    error &&
    typeof error === "object"
  ) {
    const record =
      error as Record<
        string,
        unknown
      >;

    if (
      typeof record.message ===
        "string" &&
      record.message.trim()
    ) {
      return record.message;
    }

    const response =
      record.response;

    if (
      response &&
      typeof response === "object"
    ) {
      const responseRecord =
        response as Record<
          string,
          unknown
        >;

      const data =
        responseRecord.data;

      if (
        data &&
        typeof data === "object"
      ) {
        const dataRecord =
          data as Record<
            string,
            unknown
          >;

        if (
          typeof dataRecord.message ===
            "string" &&
          dataRecord.message.trim()
        ) {
          return dataRecord.message;
        }

        if (
          typeof dataRecord.error ===
            "string" &&
          dataRecord.error.trim()
        ) {
          return dataRecord.error;
        }
      }
    }
  }

  return fallback;
}