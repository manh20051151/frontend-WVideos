'use client';

import { useState } from 'react';
import { categoryApi } from '@/lib/apis/category.api';

export default function TestCategoriesPage() {
  const [result, setResult] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const testGetCategories = async () => {
    setLoading(true);
    try {
      const categories = await categoryApi.getActiveCategories();
      setResult(`✅ GET /categories thành công: ${JSON.stringify(categories, null, 2)}`);
    } catch (error: any) {
      setResult(`❌ GET /categories thất bại: ${error.message}\nStatus: ${error.response?.status}\nData: ${JSON.stringify(error.response?.data, null, 2)}`);
    } finally {
      setLoading(false);
    }
  };

  const testPostEndpoint = async () => {
    setLoading(true);
    try {
      // Test endpoint không cần auth
      const response = await fetch('http://localhost:8080/api/categories/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const text = await response.text();
        setResult(`✅ POST /categories/test thành công: ${text}`);
      } else {
        setResult(`❌ POST /categories/test thất bại: ${response.status} ${response.statusText}`);
      }
    } catch (error: any) {
      setResult(`❌ POST /categories/test lỗi: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const testCreateCategory = async () => {
    setLoading(true);
    try {
      const newCategory = await categoryApi.createCategory({
        name: 'Test Category',
        slug: 'test-category',
        description: 'Test description',
        color: '#FF6B6B',
        icon: '🎬',
        isActive: true,
        sortOrder: 0
      });
      setResult(`✅ POST /categories thành công: ${JSON.stringify(newCategory, null, 2)}`);
    } catch (error: any) {
      setResult(`❌ POST /categories thất bại: ${error.message}\nStatus: ${error.response?.status}\nData: ${JSON.stringify(error.response?.data, null, 2)}`);
    } finally {
      setLoading(false);
    }
  };

  const checkAuth = () => {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    setResult(`Token: ${token ? 'Có' : 'Không'}\nUser: ${user || 'Không có'}`);
  };

  return (
    <div className='min-h-screen bg-primary p-8'>
      <div className='max-w-4xl mx-auto'>
        <h1 className='text-3xl font-bold text-foreground mb-8'>🧪 Test Categories API</h1>
        
        <div className='space-y-4 mb-8'>
          <button
            onClick={testGetCategories}
            disabled={loading}
            className='btn btn-accent mr-4'
          >
            Test GET /categories
          </button>
          
          <button
            onClick={testPostEndpoint}
            disabled={loading}
            className='btn btn-accent mr-4'
          >
            Test POST /categories/test
          </button>
          
          <button
            onClick={testCreateCategory}
            disabled={loading}
            className='btn btn-accent mr-4'
          >
            Test POST /categories
          </button>
          
          <button
            onClick={checkAuth}
            className='btn mr-4'
          >
            Check Auth
          </button>
        </div>

        {loading && (
          <div className='text-foreground mb-4'>⏳ Đang test...</div>
        )}

        {result && (
          <div className='bg-secondary p-4 rounded-lg'>
            <h3 className='text-foreground font-bold mb-2'>Kết quả:</h3>
            <pre className='text-foreground text-sm whitespace-pre-wrap'>{result}</pre>
          </div>
        )}

        <div className='mt-8 bg-secondary p-4 rounded-lg'>
          <h3 className='text-foreground font-bold mb-2'>Hướng dẫn:</h3>
          <ol className='text-foreground text-sm space-y-1'>
            <li>1. Test GET /categories - Không cần auth</li>
            <li>2. Đăng nhập tại <a href='/login' className='text-accent underline'>/login</a> với admin/admin123</li>
            <li>3. Test POST /categories - Cần auth + ADMIN role</li>
          </ol>
        </div>
      </div>
    </div>
  );
}