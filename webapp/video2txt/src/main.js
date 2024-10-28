import React, { useState, useRef } from "react";
import "./main.scss";

function Main() {
  const [file, setFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [fileStatus, setFileStatus] = useState({
    name: "",
    progress: 0,
    status: "", // 'processing', 'completed', 'error'
    message: "",
    downloadUrl: null,
  });
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
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.type.startsWith("video/")) {
      setFile(droppedFile);
    }
  };

  const handleFileInput = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && selectedFile.type.startsWith("video/")) {
      setFile(selectedFile);
    }
  };

  const handleSubmit = async () => {
    if (!file) return;

    setIsUploading(true);
    setFileStatus({
      name: file.name,
      progress: 0,
      status: "processing",
      message: "Starting upload...",
      downloadUrl: null,
    });

    const formData = new FormData();
    formData.append("video", file);

    try {
      const response = await fetch("http://127.0.0.1:5000/upload", {
        method: "POST",
        body: formData,
        headers: {
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      startProgressMonitoring(data.task_id);
    } catch (error) {
      console.error("Error:", error);
      setFileStatus((prev) => ({
        ...prev,
        status: "error",
        message: "Upload failed",
      }));
    } finally {
      setIsUploading(false);
    }
  };

  const startProgressMonitoring = (taskId) => {
    const eventSource = new EventSource(
      `http://127.0.0.1:5000/progress/${taskId}`
    );

    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setFileStatus((prev) => ({
        ...prev,
        progress: data.progress,
        status: data.status,
        message: data.message,
        downloadUrl: data.download_url,
      }));

      if (data.status === "completed" || data.status === "error") {
        eventSource.close();
      }
    };

    eventSource.onerror = () => {
      eventSource.close();
      setFileStatus((prev) => ({
        ...prev,
        status: "error",
        message: "Connection lost",
      }));
    };
  };

  const handleDownload = async () => {
    if (!fileStatus.downloadUrl) return;

    try {
      const response = await fetch(
        `http://127.0.0.1:5000${fileStatus.downloadUrl}`
      );
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.style.display = "none";
      a.href = url;
      a.download = fileStatus.downloadUrl.split("/").pop();
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Download failed:", error);
      alert("Failed to download the caption file. Please try again.");
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
        <p>
          {file
            ? file.name
            : "Drag and drop a video file here, or click to select"}
        </p>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileInput}
          accept="video/*"
          style={{ display: "none" }}
        />
      </div>
      <button
        className="submit-button"
        onClick={handleSubmit}
        disabled={!file || isUploading}
      >
        {isUploading ? "Uploading..." : "Submit"}
      </button>

      {fileStatus.name && (
        <div className="file-table">
          <table>
            <thead>
              <tr>
                <th width="20%">File Name</th>
                <th width="70%">Progress</th>
                <th width="10%">Action</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>{fileStatus.name}</td>
                <td>
                  <div className="progress-container">
                    <div
                      className="progress-bar"
                      style={{ width: `${fileStatus.progress}%` }}
                    />
                    <span className="progress-text">
                      {fileStatus.message} ({fileStatus.progress}%)
                    </span>
                  </div>
                </td>
                <td>
                  {fileStatus.downloadUrl && (
                    <button
                      onClick={handleDownload}
                      className="download-button"
                    >
                      Download
                    </button>
                  )}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default Main;
