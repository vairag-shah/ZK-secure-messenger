// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

/// @notice Interface for a ZK proof verifier contract
interface IZKVerifier {
    function verify(
        bytes calldata proof,
        bytes32[] calldata publicInputs
    ) external view returns (bool);
}

contract Messenger {
    // --- Step 1: Store commitments, not plaintext ---
    struct MessageCommitment {
        bytes32 messageHash; // keccak256 of encrypted content
        string ipfsCid; // IPFS CID for encrypted payload
        address sender;
        address receiver;
        uint256 timestamp;
        bool read;
        bool destroyed;
    }

    // --- Step 2: ZK proof verifier ---
    IZKVerifier public zkVerifier;
    address public owner;

    // --- Step 3: Multiple messages via mapping ---
    mapping(uint256 => MessageCommitment) public messages;
    uint256 public messageCount;

    // Per-user inbox: receiver => array of message IDs
    mapping(address => uint256[]) private _inbox;

    // Optional TTL for auto-destruct (Step 5)
    uint256 public messageTTL;

    // Receiver public key storage for faster encryption key lookup
    mapping(address => bytes) public encryptionPublicKey;

    // --- Step 6: Improved events (PascalCase, indexed) ---
    event MessageSent(
        uint256 indexed messageId,
        address indexed from,
        address indexed to,
        bytes32 messageHash,
        string ipfsCid
    );
    event MessageRead(uint256 indexed messageId, address indexed receiver);
    event MessageDestroyed(uint256 indexed messageId);
    event VerifierUpdated(address indexed newVerifier);
    event TTLUpdated(uint256 newTTL);
    event PublicKeyRegistered(address indexed user);

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    constructor(address _zkVerifier, uint256 _messageTTL) {
        owner = msg.sender;
        if (_zkVerifier != address(0)) {
            zkVerifier = IZKVerifier(_zkVerifier);
        }
        messageTTL = _messageTTL;
    }

    /// @notice Set or update the ZK verifier contract
    function setVerifier(address _zkVerifier) external onlyOwner {
        require(_zkVerifier != address(0), "Zero address");
        zkVerifier = IZKVerifier(_zkVerifier);
        emit VerifierUpdated(_zkVerifier);
    }

    /// @notice Set or update the message TTL
    function setTTL(uint256 _ttl) external onlyOwner {
        messageTTL = _ttl;
        emit TTLUpdated(_ttl);
    }

    /// @notice Register your encryption public key for senders to look up
    function registerPublicKey(bytes calldata _publicKey) external {
        require(_publicKey.length > 0, "Empty public key");
        encryptionPublicKey[msg.sender] = _publicKey;
        emit PublicKeyRegistered(msg.sender);
    }

    /// @notice Get a user's registered encryption public key
    function getPublicKey(address _user) external view returns (bytes memory) {
        return encryptionPublicKey[_user];
    }

    // --- Step 1 + 2: Send a message commitment with ZK proof ---
    function sendMessage(
        bytes32 _messageHash,
        string calldata _ipfsCid,
        address _receiver,
        bytes calldata _zkProof
    ) external returns (uint256 messageId) {
        require(_receiver != address(0), "Invalid receiver");
        require(_messageHash != bytes32(0), "Empty hash");
        require(bytes(_ipfsCid).length > 0, "Empty IPFS CID");

        // Step 2: Verify ZK proof if verifier is set
        if (address(zkVerifier) != address(0)) {
            bytes32[] memory publicInputs = new bytes32[](1);
            publicInputs[0] = _messageHash;
            require(
                zkVerifier.verify(_zkProof, publicInputs),
                "Invalid ZK proof"
            );
        }

        messageId = messageCount;
        messages[messageId] = MessageCommitment({
            messageHash: _messageHash,
            ipfsCid: _ipfsCid,
            sender: msg.sender,
            receiver: _receiver,
            timestamp: block.timestamp,
            read: false,
            destroyed: false
        });

        _inbox[_receiver].push(messageId);
        messageCount++;

        emit MessageSent(
            messageId,
            msg.sender,
            _receiver,
            _messageHash,
            _ipfsCid
        );
    }

    // --- Step 4: Read receipt proof ---
    function confirmRead(uint256 _messageId) external {
        MessageCommitment storage m = messages[_messageId];
        require(!m.destroyed, "Message destroyed");
        require(msg.sender == m.receiver, "Not the receiver");
        require(!m.read, "Already read");

        m.read = true;
        emit MessageRead(_messageId, msg.sender);
    }

    // --- Step 5: Message self-destruct ---
    function destroyMessage(uint256 _messageId) external {
        MessageCommitment storage m = messages[_messageId];
        require(!m.destroyed, "Already destroyed");

        bool isSenderOrReceiver = (msg.sender == m.sender ||
            msg.sender == m.receiver);
        bool isExpired = (messageTTL > 0 &&
            block.timestamp >= m.timestamp + messageTTL);

        require(
            isSenderOrReceiver || isExpired,
            "Not authorized or not expired"
        );

        m.destroyed = true;
        // Clear stored data
        m.messageHash = bytes32(0);
        m.ipfsCid = "";

        emit MessageDestroyed(_messageId);
    }

    // --- Step 3: View inbox ---
    function getInbox(address _user) external view returns (uint256[] memory) {
        return _inbox[_user];
    }

    function getMessage(
        uint256 _messageId
    )
        external
        view
        returns (
            bytes32 messageHash,
            string memory ipfsCid,
            address sender_,
            address receiver_,
            uint256 timestamp,
            bool read_,
            bool destroyed_
        )
    {
        MessageCommitment storage m = messages[_messageId];
        return (
            m.messageHash,
            m.ipfsCid,
            m.sender,
            m.receiver,
            m.timestamp,
            m.read,
            m.destroyed
        );
    }
}
