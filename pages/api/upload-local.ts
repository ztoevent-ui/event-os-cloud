import { NextApiRequest, NextApiResponse } from 'next';
import { existsSync, mkdirSync, createWriteStream } from 'fs';
import path from 'path';

// Disable the default 1MB/10MB parser limit completely for this route!
export const config = {
    api: {
        bodyParser: false,
        sizeLimit: '1gb',
        responseLimit: false,
    },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const rawFileName = req.headers['x-file-name'] as string || 'uploaded-file.mp4';
        const fileName = decodeURIComponent(rawFileName);

        // Ensure public/uploads exists
        const uploadDir = path.join(process.cwd(), 'public', 'uploads');
        if (!existsSync(uploadDir)) {
            mkdirSync(uploadDir, { recursive: true });
        }

        const cleanName = fileName.replace(/[^a-zA-Z0-9.\-_]/g, '_');
        const filename = `${Date.now()}-${cleanName}`;
        const filepath = path.join(uploadDir, filename);

        const writeStream = createWriteStream(filepath);

        // Pipe the raw request stream directly to disk!
        req.pipe(writeStream);

        await new Promise((resolve, reject) => {
            writeStream.on('finish', resolve);
            writeStream.on('error', reject);
        });

        res.status(200).json({ url: `/uploads/${filename}` });
    } catch (error: any) {
        console.error('Upload error:', error);
        res.status(500).json({ error: 'Failed to upload file', message: error.message });
    }
}
