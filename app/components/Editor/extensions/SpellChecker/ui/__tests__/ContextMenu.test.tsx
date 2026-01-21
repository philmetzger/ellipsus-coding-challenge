/**
 * ContextMenu Tests
 */

import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { ContextMenu } from "../ContextMenu";
import {
  SPELLCHECK_CONTEXT_MENU_EVENT,
  SPELLCHECK_CONTEXT_MENU_DISMISS_EVENT,
} from "../../utils/constants";

// Mock the hooks
jest.mock("../../hooks/useSpellCheckerExtension", () => ({
  useSpellCheckerExtension: jest.fn(() => ({
    name: "spellChecker",
    options: { enabled: true },
  })),
  isSpellCheckerEnabled: jest.fn(() => true),
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
  });

  describe("visibility", () => {
    it("should not render when no menu state", () => {
      const editor = createMockEditor();
      const { container } = render(<ContextMenu editor={editor as any} />);

      expect(container.querySelector(".spellcheck-context-menu")).toBeNull();
    });

    it("should render when context menu event is dispatched", async () => {
      const editor = createMockEditor();
      render(<ContextMenu editor={editor as any} />);

      // Dispatch context menu event
      window.dispatchEvent(
        new CustomEvent(SPELLCHECK_CONTEXT_MENU_EVENT, {
          detail: {
            visible: true,
            word: "tset",
            position: { x: 100, y: 100 },
            suggestions: ["test", "set"],
            wordRange: { from: 0, to: 4 },
          },
        }),
      );

      await waitFor(() => {
        expect(screen.getByText("Did you mean:")).toBeInTheDocument();
      });
    });

    it("should show suggestions", async () => {
      const editor = createMockEditor();
      render(<ContextMenu editor={editor as any} />);

      window.dispatchEvent(
        new CustomEvent(SPELLCHECK_CONTEXT_MENU_EVENT, {
          detail: {
            visible: true,
            word: "tset",
            position: { x: 100, y: 100 },
            suggestions: ["test", "set"],
            wordRange: { from: 0, to: 4 },
          },
        }),
      );

      await waitFor(() => {
        expect(screen.getByText("test")).toBeInTheDocument();
        expect(screen.getByText("set")).toBeInTheDocument();
      });
    });

    it('should show "No suggestions available" when empty', async () => {
      const editor = createMockEditor();
      render(<ContextMenu editor={editor as any} />);

      window.dispatchEvent(
        new CustomEvent(SPELLCHECK_CONTEXT_MENU_EVENT, {
          detail: {
            visible: true,
            word: "xyz123",
            position: { x: 100, y: 100 },
            suggestions: [],
            wordRange: { from: 0, to: 6 },
          },
        }),
      );

      await waitFor(() => {
        expect(
          screen.getByText("No suggestions available"),
        ).toBeInTheDocument();
      });
    });
  });

  describe("dismissal", () => {
    it("should dismiss on dismiss event", async () => {
      const editor = createMockEditor();
      render(<ContextMenu editor={editor as any} />);

      // Show menu
      window.dispatchEvent(
        new CustomEvent(SPELLCHECK_CONTEXT_MENU_EVENT, {
          detail: {
            visible: true,
            word: "tset",
            position: { x: 100, y: 100 },
            suggestions: ["test"],
            wordRange: { from: 0, to: 4 },
          },
        }),
      );

      await waitFor(() => {
        expect(screen.getByText("Did you mean:")).toBeInTheDocument();
      });

      // Dismiss
      window.dispatchEvent(
        new CustomEvent(SPELLCHECK_CONTEXT_MENU_DISMISS_EVENT),
      );

      await waitFor(() => {
        expect(screen.queryByText("Did you mean:")).not.toBeInTheDocument();
      });
    });

    it("should dismiss on scroll", async () => {
      const editor = createMockEditor();
      render(<ContextMenu editor={editor as any} />);

      // Show menu
      window.dispatchEvent(
        new CustomEvent(SPELLCHECK_CONTEXT_MENU_EVENT, {
          detail: {
            visible: true,
            word: "tset",
            position: { x: 100, y: 100 },
            suggestions: ["test"],
            wordRange: { from: 0, to: 4 },
          },
        }),
      );

      await waitFor(() => {
        expect(screen.getByText("Did you mean:")).toBeInTheDocument();
      });

      // Scroll
      fireEvent.scroll(window);

      await waitFor(() => {
        expect(screen.queryByText("Did you mean:")).not.toBeInTheDocument();
      });
    });
  });

  describe("actions", () => {
    it("should have Fix buttons for each suggestion", async () => {
      const editor = createMockEditor();
      render(<ContextMenu editor={editor as any} />);

      window.dispatchEvent(
        new CustomEvent(SPELLCHECK_CONTEXT_MENU_EVENT, {
          detail: {
            visible: true,
            word: "tset",
            position: { x: 100, y: 100 },
            suggestions: ["test", "set"],
            wordRange: { from: 0, to: 4 },
          },
        }),
      );

      await waitFor(() => {
        const fixButtons = screen.getAllByText("Fix");
        expect(fixButtons.length).toBe(2);
      });
    });

    it("should have Fix all buttons for each suggestion", async () => {
      const editor = createMockEditor();
      render(<ContextMenu editor={editor as any} />);

      window.dispatchEvent(
        new CustomEvent(SPELLCHECK_CONTEXT_MENU_EVENT, {
          detail: {
            visible: true,
            word: "tset",
            position: { x: 100, y: 100 },
            suggestions: ["test", "set"],
            wordRange: { from: 0, to: 4 },
          },
        }),
      );

      await waitFor(() => {
        const fixAllButtons = screen.getAllByText("Fix all");
        expect(fixAllButtons.length).toBe(2);
      });
    });
  });

  describe("null editor", () => {
    it("should handle null editor gracefully", () => {
      const { container } = render(<ContextMenu editor={null} />);
      expect(container.querySelector(".spellcheck-context-menu")).toBeNull();
    });
  });
});
