/**
 * Nén ảnh bằng Canvas API trước khi upload.
 * - Chỉ áp dụng cho file image/*.
 * - Giới hạn max dimension 1920px, quality 0.82.
 * - Fallback về file gốc nếu nén thất bại hoặc file không phải ảnh.
 */
async function compressImageFile(file: File): Promise<File> {
  if (!file.type.startsWith('image/')) return file;

  return new Promise((resolve) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      const MAX_DIM = 1920;
      let { width, height } = img;

      if (width > MAX_DIM || height > MAX_DIM) {
        if (width >= height) {
          height = Math.round((height * MAX_DIM) / width);
          width = MAX_DIM;
        } else {
          width = Math.round((width * MAX_DIM) / height);
          height = MAX_DIM;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(file);
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);

      // Giữ định dạng gốc; PNG giữ nguyên (lossless), JPEG nén quality 0.82
      const outputType = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
      const quality = outputType === 'image/png' ? undefined : 0.82;

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            resolve(file);
            return;
          }
          // Chỉ dùng bản nén nếu nhỏ hơn file gốc
          if (blob.size >= file.size) {
            resolve(file);
            return;
          }
          const compressed = new File([blob], file.name, { type: outputType, lastModified: Date.now() });
          resolve(compressed);
        },
        outputType,
        quality,
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(file);
    };

    img.src = objectUrl;
  });
}

export interface UploadEvidenceOptions {
  /** Callback trả về % tiến trình upload (0–100). */
  onProgress?: (percent: number) => void;
}

/**
 * Upload minh chứng lên Cloudinary.
 * - Tự động nén ảnh trước khi upload (image/*), giữ nguyên PDF.
 * - Hỗ trợ callback `onProgress` để hiển thị % tiến trình thực tế.
 */
export async function uploadEvidenceFile(
  file: File,
  options?: UploadEvidenceOptions,
): Promise<{ secureUrl: string; publicId: string }> {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME?.trim();
  const preset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET?.trim();
  if (!cloudName || !preset || /^\*+$/.test(cloudName) || /^\*+$/.test(preset)) {
    throw new Error('Thiếu cấu hình Cloudinary: kiểm tra NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME và NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET rồi khởi động/build lại ứng dụng.');
  }
  // Bước 1: Nén ảnh (chỉ image/*, fallback file gốc nếu lỗi)
  const fileToUpload = await compressImageFile(file);

  const formData = new FormData();
  formData.append('file', fileToUpload);
  formData.append('upload_preset', preset);

  // Bước 2: Upload qua XHR để bắt onprogress
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    if (options?.onProgress) {
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percent = Math.round((event.loaded / event.total) * 100);
          options.onProgress!(percent);
        }
      };
    }

    xhr.onload = () => {
      let data;
      try {
        data = JSON.parse(xhr.responseText);
      } catch {
        reject(Object.assign(new Error(`Phản hồi từ Cloudinary không hợp lệ (HTTP ${xhr.status}).`), { statusCode: xhr.status }));
        return;
      }
      if (xhr.status >= 200 && xhr.status < 300) {
        if (typeof data?.secure_url === 'string' && data.secure_url.trim() &&
            typeof data?.public_id === 'string' && data.public_id.trim()) {
          resolve({ secureUrl: data.secure_url, publicId: data.public_id });
        } else {
          reject(new Error('Phản hồi từ Cloudinary không hợp lệ.'));
        }
      } else {
        const reason = typeof data?.error?.message === 'string' ? ` ${data.error.message}` : '';
        reject(Object.assign(new Error(`Upload file lên Cloudinary thất bại (HTTP ${xhr.status}).${reason}`), { statusCode: xhr.status }));
      }
    };

    xhr.onerror = () => reject(new Error('Lỗi kết nối khi upload file lên Cloudinary.'));
    xhr.ontimeout = () => reject(new Error('Upload file bị timeout.'));
    xhr.onabort = () => reject(new Error('Upload file đã bị hủy.'));

    xhr.open('POST', `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`);
    xhr.timeout = 120_000;
    xhr.send(formData);
  });
}
