/**
 * SpellCheckerControls Tests
 */

import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { SpellCheckerControls } from "../SpellCheckerControls";

describe("SpellCheckerControls", () => {
  const defaultProps = {
    value: "en" as const,
    onChange: jest.fn(),
    isLoading: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("rendering", () => {
    it("should render dropdown with current value", () => {
      render(<SpellCheckerControls {...defaultProps} />);

      expect(screen.getByText("Spellchecker")).toBeInTheDocument();
      expect(screen.getByText("English")).toBeInTheDocument();
    });

    it('should render "Off" when value is off', () => {
      render(<SpellCheckerControls {...defaultProps} value="off" />);

      expect(screen.getByText("Off")).toBeInTheDocument();
    });

    it('should render "German" when value is de', () => {
      render(<SpellCheckerControls {...defaultProps} value="de" />);

      expect(screen.getByText("German")).toBeInTheDocument();
    });
  });

  describe("dropdown interaction", () => {
    it("should open dropdown on click", () => {
      render(<SpellCheckerControls {...defaultProps} />);

      const button = screen.getByRole("button");
      fireEvent.click(button);

      // Should show all options
      expect(screen.getAllByText("Spellchecker").length).toBeGreaterThan(1);
      expect(screen.getByText("Off")).toBeInTheDocument();
    });

    it("should call onChange when option is selected", () => {
      const onChange = jest.fn();
      render(<SpellCheckerControls {...defaultProps} onChange={onChange} />);

      // Open dropdown
      fireEvent.click(screen.getByRole("button"));

      // Click German option
      const buttons = screen.getAllByRole("button");
      const germanOption = buttons.find((btn) =>
        btn.textContent?.includes("German"),
      );
      if (germanOption) {
        fireEvent.click(germanOption);
      }

      expect(onChange).toHaveBeenCalledWith("de");
    });

    it("should close dropdown after selection", () => {
      render(<SpellCheckerControls {...defaultProps} />);

      // Open dropdown
      fireEvent.click(screen.getByRole("button"));

      // Select an option
      const buttons = screen.getAllByRole("button");
      const offOption = buttons.find((btn) => btn.textContent?.includes("Off"));
      if (offOption) {
        fireEvent.click(offOption);
      }

      // Dropdown should close - only main button should remain visible
      expect(screen.getAllByRole("button").length).toBe(1);
    });
  });

  describe("loading state", () => {
    it("should disable dropdown when loading", () => {
      render(<SpellCheckerControls {...defaultProps} isLoading={true} />);

      const button = screen.getByRole("button");
      expect(button).toBeDisabled();
    });

    it("should not open dropdown when loading", () => {
      render(<SpellCheckerControls {...defaultProps} isLoading={true} />);

      const button = screen.getByRole("button");
      fireEvent.click(button);

      // Should still only have one button (dropdown not opened)
      expect(screen.getAllByRole("button").length).toBe(1);
    });

    it("should show loading spinner when loading", () => {
      render(<SpellCheckerControls {...defaultProps} isLoading={true} />);

      // Check for SVG spinner (it has specific attributes)
      const svg = document.querySelector("svg");
      expect(svg).toBeInTheDocument();
    });
  });

  describe("outside click", () => {
    it("should close dropdown on outside click", async () => {
      render(
        <div>
          <div data-testid="outside">Outside</div>
          <SpellCheckerControls {...defaultProps} />
        </div>,
      );

      // Open dropdown
      fireEvent.click(screen.getByRole("button"));

      // Click outside
      fireEvent.mouseDown(screen.getByTestId("outside"));

      await waitFor(() => {
        // Should only have main button
        expect(screen.getAllByRole("button").length).toBe(1);
      });
    });
  });
});
