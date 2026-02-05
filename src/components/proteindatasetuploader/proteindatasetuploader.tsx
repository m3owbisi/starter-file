"use client";

import React, { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, File, CheckCircle, XCircle, X, AlertCircle } from "lucide-react";

// configuration parameters
const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20mb
const ACCEPTED_EXTENSIONS = [".pdb", ".csv", ".fasta", ".fa"];
const ACCEPTED_MIME_TYPES = {
  "chemical/x-pdb": [".pdb"],
  "text/csv": [".csv"],
  "application/x-fasta": [".fasta", ".fa"],
  "text/plain": [".pdb", ".csv", ".fasta", ".fa"],
};

// color configuration
const COLORS = {
  success: "#10b981",
  error: "#ef4444",
  progress: "#3b82f6",
};

interface UploadedFile {
  name: string;
  size: number;
  type: string;
  savedAs: string;
  path: string;
}

interface FileUploadState {
  file: File;
  progress: number;
  status: "uploading" | "success" | "error";
  error?: string;
  uploadedFile?: UploadedFile;
}

const ProteinDatasetUploader: React.FC = () => {
  const [fileStates, setFileStates] = useState<FileUploadState[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [tooltipError, setTooltipError] = useState<string | null>(null);

  const validateFile = (file: File): string | null => {
    // check file extension
    const fileName = file.name.toLowerCase();
    const extension = "." + fileName.split(".").pop();
    
    if (!ACCEPTED_EXTENSIONS.includes(extension)) {
      return "file type not supported. please upload .pdb, .csv, or .fasta files";
    }

    // check file size
    if (file.size > MAX_FILE_SIZE) {
      return "file size exceeds 20mb limit";
    }

    return null;
  };

  const uploadFile = async (file: File, index: number) => {
    const formData = new FormData();
    formData.append("file", file);

    try {
      const xhr = new XMLHttpRequest();
      
      xhr.upload.addEventListener("progress", (event) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded / event.total) * 100);
          setFileStates((prev) => 
            prev.map((state, i) => 
              i === index ? { ...state, progress } : state
            )
          );
        }
      });

      return new Promise<UploadedFile>((resolve, reject) => {
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            const response = JSON.parse(xhr.responseText);
            if (response.success) {
              resolve(response.file);
            } else {
              reject(new Error(response.error || "upload failed"));
            }
          } else {
            const response = JSON.parse(xhr.responseText);
            reject(new Error(response.error || "upload failed. please try again"));
          }
        };

        xhr.onerror = () => {
          reject(new Error("upload failed. please try again"));
        };

        xhr.open("POST", "/api/upload");
        xhr.send(formData);
      });
    } catch (error) {
      throw error;
    }
  };

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    setTooltipError(null);

    for (const file of acceptedFiles) {
      const validationError = validateFile(file);
      
      if (validationError) {
        setTooltipError(validationError);
        setTimeout(() => setTooltipError(null), 4000);
        continue;
      }

      const newIndex = fileStates.length;
      
      setFileStates((prev) => [
        ...prev,
        { file, progress: 0, status: "uploading" },
      ]);

      try {
        const uploadedFile = await uploadFile(file, newIndex);
        
        setFileStates((prev) =>
          prev.map((state, i) =>
            i === newIndex
              ? { ...state, progress: 100, status: "success", uploadedFile }
              : state
          )
        );

        setUploadedFiles((prev) => [...prev, uploadedFile]);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "upload failed. please try again";
        setTooltipError(errorMessage);
        setTimeout(() => setTooltipError(null), 4000);
        
        setFileStates((prev) =>
          prev.map((state, i) =>
            i === newIndex
              ? { ...state, status: "error", error: errorMessage }
              : state
          )
        );
      }
    }
  }, [fileStates.length]);

  const onDropRejected = useCallback((rejectedFiles: any[]) => {
    if (rejectedFiles.length > 0) {
      const firstError = rejectedFiles[0].errors[0];
      if (firstError.code === "file-too-large") {
        setTooltipError("file size exceeds 20mb limit");
      } else if (firstError.code === "file-invalid-type") {
        setTooltipError("file type not supported. please upload .pdb, .csv, or .fasta files");
      } else {
        setTooltipError("upload failed. please try again");
      }
      setTimeout(() => setTooltipError(null), 4000);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive, isDragAccept, isDragReject } = useDropzone({
    onDrop,
    onDropRejected,
    accept: ACCEPTED_MIME_TYPES,
    maxSize: MAX_FILE_SIZE,
    multiple: true,
  });

  const removeFile = (index: number) => {
    setFileStates((prev) => prev.filter((_, i) => i !== index));
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + " b";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " kb";
    return (bytes / (1024 * 1024)).toFixed(2) + " mb";
  };

  const getProgressBarColor = (status: string): string => {
    switch (status) {
      case "success":
        return COLORS.success;
      case "error":
        return COLORS.error;
      default:
        return COLORS.progress;
    }
  };

  return (
    <div className="protein-dataset-uploader">
      {/* error tooltip */}
      {tooltipError && (
        <div className="upload-tooltip upload-tooltip-error">
          <AlertCircle size={18} />
          <span>{tooltipError}</span>
        </div>
      )}

      {/* dropzone */}
      <div
        {...getRootProps()}
        className={`upload-dropzone ${
          isDragActive ? "upload-dropzone-active" : ""
        } ${isDragAccept ? "upload-dropzone-accept" : ""} ${
          isDragReject ? "upload-dropzone-reject" : ""
        }`}
      >
        <input {...getInputProps()} />
        <div className="upload-dropzone-content">
          <div className="upload-icon-wrapper">
            <Upload size={48} strokeWidth={1.5} />
          </div>
          <div className="upload-text">
            <p className="upload-text-primary">
              {isDragActive
                ? "drop your files here..."
                : "drag & drop protein dataset files here"}
            </p>
            <p className="upload-text-secondary">
              or click to browse your files
            </p>
          </div>
          <div className="upload-file-types">
            <span className="upload-file-type-badge">.pdb</span>
            <span className="upload-file-type-badge">.csv</span>
            <span className="upload-file-type-badge">.fasta</span>
            <span className="upload-file-type-badge">.fa</span>
          </div>
          <p className="upload-size-limit">maximum file size: 20mb</p>
        </div>
      </div>

      {/* file upload progress list */}
      {fileStates.length > 0 && (
        <div className="upload-file-list">
          <h3 className="upload-file-list-title">upload progress</h3>
          {fileStates.map((fileState, index) => (
            <div key={index} className="upload-file-item">
              <div className="upload-file-item-header">
                <div className="upload-file-info">
                  <File size={20} />
                  <div className="upload-file-details">
                    <span className="upload-file-name">{fileState.file.name}</span>
                    <span className="upload-file-size">
                      {formatFileSize(fileState.file.size)}
                    </span>
                  </div>
                </div>
                <div className="upload-file-status">
                  {fileState.status === "uploading" && (
                    <span className="upload-progress-text">{fileState.progress}%</span>
                  )}
                  {fileState.status === "success" && (
                    <CheckCircle size={20} style={{ color: COLORS.success }} />
                  )}
                  {fileState.status === "error" && (
                    <XCircle size={20} style={{ color: COLORS.error }} />
                  )}
                  <button
                    onClick={() => removeFile(index)}
                    className="upload-remove-btn"
                    aria-label="remove file"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>
              <div className="upload-progress-bar-container">
                <div
                  className="upload-progress-bar"
                  style={{
                    width: `${fileState.progress}%`,
                    backgroundColor: getProgressBarColor(fileState.status),
                  }}
                />
              </div>
              {fileState.status === "error" && fileState.error && (
                <p className="upload-error-message">{fileState.error}</p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* successfully uploaded files */}
      {uploadedFiles.length > 0 && (
        <div className="upload-success-list">
          <h3 className="upload-success-list-title">
            <CheckCircle size={20} style={{ color: COLORS.success }} />
            successfully uploaded files
          </h3>
          <div className="upload-success-files">
            {uploadedFiles.map((file, index) => (
              <div key={index} className="upload-success-file-item">
                <File size={18} />
                <div className="upload-success-file-info">
                  <span className="upload-success-file-name">{file.name}</span>
                  <span className="upload-success-file-meta">
                    {file.type.toUpperCase()} • {formatFileSize(file.size)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProteinDatasetUploader;
