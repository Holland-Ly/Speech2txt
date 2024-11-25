const handleDelete = async (
  fileName,
  {
    filesStatus,
    videoPreviews,
    setFilesStatus,
    setPausedTasks,
    setFiles,
    setVideoPreviews,
    setCaptionContents,
    setStateChangeAction,
    apiUrl,
  }
) => {
  const taskId = filesStatus[fileName]?.taskId;

  try {
    // Only make API call if there's a taskId
    if (taskId) {
      const response = await fetch(`${apiUrl}/delete/${taskId}`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    }

    // Clean up preview if it exists
    if (videoPreviews[fileName]) {
      URL.revokeObjectURL(videoPreviews[fileName]);
    }

    // Remove from all state management
    setFilesStatus((prev) => {
      const newStatus = { ...prev };
      delete newStatus[fileName];
      return newStatus;
    });

    setPausedTasks((prev) => {
      const newPaused = { ...prev };
      delete newPaused[fileName];
      return newPaused;
    });

    setFiles((prev) => prev.filter((f) => f.name !== fileName));

    setVideoPreviews((prev) => {
      const newPreviews = { ...prev };
      delete newPreviews[fileName];
      return newPreviews;
    });

    setCaptionContents((prev) => {
      const newContents = { ...prev };
      delete newContents[fileName];
      return newContents;
    });

    setStateChangeAction("Delete");
  } catch (error) {
    console.error("Failed to delete:", error);
  }
};

export default handleDelete;
