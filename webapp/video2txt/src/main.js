import React, { useState, useRef, useEffect } from "react";
import "./main.scss";
import ReactPlayer from "react-player";
import "../node_modules/bootstrap/dist/css/bootstrap.min.css";
import "../node_modules/bootstrap/dist/js/bootstrap.bundle.min.js";
import "../node_modules/bootstrap-icons/font/bootstrap-icons.css";
import debounce from "./utils/debounce";
import updateCaptionContent from "./utils/updateCaptionContent";
function Main() {
  const [files, setFiles] = useState([]);
  const [filesStatus, setFilesStatus] = useState({});
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);
  const [videoPreviews, setVideoPreviews] = useState({});
  const [captionContents, setCaptionContents] = useState({});

  useEffect(() => {
    Object.entries(filesStatus).forEach(([fileName, status]) => {
      if (status.status === "completed" && status.downloadUrl) {
        fetchCaptionContent(fileName);
      }
    });
  }, [filesStatus]);

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

    const newFilesStatus = {};
    const newVideoPreviews = {};
    droppedFiles.forEach((file) => {
      newFilesStatus[file.name] = {
        name: file.name,
        status: "pending",
        message: "Waiting to upload...",
        progress: 0,
      };
      newVideoPreviews[file.name] = URL.createObjectURL(file);
    });

    setFiles((prevFiles) => [...prevFiles, ...droppedFiles]);
    setFilesStatus((prev) => ({ ...prev, ...newFilesStatus }));
    setVideoPreviews((prev) => ({ ...prev, ...newVideoPreviews }));
  };

  const handleFileInput = (e) => {
    const selectedFiles = Array.from(e.target.files).filter((file) =>
      file.type.startsWith("video/")
    );

    const newFilesStatus = {};
    const newVideoPreviews = {};
    selectedFiles.forEach((file) => {
      newFilesStatus[file.name] = {
        name: file.name,
        status: "pending",
        message: "Waiting to upload...",
        progress: 0,
      };
      newVideoPreviews[file.name] = URL.createObjectURL(file);
    });

    setFiles((prevFiles) => [...prevFiles, ...selectedFiles]);
    setFilesStatus((prev) => ({ ...prev, ...newFilesStatus }));
    setVideoPreviews((prev) => ({ ...prev, ...newVideoPreviews }));
  };

  const handleSubmit = async () => {
    if (files.length === 0) return;
    setIsUploading(true);

    for (const file of files) {
      const formData = new FormData();
      formData.append("video", file);

      try {
        const response = await fetch(
          `${process.env.REACT_APP_API_URL}/upload`,
          {
            method: "POST",
            body: formData,
          }
        );

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
      `${process.env.REACT_APP_API_URL}/progress/${taskId}`
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
          downloadUrlAudio: data.download_url_audio,
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

  const handleDownload = async (fileName, type) => {
    if (!filesStatus[fileName].downloadUrl) return;

    try {
      if (type === "caption" || type === "both") {
        const response = await fetch(
          `${process.env.REACT_APP_API_URL}${filesStatus[fileName].downloadUrl}`
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
      }

      if (type === "audio" || type === "both") {
        const audioResponse = await fetch(
          `${process.env.REACT_APP_API_URL}${filesStatus[fileName].downloadUrlAudio}`
        );
        if (!audioResponse.ok) {
          throw new Error(`HTTP error! status: ${audioResponse.status}`);
        }
        const audioBlob = await audioResponse.blob();
        const audioUrl = window.URL.createObjectURL(audioBlob);
        const audioLink = document.createElement("a");
        audioLink.style.display = "none";
        audioLink.href = audioUrl;
        audioLink.download = `${fileName}.wav`;
        document.body.appendChild(audioLink);
        audioLink.click();
        window.URL.revokeObjectURL(audioUrl);
      }
    } catch (error) {
      console.error("Download failed:", error);
      alert("Failed to download the file. Please try again.");
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

      const response = await fetch(`${process.env.REACT_APP_API_URL}/upload`, {
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

  const fetchCaptionContent = async (fileName) => {
    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}${filesStatus[fileName].downloadUrl}`
      );
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const captionText = await response.text();
      setCaptionContents((prev) => ({ ...prev, [fileName]: captionText }));
    } catch (error) {
      console.error("Failed to fetch caption content:", error);
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

      {Object.keys(filesStatus).length > 0 && (
        <div className="file-table">
          <table>
            <thead>
              <tr>
                <th width="20%">File Name</th>
                <th width="55%">Progress</th>
                <th width="20%">Action</th>
                <th width="5%"></th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(filesStatus).map(([fileName, status]) => (
                <React.Fragment key={fileName}>
                  <tr>
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
                      <div className="split-button-group">
                        {status.status === "pending" ? (
                          <>
                            <button
                              className="btn btn-primary"
                              onClick={() =>
                                handleUploadFile(
                                  files.find((f) => f.name === fileName)
                                )
                              }
                              disabled={status.status === "processing"}
                            >
                              <i className="bi bi-cloud-arrow-up-fill"></i>
                            </button>
                          </>
                        ) : status.downloadUrl ? (
                          <div>
                            <button
                              className="btn btn-primary me-2"
                              onClick={() =>
                                handleDownload(fileName, "caption")
                              }
                              disabled={status.status === "processing"}
                            >
                              <i className="bi bi-blockquote-left"></i>
                            </button>
                            <button
                              className="btn btn-primary"
                              onClick={() => handleDownload(fileName, "audio")}
                              disabled={status.status === "processing"}
                            >
                              <i className="bi bi-file-earmark-music"></i>
                            </button>
                          </div>
                        ) : (
                          <>
                            <button className="btn btn-primary" disabled>
                              <i className="bi bi-cloud-arrow-up-fill"></i>
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                    <td>
                      <button
                        className="btn"
                        type="button"
                        data-bs-toggle="collapse"
                        data-bs-target={`#collapse${fileName}`}
                        aria-expanded="false"
                        aria-controls={`collapse${fileName}`}
                      >
                        <i className="bi bi-caret-down-fill"></i>
                      </button>
                    </td>
                  </tr>
                  <tr id={`collapse${fileName}`} className="collapse">
                    <td colSpan="4">
                      <div className="video-preview">
                        {" "}
                        <ReactPlayer
                          className="video-preview"
                          url={videoPreviews[fileName]}
                          controls={true}
                          width="100%"
                        />
                      </div>
                      {captionContents[fileName] ? (
                        <div className="caption-content">
                          <textarea
                            className="form-control"
                            aria-label="With textarea"
                            defaultValue={captionContents[fileName]}
                            onChange={(e) =>
                              debounce(
                                updateCaptionContent(fileName, e.target.value),
                                5000
                              )
                            }
                          ></textarea>
                        </div>
                      ) : null}
                    </td>
                  </tr>
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default Main;
