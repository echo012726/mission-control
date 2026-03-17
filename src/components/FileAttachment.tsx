'use client'
import { useRef, useState } from 'react'
import { Paperclip, Upload, X, File, Image } from 'lucide-react'

export default function FileAttachment({ files, onAdd, onRemove }: { 
  files: string[]; 
  onAdd: (urls: string[]) => void;
  onRemove: (url: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files?.length) return
    
    setUploading(true)
    // In production, upload to S3/Cloudinary. For now, use object URLs
    const urls = Array.from(files).map(f => URL.createObjectURL(f))
    onAdd(urls)
    setUploading(false)
  }

  const isImage = (url: string) => url.match(/\.(jpg|jpeg|png|gif|webp)/i)

  return (
    <div className="space-y-2">
      <button
        onClick={() => inputRef.current?.click()}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700"
      >
        <Paperclip className="w-4 h-4" />
        {uploading ? 'Uploading...' : 'Add Attachment'}
      </button>
      <input ref={inputRef} type="file" multiple className="hidden" onChange={handleFileSelect} />
      
      {files.length > 0 && (
        <div className="grid grid-cols-2 gap-2 mt-2">
          {files.map((url, i) => (
            <div key={i} className="relative group">
              {isImage(url) ? (
                <img src={url} alt="" className="w-full h-24 object-cover rounded" />
              ) : (
                <div className="h-24 bg-gray-100 rounded flex items-center justify-center">
                  <File className="w-8 h-8 text-gray-400" />
                </div>
              )}
              <button
                onClick={() => onRemove(url)}
                className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
