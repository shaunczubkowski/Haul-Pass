import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ThemeToggle } from "../ThemeToggle";

const mockSetTheme = vi.fn();
let mockResolvedTheme: string | undefined = "light";

vi.mock("next-themes", () => ({
  useTheme: () => ({
    resolvedTheme: mockResolvedTheme,
    setTheme: mockSetTheme,
  }),
}));

describe("ThemeToggle", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockResolvedTheme = "light";
  });

  it("renders a button", () => {
    render(<ThemeToggle />);
    expect(screen.getByRole("button")).toBeTruthy();
  });

  it("has accessible label to switch to dark when in light mode", () => {
    mockResolvedTheme = "light";
    render(<ThemeToggle />);
    expect(screen.getByRole("button")).toHaveAttribute(
      "aria-label",
      "Switch to dark theme"
    );
  });

  it("has accessible label to switch to light when in dark mode", () => {
    mockResolvedTheme = "dark";
    render(<ThemeToggle />);
    expect(screen.getByRole("button")).toHaveAttribute(
      "aria-label",
      "Switch to light theme"
    );
  });

  it("calls setTheme with 'dark' when in light mode", () => {
    mockResolvedTheme = "light";
    render(<ThemeToggle />);
    fireEvent.click(screen.getByRole("button"));
    expect(mockSetTheme).toHaveBeenCalledWith("dark");
  });

  it("calls setTheme with 'light' when in dark mode", () => {
    mockResolvedTheme = "dark";
    render(<ThemeToggle />);
    fireEvent.click(screen.getByRole("button"));
    expect(mockSetTheme).toHaveBeenCalledWith("light");
  });
});
