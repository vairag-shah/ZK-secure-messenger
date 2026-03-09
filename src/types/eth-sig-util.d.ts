declare module '@metamask/eth-sig-util' {
    export interface EthEncryptedData {
        version: string;
        nonce: string;
        ephemPublicKey: string;
        ciphertext: string;
    }

    export function encrypt(options: {
        publicKey: string;
        data: string;
        version: string;
    }): EthEncryptedData;
}
