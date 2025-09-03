// Never use @iconify/react inside this file.
import { ImageResponse } from 'next/og';

// Image metadata
export const size = {
  width: 180,
  height: 180,
};
export const contentType = 'image/png';

// Image generation
export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
        }}
      >
        <img
          src="https://storage.googleapis.com/cosmic-project-image-assets/images/a50f7c34-2442-4e40-ab30-84796a4e32c6/yo.png"
          alt="sketchFlow logo"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
          }}
        />
      </div>
    ),
    {
      ...size,
    }
  );
} 