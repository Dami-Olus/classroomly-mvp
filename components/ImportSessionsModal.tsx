'use client'

import { useState } from 'react'
import { X, Download, Upload, AlertCircle, CheckCircle, FileText, Loader2 } from 'lucide-react'
import { 
  downloadTemplate, 
  parseCSV, 
  validateImportData, 
  generateImportSummary,
  importSessions,
  type ImportRow 
} from '@/lib/importSessions'
import toast from 'react-hot-toast'

interface ImportSessionsModalProps {
  classId: string
  tutorId: string
  classDuration: number
  onClose: () => void
  onSuccess: () => void
}

export default function ImportSessionsModal({
  classId,
  tutorId,
  classDuration,
  onClose,
  onSuccess,
}: ImportSessionsModalProps) {
  const [step, setStep] = useState<'upload' | 'validate' | 'confirm' | 'processing'>('upload')
  const [file, setFile] = useState<File | null>(null)
  const [importData, setImportData] = useState<ImportRow[]>([])
  const [validationResult, setValidationResult] = useState<any>(null)
  const [summary, setSummary] = useState<any>(null)
  const [importing, setImporting] = useState(false)
  const [totalSessionsPerStudent, setTotalSessionsPerStudent] = useState(12)
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0])

  const handleDownloadTemplate = () => {
    downloadTemplate()
    toast.success('Template downloaded! Fill it with your student data.')
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return

    // Validate file type
    if (!selectedFile.name.match(/\.(csv|xlsx)$/i)) {
      toast.error('Please upload a CSV or XLSX file')
      return
    }

    setFile(selectedFile)

    try {
      // Parse CSV
      const rows = await parseCSV(selectedFile)
      setImportData(rows)

      // Validate data
      const validation = validateImportData(rows)
      setValidationResult(validation)

      if (validation.valid) {
        // Generate summary
        const importSummary = await generateImportSummary(rows, tutorId)
        setSummary(importSummary)
        setStep('confirm')
      } else {
        setStep('validate')
      }
    } catch (error: any) {
      console.error('Error parsing file:', error)
      toast.error(error.message || 'Failed to parse file')
      setFile(null)
    }
  }

  const handleImport = async () => {
    if (!importData || importData.length === 0) {
      toast.error('No data to import')
      return
    }

    setStep('processing')
    setImporting(true)

    try {
      const result = await importSessions(
        importData,
        classId,
        tutorId,
        totalSessionsPerStudent,
        new Date(startDate)
      )

      if (result.success) {
        toast.success(
          `✅ Import successful! Created ${result.bookingsCreated} bookings and ${result.sessionsCreated} sessions.`
        )
        onSuccess()
      } else {
        throw new Error(result.error || 'Import failed')
      }
    } catch (error: any) {
      console.error('Import error:', error)
      toast.error(error.message || 'Failed to import sessions')
      setStep('confirm')
    } finally {
      setImporting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Import Student Sessions</h2>
            <p className="text-sm text-gray-600 mt-1">
              Bulk import your existing schedule from Excel/CSV
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            disabled={importing}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Step 1: Upload */}
          {step === 'upload' && (
            <div className="space-y-6">
              {/* Instructions */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900 mb-2">📋 How It Works</h3>
                <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                  <li>Download the CSV template</li>
                  <li>Fill in your student names, emails, days, and times</li>
                  <li>Upload the completed file</li>
                  <li>Review and confirm the import</li>
                  <li>Sessions are automatically created!</li>
                </ol>
              </div>

              {/* Download Template */}
              <div className="card bg-white">
                <h3 className="font-semibold mb-3">Step 1: Download Template</h3>
                <button
                  onClick={handleDownloadTemplate}
                  className="btn-primary flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Download CSV Template
                </button>
                <p className="text-xs text-gray-500 mt-2">
                  The template includes example data. Replace it with your actual student information.
                </p>
              </div>

              {/* Upload File */}
              <div className="card bg-white">
                <h3 className="font-semibold mb-3">Step 2: Upload Completed File</h3>
                <label className="block">
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-primary-500 transition-colors cursor-pointer">
                    <Upload className="w-12 h-12 mx-auto text-gray-400 mb-3" />
                    <p className="text-gray-700 font-medium mb-1">
                      Click to upload or drag and drop
                    </p>
                    <p className="text-sm text-gray-500">
                      CSV or XLSX files only
                    </p>
                  </div>
                  <input
                    type="file"
                    accept=".csv,.xlsx"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </label>
                {file && (
                  <div className="mt-3 text-sm text-gray-600 flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    <span>{file.name}</span>
                  </div>
                )}
              </div>

              {/* Template Format */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-semibold text-sm mb-2">Template Format:</h4>
                <div className="text-xs font-mono bg-white p-3 rounded border overflow-x-auto">
                  <div className="mb-2 font-bold">Student Name, Student Email, Days, Time</div>
                  <div>John Doe, john@example.com, "Monday,Wednesday", 14:00</div>
                  <div>Jane Smith, jane@example.com, "Tuesday,Thursday", 16:00</div>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Validation Errors */}
          {step === 'validate' && validationResult && (
            <div className="space-y-6">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-red-900 mb-2">
                      Validation Errors Found
                    </h3>
                    <div className="text-sm text-red-800 space-y-1">
                      {validationResult.errors.map((error: string, i: number) => (
                        <p key={i}>• {error}</p>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {validationResult.warnings.length > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h3 className="font-semibold text-yellow-900 mb-2">Warnings</h3>
                      <div className="text-sm text-yellow-800 space-y-1">
                        {validationResult.warnings.map((warning: string, i: number) => (
                          <p key={i}>• {warning}</p>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setStep('upload')
                    setFile(null)
                    setImportData([])
                  }}
                  className="btn-secondary"
                >
                  Fix File & Re-upload
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Confirm Import */}
          {step === 'confirm' && summary && (
            <div className="space-y-6">
              {/* Summary */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h3 className="font-semibold text-green-900 mb-3">
                      Ready to Import!
                    </h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-green-700">Total Students:</p>
                        <p className="text-2xl font-bold text-green-900">{summary.totalStudents}</p>
                      </div>
                      <div>
                        <p className="text-green-700">Sessions to Create:</p>
                        <p className="text-2xl font-bold text-green-900">{summary.totalSessions * totalSessionsPerStudent}</p>
                      </div>
                      <div>
                        <p className="text-green-700">New Students:</p>
                        <p className="text-lg font-semibold text-green-900">{summary.studentsToCreate}</p>
                      </div>
                      <div>
                        <p className="text-green-700">Existing Students:</p>
                        <p className="text-lg font-semibold text-green-900">{summary.studentsExisting}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Conflicts Warning */}
              {summary.conflicts && summary.conflicts.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h3 className="font-semibold text-red-900 mb-2">
                        ⚠️ Scheduling Conflicts Detected
                      </h3>
                      <div className="text-sm text-red-800 space-y-1">
                        {summary.conflicts.map((conflict: string, i: number) => (
                          <p key={i}>• {conflict}</p>
                        ))}
                      </div>
                      <p className="text-sm text-red-700 mt-3">
                        <strong>Note:</strong> These time slots are already booked. Import will fail for conflicting sessions.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Warnings */}
              {validationResult?.warnings.length > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h3 className="font-semibold text-yellow-900 mb-2">Warnings</h3>
                      <div className="text-sm text-yellow-800 space-y-1">
                        {validationResult.warnings.slice(0, 5).map((warning: string, i: number) => (
                          <p key={i}>• {warning}</p>
                        ))}
                        {validationResult.warnings.length > 5 && (
                          <p className="font-medium">... and {validationResult.warnings.length - 5} more</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Import Settings */}
              <div className="card bg-white">
                <h3 className="font-semibold mb-4">Import Settings</h3>
                <div className="space-y-4">
                  <div>
                    <label className="label">
                      Sessions Per Student
                    </label>
                    <select
                      value={totalSessionsPerStudent}
                      onChange={(e) => setTotalSessionsPerStudent(parseInt(e.target.value))}
                      className="input"
                    >
                      <option value={4}>4 sessions (1 month)</option>
                      <option value={8}>8 sessions (2 months)</option>
                      <option value={12}>12 sessions (3 months)</option>
                      <option value={16}>16 sessions (4 months)</option>
                      <option value={24}>24 sessions (6 months)</option>
                      <option value={48}>48 sessions (1 year)</option>
                    </select>
                    <p className="text-xs text-gray-500 mt-1">
                      Total sessions to generate for each student based on their weekly schedule
                    </p>
                  </div>

                  <div>
                    <label className="label">
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      className="input"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      When should the first sessions begin?
                    </p>
                  </div>
                </div>
              </div>

              {/* Preview */}
              <div className="card bg-white">
                <h3 className="font-semibold mb-3">Preview ({importData.length} students)</h3>
                <div className="max-h-64 overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th className="px-3 py-2 text-left">Student</th>
                        <th className="px-3 py-2 text-left">Email</th>
                        <th className="px-3 py-2 text-left">Schedule</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {importData.map((row, i) => (
                        <tr key={i} className="hover:bg-gray-50">
                          <td className="px-3 py-2">{row.studentName}</td>
                          <td className="px-3 py-2 text-gray-600">{row.studentEmail || 'No email'}</td>
                          <td className="px-3 py-2">
                            <div className="flex flex-wrap gap-1">
                              {row.dayTimePairs?.map((pair, j) => (
                                <span key={j} className="px-2 py-0.5 bg-primary-100 text-primary-700 rounded text-xs">
                                  {pair.day} {pair.time}
                                </span>
                              )) || row.days.split(',').map((day, j) => (
                                <span key={j} className="px-2 py-0.5 bg-primary-100 text-primary-700 rounded text-xs">
                                  {day.trim()} {row.time}
                                </span>
                              ))}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Processing */}
          {step === 'processing' && (
            <div className="py-12 text-center">
              <Loader2 className="w-16 h-16 animate-spin mx-auto text-primary-600 mb-4" />
              <h3 className="text-xl font-semibold mb-2">Importing Sessions...</h3>
              <p className="text-gray-600">
                Creating {summary?.totalStudents} bookings and {summary?.totalSessions * totalSessionsPerStudent} sessions
              </p>
              <p className="text-sm text-gray-500 mt-4">
                This may take a few moments. Please don't close this window.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 border-t px-6 py-4 flex gap-3 justify-end">
          {step !== 'processing' && (
            <>
              <button
                onClick={onClose}
                className="btn-secondary"
                disabled={importing}
              >
                Cancel
              </button>
              
              {step === 'upload' && (
                <button
                  onClick={() => document.querySelector<HTMLInputElement>('input[type="file"]')?.click()}
                  className="btn-primary"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Upload File
                </button>
              )}

              {step === 'confirm' && (
                <>
                  <button
                    onClick={() => {
                      setStep('upload')
                      setFile(null)
                    }}
                    className="btn-secondary"
                  >
                    Choose Different File
                  </button>
                  <button
                    onClick={handleImport}
                    disabled={importing || (summary?.conflicts && summary.conflicts.length > 0)}
                    className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {summary?.conflicts && summary.conflicts.length > 0 ? (
                      'Cannot Import (Conflicts)'
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Confirm Import
                      </>
                    )}
                  </button>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

