/**
 * Injects Cloudinary optimization parameters into a URL.
 * @param url The original Cloudinary URL
 * @param options Optimization options (width, quality, format)
 * @returns The optimized URL
 */
export const getOptimizedImageUrl = (url: string | undefined, options: { width?: number; quality?: string; format?: string } = {}) => {
  if (!url || !url.includes('cloudinary.com')) return url || '';

  const { width = 1000, quality = 'auto', format = 'auto' } = options;
  
  // Cloudinary URL format: https://res.cloudinary.com/[cloud_name]/image/upload/[transformations]/[version]/[public_id].[format]
  // We insert our transformations after /upload/
  const parts = url.split('/upload/');
  if (parts.length !== 2) return url;

  const transformations = `c_limit,w_${width},q_${quality},f_${format}`;
  return `${parts[0]}/upload/${transformations}/${parts[1]}`;
};

/**
 * Specialized avatar optimization with face detection and high resolution
 */
export const getOptimizedAvatarUrl = (url: string | undefined, options: { width?: number; quality?: string } = {}) => {
  if (!url || !url.includes('cloudinary.com')) return url || '';
  
  const { width = 800, quality = 'auto:best' } = options;
  const parts = url.split('/upload/');
  if (parts.length !== 2) return url;

  // c_fill: fill the dimensions
  // g_face: center on face
  // dpr_auto: handle Retina displays automatically
  const transformations = `c_fill,g_face,w_${width},q_${quality},f_auto,dpr_auto`;
  return `${parts[0]}/upload/${transformations}/${parts[1]}`;
};
