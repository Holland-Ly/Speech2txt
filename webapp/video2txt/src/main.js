import React, { useState, useRef } from "react";
import "./main.scss";

function Main() {
  const [files, setFiles] = useState([]);
  const [filesStatus, setFilesStatus] = useState({});
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFiles = Array.from(e.dataTransfer.files).filter((file) =>
      file.type.startsWith("video/")
    );

    // Add files to status immediately
    const newFilesStatus = {};
    droppedFiles.forEach((file) => {
      newFilesStatus[file.name] = {
        name: file.name,
        status: "pending", // new status for files not yet uploaded
        message: "Waiting to upload...",
        progress: 0,
      };
    });

    setFiles((prevFiles) => [...prevFiles, ...droppedFiles]);
    setFilesStatus((prev) => ({ ...prev, ...newFilesStatus }));
  };

  const handleFileInput = (e) => {
    const selectedFiles = Array.from(e.target.files).filter((file) =>
      file.type.startsWith("video/")
    );

    const newFilesStatus = {};
    selectedFiles.forEach((file) => {
      newFilesStatus[file.name] = {
        name: file.name,
        message: "Ready to upload",
        progress: 0,
      };
    });

    setFiles((prevFiles) => [...prevFiles, ...selectedFiles]);
    setFilesStatus((prev) => ({ ...prev, ...newFilesStatus }));
  };

  const handleSubmit = async () => {
    if (files.length === 0) return;
    setIsUploading(true);

    for (const file of files) {
      const formData = new FormData();
      formData.append("video", file);

      try {
        const response = await fetch("http://127.0.0.1:5000/upload", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        setFilesStatus((prev) => ({
          ...prev,
          [file.name]: {
            name: file.name,
            progress: 0,
            status: "processing",
            message: "Starting processing...",
            downloadUrl: null,
            taskId: data.task_id,
          },
        }));
        startProgressMonitoring(data.task_id, file.name);
      } catch (error) {
        setFilesStatus((prev) => ({
          ...prev,
          [file.name]: {
            name: file.name,
            status: "error",
            message: "Upload failed",
          },
        }));
      }
    }
    setIsUploading(false);
  };

  const startProgressMonitoring = (taskId, fileName) => {
    const eventSource = new EventSource(
      `http://127.0.0.1:5000/progress/${taskId}`
    );

    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setFilesStatus((prev) => ({
        ...prev,
        [fileName]: {
          ...prev[fileName],
          progress: data.progress,
          status: data.status,
          message: data.message,
          downloadUrl: data.download_url,
        },
      }));

      if (data.status === "completed" || data.status === "error") {
        eventSource.close();
      }
    };

    eventSource.onerror = () => {
      eventSource.close();
      setFilesStatus((prev) => ({
        ...prev,
        [fileName]: {
          ...prev[fileName],
          status: "error",
          message: "Connection lost",
        },
      }));
    };
  };

  const handleDownload = async (fileName) => {
    if (!filesStatus[fileName].downloadUrl) return;

    try {
      const response = await fetch(
        `http://127.0.0.1:5000${filesStatus[fileName].downloadUrl}`
      );
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.style.display = "none";
      a.href = url;
      a.download = filesStatus[fileName].downloadUrl.split("/").pop();
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Download failed:", error);
      alert("Failed to download the caption file. Please try again.");
    }
  };

  const handleUploadFile = async (file) => {
    const formData = new FormData();
    formData.append("video", file);

    try {
      setFilesStatus((prev) => ({
        ...prev,
        [file.name]: {
          ...prev[file.name],
          status: "uploading",
          message: "Uploading...",
        },
      }));

      const response = await fetch("http://127.0.0.1:5000/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setFilesStatus((prev) => ({
        ...prev,
        [file.name]: {
          ...prev[file.name],
          status: "processing",
          message: "Starting processing...",
          taskId: data.task_id,
        },
      }));
      startProgressMonitoring(data.task_id, file.name);
    } catch (error) {
      setFilesStatus((prev) => ({
        ...prev,
        [file.name]: {
          ...prev[file.name],
          status: "error",
          message: "Upload failed",
        },
      }));
    }
  };

  return (
    <div className="container">
      <h1>Video to Text Converter</h1>
      <div
        className={`drop-zone ${isDragging ? "dragging" : ""}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current.click()}
      >
        <p>Drag and drop video files here, or click to select</p>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileInput}
          accept="video/*"
          multiple
          style={{ display: "none" }}
        />
      </div>
      <button
        className="submit-button"
        onClick={handleSubmit}
        disabled={files.length === 0 || isUploading}
      >
        {isUploading ? "Uploading..." : "Submit"}
      </button>

      {Object.keys(filesStatus).length > 0 && (
        <div className="file-table">
          <table>
            <thead>
              <tr>
                <th width="30%">File Name</th>
                <th width="50%">Progress</th>
                <th width="20%">Action</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(filesStatus).map(([fileName, status]) => (
                <tr key={fileName}>
                  <td>{fileName}</td>
                  <td>
                    <div className="progress-container">
                      <div
                        className="progress-bar"
                        style={{ width: `${status.progress}%` }}
                      />
                      <span className="progress-text">{status.message}</span>
                    </div>
                  </td>
                  <td>
                    {!status.taskId ? (
                      <button
                        className="upload-button"
                        onClick={() =>
                          handleUploadFile(
                            files.find((f) => f.name === fileName)
                          )
                        }
                      >
                        Upload
                      </button>
                    ) : status.downloadUrl ? (
                      <button
                        className="download-button"
                        onClick={() => handleDownload(fileName)}
                      >
                        Download
                      </button>
                    ) : (
                      <button className="upload-button" disabled>
                        Processing...
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default Main;
