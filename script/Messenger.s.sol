// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {Script, console} from "forge-std/Script.sol";
import {Messenger} from "../src/Messenger.sol";

contract DeployMessenger is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envOr(
            "PRIVATE_KEY",
            uint256(
                0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
            )
        );
        address zkVerifier = vm.envOr("ZK_VERIFIER", address(0));
        uint256 messageTTL = vm.envOr("MESSAGE_TTL", uint256(1 days));

        vm.startBroadcast(deployerPrivateKey);

        Messenger messenger = new Messenger(zkVerifier, messageTTL);
        console.log("Messenger deployed at:", address(messenger));
        console.log("Owner:", messenger.owner());
        console.log("ZK Verifier:", address(messenger.zkVerifier()));
        console.log("Message TTL:", messenger.messageTTL());

        vm.stopBroadcast();
    }
}
