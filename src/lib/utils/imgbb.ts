/**
 * Utility function to upload images to imgbb
 * Tối ưu: Sử dụng FormData, hỗ trợ resize ảnh trước khi upload để giảm kích thước
 */

const IMGBB_API_KEY = 'cb9fb6b332ad1a8b7d13f3452c047d7c';
const IMGBB_UPLOAD_URL = 'https://api.imgbb.com/1/upload';

// Giới hạn kích thước ảnh trước khi upload (tính bằng bytes) - 2MB
const MAX_FILE_SIZE = 2 * 1024 * 1024;

export interface ImgbbUploadResult {
  success: boolean;
  data?: {
    id: string;
    title: string;
    url: string;
    display_url: string;
    thumb: {
      url: string;
    };
    delete_url: string;
  };
  error?: string;
}

/**
 * Resize ảnh để tối ưu kích thước trước khi upload
 */
async function resizeImage(file: File, maxWidth: number = 1280, maxHeight: number = 720): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      reject(new Error('Không thể tạo canvas context'));
      return;
    }

    img.onload = () => {
      let { width, height } = img;

      // Tính toán tỷ lệ để resize
      if (width > maxWidth) {
        height = (maxWidth / width) * height;
        width = maxWidth;
      }
      if (height > maxHeight) {
        width = (maxHeight / height) * width;
        height = maxHeight;
      }

      canvas.width = width;
      canvas.height = height;
      ctx.drawImage(img, 0, 0, width, height);

      // Chuyển sang blob với chất lượng 0.8
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Không thể tạo blob từ canvas'));
          }
        },
        'image/jpeg',
        0.8
      );
    };

    img.onerror = () => reject(new Error('Không thể load ảnh'));
    img.src = URL.createObjectURL(file);
  });
}

/**
 * Chuyển file sang base64
 */
function fileToBase64(file: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Loại bỏ phần "data:image/...;base64,"
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Upload ảnh lên imgbb
 * @param file - File ảnh cần upload
 * @param name - Tên file (optional)
 * @returns ImgbbUploadResult
 */
export async function uploadImageToImgbb(
  file: File,
  name?: string
): Promise<ImgbbUploadResult> {
  try {
    // Kiểm tra file type
    if (!file.type.startsWith('image/')) {
      return {
        success: false,
        error: 'Vui lòng chọn file ảnh (JPG, PNG, GIF)',
      };
    }

    // Resize ảnh nếu quá lớn
    let fileToUpload: Blob = file;
    if (file.size > MAX_FILE_SIZE) {
      console.log('Resizing image before upload...');
      fileToUpload = await resizeImage(file);
    }

    // Chuyển sang base64
    const base64Image = await fileToBase64(fileToUpload);

    // Tạo FormData
    const formData = new FormData();
    formData.append('key', IMGBB_API_KEY);
    formData.append('image', base64Image);
    if (name) {
      formData.append('name', name);
    }

    // Upload với timeout 30 giây
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    const response = await fetch(IMGBB_UPLOAD_URL, {
      method: 'POST',
      body: formData,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();

    if (result.success) {
      return {
        success: true,
        data: result.data,
      };
    } else {
      return {
        success: false,
        error: result.error?.message || 'Upload thất bại',
      };
    }
  } catch (error) {
    console.error('Error uploading to imgbb:', error);
    
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        return {
          success: false,
          error: 'Upload timeout. Vui lòng thử lại với ảnh nhỏ hơn.',
        };
      }
      return {
        success: false,
        error: error.message,
      };
    }
    
    return {
      success: false,
      error: 'Có lỗi xảy ra khi upload ảnh',
    };
  }
}

/**
 * Validate ảnh trước khi upload
 * @param file - File cần validate
 * @param maxSize - Kích thước tối đa (bytes)
 * @returns Object với success và error
 */
export function validateImage(file: File, maxSize: number = 10 * 1024 * 1024): { success: boolean; error?: string } {
  // Kiểm tra type
  const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  if (!validTypes.includes(file.type)) {
    return {
      success: false,
      error: 'Chỉ hỗ trợ ảnh JPG, PNG, GIF, WebP',
    };
  }

  // Kiểm tra kích thước
  if (file.size > maxSize) {
    return {
      success: false,
      error: `Ảnh quá lớn. Tối đa ${(maxSize / 1024 / 1024).toFixed(1)}MB`,
    };
  }

  return { success: true };
}
