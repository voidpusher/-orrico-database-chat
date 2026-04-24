const API_BASE_URL = process.env.API_BASE_URL || "http://localhost:4000/api";

export interface ChatMessageResponse {
  reply: string;
  sql: string | null;
  rows: Record<string, unknown>[];
  mode: string;
}

export interface CsvImportResponse {
  databasePath: string;
  tableName: string;
  rowCount: number;
  columns: Array<{
    name: string;
    type: string;
  }>;
}

interface RequestOptions extends RequestInit {
  authenticated?: boolean;
}

async function request(path: string, options: RequestOptions = {}) {
  const headers = new Headers(options.headers || {});
  headers.set("Content-Type", "application/json");

  if (options.authenticated) {
    const token = localStorage.getItem("orrico_auth_token");

    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  if (response.status === 204) {
    return null;
  }

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Request failed.");
  }

  return data;
}

export const api = {
  health() {
    return request("/health");
  },
  signup(payload: Record<string, unknown>) {
    return request("/auth/signup", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
  login(payload: Record<string, unknown>) {
    return request("/auth/login", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
  googleLogin(payload: Record<string, unknown>) {
    return request("/auth/google", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
  session() {
    return request("/auth/session", { authenticated: true });
  },
  logout() {
    return request("/auth/logout", {
      method: "POST",
      authenticated: true,
    });
  },
  currentDatabaseConnection() {
    return request("/database/current", {
      authenticated: true,
    });
  },
  databaseSchema() {
    return request("/database/schema", {
      authenticated: true,
    });
  },
  saveDatabaseConnection(payload: Record<string, unknown>) {
    return request("/database/connect", {
      method: "POST",
      authenticated: true,
      body: JSON.stringify(payload),
    });
  },
  importCsvDataset(payload: {
    csvContent: string;
    fileName: string;
    tableName?: string;
  }): Promise<CsvImportResponse> {
    return request("/database/import-csv", {
      method: "POST",
      authenticated: true,
      body: JSON.stringify(payload),
    }) as Promise<CsvImportResponse>;
  },
  sendChatMessage(message: string): Promise<ChatMessageResponse> {
    return request("/chat/message", {
      method: "POST",
      authenticated: true,
      body: JSON.stringify({ message }),
    }) as Promise<ChatMessageResponse>;
  },
};
