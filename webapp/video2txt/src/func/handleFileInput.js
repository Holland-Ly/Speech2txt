const handleFileInput = async (
  e,
  {
    filesStatus,
    videoPreviews,
    setFiles,
    setFilesStatus,
    setVideoPreviews,
    setStateChangeAction,
    handleDelete,
  }
) => {
  const selectedFiles = Array.from(e.target.files).filter((file) =>
    file.type.startsWith("video/")
  );

  // Clean up existing files with the same names
  for (const file of selectedFiles) {
    if (filesStatus[file.name]) {
      // If file is being processed, use handleDelete
      if (filesStatus[file.name].taskId) {
        await handleDelete(file.name);
      } else {
        // Just clean up the preview if it's not being processed
        if (videoPreviews[file.name]) {
          URL.revokeObjectURL(videoPreviews[file.name]);
        }
      }
    }
  }

  // Now add the new files
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

  setFiles((prevFiles) => {
    const filteredFiles = prevFiles.filter(
      (f) => !selectedFiles.some((newFile) => newFile.name === f.name)
    );
    return [...filteredFiles, ...selectedFiles];
  });

  setFilesStatus((prev) => ({ ...prev, ...newFilesStatus }));
  setVideoPreviews((prev) => ({ ...prev, ...newVideoPreviews }));
  setStateChangeAction("File Input");

  // Reset the input value to allow selecting the same file again
  e.target.value = "";
};

export default handleFileInput;
