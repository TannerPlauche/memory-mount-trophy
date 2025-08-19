import React from 'react'
import { render, fireEvent, screen } from '@testing-library/react'
import Modal from './Modal'

describe('Modal', () => {
  const mockOnClose = jest.fn()
  const defaultProps = {
    isOpen: true,
    onClose: mockOnClose,
    children: <div>Modal Content</div>
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  afterEach(() => {
    // Clean up body overflow style
    document.body.style.overflow = 'unset'
  })

  describe('Rendering', () => {
    it('should not render when isOpen is false', () => {
      render(<Modal {...defaultProps} isOpen={false} />)
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })

    it('should render when isOpen is true', () => {
      render(<Modal {...defaultProps} />)
      expect(screen.getByRole('dialog')).toBeInTheDocument()
      expect(screen.getByText('Modal Content')).toBeInTheDocument()
    })

    it('should render title when provided', () => {
      render(<Modal {...defaultProps} title="Test Modal" />)
      expect(screen.getByText('Test Modal')).toBeInTheDocument()
      expect(screen.getByRole('dialog')).toHaveAttribute('aria-labelledby', 'modal-title')
    })

    it('should render close button by default', () => {
      render(<Modal {...defaultProps} />)
      expect(screen.getByLabelText('Close modal')).toBeInTheDocument()
    })

    it('should not render close button when showCloseButton is false', () => {
      render(<Modal {...defaultProps} showCloseButton={false} />)
      expect(screen.queryByLabelText('Close modal')).not.toBeInTheDocument()
    })
  })

  describe('Size variants', () => {
    it('should apply correct size classes', () => {
      const { rerender } = render(<Modal {...defaultProps} size="sm" />)
      expect(screen.getByRole('dialog').firstChild).toHaveClass('max-w-md')

      rerender(<Modal {...defaultProps} size="md" />)
      expect(screen.getByRole('dialog').firstChild).toHaveClass('max-w-2xl')

      rerender(<Modal {...defaultProps} size="lg" />)
      expect(screen.getByRole('dialog').firstChild).toHaveClass('max-w-3xl')

      rerender(<Modal {...defaultProps} size="xl" />)
      expect(screen.getByRole('dialog').firstChild).toHaveClass('max-w-4xl')
    })
  })

  describe('Interaction', () => {
    it('should call onClose when close button is clicked', () => {
      render(<Modal {...defaultProps} />)
      fireEvent.click(screen.getByLabelText('Close modal'))
      expect(mockOnClose).toHaveBeenCalledTimes(1)
    })

    it('should call onClose when backdrop is clicked', () => {
      render(<Modal {...defaultProps} />)
      fireEvent.click(screen.getByRole('dialog'))
      expect(mockOnClose).toHaveBeenCalledTimes(1)
    })

    it('should not call onClose when modal content is clicked', () => {
      render(<Modal {...defaultProps} />)
      fireEvent.click(screen.getByText('Modal Content'))
      expect(mockOnClose).not.toHaveBeenCalled()
    })

    it('should call onClose when Escape key is pressed', () => {
      render(<Modal {...defaultProps} />)
      fireEvent.keyDown(document, { key: 'Escape' })
      expect(mockOnClose).toHaveBeenCalledTimes(1)
    })

    it('should not call onClose when other keys are pressed', () => {
      render(<Modal {...defaultProps} />)
      fireEvent.keyDown(document, { key: 'Enter' })
      expect(mockOnClose).not.toHaveBeenCalled()
    })
  })

  describe('Accessibility', () => {
    it('should have correct ARIA attributes', () => {
      render(<Modal {...defaultProps} title="Test Modal" />)
      const dialog = screen.getByRole('dialog')
      
      expect(dialog).toHaveAttribute('aria-modal', 'true')
      expect(dialog).toHaveAttribute('aria-labelledby', 'modal-title')
    })

    it('should prevent body scroll when open', () => {
      render(<Modal {...defaultProps} />)
      expect(document.body.style.overflow).toBe('hidden')
    })

    it('should restore body scroll when closed', () => {
      const { unmount } = render(<Modal {...defaultProps} />)
      unmount()
      expect(document.body.style.overflow).toBe('unset')
    })
  })

  describe('Content rendering', () => {
    it('should render complex content', () => {
      const complexContent = (
        <div>
          <h3>Complex Content</h3>
          <form>
            <input type="text" placeholder="Test input" />
            <button type="submit">Submit</button>
          </form>
        </div>
      )

      render(<Modal {...defaultProps}>{complexContent}</Modal>)
      
      expect(screen.getByText('Complex Content')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('Test input')).toBeInTheDocument()
      expect(screen.getByText('Submit')).toBeInTheDocument()
    })
  })
})
