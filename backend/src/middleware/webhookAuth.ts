import type { NextFunction, Request, Response } from 'express';

// Google Apps Script sends the shared secret in a custom header on every
// webhook call. This is the only auth this endpoint has, so a missing env
// var must fail closed rather than accept every request.
export function requireWebhookSecret(req: Request, res: Response, next: NextFunction) {
  const expected = process.env.WEBHOOK_SECRET;
  if (!expected) {
    res.status(500).json({ error: 'WEBHOOK_SECRET is not configured on the server' });
    return;
  }

  const provided = req.header('x-webhook-secret');
  if (provided !== expected) {
    res.status(401).json({ error: 'Invalid or missing webhook secret' });
    return;
  }

  next();
}
