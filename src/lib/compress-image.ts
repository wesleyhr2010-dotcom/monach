/**
 * Comprime uma imagem no cliente usando Canvas API.
 * Retorna um Blob como File JPEG.
 */
export async function compressImage(file: File): Promise<File> {
  if (file.type === "application/pdf") return file;

  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);

      const maxWidthOrHeight = 1920;
      let { width, height } = img;

      if (width > height && width > maxWidthOrHeight) {
        height = Math.round((height * maxWidthOrHeight) / width);
        width = maxWidthOrHeight;
      } else if (height > maxWidthOrHeight) {
        width = Math.round((width * maxWidthOrHeight) / height);
        height = maxWidthOrHeight;
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("No se pudo crear contexto de canvas"));
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error("Falló la compresión de imagen"));
            return;
          }
          const compressed = new File([blob], file.name, {
            type: "image/jpeg",
            lastModified: Date.now(),
          });
          resolve(compressed);
        },
        "image/jpeg",
        0.85
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("No se pudo cargar la imagen para comprimir"));
    };

    img.src = url;
  });
}
