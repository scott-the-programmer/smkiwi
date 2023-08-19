import React from "react";
import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import Navbar from "./Navbar";
import "@testing-library/jest-dom/extend-expect";

describe("Navbar", () => {
  test("renders Home and Blog links by default", () => {
    render(<Navbar />, { wrapper: MemoryRouter });
    expect(screen.getByTestId("NonMobileHome")).toBeInTheDocument();
    expect(screen.getByTestId("NonMobileBlog")).toBeInTheDocument();
  });

  test("mobile menu is closed initially", () => {
    render(<Navbar />, { wrapper: MemoryRouter });
    const mobileMenu = screen.getByTestId("MobileMenu");
    expect(mobileMenu).toHaveClass("-translate-x-full");
  });

  test("opens mobile menu when clicked", () => {
    render(<Navbar />, { wrapper: MemoryRouter });
    const mobileMenuButton = screen.getByTestId("MobileMenuButton");
    act(() => {
      userEvent.click(mobileMenuButton);
    });
    const mobileMenu = screen.getByTestId("MobileMenu");
    expect(mobileMenu).toHaveClass("translate-x-0");
  });

  test("closes mobile menu when link clicked", () => {
    render(<Navbar />, { wrapper: MemoryRouter });
    const mobileMenuButton = screen.getByTestId("MobileMenuButton");
    act(() => {
      userEvent.click(mobileMenuButton);
    });
    const mobileMenuLink = screen.getByTestId("MobileHome");
    act(() => {
      userEvent.click(mobileMenuLink);
    });
    const mobileMenu = screen.getByTestId("MobileMenu");
    expect(mobileMenu).toHaveClass("-translate-x-full");
  });
});
