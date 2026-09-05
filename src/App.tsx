import { Suspense } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from "react-router-dom";
import { AuthProvider } from "./shared/auth/AuthContext";
import AppErrorBoundary from "./shared/components/AppErrorBoundary";
import ApiAvailabilityBanner from "./shared/components/ApiAvailabilityBanner";
import ConfirmationProvider from "./shared/components/ConfirmationProvider";
import { ThemeProvider } from "./shared/theme/ThemeContext";
import { router } from "./app/router";
import { queryClient } from "./shared/api/queryClient";

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
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
    </QueryClientProvider>
  );
}
