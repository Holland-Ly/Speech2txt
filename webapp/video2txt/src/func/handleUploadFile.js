const handleUploadFile = async (
  fileName,
  {
    files,
    setFilesStatus,
    setStateChangeAction,
    apiUrl,
    startProgressMonitoring,
  }
) => {
  const file = files.find((f) => f.name === fileName);
  if (!file) return;

  try {
    const formData = new FormData();
    formData.append("video", file);

    setFilesStatus((prev) => ({
      ...prev,
      [fileName]: {
        ...prev[fileName],
        status: "uploading",
        message: "Uploading...",
      },
    }));

    const response = await fetch(`${apiUrl}/upload`, {
      method: "POST",
      body: formData,
      credentials: "include",
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    setFilesStatus((prev) => ({
      ...prev,
      [fileName]: {
        ...prev[fileName],
        status: "processing",
        message: "Processing...",
        taskId: data.task_id,
      },
    }));

    setStateChangeAction("Upload Started");
    startProgressMonitoring(data.task_id, file.name);
  } catch (error) {
    setFilesStatus((prev) => ({
      ...prev,
      [fileName]: {
        ...prev[fileName],
        status: "error",
        message: "Upload failed",
      },
    }));
    console.error("Failed to upload:", error);
  }
};

export default handleUploadFile;
