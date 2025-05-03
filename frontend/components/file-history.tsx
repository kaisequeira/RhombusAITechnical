"use client";

import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
} from "@heroui/table";
import { Button } from "@heroui/button";
import { Chip } from "@heroui/chip";
import { Spinner } from "@heroui/spinner";
import { Delete, Download, FileSliders, RefreshCw } from "lucide-react";

import { FileData } from "@/app/page";

interface FileHistoryProps {
  files: FileData[];
  isLoading: boolean;
  onFetchFiles: () => Promise<void>;
  onDownload: (fileId: string) => Promise<void>;
  onDelete: (fileId: string) => Promise<boolean>;
  onPreview: (file: FileData) => void;
}

export function FileHistory({
  files,
  isLoading,
  onFetchFiles,
  onDownload,
  onDelete,
  onPreview,
}: FileHistoryProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6 py-4 h-full">
        {files.length !== 0 && (
          <div className="flex flex-row items-center justify-between text-center h-fit">
            <h2 className="text-xl font-semibold w-fit">Uploaded Files</h2>
            <Button
              className="w-fit"
              color="primary"
              startContent={<RefreshCw size={18} />}
              variant="flat"
              onClick={onFetchFiles}
            >
              Refresh
            </Button>
          </div>
        )}

        <div className="flex justify-center items-center p-4 h-full">
          <Spinner label="Loading files..." size="lg" />
        </div>
      </div>
    );
  }

  if (files.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center text-center h-full">
        <p className="text-foreground-500 mb-4 w-fit">
          No files have been uploaded yet
        </p>
        <Button
          className="w-fit"
          color="primary"
          startContent={<RefreshCw size={18} />}
          variant="flat"
          onClick={onFetchFiles}
        >
          Refresh
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 py-4">
      <div className="flex flex-row items-center justify-between text-center h-full">
        <h2 className="text-xl font-semibold w-fit">Uploaded Files</h2>
        <Button
          className="w-fit"
          color="primary"
          startContent={<RefreshCw size={18} />}
          variant="flat"
          onClick={onFetchFiles}
        >
          Refresh
        </Button>
      </div>

      <Table aria-label="Files history table">
        <TableHeader>
          <TableColumn>File Name</TableColumn>
          <TableColumn>Uploaded At</TableColumn>
          <TableColumn>Status</TableColumn>
          <TableColumn>Actions</TableColumn>
        </TableHeader>
        <TableBody>
          {files.map((file) => (
            <TableRow key={file.id}>
              <TableCell>{file.file_name}</TableCell>
              <TableCell>
                {file.uploaded_at ? formatDate(file.uploaded_at) : "N/a"}
              </TableCell>
              <TableCell>
                <Chip
                  color={file.processed ? "success" : "warning"}
                  size="sm"
                  variant="flat"
                >
                  {file.processed ? "Processed" : "Pending"}
                </Chip>
              </TableCell>
              <TableCell>
                <div className="flex gap-2">
                  {file.result && (
                    <>
                      <Button
                        color="secondary"
                        size="sm"
                        startContent={<FileSliders size={16} />}
                        variant="flat"
                        onClick={() => onPreview(file)}
                      >
                        Edit
                      </Button>
                      <Button
                        color="success"
                        size="sm"
                        startContent={<Download size={16} />}
                        variant="flat"
                        onClick={() => onDownload(file.id)}
                      >
                        Download
                      </Button>
                      <Button
                        color="danger"
                        size="sm"
                        startContent={<Delete size={16} />}
                        variant="flat"
                        onClick={() => onDelete(file.id)}
                      >
                        Delete
                      </Button>
                    </>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
