import { useState, useEffect } from "react";
import { LandingPage } from "./components/LandingPage";
import { AuthPage } from "./components/AuthPage";
import { SupportPage } from "./components/SupportPage";
import { ChatPage } from "./components/ChatPage";
import { DashboardPage } from "./components/DashboardPage";
import { DatabaseConnectionPage } from "./components/DatabaseConnectionPage";
import { Toaster } from "./components/ui/sonner";
import { ThemeProvider } from "./components/ThemeProvider";
import { api } from "./lib/api";
import {
  safeStorageGet,
  safeStorageRemove,
  safeStorageSet,
} from "./lib/storage";

type Page =
  | "landing"
  | "auth"
  | "support"
  | "chat"
  | "dashboard"
  | "database";

export default function App() {
  const [currentPage, setCurrentPage] =
    useState<Page>("landing");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [authContext, setAuthContext] = useState<{
    mode?: "verify" | "reset";
    email?: string;
    token?: string;
  }>({});

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const authMode = params.get("auth");
    const email = params.get("email") || "";
    const token = params.get("token") || "";

    if (authMode === "verify" || authMode === "reset") {
      setAuthContext({
        mode: authMode,
        email,
        token,
      });
      setCurrentPage("auth");
    }

    const authToken = safeStorageGet("orrico_auth_token");

    if (!authToken) {
      return;
    }

    api
      .session()
      .then((session) => {
        const lastPage = safeStorageGet("orrico_last_page");
        safeStorageSet(
          "orrico_current_user",
          JSON.stringify(session.user),
        );
        setIsLoggedIn(true);
        setCurrentPage(
          lastPage === "chat" ||
            lastPage === "dashboard" ||
            lastPage === "database"
            ? lastPage
            : "database",
        );
      })
      .catch(() => {
        safeStorageRemove("orrico_auth_token");
        safeStorageRemove("orrico_current_user");
      });
  }, []);

  const handleLogin = () => {
    setIsLoggedIn(true);
    setCurrentPage("database");
  };

  const handleLogout = () => {
    api.logout().catch(() => undefined);
    safeStorageRemove("orrico_auth_token");
    safeStorageRemove("orrico_current_user");
    safeStorageRemove("orrico_last_page");
    safeStorageRemove("orrico_db_connection");
    setIsLoggedIn(false);
    setCurrentPage("landing");
  };

  const handleDatabaseConnectionComplete = () => {
    setCurrentPage("chat");
  };

  return (
    <ThemeProvider>
      <div className="min-h-screen bg-background">
        {currentPage === "landing" && (
          <LandingPage
            onNavigateToAuth={() => setCurrentPage("auth")}
            onNavigateToSupport={() =>
              setCurrentPage("support")
            }
          />
        )}
        {currentPage === "auth" && (
          <AuthPage
            initialMode={authContext.mode}
            initialEmail={authContext.email}
            initialToken={authContext.token}
            onBackToHome={() => setCurrentPage("landing")}
            onNavigateToSupport={() =>
              setCurrentPage("support")
            }
            onLogin={handleLogin}
          />
        )}
        {currentPage === "support" && (
          <SupportPage
            onBackToHome={() => setCurrentPage("landing")}
            onNavigateToAuth={() => setCurrentPage("auth")}
          />
        )}
        {currentPage === "database" && isLoggedIn && (
          <DatabaseConnectionPage
            onComplete={handleDatabaseConnectionComplete}
            onLogout={handleLogout}
          />
        )}
        {currentPage === "chat" && isLoggedIn && (
          <ChatPage
            onLogout={handleLogout}
            onNavigateToSupport={() =>
              setCurrentPage("support")
            }
            onNavigateToDashboard={() => {
              safeStorageSet(
                "orrico_last_page",
                "dashboard",
              );
              setCurrentPage("dashboard");
            }}
            onNavigateToLanding={() =>
              setCurrentPage("landing")
            }
          />
        )}
        {currentPage === "dashboard" && isLoggedIn && (
          <DashboardPage
            onLogout={handleLogout}
            onNavigateToSupport={() =>
              setCurrentPage("support")
            }
            onNavigateToChat={() => {
              safeStorageSet("orrico_last_page", "chat");
              setCurrentPage("chat");
            }}
            onNavigateToLanding={() =>
              setCurrentPage("landing")
            }
          />
        )}
        <Toaster />
      </div>
    </ThemeProvider>
  );
}
