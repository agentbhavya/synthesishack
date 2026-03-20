/**
 * identity.ts - Self Protocol ZK identity gate for Cloak
 *
 * Verifies agent identity using Self Protocol's ZK-powered Agent ID
 * before granting access to vault execution.
 *
 * Self Protocol: https://app.ai.self.xyz
 */

export interface IdentityVerificationResult {
  verified: boolean;
  agentId?: string;
  reason?: string;
}

/**
 * Verify an agent's Self Protocol identity via ZK proof.
 *
 * Default (strict): denies access if no agent ID is provided or if
 * Self Protocol is unreachable. Set SELF_PERMISSIVE_MODE=true to
 * allow through during development.
 */
export async function verifyAgentIdentity(
  selfAgentId: string | undefined
): Promise<IdentityVerificationResult> {
  const permissive = process.env['SELF_PERMISSIVE_MODE'] === 'true';

  if (!selfAgentId || selfAgentId.trim() === '') {
    if (permissive) {
      console.warn('[Cloak] No Self Agent ID provided — running in permissive mode.');
      return { verified: true, reason: 'Permissive mode: no Self Agent ID required.' };
    }
    return {
      verified: false,
      reason: 'No Self Agent ID provided. Set SELF_PERMISSIVE_MODE=true to bypass in development.',
    };
  }

  try {
    const res = await fetch('https://app.ai.self.xyz/api/agent/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ agentId: selfAgentId }),
    });

    if (res.ok) {
      const data = (await res.json()) as {
        verified: boolean;
        agentId?: string;
        reason?: string;
      };
      return {
        verified: data.verified,
        agentId: data.agentId ?? selfAgentId,
        reason: data.verified ? undefined : (data.reason ?? 'Self Protocol verification failed.'),
      };
    }

    const errorText = await res.text().catch(() => '');
    console.warn(`[Cloak] Self Protocol returned HTTP ${res.status}: ${errorText}`);
    if (permissive) {
      return { verified: true, agentId: selfAgentId, reason: `Permissive mode: Self Protocol returned HTTP ${res.status}.` };
    }
    return { verified: false, reason: `Self Protocol returned HTTP ${res.status}.` };

  } catch (err) {
    console.warn('[Cloak] Self Protocol unreachable:', err);
    if (permissive) {
      return { verified: true, agentId: selfAgentId, reason: 'Permissive mode: Self Protocol unreachable.' };
    }
    return { verified: false, reason: `Self Protocol unreachable: ${String(err)}` };
  }
}
