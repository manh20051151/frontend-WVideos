export default function Footer() {
  return (
    <footer className='bg-secondary border-t border-accent mt-auto'>
      <div className='container mx-auto px-4 py-8'>
        <div className='grid grid-cols-1 md:grid-cols-3 gap-8'>
          <div>
            <h3 className='text-xl font-bold mb-4 text-foreground'>WVideos</h3>
            <p className='text-foreground opacity-70'>
              Nền tảng chia sẻ video hàng đầu Việt Nam
            </p>
          </div>
          <div>
            <h4 className='font-semibold mb-4 text-foreground'>Liên kết</h4>
            <ul className='space-y-2 text-foreground opacity-70'>
              <li className='hover:opacity-100 cursor-pointer transition-opacity'>Về chúng tôi</li>
              <li className='hover:opacity-100 cursor-pointer transition-opacity'>Điều khoản sử dụng</li>
              <li className='hover:opacity-100 cursor-pointer transition-opacity'>Chính sách bảo mật</li>
            </ul>
          </div>
          <div>
            <h4 className='font-semibold mb-4 text-foreground'>Liên hệ</h4>
            <p className='text-foreground opacity-70'>Email: contact@wvideos.com</p>
            <p className='text-foreground opacity-70'>Hotline: 1900 xxxx</p>
          </div>
        </div>
        <div className='border-t border-accent mt-8 pt-8 text-center text-foreground opacity-70'>
          © 2026 WVideos. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
