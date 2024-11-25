const handleDrop = async (
  e,
  {
    setIsDragging,
    filesStatus,
    videoPreviews,
    setFiles,
    setFilesStatus,
    setVideoPreviews,
    setStateChangeAction,
    handleDelete,
  }
) => {
  e.preventDefault();
  setIsDragging(false);

  const droppedFiles = Array.from(e.dataTransfer.files).filter((file) =>
    file.type.startsWith("video/")
  );

  // Clean up existing files with the same names
  for (const file of droppedFiles) {
    if (filesStatus[file.name]) {
      if (filesStatus[file.name].taskId) {
        await handleDelete(file.name);
      } else {
        if (videoPreviews[file.name]) {
          URL.revokeObjectURL(videoPreviews[file.name]);
        }
      }
    }
  }

  // Now add the new files
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

  setFiles((prevFiles) => {
    const filteredFiles = prevFiles.filter(
      (f) => !droppedFiles.some((newFile) => newFile.name === f.name)
    );
    return [...filteredFiles, ...droppedFiles];
  });

  setFilesStatus((prev) => ({ ...prev, ...newFilesStatus }));
  setVideoPreviews((prev) => ({ ...prev, ...newVideoPreviews }));
  setStateChangeAction("File Drop");
};

export default handleDrop;
