import fs from 'fs';
import path from 'path';
import { getSupabase } from './supabase.mjs';

const BUCKET_NAME = 'automation-evidence';

export async function uploadFile(jobId, localPath, remotePath) {
  const supabase = getSupabase();
  const fileBuffer = fs.readFileSync(localPath);
  const fullPath = `${jobId}/${remotePath}`;

  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(fullPath, fileBuffer, {
      contentType: detectMimeType(localPath),
      upsert: true,
    });

  if (error) throw new Error(`Storage upload failed: ${error.message}`);

  const { data: { publicUrl } } = supabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl(fullPath);

  return { path: fullPath, url: publicUrl };
}

export async function downloadFile(remotePath, localPath) {
  const supabase = getSupabase();
  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .download(remotePath);

  if (error) throw new Error(`Storage download failed: ${error.message}`);

  const buffer = Buffer.from(await data.arrayBuffer());
  fs.writeFileSync(localPath, buffer);
  return localPath;
}

export async function uploadEvidence(jobId, evidenceType, localPath, label = null) {
  const ext = path.extname(localPath);
  const timestamp = Date.now();
  const remotePath = `${evidenceType}-${timestamp}${ext}`;
  const result = await uploadFile(jobId, localPath, remotePath);

  const supabase = getSupabase();
  const { data: job } = await supabase
    .from('automation_jobs')
    .select('evidence')
    .eq('id', jobId)
    .single();

  const evidence = job?.evidence || [];
  evidence.push({
    type: evidenceType,
    label: label || evidenceType,
    url: result.url,
    path: result.path,
    timestamp: new Date().toISOString(),
  });

  await supabase.from('automation_jobs').update({ evidence }).eq('id', jobId);

  return result;
}

export async function listEvidence(jobId) {
  const supabase = getSupabase();
  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .list(jobId);

  if (error) throw new Error(`Failed to list evidence: ${error.message}`);
  return data || [];
}

function detectMimeType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const mimeMap = {
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.pdf': 'application/pdf',
    '.json': 'application/json',
    '.txt': 'text/plain',
    '.zip': 'application/zip',
    '.webm': 'video/webm',
  };
  return mimeMap[ext] || 'application/octet-stream';
}
