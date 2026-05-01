import axios from "axios";
import { getIdToken } from "./firebase";

const BASE_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:8080";

const apiClient = axios.create({ baseURL: BASE_URL });

// Attach Bearer token to every request
apiClient.interceptors.request.use(async (config) => {
  try {
    const token = await getIdToken();
    config.headers.Authorization = `Bearer ${token}`;
  } catch (e) {
    console.warn("Could not fetch Firebase token:", e.message);
  }
  return config;
});

/**
 * POST /evaluate
 */
export async function evaluate(payload) {
  const { data } = await apiClient.post("/evaluate", payload);
  return data;
}

/**
 * GET /polling-booth
 */
export async function getPollingBooth(state, city) {
  const { data } = await apiClient.get("/polling-booth", {
    params: { state, city },
  });
  return data;
}
