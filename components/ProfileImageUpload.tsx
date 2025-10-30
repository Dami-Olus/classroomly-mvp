'use client'

import { useState, useRef } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { createClient } from '@/lib/supabase/client'
import { Camera, User } from 'lucide-react'
import toast from 'react-hot-toast'
import { getInitials } from '@/lib/utils'

export default function ProfileImageUpload() {
  const { profile, updateProfile } = useAuth()
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true)

      if (!e.target.files || e.target.files.length === 0) {
        return
      }

      if (!profile?.id) {
        toast.error('Please refresh the page and try again')
        return
      }

      const file = e.target.files[0]
      
      // Validate file size (5MB max)
      const maxSize = 5 * 1024 * 1024
      if (file.size > maxSize) {
        toast.error('Image size must be less than 5MB')
        return
      }

      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error('Please upload an image file')
        return
      }

      const fileExt = file.name.split('.').pop()
      const fileName = `${profile.id}-${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
      const filePath = `avatars/${fileName}`

      // Check if bucket exists
      const { data: buckets, error: bucketError } = await supabase.storage.listBuckets()
      if (bucketError) throw bucketError

      const avatarsBucket = buckets?.find(b => b.name === 'avatars')
      if (!avatarsBucket) {
        toast.error(
          'Storage bucket not configured. Please contact support or check deployment guide.',
          { duration: 6000 }
        )
        console.error('avatars bucket not found. Available buckets:', buckets?.map(b => b.name))
        return
      }

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true })

      if (uploadError) {
        console.error('Upload error:', uploadError)
        if (uploadError.message?.includes('bucket') || uploadError.message?.includes('Bucket')) {
          toast.error(
            'Storage bucket not found. Please create the "avatars" bucket in Supabase Storage.',
            { duration: 6000 }
          )
        } else {
          throw uploadError
        }
        return
      }

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from('avatars').getPublicUrl(filePath)

      // Update profile
      await updateProfile({ profile_image: publicUrl })
      toast.success('Profile picture updated successfully')
    } catch (error: any) {
      console.error('Error uploading file:', error)
      toast.error(error.message || 'Failed to upload image')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="flex items-center space-x-6">
      <div className="relative">
        {profile?.profile_image ? (
          <img
            src={profile.profile_image}
            alt="Profile"
            className="w-24 h-24 rounded-full object-cover"
          />
        ) : (
          <div className="w-24 h-24 rounded-full bg-primary-100 flex items-center justify-center">
            <span className="text-2xl font-bold text-primary-600">
              {profile &&
                getInitials(profile.first_name, profile.last_name)}
            </span>
          </div>
        )}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="absolute bottom-0 right-0 bg-primary-600 text-white p-2 rounded-full hover:bg-primary-700 transition-all"
          disabled={uploading}
        >
          {uploading ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <Camera className="w-4 h-4" />
          )}
        </button>
      </div>

      <div>
        <h3 className="font-medium text-secondary-900 mb-1">Profile Photo</h3>
        <p className="text-sm text-secondary-600 mb-2">
          Upload a professional photo
        </p>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="btn-secondary text-sm"
          disabled={uploading}
        >
          {uploading ? 'Uploading...' : 'Change Photo'}
        </button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  )
}

