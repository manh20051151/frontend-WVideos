/**
 * Upload ảnh lên Cloudinary - dùng cho logo/favicon site (ảnh dài hạn).
 * ImgBB free thay ảnh bằng placeholder "upgrade to Pro" khi ảnh được nhúng trong email,
 * mà logo site lại dùng trong email hệ thống ({{logo_block}}) nên phải đổi host.
 *
 * Yêu cầu cấu hình 1 LẦN trong Cloudinary Dashboard:
 *   Settings → Upload → Upload presets → Add upload preset
 *   → Signing Mode: Unsigned → Save (tên mặc định hoặc đặt "wvideos_unsigned")
 */

const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'dnvtmbmne';
const UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_PRESET || 'wvideos_unsigned';
const UPLOAD_URL = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`;

export interface CloudinaryUploadResult {
  success: boolean;
  url?: string;
  error?: string;
}

export async function uploadImageToCloudinary(file: File): Promise<CloudinaryUploadResult> {
  try {
    // Đọc file thành base64 data URL (Cloudinary nhận cả FormData file hoặc data URL)
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error('Không đọc được file ảnh'));
      reader.readAsDataURL(file);
    });

    const formData = new FormData();
    formData.append('file', dataUrl);
    formData.append('upload_preset', UPLOAD_PRESET);

    // Upload với timeout 30 giây
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    const response = await fetch(UPLOAD_URL, {
      method: 'POST',
      body: formData,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      // 400: preset chưa tạo / sai tên preset
      const detail = await response.json().catch(() => null);
      return {
        success: false,
        error: `Cloudinary trả về HTTP ${response.status}${detail?.error?.message ? `: ${detail.error.message}` : ''}`,
      };
    }

    const result = await response.json();
    if (result.secure_url) {
      return { success: true, url: result.secure_url };
    }
    return { success: false, error: 'Cloudinary không trả về URL ảnh' };
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      return { success: false, error: 'Upload timeout. Vui lòng thử lại với ảnh nhỏ hơn.' };
    }
    return { success: false, error: 'Không upload được ảnh lên Cloudinary' };
  }
}
