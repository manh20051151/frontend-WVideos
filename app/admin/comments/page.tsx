'use client';

import CommentModeration from '@/components/admin/CommentModeration';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

export default function AdminCommentsPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-primary">
        <div className="container mx-auto px-4 py-8">
          <CommentModeration />
        </div>
      </main>
      <Footer />
    </>
  );
}
