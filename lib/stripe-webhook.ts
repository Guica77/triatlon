import { timingSafeEqual } from 'node:crypto';

function signatureValue(header: string, name: string) {
  return header.split(',').find((part) => part.startsWith(`${name}=`))?.slice(name.length + 1);
}

function unixSeconds() {
  return Math.floor(Date.now() / 1000);
}

export async function verifyStripeWebhook(payload: string, header: string | null, secret: string) {
  if (!header || !secret) return false;
  const timestamp = signatureValue(header, 't');
  const signatures = header.split(',').filter((part) => part.startsWith('v1=')).map((part) => part.slice(3));
  if (!timestamp || signatures.length === 0 || Math.abs(unixSeconds() - Number(timestamp)) > 300) return false;

  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(`${timestamp}.${payload}`));
  const expected = Buffer.from(signature).toString('hex');
  return signatures.some((candidate) => {
    const received = Buffer.from(candidate, 'hex');
    const computed = Buffer.from(expected, 'hex');
    return received.length === computed.length && timingSafeEqual(received, computed);
  });
}
