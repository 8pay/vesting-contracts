// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.3;

import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { TokenVesting } from "./base/TokenVesting.sol";

contract PrivateSale2Vesting is TokenVesting {
    uint256 internal constant _DURATION = 150 days;
    uint256 internal constant _INITIAL_RELEASE_PERCENTAGE = 15;

    constructor(
        IERC20 token_,
        uint256 start_,
        address[] memory beneficiaries_,
        uint256[] memory amounts_
    ) TokenVesting(
        token_,
        start_,
        _DURATION,
        _INITIAL_RELEASE_PERCENTAGE,
        beneficiaries_,
        amounts_
    ) {}
}
