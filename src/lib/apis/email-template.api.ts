import axiosClient from './axiosClient';

// Types cho EmailTemplate (nội dung email do admin chỉnh sửa)
export interface EmailTemplateInfo {
  templateKey: string;
  subject: string;
  body: string;
  updatedAt?: string | null;
  defaultSubject: string;
  defaultBody: string;
  customized: boolean;
}

export interface EmailTemplateUpdateRequest {
  subject: string;
  body: string;
}

export const EMAIL_TEMPLATE_LABELS: Record<string, { title: string; description: string }> = {
  CONFIRMATION: {
    title: 'Email xác nhận đăng ký',
    description: 'Gửi khi có người đăng ký tài khoản mới, chứa link kích hoạt tài khoản',
  },
  RESET_PASSWORD: {
    title: 'Email đặt lại mật khẩu',
    description: 'Gửi khi người dùng yêu cầu quên mật khẩu, chứa link đặt mật khẩu mới',
  },
};

// Placeholder khả dụng trong template
export const EMAIL_TEMPLATE_PLACEHOLDERS = [
  { key: '{{url}}', label: 'Link hành động (bắt buộc phải có)' },
  { key: '{{email}}', label: 'Email người nhận' },
  { key: '{{name}}', label: 'Tên hiển thị người nhận' },
  { key: '{{minutes}}', label: 'Thời hạn token (phút)' },
  { key: '{{logo_block}}', label: 'Khối logo - tự cập nhật theo logo đã cấu hình' },
];

// API functions
export const emailTemplateApi = {
  // Lấy danh sách template (admin only)
  getAll: async (): Promise<EmailTemplateInfo[]> => {
    return await axiosClient.get('/admin/email-templates');
  },

  // Cập nhật template theo key (admin only)
  update: async (key: string, data: EmailTemplateUpdateRequest): Promise<EmailTemplateInfo> => {
    return await axiosClient.put(`/admin/email-templates/${key}`, data);
  },

  // Khôi phục template về mặc định (admin only)
  reset: async (key: string): Promise<EmailTemplateInfo> => {
    return await axiosClient.post(`/admin/email-templates/${key}/reset`);
  },
};

// Render placeholder thành giá trị mẫu để xem trước
export const renderPreview = (
  template: string,
  sample: { url: string; email: string; name: string; minutes: string }
): string => {
  return template
    .replace(/\{\{url\}\}/g, sample.url)
    .replace(/\{\{email\}\}/g, sample.email)
    .replace(/\{\{name\}\}/g, sample.name)
    .replace(/\{\{minutes\}\}/g, sample.minutes)
    .replace(
      /\{\{logo_block\}\}/g,
      '<span style="display:inline-block;background-color:#ffffff;color:#009688;font-size:22px;font-weight:bold;padding:4px 10px;border-radius:8px;">wd</span><span style="color:#ffffff;font-size:22px;font-weight:bold;">video</span>'
    );
};
