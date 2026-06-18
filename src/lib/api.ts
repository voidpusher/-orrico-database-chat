import {
  safeJsonParse,
  safeStorageGet,
  safeStorageRemove,
  safeStorageSet,
} from "./storage";

const DEFAULT_API_BASE_URL =
  typeof window !== "undefined" &&
  !["localhost", "127.0.0.1"].includes(window.location.hostname)
    ? "/api"
    : "http://localhost:4000/api";

const runtimeEnv =
  typeof globalThis !== "undefined" &&
  "process" in globalThis &&
  typeof globalThis.process === "object" &&
  globalThis.process &&
  "env" in globalThis.process
    ? (globalThis.process.env as Record<string, string | undefined>)
    : {};

const API_BASE_URL = runtimeEnv.API_BASE_URL || DEFAULT_API_BASE_URL;
const DEMO_EMAIL = "demo@orrico.com";
const DEMO_PASSWORD = "demo123";
const LOCAL_DEMO_TOKEN = "local-demo-session";
const LOCAL_DB_CONNECTION_KEY = "orrico_db_connection";

export interface ChatMessageResponse {
  reply: string;
  sql: string | null;
  rows: Record<string, unknown>[];
  mode: string;
}

export interface StoredChatHistoryItem {
  id: string;
  userId: string;
  message: string;
  reply: string;
  mode: string;
  createdAt: string;
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

export interface StoredDatabaseConnection {
  databaseType: string;
  host?: string;
  port?: string;
  databaseName?: string;
  username?: string;
  filePath?: string;
  isDemoConnection?: boolean;
  connectedAt?: string;
  updatedAt?: string;
  hasPassword?: boolean;
}

interface RequestOptions extends RequestInit {
  authenticated?: boolean;
}

function getDemoUser() {
  return {
    id: "demo-user",
    firstName: "Demo",
    lastName: "User",
    email: DEMO_EMAIL,
    businessName: "Demo Retail Store",
    authProvider: "demo",
    createdAt: new Date().toISOString(),
  };
}

function normalizeMessage(message: string) {
  return message.toLowerCase().replace(/[^\w\s]/g, " ").trim();
}

function buildLocalChatReply(message: string) {
  const normalizedMessage = normalizeMessage(message);

  if (
    normalizedMessage.includes("sales yesterday") ||
    normalizedMessage.includes("yesterday sales")
  ) {
    return "Yesterday your store closed at Rs 2,84,750 across 43 orders. Mobile accessories and power banks led the strongest movement.";
  }

  if (
    normalizedMessage.includes("top product") ||
    normalizedMessage.includes("best product")
  ) {
    return "Your top movers right now are Xiaomi Power Bank 20000mAh, Realme Buds Air 3, Logitech K380 Keyboard, Samsung Galaxy A34 5G, and Samsung 43-inch Smart TV.";
  }

  if (
    normalizedMessage.includes("inventory") ||
    normalizedMessage.includes("stock") ||
    normalizedMessage.includes("low stock")
  ) {
    return "Inventory is mostly healthy, but Lenovo IdeaPad Slim 3, Samsung 43-inch Smart TV, HP LaserJet M126nw, and Samsung Galaxy A34 5G are getting low.";
  }

  if (
    normalizedMessage.includes("profit") ||
    normalizedMessage.includes("margin")
  ) {
    return "Your current gross margin is about 32.8%. Accessories are the strongest margin driver, while premium hardware remains important for revenue.";
  }

  if (
    normalizedMessage.includes("customer") ||
    normalizedMessage.includes("repeat buyer")
  ) {
    return "Your strongest customer segment is repeat buyers. Amit Kumar is the top individual customer this month, and repeat customers are driving more than half of revenue.";
  }

  return "I can help with sales, products, inventory, customers, and margins. Ask me something direct about your store and I'll keep the answer sharp.";
}

function getStoredCurrentUser() {
  const storedUser = safeStorageGet("orrico_current_user");
  return safeJsonParse(storedUser, null);
}

function isDemoSession() {
  const token = safeStorageGet("orrico_auth_token");
  const user = getStoredCurrentUser() as
    | { authProvider?: string; email?: string }
    | null;

  return (
    token === LOCAL_DEMO_TOKEN ||
    user?.authProvider === "demo" ||
    user?.email === DEMO_EMAIL
  );
}

export interface DashboardMetricResponse {
  title: string;
  value: string;
  change: string;
  positive: boolean;
  key: string;
}

export interface DashboardSeriesPoint {
  date: string;
  revenue: number;
  orders: number;
}

export interface DashboardCategoryPoint {
  name: string;
  value: number;
  revenue: number;
  color: string;
}

export interface DashboardProductRow {
  id: string;
  name: string;
  category: string;
  price: number;
  sold: number;
  revenue: number;
  stock: number;
}

export interface DashboardCustomerRow {
  id: string;
  name: string;
  email: string;
  phone: string;
  orders: number;
  totalSpent: number;
  lastOrder: string;
}

export interface DashboardOrderRow {
  id: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  productId: string;
  productName: string;
  quantity: number;
  total: number;
  date: string;
}

export interface DashboardCustomersResponse {
  available: boolean;
  reason?: string;
  schema?: string[];
  customers?: DashboardCustomerRow[];
}

export interface DashboardSummaryResponse {
  available: boolean;
  reason?: string;
  schema?: string[];
  metrics?: DashboardMetricResponse[];
  salesData?: DashboardSeriesPoint[];
  categoryData?: DashboardCategoryPoint[];
  topProducts?: DashboardProductRow[];
  recentCustomers?: DashboardCustomerRow[];
}

export interface DashboardInventoryResponse {
  availableProducts: number;
  lowStockItems: number;
  totalStockValue: number;
  products: DashboardProductRow[];
}

export interface DashboardDetailsResponse {
  available: boolean;
  reason?: string;
  schema?: string[];
  products?: DashboardProductRow[];
  customers?: DashboardCustomerRow[];
  inventory?: DashboardInventoryResponse;
}

export interface DashboardOrdersResponse {
  available: boolean;
  reason?: string;
  schema?: string[];
  orders?: DashboardOrderRow[];
}

export interface CreateDashboardProductPayload {
  name: string;
  category: string;
  price: number;
  stock: number;
  costPrice?: number;
}

export interface UpdateDashboardProductPayload {
  name: string;
  category: string;
  price: number;
  stock: number;
  costPrice?: number;
}

export interface CreateDashboardOrderPayload {
  productId: string;
  quantity: number;
  customerId?: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  paymentMethod?: string;
}

export interface DatabaseConnectionTestResponse {
  ok: boolean;
  databasePath: string;
  tableCount: number;
}

function getStoredDatabaseConnection() {
  const storedConnection = safeStorageGet(LOCAL_DB_CONNECTION_KEY);
  return safeJsonParse(storedConnection, null);
}

function clearStoredSession() {
  safeStorageRemove("orrico_auth_token");
  safeStorageRemove("orrico_current_user");
}

async function request(path: string, options: RequestOptions = {}) {
  const headers = new Headers(options.headers || {});
  headers.set("Content-Type", "application/json");

  if (options.authenticated) {
    const token = safeStorageGet("orrico_auth_token");

    if (token && token !== LOCAL_DEMO_TOKEN) {
      headers.set("Authorization", `Bearer ${token}`);
    }
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    credentials: "include",
    headers,
  });

  if (response.status === 204) {
    return null;
  }

  const contentType = response.headers.get("content-type") || "";
  const data = contentType.includes("application/json")
    ? await response.json()
    : { error: "Request failed." };

  if (!response.ok) {
    if (response.status === 401 && options.authenticated) {
      clearStoredSession();
    }

    const error = new Error(data.error || "Request failed.");
    Object.assign(error, {
      status: response.status,
      details: data,
    });
    throw error;
  }

  return data;
}

export interface BillingPlan {
  key: string;
  name: string;
  priceMonthly: number;
  features: string[];
  monthlyMessages: number | null;
  dbConnections: number | null;
}

export interface BillingStatusResponse {
  stripeEnabled: boolean;
  plan: { key: string; name: string; priceMonthly: number; features: string[] };
  usage: { messagesThisMonth: number; messagesLimit: number | null; dbConnectionsLimit: number | null };
  subscription: { customerId: string | null; subscriptionId: string | null; status: string };
  plans: BillingPlan[];
}

export const api = {
  health() {
    return request("/health").catch(() => ({
      status: "ok",
      mode: "local-demo",
    }));
  },
  signup(payload: Record<string, unknown>) {
    return request("/auth/signup", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
  requestEmailVerification(email: string) {
    return request("/auth/verify-email/request", {
      method: "POST",
      body: JSON.stringify({ email }),
    }) as Promise<{
      ok: boolean;
      message: string;
      verificationToken?: string;
    }>;
  },
  confirmEmailVerification(email: string, token: string) {
    return request("/auth/verify-email/confirm", {
      method: "POST",
      body: JSON.stringify({ email, token }),
    }) as Promise<{
      token: string;
      user: Record<string, unknown>;
    }>;
  },
  requestPasswordReset(email: string) {
    return request("/auth/password-reset/request", {
      method: "POST",
      body: JSON.stringify({ email }),
    }) as Promise<{
      ok: boolean;
      message: string;
      resetToken?: string;
    }>;
  },
  confirmPasswordReset(
    email: string,
    token: string,
    password: string,
  ) {
    return request("/auth/password-reset/confirm", {
      method: "POST",
      body: JSON.stringify({ email, token, password }),
    }) as Promise<{
      ok: boolean;
      message: string;
    }>;
  },
  async login(payload: Record<string, unknown>) {
    try {
      return await request("/auth/login", {
        method: "POST",
        body: JSON.stringify(payload),
      });
    } catch (error) {
      const normalizedEmail = String(payload.email || "")
        .trim()
        .toLowerCase();
      const password = String(payload.password || "");

      if (normalizedEmail === DEMO_EMAIL && password === DEMO_PASSWORD) {
        const user = getDemoUser();
        safeStorageSet("orrico_auth_token", LOCAL_DEMO_TOKEN);
        safeStorageSet("orrico_current_user", JSON.stringify(user));

        return {
          token: LOCAL_DEMO_TOKEN,
          user,
        };
      }

      throw error;
    }
  },
  async session() {
    try {
      return await request("/auth/session", { authenticated: true });
    } catch (error) {
      const token = safeStorageGet("orrico_auth_token");
      const user = getStoredCurrentUser();

      if (token === LOCAL_DEMO_TOKEN && user) {
        return { user };
      }

      throw error;
    }
  },
  async logout() {
    try {
      return await request("/auth/logout", {
        method: "POST",
        authenticated: true,
      });
    } catch {
      return null;
    }
  },
  async currentDatabaseConnection(): Promise<{
    connection: StoredDatabaseConnection | null;
  }> {
    try {
      return await request("/database/current", {
        authenticated: true,
      });
    } catch {
      if (!isDemoSession()) {
        throw new Error(
          "Shop setup could not be loaded. Sign in again or check the backend connection.",
        );
      }

      return {
        connection: getStoredDatabaseConnection(),
      };
    }
  },
  async databaseSchema() {
    try {
      return await request("/database/schema", {
        authenticated: true,
      });
    } catch {
      if (!isDemoSession()) {
        throw new Error(
          "Database schema is not available until your shop is connected.",
        );
      }

      const localConnection = getStoredDatabaseConnection();

      return {
        databasePath: "local-demo-mode",
        schema: localConnection
          ? [
              {
                table: localConnection.databaseName || "demo_data",
                columns: [],
              },
            ]
          : [],
      };
    }
  },
  async saveDatabaseConnection(payload: Record<string, unknown>) {
    try {
      return await request("/database/connect", {
        method: "POST",
        authenticated: true,
        body: JSON.stringify(payload),
      });
    } catch {
      if (!isDemoSession()) {
        throw new Error(
          "Database connection could not be saved. Check the backend and try again.",
        );
      }

      const connection = {
        ...payload,
        updatedAt: new Date().toISOString(),
      };
      safeStorageSet(
        LOCAL_DB_CONNECTION_KEY,
        JSON.stringify(connection),
      );

      return { connection };
    }
  },
  testDatabaseConnection(
    payload: Record<string, unknown>,
  ): Promise<DatabaseConnectionTestResponse> {
    return request("/database/test", {
      method: "POST",
      authenticated: true,
      body: JSON.stringify(payload),
    }) as Promise<DatabaseConnectionTestResponse>;
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
  async sendChatMessage(message: string): Promise<ChatMessageResponse> {
    try {
      return (await request("/chat/message", {
        method: "POST",
        authenticated: true,
        body: JSON.stringify({ message }),
      })) as ChatMessageResponse;
    } catch {
      if (!isDemoSession()) {
        throw new Error(
          "Finish your shop setup before using chat.",
        );
      }

      return {
        reply: buildLocalChatReply(message),
        sql: null,
        rows: [],
        mode: "local-demo",
      };
    }
  },
  chatHistory(): Promise<{ messages: StoredChatHistoryItem[] }> {
    return request("/chat/history", {
      authenticated: true,
    }) as Promise<{ messages: StoredChatHistoryItem[] }>;
  },
  dashboardSummary(): Promise<DashboardSummaryResponse> {
    return request("/dashboard/summary", {
      authenticated: true,
    }) as Promise<DashboardSummaryResponse>;
  },
  dashboardDetails(): Promise<DashboardDetailsResponse> {
    return request("/dashboard/details", {
      authenticated: true,
    }) as Promise<DashboardDetailsResponse>;
  },
  dashboardOrders(limit = 50): Promise<DashboardOrdersResponse> {
    return request(`/dashboard/orders?limit=${limit}`, {
      authenticated: true,
    }) as Promise<DashboardOrdersResponse>;
  },
  dashboardCustomers(): Promise<DashboardCustomersResponse> {
    return request("/dashboard/customers", {
      authenticated: true,
    }) as Promise<DashboardCustomersResponse>;
  },
  createDashboardProduct(payload: CreateDashboardProductPayload) {
    return request("/dashboard/products", {
      method: "POST",
      authenticated: true,
      body: JSON.stringify(payload),
    }) as Promise<{ product: DashboardProductRow }>;
  },
  updateDashboardProduct(
    productId: string,
    payload: UpdateDashboardProductPayload,
  ) {
    return request(`/dashboard/products/${productId}`, {
      method: "PATCH",
      authenticated: true,
      body: JSON.stringify(payload),
    }) as Promise<{
      product: Pick<
        DashboardProductRow,
        "id" | "name" | "category" | "price" | "stock"
      > & { costPrice?: number };
    }>;
  },
  updateDashboardProductStock(productId: string, stock: number) {
    return request(`/dashboard/products/${productId}/stock`, {
      method: "PATCH",
      authenticated: true,
      body: JSON.stringify({ stock }),
    }) as Promise<{
      product: Pick<DashboardProductRow, "id" | "name" | "category" | "price" | "stock">;
    }>;
  },
  deleteDashboardProduct(productId: string) {
    return request(`/dashboard/products/${productId}`, {
      method: "DELETE",
      authenticated: true,
    }) as Promise<{
      product: {
        id: string;
        name: string;
      };
    }>;
  },
  updateDashboardCustomer(
    customerId: string,
    payload: {
      name: string;
      email: string;
      phone?: string;
    },
  ) {
    return request(`/dashboard/customers/${customerId}`, {
      method: "PATCH",
      authenticated: true,
      body: JSON.stringify(payload),
    }) as Promise<{
      customer: Pick<
        DashboardCustomerRow,
        "id" | "name" | "email" | "phone"
      >;
    }>;
  },
  deleteDashboardCustomer(customerId: string) {
    return request(`/dashboard/customers/${customerId}`, {
      method: "DELETE",
      authenticated: true,
    }) as Promise<{
      customer: {
        id: string;
        name: string;
      };
    }>;
  },
  billingStatus(): Promise<BillingStatusResponse> {
    return request("/billing/status", { authenticated: true }) as Promise<BillingStatusResponse>;
  },
  billingCheckout(planKey: string): Promise<{ url: string }> {
    return request("/billing/checkout", {
      method: "POST",
      authenticated: true,
      body: JSON.stringify({ planKey }),
    }) as Promise<{ url: string }>;
  },
  billingPortal(): Promise<{ url: string }> {
    return request("/billing/portal", {
      method: "POST",
      authenticated: true,
    }) as Promise<{ url: string }>;
  },
  createDashboardOrder(payload: CreateDashboardOrderPayload) {
    return request("/dashboard/orders", {
      method: "POST",
      authenticated: true,
      body: JSON.stringify(payload),
    }) as Promise<{
      order: {
        id: string;
        customerId: string;
        customerName: string;
        customerEmail: string;
        customerPhone: string;
        productId: string;
        productName: string;
        quantity: number;
        total: number;
        date: string;
      };
      customer: {
        id: string;
        name: string;
        email: string;
        phone: string;
      };
    }>;
  },
};
