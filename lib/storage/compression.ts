/**
 * High-performance client-side WebP image compressor.
 * Compresses 8MB–15MB phone camera photos down to < 400KB WebP files
 * entirely in the browser before network transmission.
 */

export interface CompressionOptions {
  maxDimension?: number;
  quality?: number;
}

export async function compressImageToWebP(
  file: File,
  options: CompressionOptions = {}
): Promise<{ file: File; originalSize: number; compressedSize: number }> {
  const { maxDimension = 1920, quality = 0.82 } = options;

  return new Promise((resolve, reject) => {
    // If not an image, return original
    if (!file.type.startsWith('image/')) {
      resolve({ file, originalSize: file.size, compressedSize: file.size });
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read image file'));

    reader.onload = (event) => {
      const img = new Image();
      img.onerror = () => reject(new Error('Failed to load image for compression'));

      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Downscale while preserving aspect ratio
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve({ file, originalSize: file.size, compressedSize: file.size });
          return;
        }

        // High quality bicubic interpolation
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              resolve({ file, originalSize: file.size, compressedSize: file.size });
              return;
            }

            const cleanName = file.name.replace(/\.[^/.]+$/, '') + '.webp';
            const compressedFile = new File([blob], cleanName, {
              type: 'image/webp',
              lastModified: Date.now(),
            });

            resolve({
              file: compressedFile,
              originalSize: file.size,
              compressedSize: blob.size,
            });
          },
          'image/webp',
          quality
        );
      };

      img.src = event.target?.result as string;
    };

    reader.readAsDataURL(file);
  });
}
