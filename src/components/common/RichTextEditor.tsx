'use client';

import { useRef } from 'react';
import { Editor } from '@tinymce/tinymce-react';
import { uploadImageToImgbbFromBlob } from '@/lib/utils/imgbb';

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  className?: string;
}

const TINYMCE_BASE = '/tinymce/tinymce.min.js';

const CONTENT_STYLE = `
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 15px; line-height: 1.7; color: #1f2937; }
  img { max-width: 100%; height: auto; border-radius: 8px; }
  a { color: #6d28d9; }
  table { border-collapse: collapse; }
  table td, table th { border: 1px solid #d1d5db; padding: 6px 8px; }
`;

export default function RichTextEditor({ value, onChange, placeholder, className = '' }: RichTextEditorProps) {
  const editorRef = useRef<any>(null);

  // Upload ảnh lên imgbb khi người dùng chèn ảnh vào nội dung
  const imagesUploadHandler = (_blobInfo: unknown, _progress?: (percent: number) => void): Promise<string> => {
    const blobInfo = _blobInfo as { blob: () => Blob; filename: () => string };
    return uploadImageToImgbbFromBlob(blobInfo.blob(), blobInfo.filename()).then((res) => {
      if (res.success && res.data?.url) {
        return res.data.url;
      }
      return Promise.reject(res.error || 'Upload ảnh thất bại');
    });
  };

  return (
    <div className={`rounded-lg border border-accent overflow-hidden ${className}`}>
      <Editor
        onInit={(_evt, editor) => (editorRef.current = editor)}
        tinymceScriptSrc={TINYMCE_BASE}
        value={value}
        onEditorChange={(content) => onChange(content)}
        init={{
          height: 420,
          menubar: true,
          branding: false,
          promotion: false,
          placeholder: placeholder || '',
          plugins:
            'lists link image table media code autolink searchreplace fullscreen insertdatetime hr charmap preview',
          toolbar:
            'undo redo | blocks fontfamily fontsize | bold italic underline strike | forecolor backcolor | \
             alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | \
             link image media table | removeformat code fullscreen',
          content_style: CONTENT_STYLE,
          images_upload_handler: imagesUploadHandler,
          automatic_uploads: true,
          images_reuse_filename: true,
          file_picker_types: 'image',
        }}
      />
    </div>
  );
}
