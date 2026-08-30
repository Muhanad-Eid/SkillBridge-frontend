import { Suspense } from "react";
import { RouterProvider } from "react-router-dom";
import { AuthProvider } from "./shared/auth/AuthContext";
import AppErrorBoundary from "./shared/components/AppErrorBoundary";
import ApiAvailabilityBanner from "./shared/components/ApiAvailabilityBanner";
import ConfirmationProvider from "./shared/components/ConfirmationProvider";
import { ThemeProvider } from "./shared/theme/ThemeContext";
import { router } from "./app/router";

export default function App() {
  return (
    <ThemeProvider>
      <AppErrorBoundary>
        <ApiAvailabilityBanner />
        <ConfirmationProvider>
          <AuthProvider>
            <Suspense
              fallback={
                <div className="app-route-loader" role="status">
                  <span aria-hidden="true" />
                  <strong>Loading SkillBridge</strong>
                </div>
              }
            >
              <RouterProvider router={router} />
            </Suspense>
          </AuthProvider>
        </ConfirmationProvider>
      </AppErrorBoundary>
    </ThemeProvider>
  );
}
