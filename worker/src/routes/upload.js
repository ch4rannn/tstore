// Upload Routes — R2 presigned URL generation
import { Hono } from 'hono';
import { authMiddleware } from '../middleware/auth.js';
import { generateId } from '../services/jwt.js';

const upload = new Hono();
upload.use('*', authMiddleware);

// POST /api/upload/presign — Generate presigned URL for direct browser upload
upload.post('/presign', async (c) => {
  try {
    const user = c.get('user');
    const { type, contentType, fileName } = await c.req.json();

    // Validate type
    const allowedTypes = {
      'product-image': { maxSize: 10 * 1024 * 1024, formats: ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif', 'image/avif', 'image/gif'], folder: 'products' },
      'product-video': { maxSize: 50 * 1024 * 1024, formats: ['video/mp4', 'video/webm'], folder: 'videos' },
      'chat-image': { maxSize: 5 * 1024 * 1024, formats: ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif', 'image/avif', 'image/gif'], folder: 'chat' },
      'chat-video': { maxSize: 50 * 1024 * 1024, formats: ['video/mp4'], folder: 'chat-videos' },
      'avatar': { maxSize: 2 * 1024 * 1024, formats: ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif', 'image/avif', 'image/gif'], folder: 'avatars' },
    };

    const config = allowedTypes[type];
    if (!config) {
      return c.json({ error: 'Invalid upload type' }, 400);
    }

    // Allow any image format if it starts with image/
    if (!contentType.startsWith('image/') && !config.formats.includes(contentType)) {
      return c.json({ error: `Invalid file format. Allowed: ${config.formats.join(', ')}` }, 400);
    }

    // Generate unique key
    const ext = contentType.split('/')[1] === 'jpeg' ? 'jpg' : contentType.split('/')[1];
    const key = `${config.folder}/${user.id}/${generateId()}.${ext}`;

    // For R2, we'll use direct upload through the worker
    // Return the upload endpoint and the final public URL
    return c.json({
      uploadUrl: `/api/upload/file/${key}`,
      key,
      publicUrl: `/api/upload/file/${key}`,
      maxSize: config.maxSize,
    });
  } catch (error) {
    return c.json({ error: 'Failed to generate upload URL' }, 500);
  }
});

// PUT /api/upload/file — Direct file upload to R2
upload.put('/file/*', async (c) => {
  try {
    const key = c.req.path.replace('/api/upload/file/', '');
    const contentType = c.req.header('Content-Type') || 'application/octet-stream';
    const body = await c.req.arrayBuffer();

    // Server-side file size check
    const MAX_IMAGE_SIZE = 5 * 1024 * 1024;   // 5 MB
    const MAX_VIDEO_SIZE = 50 * 1024 * 1024;  // 50 MB
    const isVideo = contentType.startsWith('video/');
    const maxSize = isVideo ? MAX_VIDEO_SIZE : MAX_IMAGE_SIZE;

    if (body.byteLength > maxSize) {
      return c.json({ error: `File too large. Max size: ${maxSize / (1024 * 1024)}MB` }, 413);
    }

    // Validate key format: folder/userId/uuid.ext
    if (!/^[\w-]+\/[\w-]+\/[\w-]+\.\w+$/.test(key)) {
      return c.json({ error: 'Invalid file path' }, 400);
    }

    await c.env.R2.put(key, body, {
      httpMetadata: { contentType },
    });

    return c.json({
      url: `/api/upload/file/${key}`,
      key,
    });
  } catch (error) {
    console.error('Upload error:', error);
    return c.json({ error: 'Upload failed' }, 500);
  }
});

// GET /api/upload/file/* — Serve files from R2
upload.get('/file/*', async (c) => {
  try {
    const key = c.req.path.replace('/api/upload/file/', '');
    const object = await c.env.R2.get(key);

    if (!object) {
      return c.json({ error: 'File not found' }, 404);
    }

    const headers = new Headers();
    headers.set('Content-Type', object.httpMetadata?.contentType || 'application/octet-stream');
    headers.set('Cache-Control', 'public, max-age=31536000, immutable');
    headers.set('ETag', object.etag);

    return new Response(object.body, { headers });
  } catch (error) {
    return c.json({ error: 'Failed to retrieve file' }, 500);
  }
});

export default upload;
