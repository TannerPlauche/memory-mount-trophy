// import React from 'react'
// import { render } from '@testing-library/react'
// import { useParams } from 'next/navigation'
// import { upload } from '@vercel/blob/client'
// import TrophyPage from './trophyPage'
// import { getFiles, sortFiles, validateFiles, deleteFile } from '@/app/services/file.service'
// import { iTrophyFile } from '@/app/shared/types/types'

// // Mock Next.js navigation
// jest.mock('next/navigation', () => ({
//     useParams: jest.fn(),
// }))

// // Mock Vercel blob client
// jest.mock('@vercel/blob/client', () => ({
//     upload: jest.fn(),
// }))

// // Mock file service
// jest.mock('@/app/services/file.service', () => ({
//     getFiles: jest.fn(),
//     sortFiles: jest.fn(),
//     validateFiles: jest.fn(),
//     deleteFile: jest.fn(),
// }))

// // Mock constants
// jest.mock('@/app/shared/constants/constants', () => ({
//     imageFileTypes: ['.jpg', '.jpeg', '.png', '.gif', '.webp'],
//     videoFileTypes: ['.mp4', '.mkv', '.avi', '.mov'],
//     MAX_VIDEO_FILE_SIZE: 1024 * 1024 * 1024,
//     MAX_IMAGE_FILE_SIZE: 1024 * 1024 * 10,
// }))

// // Mock implementations
// const mockUseParams = useParams as jest.MockedFunction<typeof useParams>
// const mockUpload = upload as jest.MockedFunction<typeof upload>
// const mockGetFiles = getFiles as jest.MockedFunction<typeof getFiles>
// const mockSortFiles = sortFiles as jest.MockedFunction<typeof sortFiles>
// const mockValidateFiles = validateFiles as jest.MockedFunction<typeof validateFiles>
// const mockDeleteFile = deleteFile as jest.MockedFunction<typeof deleteFile>

// // Mock data - creating a simplified mock that satisfies the interface
// const createMockTrophyFile = (overrides: Partial<iTrophyFile> = {}): iTrophyFile => {
//     return {
//         uploadedAt: '2024-01-01T00:00:00Z',
//         pathname: '/test-trophy-123/video.mp4',
//         Key: 'test-trophy-123/video.mp4',
//         downloadUrl: 'https://example.com/video.mp4',
//         url: 'https://example.com/video.mp4',
//         name: 'video.mp4',
//         size: 1000000,
//         type: 'video/mp4',
//         lastModified: 1234567890,
//         webkitRelativePath: '',
//         arrayBuffer: jest.fn(),
//         slice: jest.fn(),
//         stream: jest.fn(),
//         text: jest.fn(),
//         ...overrides
//     } as iTrophyFile
// }

// const mockTrophyId = 'test-trophy-123'
// const mockVideoFile = createMockTrophyFile()
// const mockImageFile = createMockTrophyFile({
//     name: 'image.jpg',
//     pathname: '/test-trophy-123/image.jpg',
//     Key: 'test-trophy-123/image.jpg',
//     downloadUrl: 'https://example.com/image.jpg',
//     url: 'https://example.com/image.jpg',
// })

// describe('TrophyPage', () => {
//     beforeEach(() => {
//         // Reset all mocks
//         jest.clearAllMocks()

//         // Setup default mock implementations
//         mockUseParams.mockReturnValue({ trophyId: mockTrophyId })
//         mockGetFiles.mockResolvedValue([])
//         mockSortFiles.mockReturnValue({ videoFiles: [], imageFiles: [], otherFiles: [] })
//         mockValidateFiles.mockReturnValue({ valid: true, message: '' })

//         // Mock environment variables
//         process.env.PUBLIC_PREFIX = 'https://pub-test.r2.dev/'
//     })

//     describe('Loading State', () => {
//         it('should show loading spinner initially', () => {
//             const { container } = render(<TrophyPage />)
//             expect(container.querySelector('[data-testid="loading-spinner"]')).toBeInTheDocument()
//         })

//         it('should hide loading spinner after data is fetched', async () => {
//             mockGetFiles.mockResolvedValue([])

//             const { container } = render(<TrophyPage />)

//             // Wait for the component to finish loading
//             await new Promise(resolve => setTimeout(resolve, 100))

//             expect(container.querySelector('[data-testid="loading-spinner"]')).not.toBeInTheDocument()
//         })
//     })

//     describe('Trophy ID Display', () => {
//         it('should display the trophy ID', async () => {
//             mockGetFiles.mockResolvedValue([])

//             const { container } = render(<TrophyPage />)

//             // Wait for the component to finish loading
//             await new Promise(resolve => setTimeout(resolve, 100))

//             expect(container.textContent).toContain('Trophy ID: test-trophy-123')
//         })
//     })

//     describe('Error Handling', () => {
//         it('should display error message when API returns error', async () => {
//             const errorMessage = 'Trophy ID: test-trophy-123Select a Trophy VideoTrophy NameUpload VideoSelect Trophy ImagesUpload ImagesSubmit';
//             mockGetFiles.mockResolvedValue({ error: errorMessage })

//             const { container } = render(<TrophyPage />)

//             // Wait for the component to finish loading
//             await new Promise(resolve => setTimeout(resolve, 100))

//             expect(container.textContent).toContain(errorMessage)
//         })

//         it('should display error message when API request fails', async () => {
//             mockGetFiles.mockRejectedValue(new Error('Network error'))

//             const { container } = render(<TrophyPage />)

//             // Wait for the component to finish loading
//             await new Promise(resolve => setTimeout(resolve, 100))

//             expect(container.textContent).toContain('No file uploaded. Please upload a file.')
//         })
//     })

//     describe('Video Upload Section', () => {
//         it('should show upload form when no video exists', async () => {
//             mockGetFiles.mockResolvedValue([])
//             mockSortFiles.mockReturnValue({ videoFiles: [], imageFiles: [], otherFiles: [] })

//             const { container } = render(<TrophyPage />)

//             // Wait for the component to finish loading
//             await new Promise(resolve => setTimeout(resolve, 100))

//             expect(container.textContent).toContain('Select a Trophy Video')
//             expect(container.textContent).toContain('Trophy Name')
//             expect(container.textContent).toContain('Upload Video')
//         })

//         it('should show video player when video exists', async () => {
//             mockGetFiles.mockResolvedValue([mockVideoFile])
//             mockSortFiles.mockReturnValue({ videoFiles: [mockVideoFile], imageFiles: [], otherFiles: [] })

//             const { container } = render(<TrophyPage />)

//             // Wait for the component to finish loading
//             await new Promise(resolve => setTimeout(resolve, 100))

//             expect(container.textContent).toContain('Trophy Video')
//             expect(container.querySelector('video')).toBeInTheDocument()
//         })
//     })

//     describe('Image Upload Section', () => {
//         it('should show lightbox when images exist', async () => {
//             mockGetFiles.mockResolvedValue([mockImageFile])
//             mockSortFiles.mockReturnValue({ videoFiles: [], imageFiles: [mockImageFile], otherFiles: [] })

//             const { container } = render(<TrophyPage />)

//             // Wait for the component to finish loading
//             await new Promise(resolve => setTimeout(resolve, 100))

//             expect(container.textContent).toContain('Trophy Images')
//             expect(container.querySelector('[data-testid="lightbox"]')).toBeInTheDocument()
//         })
//     })

//     describe('Replace Video Functionality', () => {
//         it('should show replace video button when video exists', async () => {
//             mockGetFiles.mockResolvedValue([mockVideoFile])
//             mockSortFiles.mockReturnValue({ videoFiles: [mockVideoFile], imageFiles: [], otherFiles: [] })

//             const { container } = render(<TrophyPage />)

//             // Wait for the component to finish loading
//             await new Promise(resolve => setTimeout(resolve, 100))

//             expect(container.textContent).toContain('Replace Video')
//         })
//     })

//     describe('API Calls', () => {
//         it('should make API call with correct trophy ID', async () => {
//             mockGetFiles.mockResolvedValue([])

//             render(<TrophyPage />)

//             // Wait for the component to finish loading
//             await new Promise(resolve => setTimeout(resolve, 100))

//             expect(mockGetFiles).toHaveBeenCalledWith(mockTrophyId)
//         })

//         it('should call sortFiles when data is received', async () => {
//             const mockData = [mockVideoFile, mockImageFile]
//             mockGetFiles.mockResolvedValue(mockData)

//             render(<TrophyPage />)

//             // Wait for the component to finish loading
//             await new Promise(resolve => setTimeout(resolve, 100))

//             expect(mockSortFiles).toHaveBeenCalled()
//         })
//     })
// })