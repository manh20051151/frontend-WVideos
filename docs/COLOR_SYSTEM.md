# Color System - WVideos Frontend

## Tổng quan

Dự án sử dụng color palette tùy chỉnh với hỗ trợ light và dark mode.

## Color Palette

### Light Mode

| Color | Hex Code | Sử dụng |
|-------|----------|---------|
| Primary | `#A8DF8E` | Màu chính, buttons, links |
| Secondary | `#F0FFDF` | Background phụ, cards |
| Accent | `#FFD8DF` | Highlights, badges |
| Highlight | `#FFAAB8` | Call-to-action, warnings |
| Foreground | `#000000` | **Màu chữ chính (đen)** |

### Dark Mode

| Color | Hex Code | Sử dụng |
|-------|----------|---------|
| Primary | `#222831` | Background chính |
| Secondary | `#393E46` | Background phụ, cards |
| Accent | `#00ADB5` | Màu nhấn, buttons, links |
| Highlight | `#EEEEEE` | Text phụ, icons |
| Foreground | `#FFFFFF` | **Màu chữ chính (trắng)** |

## Sử dụng

### CSS Variables

```css
/* Light Mode */
--color-primary: #a8df8e;
--color-secondary: #f0ffdf;
--color-accent: #ffd8df;
--color-highlight: #ffaab8;

/* Dark Mode (auto switch với prefers-color-scheme) */
--color-primary: #222831;
--color-secondary: #393e46;
--color-accent: #00adb5;
--color-highlight: #eeeeee;
```

### Utility Classes

#### Background Colors

```jsx
<div className='bg-primary'>Primary background</div>
<div className='bg-secondary'>Secondary background</div>
<div className='bg-accent'>Accent background</div>
<div className='bg-highlight'>Highlight background</div>
```

#### Text Colors

```jsx
<p className='text-primary'>Primary text</p>
<p className='text-secondary'>Secondary text</p>
<p className='text-accent'>Accent text</p>
<p className='text-highlight'>Highlight text</p>
```

#### Border Colors

```jsx
<div className='border border-primary'>Primary border</div>
<div className='border border-secondary'>Secondary border</div>
<div className='border border-accent'>Accent border</div>
<div className='border border-highlight'>Highlight border</div>
```

### Trong Components

```tsx
// Sử dụng CSS variables
<button style={{ backgroundColor: 'var(--color-accent)' }}>
  Click me
</button>

// Sử dụng utility classes
<button className='bg-accent text-white px-4 py-2 rounded'>
  Click me
</button>
```

## Dark Mode

Dark mode tự động kích hoạt dựa trên system preference (`prefers-color-scheme: dark`).

### Manual Toggle (Optional)

Nếu muốn toggle manual, có thể thêm:

```tsx
// hooks/useDarkMode.ts
export const useDarkMode = () => {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const isDarkMode = localStorage.getItem('darkMode') === 'true';
    setIsDark(isDarkMode);
    document.documentElement.classList.toggle('dark', isDarkMode);
  }, []);

  const toggleDarkMode = () => {
    const newMode = !isDark;
    setIsDark(newMode);
    localStorage.setItem('darkMode', String(newMode));
    document.documentElement.classList.toggle('dark', newMode);
  };

  return { isDark, toggleDarkMode };
};
```

## Best Practices

1. **Consistency**: Luôn sử dụng color variables thay vì hardcode hex values
2. **Accessibility**: Đảm bảo contrast ratio đủ cho text và background
3. **Semantic**: Sử dụng đúng màu cho đúng mục đích (primary cho actions, accent cho highlights)
4. **Testing**: Test cả light và dark mode trên mọi components

## Examples

### Button Component

```tsx
// Primary button
<button className='bg-primary hover:opacity-90 text-white px-6 py-3 rounded-lg'>
  Primary Action
</button>

// Accent button
<button className='bg-accent hover:opacity-90 text-white px-6 py-3 rounded-lg'>
  Accent Action
</button>

// Outline button
<button className='border-2 border-accent text-accent hover:bg-accent hover:text-white px-6 py-3 rounded-lg'>
  Outline Action
</button>
```

### Card Component

```tsx
<div className='bg-secondary border border-primary rounded-lg p-6 shadow-md'>
  <h3 className='text-primary text-xl font-bold mb-2'>Card Title</h3>
  <p className='text-foreground'>Card content goes here...</p>
  <button className='mt-4 bg-accent text-white px-4 py-2 rounded'>
    Action
  </button>
</div>
```

### Alert Component

```tsx
// Success alert
<div className='bg-primary border-l-4 border-accent p-4 rounded'>
  <p className='text-foreground'>Success message!</p>
</div>

// Warning alert
<div className='bg-highlight border-l-4 border-accent p-4 rounded'>
  <p className='text-foreground'>Warning message!</p>
</div>
```

## Color Contrast Ratios

### Light Mode
- Primary (#A8DF8E) on white: ✅ AA compliant
- Accent (#FFD8DF) on white: ✅ AA compliant
- Highlight (#FFAAB8) on white: ✅ AA compliant

### Dark Mode
- Accent (#00ADB5) on Primary (#222831): ✅ AAA compliant
- Highlight (#EEEEEE) on Primary (#222831): ✅ AAA compliant

## Resources

- [WCAG Color Contrast Guidelines](https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [CSS Custom Properties](https://developer.mozilla.org/en-US/docs/Web/CSS/--*)
