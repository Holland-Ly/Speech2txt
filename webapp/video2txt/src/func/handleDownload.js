const handleDownload = async (fileName, type, { filesStatus, apiUrl }) => {
  if (!filesStatus[fileName].downloadUrl) return;

  try {
    const url =
      type === "audio"
        ? filesStatus[fileName].downloadUrl_audio
        : filesStatus[fileName].downloadUrl;

    const response = await fetch(`${apiUrl}${url}`, {
      credentials: "include",
      headers: {
        Accept: "application/json",
      },
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const blob = await response.blob();
    const downloadUrl = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = downloadUrl;
    a.download = `${fileName}.${type === "audio" ? "mp3" : "srt"}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(downloadUrl);
  } catch (error) {
    console.error("Failed to download:", error);
  }
};

export default handleDownload;
