import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import Button from "./Button";

describe("Button", () => {
  it("disables submission and shows progress while loading", () => {
    render(<Button isLoading>Save profile</Button>);

    const button = screen.getByRole("button", { name: "Please wait..." });
    expect(button).toBeDisabled();
  });

  it("renders navigation actions as links", () => {
    render(
      <MemoryRouter>
        <Button to="/login">Log in</Button>
      </MemoryRouter>,
    );

    expect(screen.getByRole("link", { name: "Log in" })).toHaveAttribute(
      "href",
      "/login",
    );
  });
});
