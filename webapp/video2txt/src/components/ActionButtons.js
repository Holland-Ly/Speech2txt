import React from "react";

const ActionButtons = ({
  fileName,
  status,
  handleUploadFile,
  handleDownload,
  handlePauseResume,
  handleDelete,
  isPaused,
}) => {
  return (
    <div className="action-buttons">
      {status.status === "processing" && (
        <div className="row justify-content-center">
          <button
            className={`btn ${isPaused ? "col-5" : ""}`}
            onClick={() => handlePauseResume(fileName)}
          >
            <i
              className={`bi  ${isPaused ? "bi-play-fill " : "bi-pause-fill"}`}
            ></i>
          </button>
          {isPaused && (
            <button
              className="btn col-5"
              onClick={() => handleDelete(fileName)}
            >
              <i className="bi bi-trash"></i>
            </button>
          )}
        </div>
      )}
      {status.status === "pending" && (
        <div className="row justify-content-center">
          <button
            className="btn col-5"
            onClick={() => {
              handleUploadFile(fileName);
            }}
            disabled={status.status === "processing"}
          >
            <i className="bi bi-cloud-arrow-up-fill"></i>
          </button>
          <button className="btn col-5" onClick={() => handleDelete(fileName)}>
            <i className="bi bi-trash"></i>
          </button>
        </div>
      )}
      {status.downloadUrl && (
        <div className="row justify-content-center">
          <button
            className="btn col-5"
            onClick={() => handleDownload(fileName, "caption")}
            disabled={status.status === "processing"}
          >
            <i className="bi bi-blockquote-left"></i>
          </button>
          <button
            className="btn col-5"
            onClick={() => handleDownload(fileName, "audio")}
            disabled={status.status === "processing"}
          >
            <i className="bi bi-file-earmark-music"></i>
          </button>
        </div>
      )}
    </div>
  );
};

export default ActionButtons;
