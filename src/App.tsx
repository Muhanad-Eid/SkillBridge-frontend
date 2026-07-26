import { RouterProvider } from "react-router-dom";
import { AuthProvider } from "./shared/auth/AuthContext";
import AppErrorBoundary from "./shared/components/AppErrorBoundary";
import { ThemeProvider } from "./shared/theme/ThemeContext";
import { router } from "./app/router";

export default function App() {
  return (
    <ThemeProvider>
      <AppErrorBoundary>
        <AuthProvider>
          <RouterProvider router={router} />
        </AuthProvider>
      </AppErrorBoundary>
    </ThemeProvider>
  );
}
