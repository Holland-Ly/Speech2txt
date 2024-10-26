import React, { useState, useRef } from "react";
import "./main.scss";

function Main() {
  const [file, setFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [captionUrl, setCaptionUrl] = useState(null);
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
      setCaptionUrl(data.caption_url);
    } catch (error) {
      console.error("Error:", error);
      alert("Failed to upload video. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDownload = async () => {
    if (!captionUrl) return;

    try {
      const response = await fetch(`http://127.0.0.1:5000${captionUrl}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.style.display = "none";
      a.href = url;
      a.download = captionUrl.split("/").pop();
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
      {captionUrl && (
        <div className="caption-result">
          <h2>Caption Generated!</h2>
          <button onClick={handleDownload} className="download-button">
            Download Caption File
          </button>
        </div>
      )}
    </div>
  );
}

export default Main;
