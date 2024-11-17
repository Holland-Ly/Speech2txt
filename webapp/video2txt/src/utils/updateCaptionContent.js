const updateCaptionContent = async (fileName, updatedContent) => {
  try {
    const response = await fetch(
      `${process.env.REACT_APP_API_URL}/update-caption/${fileName}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ content: updatedContent }),
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    console.log("Caption updated successfully");
  } catch (error) {
    console.error("Failed to update caption content:", error);
  }
};

export default updateCaptionContent;
