import { safeMediaUrl } from "@shared/kuryelerSecurity";

export function compressImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Fotoğraf okunamadı"));
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const max = 640;
        const scale = Math.min(1, max / Math.max(img.width, img.height));
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Fotoğraf işlenemedi"));
          return;
        }
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", 0.62));
      };
      img.onerror = () => reject(new Error("Fotoğraf açılamadı"));
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}

export async function fileToSafePhoto(file: File): Promise<string | null> {
  if (!/^image\/(jpeg|png|webp)$/i.test(file.type)) return null;
  const dataUrl = await compressImage(file);
  return safeMediaUrl(dataUrl);
}
