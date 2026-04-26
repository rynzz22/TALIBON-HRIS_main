export interface ApiEnvelope<T> {
  success: boolean;
  timestamp: string;
  message: string;
  data: T;
}

export const wrap = <T>(data: T, message = "Success"): ApiEnvelope<T> => ({
  success: true,
  timestamp: new Date().toISOString(),
  message,
  data,
});
