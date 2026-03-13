import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import PrivacyPolicy from "@/app/privacy/page";

describe("Privacy Policy page", () => {
  it("renders without throwing", () => {
    render(<PrivacyPolicy />);
    expect(screen.getByRole("heading", { name: /privacy policy/i })).toBeInTheDocument();
  });

  it("discloses Vercel Web Analytics usage", () => {
    render(<PrivacyPolicy />);
    expect(screen.getByText("Vercel Web Analytics")).toBeInTheDocument();
  });

  it("describes cookie-free nature of analytics", () => {
    render(<PrivacyPolicy />);
    // 'cookie-free' appears in the <strong> in §3
    const instances = screen.getAllByText(/cookie-free/i);
    expect(instances.length).toBeGreaterThan(0);
  });

  it("discloses 24-hour data retention", () => {
    render(<PrivacyPolicy />);
    expect(screen.getByText(/24 hours/i)).toBeInTheDocument();
  });

  it("has a functioning contact email link", () => {
    render(<PrivacyPolicy />);
    const link = screen.getByRole("link", { name: /getfillright@gmail\.com/i });
    expect(link).toHaveAttribute("href", "mailto:getfillright@gmail.com");
  });

  it("has the short version summary heading", () => {
    render(<PrivacyPolicy />);
    expect(screen.getByRole("heading", { name: /the short version/i })).toBeInTheDocument();
  });

  it("has all nine numbered section headings", () => {
    render(<PrivacyPolicy />);
    expect(screen.getByRole("heading", { name: /what we collect/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /what we don.t collect/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /hosting/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /fonts/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /service worker/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /data sharing/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /children/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /changes to this policy/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /contact/i })).toBeInTheDocument();
  });

  it("has the main landmark with skip-nav target id", () => {
    render(<PrivacyPolicy />);
    expect(screen.getByRole("main")).toBeInTheDocument();
    expect(screen.getByRole("main")).toHaveAttribute("id", "main-content");
  });
});
