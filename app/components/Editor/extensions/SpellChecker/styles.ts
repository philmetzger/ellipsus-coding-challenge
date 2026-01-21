import type { CSSProperties } from 'react'

/**
 * Styles for SpellChecker UI components
 * Extracted from inline styles for maintainability
 */

// ============================================
// Context Menu Styles
// ============================================

export const contextMenuStyles = {
  container: {
    position: 'fixed',
    zIndex: 1000,
    backgroundColor: '#ffffff',
    border: '1px solid rgba(0, 0, 0, 0.1)',
    borderRadius: '8px',
    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.12), 0 2px 4px rgba(0, 0, 0, 0.08)',
    padding: '8px 0',
    minWidth: '240px',
    maxWidth: '320px',
    overflow: 'hidden',
  } as CSSProperties,

  header: {
    padding: '10px 16px 12px 16px',
    fontSize: '0.8125rem',
    color: 'rgba(0, 0, 0, 0.6)',
    fontWeight: 500,
    letterSpacing: '0.01em',
    borderBottom: '1px solid rgba(0, 0, 0, 0.06)',
  } as CSSProperties,

  suggestionsContainer: {
    padding: '4px 0',
  } as CSSProperties,

  suggestionRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '6px 16px',
    gap: '8px',
  } as CSSProperties,

  suggestionText: {
    flex: 1,
    fontSize: '0.9375rem',
    color: 'rgba(26, 26, 26, 0.95)',
    fontWeight: 400,
  } as CSSProperties,

  buttonGroup: {
    display: 'flex',
    gap: '4px',
  } as CSSProperties,

  actionButton: {
    padding: '4px 10px',
    fontSize: '0.8125rem',
    color: 'rgba(26, 26, 26, 0.85)',
    backgroundColor: 'transparent',
    border: '1px solid rgba(0, 0, 0, 0.1)',
    borderRadius: '4px',
    cursor: 'pointer',
    transition: 'all 0.12s ease',
    fontWeight: 500,
  } as CSSProperties,

  noSuggestions: {
    padding: '12px 16px',
    fontSize: '0.8125rem',
    color: 'rgba(0, 0, 0, 0.4)',
    fontStyle: 'italic',
  } as CSSProperties,
}

// ============================================
// Spell Checker Controls Styles
// ============================================

export const controlsStyles = {
  container: {
    padding: '14px 16px',
    borderBottom: '1px solid rgba(0, 0, 0, 0.06)',
    backgroundColor: 'rgba(250, 250, 250, 0.5)',
  } as CSSProperties,

  dropdownWrapper: {
    position: 'relative',
    display: 'inline-block',
    width: 'auto',
    minWidth: '200px',
  } as CSSProperties,

  dropdownButton: (isLoading: boolean, isOpen: boolean): CSSProperties => ({
    width: '100%',
    padding: '10px 36px 10px 12px',
    border: '1px solid rgba(0, 0, 0, 0.12)',
    borderRadius: '6px',
    backgroundColor: isLoading ? 'rgba(250, 250, 250, 0.8)' : '#ffffff',
    color: isLoading ? 'rgba(26, 26, 26, 0.6)' : 'rgba(26, 26, 26, 0.95)',
    fontSize: '0.875rem',
    fontWeight: 400,
    cursor: isLoading ? 'not-allowed' : 'pointer',
    outline: 'none',
    textAlign: 'left',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: '2px',
    transition: 'all 0.15s ease',
    position: 'relative',
    opacity: isLoading ? 0.7 : 1,
  }),

  dropdownLabel: (isLoading: boolean): CSSProperties => ({
    fontSize: '0.75rem',
    color: isLoading ? 'rgba(0, 0, 0, 0.4)' : 'rgba(0, 0, 0, 0.5)',
    fontWeight: 400,
  }),

  dropdownValue: (isLoading: boolean): CSSProperties => ({
    fontSize: '0.875rem',
    color: isLoading ? 'rgba(26, 26, 26, 0.6)' : 'rgba(26, 26, 26, 0.95)',
    fontWeight: 500,
  }),

  iconContainer: {
    position: 'absolute',
    right: '12px',
    top: '50%',
    transform: 'translateY(-50%)',
    width: '12px',
    height: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  } as CSSProperties,

  dropdownMenu: {
    position: 'absolute',
    top: '100%',
    left: 0,
    width: '100%',
    marginTop: '4px',
    backgroundColor: '#ffffff',
    border: '1px solid rgba(0, 0, 0, 0.12)',
    borderRadius: '6px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.12)',
    zIndex: 1000,
    overflow: 'hidden',
  } as CSSProperties,

  optionButton: (isSelected: boolean, isLoading: boolean): CSSProperties => ({
    width: '100%',
    padding: '10px 12px',
    border: 'none',
    backgroundColor: isSelected ? 'rgba(59, 130, 246, 0.08)' : 'transparent',
    color: isSelected ? 'rgba(59, 130, 246, 0.95)' : 'rgba(26, 26, 26, 0.95)',
    cursor: isLoading ? 'not-allowed' : 'pointer',
    outline: 'none',
    textAlign: 'left',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: '2px',
    transition: 'background-color 0.12s ease',
    borderBottom: '1px solid rgba(0, 0, 0, 0.04)',
    opacity: isLoading ? 0.6 : 1,
  }),

  optionLabel: (isSelected: boolean): CSSProperties => ({
    fontSize: '0.75rem',
    color: isSelected ? 'rgba(59, 130, 246, 0.7)' : 'rgba(0, 0, 0, 0.5)',
    fontWeight: 400,
  }),

  optionValue: (isSelected: boolean): CSSProperties => ({
    fontSize: '0.875rem',
    color: isSelected ? 'rgba(59, 130, 246, 0.95)' : 'rgba(26, 26, 26, 0.95)',
    fontWeight: isSelected ? 500 : 400,
  }),
}

// ============================================
// Hover state handlers
// ============================================

export const hoverHandlers = {
  actionButton: {
    onMouseEnter: (e: React.MouseEvent<HTMLButtonElement>) => {
      e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.04)'
      e.currentTarget.style.borderColor = 'rgba(0, 0, 0, 0.15)'
    },
    onMouseLeave: (e: React.MouseEvent<HTMLButtonElement>) => {
      e.currentTarget.style.backgroundColor = 'transparent'
      e.currentTarget.style.borderColor = 'rgba(0, 0, 0, 0.1)'
    },
  },

  dropdownButton: {
    onMouseEnter: (e: React.MouseEvent<HTMLButtonElement>, isLoading: boolean, isOpen: boolean) => {
      if (!isLoading && !isOpen) {
        e.currentTarget.style.borderColor = 'rgba(0, 0, 0, 0.2)'
        e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.08)'
      }
    },
    onMouseLeave: (e: React.MouseEvent<HTMLButtonElement>, isOpen: boolean) => {
      if (!isOpen) {
        e.currentTarget.style.borderColor = 'rgba(0, 0, 0, 0.12)'
        e.currentTarget.style.boxShadow = 'none'
      }
    },
    onFocus: (e: React.FocusEvent<HTMLButtonElement>, isLoading: boolean) => {
      if (!isLoading) {
        e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.5)'
        e.currentTarget.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)'
      }
    },
    onBlur: (e: React.FocusEvent<HTMLButtonElement>, isOpen: boolean) => {
      if (!isOpen) {
        e.currentTarget.style.borderColor = 'rgba(0, 0, 0, 0.12)'
        e.currentTarget.style.boxShadow = 'none'
      }
    },
  },

  optionButton: {
    onMouseEnter: (e: React.MouseEvent<HTMLButtonElement>, isSelected: boolean, isLoading: boolean) => {
      if (!isSelected && !isLoading) {
        e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.04)'
      }
    },
    onMouseLeave: (e: React.MouseEvent<HTMLButtonElement>, isSelected: boolean) => {
      if (!isSelected) {
        e.currentTarget.style.backgroundColor = 'transparent'
      }
    },
  },
}

// ============================================
// SVG Spinner keyframes (for CSS injection)
// ============================================

export const spinnerKeyframes = `
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
`
