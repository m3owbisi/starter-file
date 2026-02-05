"use client";

import React, { useCallback, useState } from "react";
import { Upload, FileText, X, AlertCircle, CheckCircle } from "lucide-react";
import { validatePdb, extractProteinName } from "@/lib/proteinViewer/pdbParser";

interface PdbUploaderProps {
  onFileLoad: (content: string, fileName: string) => void;
  isLoading: boolean;
}

const PdbUploader: React.FC<PdbUploaderProps> = ({ onFileLoad, isLoading }) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileInfo, setFileInfo] = useState<{
    name: string;
    size: string;
    proteinName: string;
  } | null>(null);

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} b`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} kb`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} mb`;
  };

  const processFile = useCallback(
    async (file: File) => {
      setError(null);

      // check file extension
      const validExtensions = [".pdb", ".ent"];
      const hasValidExtension = validExtensions.some((ext) =>
        file.name.toLowerCase().endsWith(ext)
      );

      if (!hasValidExtension) {
        setError("please upload a valid pdb file (.pdb or .ent)");
        return;
      }

      // check file size (max 10mb)
      const maxSize = 10 * 1024 * 1024;
      if (file.size > maxSize) {
        setError("file size exceeds 10mb limit");
        return;
      }

      try {
        const content = await file.text();
        const validation = validatePdb(content);

        if (!validation.valid) {
          setError(validation.error || "invalid pdb file format");
          return;
        }

        const proteinName = extractProteinName(content);
        setFileName(file.name);
        setFileInfo({
          name: file.name.toLowerCase(),
          size: formatFileSize(file.size),
          proteinName: proteinName,
        });

        onFileLoad(content, file.name);
      } catch (err) {
        setError("failed to read file");
        console.error(err);
      }
    },
    [onFileLoad]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragOver(false);

      const files = e.dataTransfer.files;
      if (files.length > 0) {
        processFile(files[0]);
      }
    },
    [processFile]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        processFile(files[0]);
      }
    },
    [processFile]
  );

  const clearFile = useCallback(() => {
    setFileName(null);
    setFileInfo(null);
    setError(null);
  }, []);

  return (
    <div className="w-full">
      {/* drop zone */}
      <div
        className={`
          relative rounded-2xl border-2 border-dashed transition-all duration-300 overflow-hidden
          ${
            isDragOver
              ? "border-primary bg-primary/10 scale-[1.02]"
              : error
              ? "border-red/50 bg-red/5"
              : fileInfo
              ? "border-meta-3/50 bg-meta-3/5"
              : "border-gray-600/50 bg-gray-800/30 hover:border-primary/50 hover:bg-gray-800/50"
          }
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {/* background gradient effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 pointer-events-none" />

        <div className="relative p-8">
          {isLoading ? (
            // loading state
            <div className="flex flex-col items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center animate-pulse">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
              <p className="text-gray-400 text-sm">loading structure...</p>
            </div>
          ) : fileInfo ? (
            // file loaded state
            <div className="flex flex-col items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-meta-3/20 flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-meta-3" />
              </div>
              <div className="text-center">
                <p className="text-white font-medium text-lg">{fileInfo.proteinName}</p>
                <p className="text-gray-400 text-sm mt-1">
                  {fileInfo.name} • {fileInfo.size}
                </p>
              </div>
              <button
                onClick={clearFile}
                className="flex items-center gap-2 px-4 py-2 bg-gray-700/50 hover:bg-gray-600/50 rounded-lg transition-colors text-gray-300 text-sm"
              >
                <X size={16} />
                clear & upload new
              </button>
            </div>
          ) : (
            // default upload state
            <label className="flex flex-col items-center gap-4 cursor-pointer">
              <div
                className={`
                w-20 h-20 rounded-2xl flex items-center justify-center transition-all duration-300
                ${
                  isDragOver
                    ? "bg-primary/30 scale-110"
                    : "bg-gradient-to-br from-primary/20 to-secondary/20"
                }
              `}
              >
                <Upload
                  className={`w-10 h-10 transition-all duration-300 ${
                    isDragOver ? "text-primary scale-110" : "text-gray-400"
                  }`}
                />
              </div>

              <div className="text-center">
                <p className="text-white font-medium text-lg mb-1">
                  {isDragOver ? "drop your file here" : "upload pdb file"}
                </p>
                <p className="text-gray-400 text-sm">
                  drag & drop or click to browse
                </p>
                <p className="text-gray-500 text-xs mt-2">
                  supports .pdb and .ent files up to 10mb
                </p>
              </div>

              <input
                type="file"
                accept=".pdb,.ent"
                onChange={handleFileInput}
                className="hidden"
              />
            </label>
          )}

          {/* error message */}
          {error && (
            <div className="absolute bottom-4 left-4 right-4 flex items-center gap-2 px-4 py-3 bg-red/10 border border-red/30 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red flex-shrink-0" />
              <span className="text-red text-sm">{error}</span>
              <button
                onClick={() => setError(null)}
                className="ml-auto text-red hover:text-white transition-colors"
              >
                <X size={16} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* sample files hint */}
      {!fileInfo && !isLoading && (
        <div className="mt-4 flex items-center gap-2 text-gray-500 text-xs justify-center">
          <FileText size={14} />
          <span>
            try sample pdb files: 1ubq (ubiquitin), 1crn (crambin), 4hhb
            (hemoglobin)
          </span>
        </div>
      )}
    </div>
  );
};

export default PdbUploader;
