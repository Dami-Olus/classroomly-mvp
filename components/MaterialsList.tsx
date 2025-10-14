'use client'

import { useState } from 'react'
import { Download, Trash2, FileText, Loader2 } from 'lucide-react'
import { formatFileSize, getFileIcon, downloadFile, deleteFile } from '@/lib/storage'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'

interface Material {
  id: string
  file_name: string
  file_url: string
  file_size: number | null
  file_type: string | null
  description: string | null
  uploaded_by: string
  created_at: string
  uploader?: {
    first_name: string
    last_name: string
  }
}

interface MaterialsListProps {
  bookingId: string
  materials: Material[]
  currentUserId?: string
  onDelete?: () => void
}

export default function MaterialsList({
  bookingId,
  materials,
  currentUserId,
  onDelete,
}: MaterialsListProps) {
  const supabase = createClient()
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [downloadingId, setDownloadingId] = useState<string | null>(null)

  const handleDownload = async (material: Material) => {
    setDownloadingId(material.id)
    try {
      // Extract file path from URL or use stored path
      const urlParts = material.file_url.split('/materials/')
      const filePath = urlParts[1] ? decodeURIComponent(urlParts[1].split('?')[0]) : ''
      
      if (!filePath) {
        throw new Error('Invalid file path')
      }

      // Generate fresh signed URL for download
      const { data, error } = await supabase.storage
        .from('materials')
        .createSignedUrl(filePath, 60) // 60 seconds expiry for download

      if (error) throw error
      if (!data?.signedUrl) throw new Error('Failed to generate download URL')

      // Download using the signed URL
      await downloadFile(data.signedUrl, material.file_name)
      toast.success('Download started!')
    } catch (error: any) {
      console.error('Download error:', error)
      toast.error(error.message || 'Failed to download file')
    } finally {
      setDownloadingId(null)
    }
  }

  const handleDelete = async (material: Material) => {
    if (!confirm(`Are you sure you want to delete "${material.file_name}"?`)) {
      return
    }

    setDeletingId(material.id)
    try {
      // Extract file path from URL
      const urlParts = material.file_url.split('/materials/')
      const filePath = urlParts[1] ? decodeURIComponent(urlParts[1].split('?')[0]) : ''

      // Delete from storage
      await deleteFile(filePath)

      // Delete from database
      const { error } = await supabase
        .from('session_materials')
        .delete()
        .eq('id', material.id)

      if (error) throw error

      toast.success('File deleted successfully!')
      if (onDelete) onDelete()
    } catch (error: any) {
      console.error('Delete error:', error)
      toast.error(error.message || 'Failed to delete file')
    } finally {
      setDeletingId(null)
    }
  }

  if (materials.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-lg">
        <FileText className="w-12 h-12 mx-auto text-gray-300 mb-4" />
        <p className="text-gray-500">No materials uploaded yet</p>
        <p className="text-sm text-gray-400 mt-2">
          Upload files to share with your tutor or student
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {materials.map((material) => {
        const isOwner = currentUserId === material.uploaded_by
        const icon = getFileIcon(material.file_type || '')
        const uploaderName = material.uploader
          ? `${material.uploader.first_name} ${material.uploader.last_name}`
          : 'Unknown'

        return (
          <div
            key={material.id}
            className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start gap-4">
              {/* File Icon */}
              <div className="text-3xl flex-shrink-0">{icon}</div>

              {/* File Info */}
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-gray-900 truncate">
                  {material.file_name}
                </h4>
                <div className="flex items-center gap-2 mt-1 text-sm text-gray-500">
                  <span>{material.file_size ? formatFileSize(material.file_size) : 'Unknown size'}</span>
                  <span>•</span>
                  <span>
                    Uploaded by {isOwner ? 'you' : uploaderName}
                  </span>
                  <span>•</span>
                  <span>
                    {new Date(material.created_at).toLocaleDateString()}
                  </span>
                </div>
                {material.description && (
                  <p className="text-sm text-gray-600 mt-2">
                    {material.description}
                  </p>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 flex-shrink-0">
                {/* Download Button */}
                <button
                  onClick={() => handleDownload(material)}
                  disabled={downloadingId === material.id}
                  className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                  title="Download"
                >
                  {downloadingId === material.id ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Download className="w-5 h-5" />
                  )}
                </button>

                {/* Delete Button (only for owner) */}
                {isOwner && (
                  <button
                    onClick={() => handleDelete(material)}
                    disabled={deletingId === material.id}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete"
                  >
                    {deletingId === material.id ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Trash2 className="w-5 h-5" />
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

