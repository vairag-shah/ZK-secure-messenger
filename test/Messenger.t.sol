// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {Test} from "forge-std/Test.sol";
import {Messenger, IZKVerifier} from "../src/Messenger.sol";

/// @dev Mock ZK verifier that always returns true
contract MockZKVerifierPass is IZKVerifier {
    function verify(
        bytes calldata,
        bytes32[] calldata
    ) external pure returns (bool) {
        return true;
    }
}

/// @dev Mock ZK verifier that always returns false
contract MockZKVerifierFail is IZKVerifier {
    function verify(
        bytes calldata,
        bytes32[] calldata
    ) external pure returns (bool) {
        return false;
    }
}

contract MessengerTest is Test {
    Messenger public messenger;
    MockZKVerifierPass public verifierPass;
    MockZKVerifierFail public verifierFail;

    address public deployer = address(1);
    address public alice = address(2);
    address public bob = address(3);
    address public charlie = address(4);

    bytes32 constant MSG_HASH = keccak256("encrypted-message-content");
    string constant IPFS_CID = "QmTestCid123456789";
    bytes constant ZK_PROOF = hex"deadbeef";

    function setUp() public {
        vm.startPrank(deployer);
        verifierPass = new MockZKVerifierPass();
        verifierFail = new MockZKVerifierFail();
        // Deploy without verifier, TTL = 1 day
        messenger = new Messenger(address(0), 1 days);
        vm.stopPrank();
    }

    // ========== Constructor Tests ==========

    function test_ConstructorSetsOwner() public view {
        assertEq(messenger.owner(), deployer);
    }

    function test_ConstructorSetsTTL() public view {
        assertEq(messenger.messageTTL(), 1 days);
    }

    function test_ConstructorNoVerifier() public view {
        assertEq(address(messenger.zkVerifier()), address(0));
    }

    function test_ConstructorWithVerifier() public {
        vm.prank(deployer);
        Messenger m = new Messenger(address(verifierPass), 0);
        assertEq(address(m.zkVerifier()), address(verifierPass));
    }

    // ========== setVerifier Tests ==========

    function test_SetVerifier() public {
        vm.prank(deployer);
        messenger.setVerifier(address(verifierPass));
        assertEq(address(messenger.zkVerifier()), address(verifierPass));
    }

    function test_SetVerifierEmitsEvent() public {
        vm.prank(deployer);
        vm.expectEmit(true, false, false, false);
        emit Messenger.VerifierUpdated(address(verifierPass));
        messenger.setVerifier(address(verifierPass));
    }

    function test_RevertSetVerifierNotOwner() public {
        vm.prank(alice);
        vm.expectRevert("Not owner");
        messenger.setVerifier(address(verifierPass));
    }

    function test_RevertSetVerifierZeroAddress() public {
        vm.prank(deployer);
        vm.expectRevert("Zero address");
        messenger.setVerifier(address(0));
    }

    // ========== setTTL Tests ==========

    function test_SetTTL() public {
        vm.prank(deployer);
        messenger.setTTL(7 days);
        assertEq(messenger.messageTTL(), 7 days);
    }

    function test_SetTTLEmitsEvent() public {
        vm.prank(deployer);
        vm.expectEmit(false, false, false, true);
        emit Messenger.TTLUpdated(7 days);
        messenger.setTTL(7 days);
    }

    function test_RevertSetTTLNotOwner() public {
        vm.prank(alice);
        vm.expectRevert("Not owner");
        messenger.setTTL(7 days);
    }

    // ========== Public Key Registration Tests ==========

    function test_RegisterPublicKey() public {
        bytes memory pubKey = hex"04abcdef1234567890";
        vm.prank(bob);
        messenger.registerPublicKey(pubKey);

        bytes memory stored = messenger.getPublicKey(bob);
        assertEq(stored, pubKey);
    }

    function test_RegisterPublicKeyEmitsEvent() public {
        bytes memory pubKey = hex"04abcdef1234567890";
        vm.prank(bob);
        vm.expectEmit(true, false, false, false);
        emit Messenger.PublicKeyRegistered(bob);
        messenger.registerPublicKey(pubKey);
    }

    function test_RegisterPublicKeyOverwrite() public {
        bytes memory key1 = hex"04aa";
        bytes memory key2 = hex"04bb";
        vm.startPrank(bob);
        messenger.registerPublicKey(key1);
        messenger.registerPublicKey(key2);
        vm.stopPrank();

        assertEq(messenger.getPublicKey(bob), key2);
    }

    function test_RevertRegisterEmptyPublicKey() public {
        vm.prank(bob);
        vm.expectRevert("Empty public key");
        messenger.registerPublicKey("");
    }

    function test_GetPublicKeyUnregistered() public view {
        bytes memory stored = messenger.getPublicKey(charlie);
        assertEq(stored.length, 0);
    }

    // ========== sendMessage Tests (Step 1 + 2) ==========

    function test_SendMessage() public {
        vm.prank(alice);
        uint256 msgId = messenger.sendMessage(
            MSG_HASH,
            IPFS_CID,
            bob,
            ZK_PROOF
        );
        assertEq(msgId, 0);
        assertEq(messenger.messageCount(), 1);

        (
            bytes32 hash,
            string memory cid,
            address sender_,
            address receiver_,
            uint256 timestamp,
            bool read_,
            bool destroyed_
        ) = messenger.getMessage(0);

        assertEq(hash, MSG_HASH);
        assertEq(cid, IPFS_CID);
        assertEq(sender_, alice);
        assertEq(receiver_, bob);
        assertEq(timestamp, block.timestamp);
        assertFalse(read_);
        assertFalse(destroyed_);
    }

    function test_SendMessageEmitsEvent() public {
        vm.prank(alice);
        vm.expectEmit(true, true, true, true);
        emit Messenger.MessageSent(0, alice, bob, MSG_HASH, IPFS_CID);
        messenger.sendMessage(MSG_HASH, IPFS_CID, bob, ZK_PROOF);
    }

    function test_SendMessageUpdatesInbox() public {
        vm.prank(alice);
        messenger.sendMessage(MSG_HASH, IPFS_CID, bob, ZK_PROOF);

        uint256[] memory inbox = messenger.getInbox(bob);
        assertEq(inbox.length, 1);
        assertEq(inbox[0], 0);
    }

    function test_SendMultipleMessages() public {
        vm.startPrank(alice);
        messenger.sendMessage(MSG_HASH, IPFS_CID, bob, ZK_PROOF);
        messenger.sendMessage(keccak256("msg2"), "QmSecondCid", bob, ZK_PROOF);
        messenger.sendMessage(
            keccak256("msg3"),
            "QmThirdCid",
            charlie,
            ZK_PROOF
        );
        vm.stopPrank();

        assertEq(messenger.messageCount(), 3);

        uint256[] memory bobInbox = messenger.getInbox(bob);
        assertEq(bobInbox.length, 2);
        assertEq(bobInbox[0], 0);
        assertEq(bobInbox[1], 1);

        uint256[] memory charlieInbox = messenger.getInbox(charlie);
        assertEq(charlieInbox.length, 1);
        assertEq(charlieInbox[0], 2);
    }

    function test_RevertSendMessageZeroReceiver() public {
        vm.prank(alice);
        vm.expectRevert("Invalid receiver");
        messenger.sendMessage(MSG_HASH, IPFS_CID, address(0), ZK_PROOF);
    }

    function test_RevertSendMessageEmptyHash() public {
        vm.prank(alice);
        vm.expectRevert("Empty hash");
        messenger.sendMessage(bytes32(0), IPFS_CID, bob, ZK_PROOF);
    }

    function test_RevertSendMessageEmptyCID() public {
        vm.prank(alice);
        vm.expectRevert("Empty IPFS CID");
        messenger.sendMessage(MSG_HASH, "", bob, ZK_PROOF);
    }

    // ========== ZK Proof Verification Tests (Step 2) ==========

    function test_SendMessageWithValidZKProof() public {
        // Set passing verifier
        vm.prank(deployer);
        messenger.setVerifier(address(verifierPass));

        vm.prank(alice);
        uint256 msgId = messenger.sendMessage(
            MSG_HASH,
            IPFS_CID,
            bob,
            ZK_PROOF
        );
        assertEq(msgId, 0);
    }

    function test_RevertSendMessageWithInvalidZKProof() public {
        // Set failing verifier
        vm.prank(deployer);
        messenger.setVerifier(address(verifierFail));

        vm.prank(alice);
        vm.expectRevert("Invalid ZK proof");
        messenger.sendMessage(MSG_HASH, IPFS_CID, bob, ZK_PROOF);
    }

    // ========== confirmRead Tests (Step 4) ==========

    function test_ConfirmRead() public {
        // Send message
        vm.prank(alice);
        messenger.sendMessage(MSG_HASH, IPFS_CID, bob, ZK_PROOF);

        // Receiver confirms read
        vm.prank(bob);
        messenger.confirmRead(0);

        (, , , , , bool read_, ) = messenger.getMessage(0);
        assertTrue(read_);
    }

    function test_ConfirmReadEmitsEvent() public {
        vm.prank(alice);
        messenger.sendMessage(MSG_HASH, IPFS_CID, bob, ZK_PROOF);

        vm.prank(bob);
        vm.expectEmit(true, true, false, false);
        emit Messenger.MessageRead(0, bob);
        messenger.confirmRead(0);
    }

    function test_RevertConfirmReadNotReceiver() public {
        vm.prank(alice);
        messenger.sendMessage(MSG_HASH, IPFS_CID, bob, ZK_PROOF);

        vm.prank(charlie);
        vm.expectRevert("Not the receiver");
        messenger.confirmRead(0);
    }

    function test_RevertConfirmReadAlreadyRead() public {
        vm.prank(alice);
        messenger.sendMessage(MSG_HASH, IPFS_CID, bob, ZK_PROOF);

        vm.prank(bob);
        messenger.confirmRead(0);

        vm.prank(bob);
        vm.expectRevert("Already read");
        messenger.confirmRead(0);
    }

    function test_RevertConfirmReadDestroyed() public {
        vm.prank(alice);
        messenger.sendMessage(MSG_HASH, IPFS_CID, bob, ZK_PROOF);

        // Sender destroys message
        vm.prank(alice);
        messenger.destroyMessage(0);

        vm.prank(bob);
        vm.expectRevert("Message destroyed");
        messenger.confirmRead(0);
    }

    // ========== destroyMessage Tests (Step 5) ==========

    function test_DestroyMessageBySender() public {
        vm.prank(alice);
        messenger.sendMessage(MSG_HASH, IPFS_CID, bob, ZK_PROOF);

        vm.prank(alice);
        messenger.destroyMessage(0);

        (bytes32 hash, string memory cid, , , , , bool destroyed_) = messenger
            .getMessage(0);
        assertTrue(destroyed_);
        assertEq(hash, bytes32(0));
        assertEq(cid, "");
    }

    function test_DestroyMessageByReceiver() public {
        vm.prank(alice);
        messenger.sendMessage(MSG_HASH, IPFS_CID, bob, ZK_PROOF);

        vm.prank(bob);
        messenger.destroyMessage(0);

        (, , , , , , bool destroyed_) = messenger.getMessage(0);
        assertTrue(destroyed_);
    }

    function test_DestroyMessageEmitsEvent() public {
        vm.prank(alice);
        messenger.sendMessage(MSG_HASH, IPFS_CID, bob, ZK_PROOF);

        vm.prank(alice);
        vm.expectEmit(true, false, false, false);
        emit Messenger.MessageDestroyed(0);
        messenger.destroyMessage(0);
    }

    function test_DestroyMessageAfterTTLExpiry() public {
        vm.prank(alice);
        messenger.sendMessage(MSG_HASH, IPFS_CID, bob, ZK_PROOF);

        // Warp past TTL (1 day)
        vm.warp(block.timestamp + 1 days);

        // Anyone can destroy after TTL expiry
        vm.prank(charlie);
        messenger.destroyMessage(0);

        (, , , , , , bool destroyed_) = messenger.getMessage(0);
        assertTrue(destroyed_);
    }

    function test_RevertDestroyMessageUnauthorizedBeforeTTL() public {
        vm.prank(alice);
        messenger.sendMessage(MSG_HASH, IPFS_CID, bob, ZK_PROOF);

        vm.prank(charlie);
        vm.expectRevert("Not authorized or not expired");
        messenger.destroyMessage(0);
    }

    function test_RevertDestroyAlreadyDestroyed() public {
        vm.prank(alice);
        messenger.sendMessage(MSG_HASH, IPFS_CID, bob, ZK_PROOF);

        vm.prank(alice);
        messenger.destroyMessage(0);

        vm.prank(alice);
        vm.expectRevert("Already destroyed");
        messenger.destroyMessage(0);
    }

    function test_DestroyMessageNoTTLUnauthorized() public {
        // Deploy messenger with TTL = 0 (no auto-expiry)
        vm.prank(deployer);
        Messenger noTTL = new Messenger(address(0), 0);

        vm.prank(alice);
        noTTL.sendMessage(MSG_HASH, IPFS_CID, bob, ZK_PROOF);

        // Even after a long time, unauthorized user can't destroy
        vm.warp(block.timestamp + 365 days);
        vm.prank(charlie);
        vm.expectRevert("Not authorized or not expired");
        noTTL.destroyMessage(0);
    }

    // ========== View Functions (Step 3) ==========

    function test_GetInboxEmpty() public view {
        uint256[] memory inbox = messenger.getInbox(alice);
        assertEq(inbox.length, 0);
    }

    function test_GetMessageDefaults() public view {
        (
            bytes32 hash,
            string memory cid,
            address sender_,
            address receiver_,
            uint256 timestamp,
            bool read_,
            bool destroyed_
        ) = messenger.getMessage(999);

        assertEq(hash, bytes32(0));
        assertEq(cid, "");
        assertEq(sender_, address(0));
        assertEq(receiver_, address(0));
        assertEq(timestamp, 0);
        assertFalse(read_);
        assertFalse(destroyed_);
    }

    // ========== Full Flow Integration Test ==========

    function test_FullMessageLifecycle() public {
        // 1. Alice sends message to Bob
        vm.prank(alice);
        uint256 msgId = messenger.sendMessage(
            MSG_HASH,
            IPFS_CID,
            bob,
            ZK_PROOF
        );
        assertEq(msgId, 0);

        // 2. Verify message is stored
        (
            bytes32 hash,
            ,
            address sender_,
            address receiver_,
            ,
            bool read_,
            bool destroyed_
        ) = messenger.getMessage(0);
        assertEq(hash, MSG_HASH);
        assertEq(sender_, alice);
        assertEq(receiver_, bob);
        assertFalse(read_);
        assertFalse(destroyed_);

        // 3. Bob confirms read
        vm.prank(bob);
        messenger.confirmRead(0);
        (, , , , , read_, ) = messenger.getMessage(0);
        assertTrue(read_);

        // 4. Bob destroys the message
        vm.prank(bob);
        messenger.destroyMessage(0);
        (hash, , , , , , destroyed_) = messenger.getMessage(0);
        assertTrue(destroyed_);
        assertEq(hash, bytes32(0));
    }
}
