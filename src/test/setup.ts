import '@testing-library/jest-dom/vitest';
import 'fake-indexeddb/auto';

if (typeof window !== 'undefined') {
  window.Blob = globalThis.Blob;
  window.File = globalThis.File;

  const originalCreateObjectURL = window.URL?.createObjectURL;
  window.URL.createObjectURL = (obj: any) => {
    try {
      if (originalCreateObjectURL) return originalCreateObjectURL(obj);
    } catch {
      // Fallback
    }
    return `blob:mock-url-${Math.random().toString(36).slice(2)}`;
  };
  if (!window.URL.revokeObjectURL) {
    window.URL.revokeObjectURL = () => {};
  }
}
