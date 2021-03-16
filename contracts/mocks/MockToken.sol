// SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.7.0 <0.9.0;

import { ERC20 } from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/**
 * @dev Mock token used for testing.
 */
contract MockToken is ERC20 {
    string internal constant NAME = "Mock Token";
    string internal constant SYMBOL = "MOCK";
    uint256 internal constant TOTAL_SUPPLY = 3000000 * 10**18;

    constructor() ERC20(NAME, SYMBOL) {
        _mint(msg.sender, TOTAL_SUPPLY);
    }
}
