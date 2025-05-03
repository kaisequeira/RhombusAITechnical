"use client";

import type React from "react";

import { useState, useRef } from "react";
import { Card, CardBody } from "@heroui/card";
import { Button } from "@heroui/button";
import { Upload } from "lucide-react";

interface FileUploaderProps {
  onUploadStart: () => void;
  onProcessed: (data: any) => void;
  onError: (message: string) => void;
  onFileUpload: (file: File) => Promise<void>;
}

export function FileUploader({
  onUploadStart,
  onProcessed,
  onError,
  onFileUpload,
}: FileUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelection(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileSelection(e.target.files[0]);
    }
  };

  const handleFileSelection = async (file: File) => {
    if (
      !file.name.endsWith(".csv") &&
      !file.name.endsWith(".xlsx") &&
      !file.name.endsWith(".xls")
    ) {
      onError("Please upload a CSV or Excel file");

      return;
    }

    onUploadStart();

    try {
      await onFileUpload(file);
    } catch (error) {
      onError(
        error instanceof Error
          ? error.message
          : "An error occurred while processing the file",
      );
    }
  };

  return (
    <div className="w-full h-full">
      <Card
        className={`border-2 border-dashed h-full ${
          isDragging
            ? "border-primary-200 bg-foreground-200"
            : "border-foreground-800"
        } hover:border-primary-200 transition-colors cursor-pointer`}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <CardBody className="flex flex-col items-center justify-center py-12">
          <Upload className="text-foreground-500 mb-4" size={48} />
          <h3 className="text-xl font-semibold mb-2">Upload your file</h3>
          <p className="text-foreground-500 text-center mb-4">
            Drag and drop your CSV or Excel file here, or click to browse
          </p>
          <Button
            color="primary"
            variant="light"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (fileInputRef.current) {
                fileInputRef.current.click();
              }
            }}
          >
            Select File
          </Button>
          <p className="text-xs text-foreground-500 mt-4">
            Supported formats: CSV, Excel (.xlsx, .xls)
          </p>
        </CardBody>
      </Card>
      <input
        ref={fileInputRef}
        accept=".csv,.xlsx,.xls"
        className="hidden"
        type="file"
        onChange={handleFileChange}
      />
    </div>
  );
}
