const fetchCaptionContent = async (
  fileName,
  { filesStatus, setCaptionContents, apiUrl }
) => {
  try {
    const response = await fetch(
      `${apiUrl}${filesStatus[fileName].downloadUrl}`
    );
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const captionText = await response.text();

    setCaptionContents((prev) => ({ ...prev, [fileName]: captionText }));
  } catch (error) {
    console.error("Failed to fetch caption content:", error);
  }
};

export default fetchCaptionContent;
