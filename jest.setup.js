// Import Jest DOM matchers
import '@testing-library/jest-dom'

// Polyfill for TextDecoder/TextEncoder (needed for Vercel blob)
import { TextDecoder, TextEncoder } from 'util';
global.TextDecoder = TextDecoder;
global.TextEncoder = TextEncoder;

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useParams: jest.fn(),
  useRouter: jest.fn(),
  usePathname: jest.fn(),
}))

// Mock axios
jest.mock('axios')

// Mock Vercel blob client
jest.mock('@vercel/blob/client', () => ({
  upload: jest.fn(),
  handleUpload: jest.fn(),
}))

// Mock Vercel blob
jest.mock('@vercel/blob', () => ({
  put: jest.fn(),
  del: jest.fn(),
  list: jest.fn(),
}))

// Mock react-loader-spinner
jest.mock('react-loader-spinner', () => ({
  Oval: ({ visible, ...props }) => visible ? <div data-testid="loading-spinner" {...props}>Loading...</div> : null,
}))

// Mock yet-another-react-lightbox
jest.mock('yet-another-react-lightbox', () => {
  return function MockLightbox({ children, ...props }) {
    return <div data-testid="lightbox" {...props}>{children}</div>
  }
})

jest.mock('yet-another-react-lightbox/plugins/inline', () => {
  return {}
})

// Mock CSS imports
jest.mock('yet-another-react-lightbox/styles.css', () => ({}))

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: jest.fn(),
  error: jest.fn(),
}
