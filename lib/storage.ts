import { createClient } from '@/lib/supabase/client'

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB in bytes

const ALLOWED_FILE_TYPES = [
  // Documents
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  // Images
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp',
  // Text
  'text/plain',
  'text/csv',
]

export interface UploadResult {
  url: string
  path: string
  fileName: string
  fileSize: number
  fileType: string
}

export const validateFile = (file: File): { valid: boolean; error?: string } => {
  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `File size must be less than ${MAX_FILE_SIZE / 1024 / 1024}MB`,
    }
  }

  // Check file type
  if (!ALLOWED_FILE_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: `File type ${file.type} is not allowed. Please upload PDF, Word, Excel, PowerPoint, or image files.`,
    }
  }

  return { valid: true }
}

export const uploadFile = async (
  file: File,
  bookingId: string,
  userId: string
): Promise<UploadResult> => {
  const supabase = createClient()

  // Validate file
  const validation = validateFile(file)
  if (!validation.valid) {
    throw new Error(validation.error)
  }

  // Generate unique file path
  const timestamp = Date.now()
  const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
  const filePath = `${bookingId}/${timestamp}_${sanitizedFileName}`

  // Upload to Supabase Storage
  const { data, error } = await supabase.storage
    .from('materials')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
    })

  if (error) {
    console.error('Upload error:', error)
    throw new Error(`Failed to upload file: ${error.message}`)
  }

  // Get public URL
  const {
    data: { publicUrl },
  } = supabase.storage.from('materials').getPublicUrl(data.path)

  return {
    url: publicUrl,
    path: data.path,
    fileName: file.name,
    fileSize: file.size,
    fileType: file.type,
  }
}

export const deleteFile = async (filePath: string): Promise<void> => {
  const supabase = createClient()

  const { error } = await supabase.storage.from('materials').remove([filePath])

  if (error) {
    console.error('Delete error:', error)
    throw new Error(`Failed to delete file: ${error.message}`)
  }
}

export const downloadFile = async (fileUrl: string, fileName: string): Promise<void> => {
  try {
    const response = await fetch(fileUrl)
    const blob = await response.blob()
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = fileName
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  } catch (error) {
    console.error('Download error:', error)
    throw new Error('Failed to download file')
  }
}

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
}

export const getFileIcon = (fileType: string): string => {
  if (fileType.startsWith('image/')) return '🖼️'
  if (fileType.includes('pdf')) return '📄'
  if (fileType.includes('word')) return '📝'
  if (fileType.includes('excel') || fileType.includes('spreadsheet')) return '📊'
  if (fileType.includes('powerpoint') || fileType.includes('presentation')) return '📽️'
  if (fileType.startsWith('text/')) return '📃'
  return '📎'
}

