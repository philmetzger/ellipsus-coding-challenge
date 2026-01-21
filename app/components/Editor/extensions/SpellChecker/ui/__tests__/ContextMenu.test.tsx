/**
 * ContextMenu Tests
 *
 * Tests use a mock context provider to supply context menu state,
 * replacing the previous window event approach.
 */

import React, { useState } from "react";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import { ContextMenu } from "../ContextMenu";
import type { ContextMenuState } from "../../types";
import type { SpellCheckerContextValue } from "../SpellCheckerContext";

// Mock the hooks
jest.mock("../../hooks/useSpellCheckerExtension", () => ({
  useSpellCheckerExtension: jest.fn(() => ({
    name: "spellChecker",
    options: { enabled: true },
  })),
  isSpellCheckerEnabled: jest.fn(() => true),
}));

// Mock context value factory
const createMockContextValue = (
  contextMenu: ContextMenuState | null = null,
  overrides: Partial<SpellCheckerContextValue> = {}
): SpellCheckerContextValue => ({
  contextMenu,
  dismissContextMenu: jest.fn(),
  fixWord: jest.fn(),
  fixAllInstances: jest.fn(),
  ...overrides,
});

// Mock the SpellCheckerContext hook
let mockContextValue: SpellCheckerContextValue | null = null;

jest.mock("../SpellCheckerContext", () => ({
  useSpellCheckerContext: () => mockContextValue,
  SpellCheckerProvider: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
}));

// Mock editor
const createMockEditor = (enabled = true) => ({
  chain: jest.fn(() => ({
    focus: jest.fn(() => ({
      setTextSelection: jest.fn(() => ({
        deleteSelection: jest.fn(() => ({
          insertContent: jest.fn(() => ({
            run: jest.fn(),
          })),
        })),
      })),
    })),
  })),
  commands: {
    replaceAllInstances: jest.fn(),
  },
  extensionManager: {
    extensions: [
      {
        name: "spellChecker",
        options: { enabled },
      },
    ],
  },
});

describe("ContextMenu", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockContextValue = null;
  });

  describe("visibility", () => {
    it("should not render when no menu state", () => {
      mockContextValue = createMockContextValue(null);
      const editor = createMockEditor();
      const { container } = render(<ContextMenu editor={editor as any} />);

      expect(container.querySelector(".spellcheck-context-menu")).toBeNull();
    });

    it("should render when context menu state is visible", () => {
      mockContextValue = createMockContextValue({
        visible: true,
        word: "tset",
        position: { x: 100, y: 100 },
        suggestions: ["test", "set"],
        wordRange: { from: 0, to: 4 },
      });

      const editor = createMockEditor();
      render(<ContextMenu editor={editor as any} />);

      expect(screen.getByText("Did you mean:")).toBeInTheDocument();
    });

    it("should show suggestions", () => {
      mockContextValue = createMockContextValue({
        visible: true,
        word: "tset",
        position: { x: 100, y: 100 },
        suggestions: ["test", "set"],
        wordRange: { from: 0, to: 4 },
      });

      const editor = createMockEditor();
      render(<ContextMenu editor={editor as any} />);

      expect(screen.getByText("test")).toBeInTheDocument();
      expect(screen.getByText("set")).toBeInTheDocument();
    });

    it('should show "No suggestions available" when empty', () => {
      mockContextValue = createMockContextValue({
        visible: true,
        word: "xyz123",
        position: { x: 100, y: 100 },
        suggestions: [],
        wordRange: { from: 0, to: 6 },
      });

      const editor = createMockEditor();
      render(<ContextMenu editor={editor as any} />);

      expect(screen.getByText("No suggestions available")).toBeInTheDocument();
    });
  });

  describe("dismissal", () => {
    it("should call dismissContextMenu on scroll", async () => {
      const dismissContextMenu = jest.fn();
      mockContextValue = createMockContextValue(
        {
          visible: true,
          word: "tset",
          position: { x: 100, y: 100 },
          suggestions: ["test"],
          wordRange: { from: 0, to: 4 },
        },
        { dismissContextMenu }
      );

      const editor = createMockEditor();
      render(<ContextMenu editor={editor as any} />);

      expect(screen.getByText("Did you mean:")).toBeInTheDocument();

      // Scroll should trigger dismiss
      fireEvent.scroll(window);

      await waitFor(() => {
        expect(dismissContextMenu).toHaveBeenCalled();
      });
    });

    it("should not render when context menu is not visible", () => {
      mockContextValue = createMockContextValue({
        visible: false,
        word: "tset",
        position: { x: 100, y: 100 },
        suggestions: ["test"],
        wordRange: { from: 0, to: 4 },
      });

      const editor = createMockEditor();
      const { container } = render(<ContextMenu editor={editor as any} />);

      expect(container.querySelector(".spellcheck-context-menu")).toBeNull();
    });
  });

  describe("actions", () => {
    it("should have Fix buttons for each suggestion", () => {
      mockContextValue = createMockContextValue({
        visible: true,
        word: "tset",
        position: { x: 100, y: 100 },
        suggestions: ["test", "set"],
        wordRange: { from: 0, to: 4 },
      });

      const editor = createMockEditor();
      render(<ContextMenu editor={editor as any} />);

      const fixButtons = screen.getAllByText("Fix");
      expect(fixButtons.length).toBe(2);
    });

    it("should have Fix all buttons for each suggestion", () => {
      mockContextValue = createMockContextValue({
        visible: true,
        word: "tset",
        position: { x: 100, y: 100 },
        suggestions: ["test", "set"],
        wordRange: { from: 0, to: 4 },
      });

      const editor = createMockEditor();
      render(<ContextMenu editor={editor as any} />);

      const fixAllButtons = screen.getAllByText("Fix all");
      expect(fixAllButtons.length).toBe(2);
    });

    it("should call fixWord when Fix button is clicked", async () => {
      const fixWord = jest.fn();
      mockContextValue = createMockContextValue(
        {
          visible: true,
          word: "tset",
          position: { x: 100, y: 100 },
          suggestions: ["test"],
          wordRange: { from: 0, to: 4 },
        },
        { fixWord }
      );

      const editor = createMockEditor();
      render(<ContextMenu editor={editor as any} />);

      const fixButton = screen.getByText("Fix");
      fireEvent.click(fixButton);

      expect(fixWord).toHaveBeenCalledWith(0, 4, "test");
    });

    it("should call fixAllInstances when Fix all button is clicked", async () => {
      const fixAllInstances = jest.fn();
      mockContextValue = createMockContextValue(
        {
          visible: true,
          word: "tset",
          position: { x: 100, y: 100 },
          suggestions: ["test"],
          wordRange: { from: 0, to: 4 },
        },
        { fixAllInstances }
      );

      const editor = createMockEditor();
      render(<ContextMenu editor={editor as any} />);

      const fixAllButton = screen.getByText("Fix all");
      fireEvent.click(fixAllButton);

      expect(fixAllInstances).toHaveBeenCalledWith("tset", "test");
    });
  });

  describe("null editor", () => {
    it("should handle null editor gracefully", () => {
      mockContextValue = createMockContextValue(null);
      const { container } = render(<ContextMenu editor={null} />);
      expect(container.querySelector(".spellcheck-context-menu")).toBeNull();
    });
  });

  describe("null context", () => {
    it("should handle null context gracefully", () => {
      mockContextValue = null;
      const editor = createMockEditor();
      const { container } = render(<ContextMenu editor={editor as any} />);
      expect(container.querySelector(".spellcheck-context-menu")).toBeNull();
    });
  });
});
