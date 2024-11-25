const logStateChanges = (
  stateChangeAction,
  {
    files,
    filesStatus,
    videoPreviews,
    captionContents,
    pausedTasks,
    setStateChangeAction,
  }
) => {
  if (stateChangeAction) {
    console.group(
      `State Update After: ${stateChangeAction} - ${new Date().toISOString()}`
    );
    console.log(
      "Files:",
      files.map((f) => ({ name: f.name, size: f.size }))
    );
    console.log(
      "Files Status:",
      Object.fromEntries(
        Object.entries(filesStatus).map(([k, v]) => [
          k,
          {
            status: v.status,
            progress: v.progress,
            message: v.message,
          },
        ])
      )
    );
    console.log("Video Previews:", Object.keys(videoPreviews));
    console.log("Caption Contents:", Object.keys(captionContents));
    console.log("Paused Tasks:", pausedTasks);
    console.groupEnd();

    // Reset the action
    setStateChangeAction(null);
  }
};

export default logStateChanges;
