const API_CONFIG = {
  // Vercel에서 EC2 Backend로 연결 (환경 변수 사용)
  BASE_URL: process.env.REACT_APP_API_URL || "",

  WS_URL: process.env.REACT_APP_WS_URL || "/api/ws",

  ENDPOINTS: {
    AUTH: {
      LOGIN: "/api/auth/login",
      LOGOUT: "/api/auth/logout",
      VERIFY: "/api/auth/verify",
    },
    AI: {
      QUESTIONS: "/api/ai/questions",
      RECOMMENDATIONS: "/api/ai/recommendations",
    },
    CUSTOMER: {
      LIST: "/api/customers",
      DETAIL: "/api/customers",
      CREATE: "/api/customers",
    },
    PRODUCT: {
      LIST: "/api/products",
      DETAIL: "/api/products",
      RECOMMENDATIONS: "/api/products/recommendations",
    },
    SIGNATURE: {
      SUBMIT: "/api/signature/submit",
    },
    SIMULATION: {
      BENEFITS: "/api/simulation/benefits",
    },
  },
};

// API URL 생성 헬퍼 함수
export const getApiUrl = (endpoint) => {
  return `${API_CONFIG.BASE_URL}${endpoint}`;
};

// WebSocket URL
export const getWebSocketUrl = () => {
  const raw = API_CONFIG.WS_URL || "/api/ws";
  if (raw.startsWith("ws://")) return raw.replace(/^ws:\/\//, "http://");
  if (raw.startsWith("wss://")) return raw.replace(/^wss:\/\//, "https://");
  try {
    if (typeof window !== "undefined") {
      const isDevLocal = window.location.origin.includes("localhost:3000");
      if (isDevLocal) return "/api/ws";
    }
  } catch (_) {}
  return raw; 
};

export { API_CONFIG };
export const BASE_URL = API_CONFIG.BASE_URL;
export default API_CONFIG;
