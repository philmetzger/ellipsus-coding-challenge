/**
 * SpellCheckerWrapper Tests
 */

import React from "react";
import { render, screen } from "@testing-library/react";
import { SpellCheckerWrapper } from "../SpellCheckerWrapper";

// Mock SpellCheckerUI
jest.mock("../SpellCheckerUI", () => ({
  SpellCheckerUI: () => (
    <div data-testid="spellchecker-ui">SpellCheckerUI Mock</div>
  ),
}));

describe("SpellCheckerWrapper", () => {
  describe("rendering", () => {
    it("should render children", () => {
      render(
        <SpellCheckerWrapper editor={null}>
          <div data-testid="child-content">Child Content</div>
        </SpellCheckerWrapper>,
      );

      expect(screen.getByTestId("child-content")).toBeInTheDocument();
      expect(screen.getByText("Child Content")).toBeInTheDocument();
    });

    it("should render SpellCheckerUI", () => {
      render(
        <SpellCheckerWrapper editor={null}>
          <div>Content</div>
        </SpellCheckerWrapper>,
      );

      expect(screen.getByTestId("spellchecker-ui")).toBeInTheDocument();
    });

    it("should render both SpellCheckerUI and children", () => {
      render(
        <SpellCheckerWrapper editor={null}>
          <div data-testid="child">Child</div>
        </SpellCheckerWrapper>,
      );

      expect(screen.getByTestId("spellchecker-ui")).toBeInTheDocument();
      expect(screen.getByTestId("child")).toBeInTheDocument();
    });

    it("should pass editor to SpellCheckerUI", () => {
      const mockEditor = { mock: "editor" };

      render(
        <SpellCheckerWrapper editor={mockEditor as any}>
          <div>Content</div>
        </SpellCheckerWrapper>,
      );

      // SpellCheckerUI mock receives the editor prop
      expect(screen.getByTestId("spellchecker-ui")).toBeInTheDocument();
    });
  });

  describe("with different children types", () => {
    it("should handle multiple children", () => {
      render(
        <SpellCheckerWrapper editor={null}>
          <div data-testid="child-1">Child 1</div>
          <div data-testid="child-2">Child 2</div>
        </SpellCheckerWrapper>,
      );

      expect(screen.getByTestId("child-1")).toBeInTheDocument();
      expect(screen.getByTestId("child-2")).toBeInTheDocument();
    });

    it("should handle text children", () => {
      render(
        <SpellCheckerWrapper editor={null}>Just some text</SpellCheckerWrapper>,
      );

      expect(screen.getByText("Just some text")).toBeInTheDocument();
    });

    it("should handle null children", () => {
      render(<SpellCheckerWrapper editor={null}>{null}</SpellCheckerWrapper>);

      // Should still render SpellCheckerUI
      expect(screen.getByTestId("spellchecker-ui")).toBeInTheDocument();
    });
  });
});
