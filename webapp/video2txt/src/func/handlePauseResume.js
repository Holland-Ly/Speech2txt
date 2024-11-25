const handlePauseResume = async (
  fileName,
  {
    filesStatus,
    pausedTasks,
    setPausedTasks,
    setFilesStatus,
    setStateChangeAction,
    apiUrl,
  }
) => {
  const taskId = filesStatus[fileName]?.taskId;
  if (!taskId) return;

  try {
    const newPauseState = !pausedTasks[fileName];

    setPausedTasks((prev) => ({
      ...prev,
      [fileName]: newPauseState,
    }));

    const response = await fetch(`${apiUrl}/pause/${taskId}`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        paused: newPauseState,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    setFilesStatus((prev) => ({
      ...prev,
      [fileName]: {
        ...prev[fileName],
        message: newPauseState ? "Paused" : "Processing...",
      },
    }));

    setStateChangeAction("Pause/Resume");
  } catch (error) {
    console.error("Failed to pause/resume:", error);
  }
};

export default handlePauseResume;
