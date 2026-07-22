import { Component, type ErrorInfo, type ReactNode } from "react";
import BrandIcon from "./BrandIcon";

type AppErrorBoundaryProps = {
  children: ReactNode;
};

type AppErrorBoundaryState = {
  hasError: boolean;
};

export default class AppErrorBoundary extends Component<
  AppErrorBoundaryProps,
  AppErrorBoundaryState
> {
  state: AppErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): AppErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("SkillBridge page error", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <main className="app-error-page" role="alert">
          <BrandIcon />
          <h1>Unable to display this page</h1>
          <button
            className="button button-primary"
            type="button"
            onClick={() => window.location.reload()}
          >
            Reload
          </button>
        </main>
      );
    }

    return this.props.children;
  }
}
