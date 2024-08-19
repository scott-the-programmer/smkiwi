import React from "react";
import { render, screen, act, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import GraphToggle from "./GraphToggle";

window.ResizeObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
};

describe("GraphToggle", () => {
  test("renders BubbleSkillGraph by default", () => {
    render(<GraphToggle />);
    expect(screen.getByTestId("bubble-skill-graph")).toBeInTheDocument();
  });

  test("renders SkillGraph when toggle is clicked", async () => {
    render(<GraphToggle />);
    const toggleElement = screen.getByTestId("react-toggle");

    act(() => {
      userEvent.click(toggleElement);
    });

    await waitFor(() => {
      expect(screen.getByTestId("skill-graph")).toBeInTheDocument();
    });
  });
});
