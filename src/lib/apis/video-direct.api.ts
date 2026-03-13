import axiosClient from './axiosClient';
import type { ApiResponse } from '@/types';
import { VideoResponse } from '../../types/video.types';

export interface VideoInitUploadData {
  title: string;
  description?: string;
  isPublic: boolean;
  categoryIds: string[];
  tags?: string[];
  thumbnailUrl?: string;
}

export interface VideoInitUploadResponse {
  videoId: string;
  uploadServerUrl: string;
  uploadToken: string;
  status: string;
}

export interface VideoUploadData {
  title: string;
  description?: string;
  isPublic: boolean;
  categoryIds: string[];
  tags?: string[];
  thumbnailUrl?: string;
}

export const videoApi = {
  // Legacy upload
  uploadVideo: async (file: File, data: VideoUploadData): Promise<VideoResponse> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('data', JSON.stringify(data));

    const response = await axiosClient.post<ApiResponse<VideoResponse>>(
      '/videos/upload',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );

    return response.data.result!;
  },

  // New direct upload flow
  initUpload: async (data: VideoInitUploadData): Promise<VideoInitUploadResponse> => {
    // axiosClient đã unwrap response.data.result hoặc response.data trong interceptor
    const result: any = await axiosClient.post(
      '/videos/init-upload',
      data
    );

    console.log('Init upload result:', result);

    if (!result) {
      throw new Error('Empty response from server');
    }

    // axiosClient return result.data (đã unwrap)
    return result as VideoInitUploadResponse;
  },

  // Complete upload by filename (sau khi direct upload lên DoodStream)
  completeUploadByFilename: async (videoId: string, filename: string): Promise<VideoResponse> => {
    const response = await axiosClient.post<ApiResponse<VideoResponse>>(
      `/videos/${videoId}/complete-upload-by-filename`,
      null,
      {
        params: { filename }
      }
    );

    return response.data.result!;
  },

  // Upload directly to DoodStream using XMLHttpRequest for progress tracking
  uploadToDoodStream: async (file: File, uploadUrl: string, onProgress?: (progress: number) => void): Promise<any> => {
    return new Promise((resolve, reject) => {
      // Extract token from uploadUrl
      // URL format: https://xxx.cloudatacdn.com/upload/01
      const url = new URL(uploadUrl);
      const token = url.pathname.split('/').pop(); // "01"
      const finalUrl = `${url.origin}${url.pathname}?${token}`;

      console.log('[DIRECT UPLOAD] Upload URL:', finalUrl);

      const xhr = new XMLHttpRequest();

      // Track upload progress
      if (onProgress) {
        xhr.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable) {
            const progress = Math.round((event.loaded / event.total) * 100);
            onProgress(progress);
          }
        });
      }

      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          const responseText = xhr.responseText;
          console.log('[DIRECT UPLOAD] Raw response:', responseText.substring(0, 500));
          
          try {
            // Try to parse as JSON first
            const jsonResponse = JSON.parse(responseText);
            console.log('[DIRECT UPLOAD] JSON response:', jsonResponse);
            resolve(jsonResponse);
          } catch (e) {
            // Parse HTML form response from DoodStream
            // Format: <textarea name="op">upload_result</textarea><textarea name="fn">filename.mp4</textarea>...
            const opMatch = responseText.match(/<textarea[^>]*name=["']op["'][^>]*>([^<]*)<\/textarea>/i);
            const fnMatch = responseText.match(/<textarea[^>]*name=["']fn["'][^>]*>([^<]*)<\/textarea>/i);
            
            if (opMatch && opMatch[1] === 'upload_result') {
              // Upload thành công, cần lấy fileCode từ backend
              console.log('[DIRECT UPLOAD] Upload success (form), filename:', fnMatch?.[1] || 'unknown');
              resolve({ 
                status: 'success', 
                filename: fnMatch?.[1] || 'unknown',
                source: 'html_form'
              });
            } else {
              console.log('[DIRECT UPLOAD] Response (text):', responseText.substring(0, 200));
              resolve({ rawResponse: responseText });
            }
          }
        } else {
          console.error('[DIRECT UPLOAD] Upload failed:', xhr.status, xhr.statusText);
          console.error('[DIRECT UPLOAD] Response:', xhr.responseText.substring(0, 500));
          reject(new Error(`Upload failed: ${xhr.status} ${xhr.statusText}`));
        }
      });

      xhr.addEventListener('error', () => {
        console.error('[DIRECT UPLOAD] Network error');
        reject(new Error('Network error during upload'));
      });

      xhr.addEventListener('abort', () => {
        reject(new Error('Upload aborted'));
      });

      xhr.open('POST', finalUrl);
      
      // Create FormData
      const formData = new FormData();
      formData.append('file', file);
      
      xhr.send(formData);
    });
  },
};
