import { render, screen } from "@testing-library/react";
import Timeline from "./Timeline";
import "@testing-library/jest-dom/extend-expect";

describe("Timeline", () => {
  test("renders correctly", () => {
    render(<Timeline />);
    expect(screen.getByText("Lightspeed")).toBeInTheDocument();
  });

  test("loads employment images", () => {
    render(<Timeline />);
    const image = screen.getByAltText("Lightspeed");
    expect(image).toBeInTheDocument();
    expect(image).toHaveAttribute("src", "timeline/lightspeed.jpeg");
  });

  test("renders text contents correctly", () => {
    render(<Timeline />);
    expect(
      screen.getByText(
        "Created terraform-provider-minikube (Terraform Provider for Minikube)",
      ),
    ).toBeInTheDocument();
    expect(screen.getByText("Jun 2022 - Oct 2022")).toBeInTheDocument();
  });
});
