"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const { S3Client, GetObjectCommand, PutObjectCommand } = require('@aws-sdk/client-s3');
const client_s3_1 = require("@aws-sdk/client-s3");
const sharp = require("sharp");
const s3Client = new client_s3_1.S3Client({});
const handler = async (event) => {
    try {
        for (const record of event.Records) {
            const bucket = record.s3.bucket.name;
            const key = decodeURIComponent(record.s3.object.key.replace(/\+/g, ' '));
            if (!key.startsWith('profiles/') && !key.startsWith('events/')) {
                console.log(`Skipping non-processable file: ${key}`);
                continue;
            }
            const getObjectParams = {
                Bucket: bucket,
                Key: key
            };
            const { Body } = await s3Client.send(new client_s3_1.GetObjectCommand(getObjectParams));
            const imageBuffer = await streamToBuffer(Body);
            const processedImageBuffer = await sharp(imageBuffer)
                .resize(300, 300, {
                fit: 'cover',
                position: 'center',
            })
                .toBuffer();
            const putObjectParams = {
                Bucket: bucket,
                Key: key,
                Body: processedImageBuffer,
                ContentType: 'image/jpeg'
            };
            await s3Client.send(new client_s3_1.PutObjectCommand(putObjectParams));
            console.log(`Image processed successfully: ${key}`);
        }
    }
    catch (error) {
        console.error('Error processing image:', error);
        throw error;
    }
};
exports.handler = handler;
async function streamToBuffer(stream) {
    return new Promise((resolve, reject) => {
        const chunks = [];
        stream.on('data', (chunk) => chunks.push(chunk));
        stream.on('end', () => resolve(Buffer.concat(chunks)));
        stream.on('error', reject);
    });
}
//# sourceMappingURL=index.js.map