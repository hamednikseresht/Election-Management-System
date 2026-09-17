/**
 * Resizes and compresses an uploaded image file into a base64 JPEG
 * to ensure smooth offline storage and lightweight JSON exports.
 */
export function fileToBase64Optimized(file: File, maxDimension = 300, quality = 0.85): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('لطفاً یک فایل تصویری معتبر انتخاب کنید.'));
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxDimension) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          }
        } else {
          if (height > maxDimension) {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(e.target?.result as string);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(dataUrl);
      };

      img.onerror = () => reject(new Error('خطا در بارگذاری تصویر'));
      img.src = e.target?.result as string;
    };

    reader.onerror = () => reject(new Error('خطا در خواندن فایل'));
    reader.readAsDataURL(file);
  });
}
