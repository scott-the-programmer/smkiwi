import React from "react";
import { render, screen } from "@testing-library/react";
import BubbleSkillGraph from "./BubbleSkillGraph";
import "@testing-library/jest-dom/extend-expect";

describe("BubbleSkillGraph", () => {
  test("renders the correct number of circles and texts", () => {
    render(<BubbleSkillGraph />);

    const circles = document.querySelectorAll("circle");
    const texts = document.querySelectorAll("text");

    expect(circles.length).toBe(7);
    expect(texts.length).toBe(7);
  });

  test("renders the texts correctly", () => {
    render(<BubbleSkillGraph />);

    expect(screen.getByText("Terraform")).toBeInTheDocument();
    expect(screen.getByText("Pulumi")).toBeInTheDocument();
    expect(screen.getByText("Golang")).toBeInTheDocument();
    expect(screen.getByText("Typescript")).toBeInTheDocument();
    expect(screen.getByText("Python")).toBeInTheDocument();
    expect(screen.getByText("Flutter")).toBeInTheDocument();
  });
});
