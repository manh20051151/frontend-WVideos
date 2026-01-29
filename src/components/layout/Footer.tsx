export default function Footer() {
  return (
    <footer className='bg-gray-800 text-white mt-auto'>
      <div className='container mx-auto px-4 py-8'>
        <div className='grid grid-cols-1 md:grid-cols-3 gap-8'>
          <div>
            <h3 className='text-xl font-bold mb-4'>WVideos</h3>
            <p className='text-gray-400'>
              Nền tảng chia sẻ video hàng đầu Việt Nam
            </p>
          </div>
          <div>
            <h4 className='font-semibold mb-4'>Liên kết</h4>
            <ul className='space-y-2 text-gray-400'>
              <li>Về chúng tôi</li>
              <li>Điều khoản sử dụng</li>
              <li>Chính sách bảo mật</li>
            </ul>
          </div>
          <div>
            <h4 className='font-semibold mb-4'>Liên hệ</h4>
            <p className='text-gray-400'>Email: contact@wvideos.com</p>
            <p className='text-gray-400'>Hotline: 1900 xxxx</p>
          </div>
        </div>
        <div className='border-t border-gray-700 mt-8 pt-8 text-center text-gray-400'>
          © 2026 WVideos. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
