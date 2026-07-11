import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it } from "vitest";
import { OpportunityTypes } from "../../projects/domain/projectTypes";
import type { PortfolioItem } from "../domain/portfolioTypes";
import PortfolioGallery from "./PortfolioGallery";

afterEach(cleanup);

const item: PortfolioItem = {
  id: 10,
  jobSeekerId: 4,
  projectId: 22,
  projectTitle: "Booking dashboard",
  companyName: "Northstar Labs",
  opportunityType: OpportunityTypes.PaidProject,
  skills: [
    { id: 1, name: "React" },
    { id: 2, name: "TypeScript" },
  ],
  description: "Built the booking flow and documented the API integration.",
  projectUrl: "https://example.com/work",
  reviewRating: 5,
  reviewComment: "Clear delivery and thoughtful communication.",
};

describe("PortfolioGallery", () => {
  it("shows verified work context instead of internal record ids", () => {
    render(
      <MemoryRouter>
        <PortfolioGallery items={[item]} />
      </MemoryRouter>,
    );

    expect(screen.getByText("Booking dashboard")).toBeInTheDocument();
    expect(screen.getByText("Northstar Labs")).toBeInTheDocument();
    expect(screen.getByText("React")).toBeInTheDocument();
    expect(screen.getByText("5 / 5 company review")).toBeInTheDocument();
    expect(screen.queryByText("Portfolio ID")).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: /open work/i })).toHaveAttribute(
      "href",
      "/opportunities/22",
    );
  });

  it("shows a useful empty state", () => {
    render(
      <MemoryRouter>
        <PortfolioGallery items={[]} />
      </MemoryRouter>,
    );

    expect(screen.getByText("No portfolio proof yet")).toBeInTheDocument();
  });

  it("does not turn an invalid saved value into an internal app link", () => {
    render(
      <MemoryRouter>
        <PortfolioGallery items={[{ ...item, projectUrl: "ddwad" }]} />
      </MemoryRouter>,
    );

    expect(screen.getByText("ddwad")).toBeInTheDocument();
    expect(screen.getByText("Invalid URL")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /open work/i })).toHaveAttribute(
      "href",
      "/opportunities/22",
    );
  });
});
