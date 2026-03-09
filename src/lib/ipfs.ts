import { PINATA_JWT, PINATA_GATEWAY } from './constants';

interface IPFSPayload {
  encryptedMessage: string;
  createdAt: number;
}

/**
 * Upload an encrypted message payload to IPFS via Pinata.
 * Returns the IPFS CID (Content Identifier).
 */
export async function uploadToIPFS(encryptedMessage: string): Promise<string> {
  const payload: IPFSPayload = {
    encryptedMessage,
    createdAt: Date.now(),
  };

  const response = await fetch('https://api.pinata.cloud/pinning/pinJSONToIPFS', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${PINATA_JWT}`,
    },
    body: JSON.stringify({
      pinataContent: payload,
      pinataMetadata: {
        name: `msg-${Date.now()}`,
      },
    }),
  });

  if (!response.ok) {
    const errorData = await response.text();
    throw new Error(`Failed to upload to IPFS: ${errorData}`);
  }

  const data = await response.json();
  return data.IpfsHash;
}

/**
 * Fetch encrypted message payload from IPFS using the CID.
 * Validates the CID format to prevent SSRF attacks.
 */
export async function fetchFromIPFS(cid: string): Promise<IPFSPayload> {
  // Validate CID format (CIDv0: Qm..., CIDv1: bafy...)
  if (!/^(Qm[1-9A-HJ-NP-Za-km-z]{44}|b[a-z2-7]{58,})$/.test(cid)) {
    throw new Error('Invalid IPFS CID format');
  }

  const response = await fetch(`${PINATA_GATEWAY}/${cid}`);

  if (!response.ok) {
    throw new Error(`Failed to fetch from IPFS: ${response.statusText}`);
  }

  return response.json();
}
