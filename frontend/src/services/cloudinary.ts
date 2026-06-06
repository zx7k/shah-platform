const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'dz0uzidoi';
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || 'upload_preset';

export const openUploadWidget = (callback: (url: string) => void) => {
  const widget = (window as any).cloudinary.createUploadWidget(
    {
      cloudName: CLOUD_NAME,
      uploadPreset: UPLOAD_PRESET,
      cropping: true,
      croppingAspectRatio: 1,
      multiple: false,
      sources: ['local', 'url', 'camera'],
      styles: {
        palette: {
          window: '#0c0c0c', sourceBg: '#0a0a0a', windowBorder: '#6366f1',
          tabIcon: '#e0e0e0', inactiveTabIcon: '#888888', menuIcons: '#e0e0e0',
          link: '#6366f1', action: '#6366f1', inProgress: '#6366f1',
          complete: '#22c55e', error: '#ef4444', textDark: '#e0e0e0', textLight: '#e0e0e0',
        },
        frame: { background: 'rgba(0,0,0,0.9)' },
      },
    },
    (error: any, result: any) => {
      if (!error && result?.event === 'success') callback(result.info.secure_url);
    }
  );
  widget.open();
};