import { RouterProvider } from "react-router-dom";
import { AuthProvider } from "./shared/auth/AuthContext";
import AppErrorBoundary from "./shared/components/AppErrorBoundary";
import { router } from "./app/router";

export default function App() {
  return (
    <AppErrorBoundary>
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>
    </AppErrorBoundary>
  );
}
