import React from 'react'
import { render } from '@testing-library/react'
import axios from 'axios'
import { useParams } from 'next/navigation'
import { upload } from '@vercel/blob/client'
import TrophyPage from './trophyPage'
import { sortFiles, validateFiles } from '@/app/services/file.service'
import { iTrophyFile } from '@/app/shared/types/types'

// Mock file service
jest.mock('@/app/services/file.service', () => ({
  sortFiles: jest.fn(),
  validateFiles: jest.fn(),
}))

// Mock constants
jest.mock('@/app/shared/constants/constants', () => ({
  imageFileTypes: ['.jpg', '.jpeg', '.png', '.gif', '.webp'],
  videoFileTypes: ['.mp4', '.mkv', '.avi', '.mov'],
  MAX_VIDEO_FILE_SIZE: 1024 * 1024 * 1024,
  MAX_IMAGE_FILE_SIZE: 1024 * 1024 * 10,
}))

// Mock implementations
const mockAxios = axios as jest.Mocked<typeof axios>
const mockUseParams = useParams as jest.MockedFunction<typeof useParams>
const mockUpload = upload as jest.MockedFunction<typeof upload>
const mockSortFiles = sortFiles as jest.MockedFunction<typeof sortFiles>
const mockValidateFiles = validateFiles as jest.MockedFunction<typeof validateFiles>

// Mock data - creating a simplified mock that satisfies the interface
const createMockTrophyFile = (overrides: Partial<iTrophyFile> = {}): iTrophyFile => {
  return {
    uploadedAt: '2024-01-01T00:00:00Z',
    pathname: '/test-trophy-123/video.mp4',
    Key: 'test-trophy-123/video.mp4',
    downloadUrl: 'https://example.com/video.mp4',
    url: 'https://example.com/video.mp4',
    name: 'video.mp4',
    size: 1000000,
    type: 'video/mp4',
    lastModified: 1234567890,
    webkitRelativePath: '',
    arrayBuffer: jest.fn(),
    slice: jest.fn(),
    stream: jest.fn(),
    text: jest.fn(),
    ...overrides
  } as iTrophyFile
}

const mockTrophyId = 'test-trophy-123'
const mockVideoFile = createMockTrophyFile()
const mockImageFile = createMockTrophyFile({
  name: 'image.jpg',
  pathname: '/test-trophy-123/image.jpg',
  Key: 'test-trophy-123/image.jpg',
  downloadUrl: 'https://example.com/image.jpg',
  url: 'https://example.com/image.jpg',
})

describe('TrophyPage', () => {
  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks()
    
    // Setup default mock implementations
    mockUseParams.mockReturnValue({ trophyId: mockTrophyId })
    mockAxios.get.mockResolvedValue({ data: [] })
    mockSortFiles.mockReturnValue({ videoFiles: [], imageFiles: [], otherFiles: [] })
    mockValidateFiles.mockReturnValue({ valid: true, message: '' })
    
    // Mock environment variables
    process.env.PUBLIC_PREFIX = 'https://pub-test.r2.dev/'
  })

  describe('Loading State', () => {
    it('should show loading spinner initially', () => {
      const { container } = render(<TrophyPage />)
      expect(container.querySelector('[data-testid="loading-spinner"]')).toBeInTheDocument()
    })

    it('should hide loading spinner after data is fetched', async () => {
      mockAxios.get.mockResolvedValue({ data: [] })
      
      const { container } = render(<TrophyPage />)
      
      // Wait for the component to finish loading
      await new Promise(resolve => setTimeout(resolve, 100))
      
      expect(container.querySelector('[data-testid="loading-spinner"]')).not.toBeInTheDocument()
    })
  })

  describe('Trophy ID Display', () => {
    it('should display the trophy ID', async () => {
      mockAxios.get.mockResolvedValue({ data: [] })
      
      const { container } = render(<TrophyPage />)
      
      // Wait for the component to finish loading
      await new Promise(resolve => setTimeout(resolve, 100))
      
      expect(container.textContent).toContain(mockTrophyId)
    })
  })

  describe('Error Handling', () => {
    it('should display error message when API returns error', async () => {
      const errorMessage = 'Failed to fetch files'
      mockAxios.get.mockResolvedValue({ data: { error: errorMessage } })
      
      const { container } = render(<TrophyPage />)
      
      // Wait for the component to finish loading
      await new Promise(resolve => setTimeout(resolve, 100))
      
      expect(container.textContent).toContain(errorMessage)
    })

    it('should display error message when API request fails', async () => {
      mockAxios.get.mockRejectedValue(new Error('Network error'))
      
      const { container } = render(<TrophyPage />)
      
      // Wait for the component to finish loading
      await new Promise(resolve => setTimeout(resolve, 100))
      
      expect(container.textContent).toContain('No file uploaded. Please upload a file.')
    })
  })

  describe('Video Upload Section', () => {
    it('should show video upload form when no video exists', async () => {
      mockAxios.get.mockResolvedValue({ data: [] })
      
      const { container } = render(<TrophyPage />)
      
      // Wait for the component to finish loading
      await new Promise(resolve => setTimeout(resolve, 100))
      
      expect(container.textContent).toContain('Select a Trophy Video')
      expect(container.querySelector('input[type="text"]')).toBeInTheDocument()
      expect(container.querySelector('input[type="file"]')).toBeInTheDocument()
    })

    it('should show video player when video exists', async () => {
      mockAxios.get.mockResolvedValue({ data: [mockVideoFile] })
      mockSortFiles.mockReturnValue({ videoFiles: [mockVideoFile], imageFiles: [], otherFiles: [] })
      
      const { container } = render(<TrophyPage />)
      
      // Wait for the component to finish loading
      await new Promise(resolve => setTimeout(resolve, 100))
      
      expect(container.textContent).toContain('Trophy Video')
      expect(container.querySelector('video')).toBeInTheDocument()
    })
  })

  describe('Image Upload Section', () => {
    it('should show image upload form when no images exist', async () => {
      mockAxios.get.mockResolvedValue({ data: [] })
      
      const { container } = render(<TrophyPage />)
      
      // Wait for the component to finish loading
      await new Promise(resolve => setTimeout(resolve, 100))
      
      expect(container.textContent).toContain('Select Trophy Images')
      expect(container.querySelector('#imageInput')).toBeInTheDocument()
    })

    it('should show lightbox when images exist', async () => {
      mockAxios.get.mockResolvedValue({ data: [mockImageFile] })
      mockSortFiles.mockReturnValue({ videoFiles: [], imageFiles: [mockImageFile], otherFiles: [] })
      
      const { container } = render(<TrophyPage />)
      
      // Wait for the component to finish loading
      await new Promise(resolve => setTimeout(resolve, 100))
      
      expect(container.textContent).toContain('Trophy Images')
      expect(container.querySelector('[data-testid="lightbox"]')).toBeInTheDocument()
    })
  })

  describe('Replace Video Functionality', () => {
    it('should show replace video button when video exists', async () => {
      mockAxios.get.mockResolvedValue({ data: [mockVideoFile] })
      mockSortFiles.mockReturnValue({ videoFiles: [mockVideoFile], imageFiles: [], otherFiles: [] })
      
      const { container } = render(<TrophyPage />)
      
      // Wait for the component to finish loading
      await new Promise(resolve => setTimeout(resolve, 100))
      
      expect(container.textContent).toContain('Replace Video')
    })
  })

  describe('API Calls', () => {
    it('should make API call with correct trophy ID', async () => {
      mockAxios.get.mockResolvedValue({ data: [] })
      
      render(<TrophyPage />)
      
      // Wait for the API call
      await new Promise(resolve => setTimeout(resolve, 100))
      
      expect(mockAxios.get).toHaveBeenCalledWith(`/api/trophy/${mockTrophyId}`)
    })

    it('should call sortFiles when data is received', async () => {
      const mockData = [mockVideoFile, mockImageFile]
      mockAxios.get.mockResolvedValue({ data: mockData })
      
      render(<TrophyPage />)
      
      // Wait for the API call and processing
      await new Promise(resolve => setTimeout(resolve, 100))
      
      expect(mockSortFiles).toHaveBeenCalled()
    })
  })

  describe('Component Behavior', () => {
    it('should handle empty data response', async () => {
      mockAxios.get.mockResolvedValue({ data: [] })
      
      const { container } = render(<TrophyPage />)
      
      // Wait for the component to finish loading
      await new Promise(resolve => setTimeout(resolve, 100))
      
      expect(container.textContent).toContain('Select a Trophy Video')
      expect(container.textContent).toContain('Select Trophy Images')
    })

    it('should process files correctly when both video and images are present', async () => {
      mockAxios.get.mockResolvedValue({ data: [mockVideoFile, mockImageFile] })
      mockSortFiles.mockReturnValue({ 
        videoFiles: [mockVideoFile], 
        imageFiles: [mockImageFile], 
        otherFiles: [] 
      })
      
      const { container } = render(<TrophyPage />)
      
      // Wait for the component to finish loading
      await new Promise(resolve => setTimeout(resolve, 100))
      
      expect(container.textContent).toContain('Trophy Video')
      expect(container.textContent).toContain('Trophy Images')
    })
  })
})
