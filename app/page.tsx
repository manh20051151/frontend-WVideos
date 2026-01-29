import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

export default function Home() {
  return (
    <>
      <Header />
      <main className='flex-1 container mx-auto px-4 py-8'>
        <h1 className='text-4xl font-bold mb-8'>Khám phá video mới</h1>
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'>
          {/* Video cards sẽ được render ở đây */}
          <p className='col-span-full text-center text-gray-500'>
            Đang tải video...
          </p>
        </div>
      </main>
      <Footer />
    </>
  );
}
