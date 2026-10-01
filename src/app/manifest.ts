import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'WhatsApp ChatBook',
    short_name: 'ChatBook',
    description: 'Private, offline, client-side WhatsApp chat viewer and memory library.',
    start_url: '/',
    display: 'standalone',
    orientation: 'any',
    background_color: '#0c1317',
    theme_color: '#00a884',
    icons: [
      {
        src: '/icons/icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'any',
      },
      {
        src: '/icons/icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'maskable',
      },
    ],
  };
}
