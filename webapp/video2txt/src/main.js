import React, { useState, useRef, useEffect } from "react";
import "./main.scss";

import "../node_modules/bootstrap/dist/css/bootstrap.min.css";
import "../node_modules/bootstrap/dist/js/bootstrap.bundle.min.js";
import "../node_modules/bootstrap-icons/font/bootstrap-icons.css";

import updateCaptionContent from "./utils/updateCaptionContent";
import FileItem from "./components/FileItem";
import handleDelete from "./func/handleDelete";
import handlePauseResume from "./func/handlePauseResume";
import handleDrop from "./func/handleDrop";
import handleFileInput from "./func/handleFileInput";
import logStateChanges from "./func/logStateChanges";
import handleDownload from "./func/handleDownload";
import handleUploadFile from "./func/handleUploadFile";
import fetchCaptionContent from "./utils/fetchCaptionContent";

function Main() {
  const [files, setFiles] = useState([]);
  const [filesStatus, setFilesStatus] = useState({});
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);
  const [videoPreviews, setVideoPreviews] = useState({});
  const [captionContents, setCaptionContents] = useState({});
  const [pausedTasks, setPausedTasks] = useState({});
  const [stateChangeAction, setStateChangeAction] = useState(null);

  useEffect(() => {
    /* logStateChanges(stateChangeAction, {
      files,
      filesStatus,
      videoPreviews,
      captionContents,
      pausedTasks,
      setStateChangeAction,
    });
  */
  }, [
    files,
    filesStatus,
    videoPreviews,
    captionContents,
    pausedTasks,
    stateChangeAction,
  ]);

  useEffect(() => {
    Object.entries(filesStatus).forEach(([fileName, status]) => {
      if (status.status === "completed" && status.downloadUrl) {
        fetchCaptionContent(fileName, {
          filesStatus,
          setCaptionContents,
          apiUrl: process.env.REACT_APP_API_URL,
        });
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

  const handleDropWrapper = (e) => {
    return handleDrop(e, {
      setIsDragging,
      filesStatus,
      videoPreviews,
      setFiles,
      setFilesStatus,
      setVideoPreviews,
      setStateChangeAction,
      handleDelete: handleDeleteWrapper,
    });
  };

  const handleFileInputWrapper = (e) => {
    return handleFileInput(e, {
      filesStatus,
      videoPreviews,
      setFiles,
      setFilesStatus,
      setVideoPreviews,
      setStateChangeAction,
      handleDelete: handleDeleteWrapper,
    });
  };

  const startProgressMonitoring = (taskId, fileName) => {
    const eventSource = new EventSource(
      `${process.env.REACT_APP_API_URL}/progress/${taskId}`
    );

    eventSource.onmessage = async (event) => {
      const data = JSON.parse(event.data);
      console.log("Progress data received:", data);

      // First update the file status
      await setFilesStatus((prev) => ({
        ...prev,
        [fileName]: {
          ...prev[fileName],
          progress: data.progress,
          status: data.status,
          message: data.message,
          downloadUrl: data.download_url,
          downloadUrlAudio: data.download_url_audio,
          taskId: taskId,
        },
      }));

      // If completed, ensure we have the latest state before fetching captions
      if (data.status === "completed") {
        console.log("Processing completed for:", fileName);
        console.log("Download URLs:", {
          caption: data.download_url,
          audio: data.download_url_audio,
        });

        // Wait for state update to complete
        setTimeout(() => {
          if (data.download_url) {
            fetchCaptionContent(fileName, {
              filesStatus,
              setCaptionContents,
              apiUrl: process.env.REACT_APP_API_URL,
            });
          }
        }, 1000);

        eventSource.close();
      } else if (data.status === "error") {
        eventSource.close();
      }
    };

    eventSource.onerror = () => {
      console.error("EventSource error for:", fileName);
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

  const handleDownloadWrapper = (fileName, type) => {
    return handleDownload(fileName, type, {
      filesStatus,
      apiUrl: process.env.REACT_APP_API_URL,
    });
  };

  const handleUploadFileWrapper = (fileName) => {
    return handleUploadFile(fileName, {
      files,
      setFilesStatus,
      setStateChangeAction,
      apiUrl: process.env.REACT_APP_API_URL,
      startProgressMonitoring,
    });
  };

  const handleDeleteWrapper = (fileName) => {
    return handleDelete(fileName, {
      filesStatus,
      videoPreviews,
      setFilesStatus,
      setPausedTasks,
      setFiles,
      setVideoPreviews,
      setCaptionContents,
      setStateChangeAction,
      apiUrl: process.env.REACT_APP_API_URL,
    });
  };

  const handlePauseResumeWrapper = (fileName) => {
    return handlePauseResume(fileName, {
      filesStatus,
      pausedTasks,
      setPausedTasks,
      setFilesStatus,
      setStateChangeAction,
      apiUrl: process.env.REACT_APP_API_URL,
    });
  };

  return (
    <div className="container">
      <h1>Video to Text Converter</h1>
      <div
        className={`drop-zone ${isDragging ? "dragging" : ""}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDropWrapper}
        onClick={() => fileInputRef.current.click()}
      >
        <p>Drag and drop video files here, or click to select</p>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileInputWrapper}
          accept="video/*"
          multiple
          style={{ display: "none" }}
        />
      </div>

      {Object.keys(filesStatus).length > 0 && (
        <div className="file-list">
          {Object.entries(filesStatus).map(([fileName, status]) => (
            <FileItem
              key={fileName}
              fileName={fileName}
              status={status}
              videoPreviews={videoPreviews}
              captionContents={captionContents}
              handleUploadFile={handleUploadFileWrapper}
              handleDownload={handleDownloadWrapper}
              updateCaptionContent={updateCaptionContent}
              handlePauseResume={handlePauseResumeWrapper}
              handleDelete={handleDeleteWrapper}
              isPaused={!!pausedTasks[fileName]}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default Main;
