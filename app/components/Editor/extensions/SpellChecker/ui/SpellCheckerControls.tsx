"use client";

import { useState, useRef, useEffect } from "react";
import { controlsStyles, hoverHandlers, spinnerKeyframes } from "./styles";

interface SpellCheckerControlsProps {
  value: "off" | "en" | "de";
  onChange: (value: "off" | "en" | "de") => void;
  isLoading?: boolean;
}

const options: Array<{ value: "off" | "en" | "de"; label: string }> = [
  { value: "off", label: "Off" },
  { value: "en", label: "English" },
  { value: "de", label: "German" },
];

/**
 * SpellCheckerControls component - custom dropdown with 2-line layout
 */
export function SpellCheckerControls({
  value,
  onChange,
  isLoading = false,
}: SpellCheckerControlsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  const selectedOption =
    options.find((opt) => opt.value === value) || options[0];

  return (
    <div className="spellcheck-controls" style={controlsStyles.container}>
      {/* Custom Dropdown */}
      <div ref={dropdownRef} style={controlsStyles.dropdownWrapper}>
        {/* Dropdown Button */}
        <button
          type="button"
          onClick={() => !isLoading && setIsOpen(!isOpen)}
          disabled={isLoading}
          style={controlsStyles.dropdownButton(isLoading, isOpen)}
          onMouseEnter={(e) => hoverHandlers.dropdownButton.onMouseEnter(e, isLoading, isOpen)}
          onMouseLeave={(e) => hoverHandlers.dropdownButton.onMouseLeave(e, isOpen)}
          onFocus={(e) => hoverHandlers.dropdownButton.onFocus(e, isLoading)}
          onBlur={(e) => hoverHandlers.dropdownButton.onBlur(e, isOpen)}
        >
          <div style={controlsStyles.dropdownLabel(isLoading)}>
            Spellchecker
          </div>
          <div style={controlsStyles.dropdownValue(isLoading)}>
            {selectedOption.label}
          </div>
          {/* Loading Spinner or Dropdown Arrow */}
          <div style={controlsStyles.iconContainer}>
            {isLoading ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="12"
                height="12"
                viewBox="0 0 12 12"
                fill="none"
                style={{ animation: "spin 1s linear infinite" }}
              >
                <style>{spinnerKeyframes}</style>
                <circle
                  cx="6"
                  cy="6"
                  r="5"
                  stroke="rgba(59, 130, 246, 0.3)"
                  strokeWidth="1.5"
                  fill="none"
                />
                <path
                  d="M 6 1 A 5 5 0 0 1 11 6"
                  stroke="rgba(59, 130, 246, 0.8)"
                  strokeWidth="1.5"
                  fill="none"
                  strokeLinecap="round"
                />
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="12"
                height="12"
                viewBox="0 0 12 12"
                fill="none"
                style={{
                  transform: `rotate(${isOpen ? "180deg" : "0deg"})`,
                  transition: "transform 0.15s ease",
                }}
              >
                <path d="M6 9L1 4h10z" fill="rgba(0, 0, 0, 0.5)" />
              </svg>
            )}
          </div>
        </button>

        {/* Dropdown Menu */}
        {isOpen && !isLoading && (
          <div style={controlsStyles.dropdownMenu}>
            {options.map((option) => {
              const isSelected = value === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    onChange(option.value);
                    setIsOpen(false);
                  }}
                  disabled={isLoading}
                  style={controlsStyles.optionButton(isSelected, isLoading)}
                  onMouseEnter={(e) => hoverHandlers.optionButton.onMouseEnter(e, isSelected, isLoading)}
                  onMouseLeave={(e) => hoverHandlers.optionButton.onMouseLeave(e, isSelected)}
                >
                  <div style={controlsStyles.optionLabel(isSelected)}>
                    Spellchecker
                  </div>
                  <div style={controlsStyles.optionValue(isSelected)}>
                    {option.label}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
