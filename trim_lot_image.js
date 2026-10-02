require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const sharp = require('sharp');
const https = require('https');
const http = require('http');
const path = require('path');
const fs = require('fs');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

const LOT = process.argv[2] || 'B19';

async function downloadBuffer(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    client.get(url, res => {
      const chunks = [];
      res.on('data', d => chunks.push(d));
      res.on('end', () => resolve(Buffer.concat(chunks)));
      res.on('error', reject);
    }).on('error', reject);
  });
}

async function run() {
  console.log(`Fetching lot ${LOT}...`);
  const { data: items, error } = await supabase.from('auction_items').select('id, title, image_url, lot_number').eq('lot_number', LOT);
  if (error || !items?.length) { console.error('Not found:', error?.message); return; }

  const item = items[0];
  console.log(`Found: ${item.title}`);
  console.log(`Image URL: ${item.image_url}`);

  if (!item.image_url) { console.error('No image_url'); return; }

  console.log('Downloading image...');
  const imgBuffer = await downloadBuffer(item.image_url);

  console.log('Trimming transparent/white border...');
  const trimmed = await sharp(imgBuffer)
    .trim({ threshold: 10 })
    .png()
    .toBuffer();

  const fileName = `auction_${LOT}_trimmed_${Date.now()}.png`;
  console.log(`Uploading as ${fileName}...`);

  const { data: uploadData, error: uploadError } = await supabase.storage
    .from('event-assets')
    .upload(fileName, trimmed, { contentType: 'image/png', upsert: true });

  if (uploadError) { console.error('Upload error:', uploadError.message); return; }

  const { data: urlData } = supabase.storage.from('event-assets').getPublicUrl(uploadData.path);
  const newUrl = urlData.publicUrl;

  console.log(`New URL: ${newUrl}`);
  const { error: updateError } = await supabase.from('auction_items').update({ image_url: newUrl }).eq('id', item.id);
  if (updateError) { console.error('Update error:', updateError.message); return; }

  console.log(`✅ Done! ${LOT} image trimmed and updated.`);
}

run().catch(console.error);
