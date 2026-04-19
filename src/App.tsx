import { useState, useEffect } from "react";
import { LandingPage } from "./components/LandingPage";
import { AuthPage } from "./components/AuthPage";
import { SupportPage } from "./components/SupportPage";
import { ChatPage } from "./components/ChatPage";
import { DashboardPage } from "./components/DashboardPage";
import { DatabaseConnectionPage } from "./components/DatabaseConnectionPage";
import { Toaster } from "./components/ui/sonner";
import { ThemeProvider } from "./components/ThemeProvider";

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

  // Check for existing authentication on startup
  useEffect(() => {
    const authToken = localStorage.getItem("orrico_auth_token");
    const currentUser = localStorage.getItem(
      "orrico_current_user",
    );

    if (authToken && currentUser) {
      setIsLoggedIn(true);
      // Keep user on landing page even if logged in
      // They can navigate to chat/dashboard from the header
    }
  }, []);

  const handleLogin = () => {
    setIsLoggedIn(true);
    // Always show database connection page first after login
    // Users can skip if they've already connected
    setCurrentPage("database");
  };

  const handleLogout = () => {
    // Clear authentication data
    localStorage.removeItem("orrico_auth_token");
    localStorage.removeItem("orrico_current_user");
    localStorage.removeItem("orrico_last_page");
    localStorage.removeItem("orrico_db_connection");
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
              localStorage.setItem(
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
              localStorage.setItem("orrico_last_page", "chat");
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