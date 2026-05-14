export function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function downloadMultipleBlobs(blobs: { blob: Blob; name: string }[]) {
  blobs.forEach(({ blob, name }, index) => {
    setTimeout(() => downloadBlob(blob, name), index * 200);
  });
}
