import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Card } from "./Card";
import type { Tool } from "../lib/types";

const submodule: Tool = {
  slug: "wheel",
  type: "submodule",
  path: "/wheel/",
  url: null,
  repo: "https://github.com/x/wheel",
  icon: null,
  i18n: { en: { title: "Spinning Wheel", description: "Random picker." } },
};

const external: Tool = {
  slug: "fastgoto",
  type: "external",
  path: null,
  url: "https://fastgoto.xyz",
  repo: "https://github.com/x/p",
  icon: null,
  i18n: { en: { title: "Fastgoto", description: "Quick launcher." } },
};

describe("Card", () => {
  it("renders title and description in given language", () => {
    render(<Card tool={submodule} lang="en" />);
    expect(screen.getByText("Spinning Wheel")).toBeInTheDocument();
    expect(screen.getByText("Random picker.")).toBeInTheDocument();
  });

  it("links to internal path for submodule tools", () => {
    render(<Card tool={submodule} lang="en" />);
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/wheel/");
    expect(link).not.toHaveAttribute("target");
  });

  it("opens external tools in new tab with safe rel", () => {
    render(<Card tool={external} lang="en" />);
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "https://fastgoto.xyz");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });
});
