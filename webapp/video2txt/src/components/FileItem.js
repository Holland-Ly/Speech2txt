import React from "react";
import ReactPlayer from "react-player";
import debounce from "lodash.debounce";
import ActionButtons from "./ActionButtons";

const FileItem = ({
  fileName,
  status,
  videoPreviews,
  captionContents,
  handleUploadFile,
  handleDownload,
  updateCaptionContent,
  handlePauseResume,
  handleDelete,
  isPaused,
}) => {
  return (
    <div className="file-item">
      <div className="file-header w-100 row gx-0 ">
        <div className="file-name col-2  text-start ms-1">{fileName}</div>
        <div className="progress-container col-7">
          <div
            className="progress-bar"
            style={{ width: `${status.progress}%` }}
          />
          <span className="progress-text">{status.message}</span>
        </div>
        <div className="action-buttons col-1">
          <ActionButtons
            fileName={fileName}
            status={status}
            handleUploadFile={handleUploadFile}
            handleDownload={handleDownload}
            handlePauseResume={handlePauseResume}
            handleDelete={handleDelete}
            isPaused={isPaused}
          />
        </div>
        <button
          className="btn col-1"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target={`#collapse${fileName}`}
          aria-expanded="false"
          aria-controls={`collapse${fileName}`}
        >
          <i className="bi bi-caret-down-fill"></i>
        </button>
      </div>
      <div id={`collapse${fileName}`} className="collapse">
        <div className="video-preview">
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
                debounce(updateCaptionContent(fileName, e.target.value), 5000)
              }
            ></textarea>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default FileItem;
