// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.3;

import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { TokenVesting } from "./base/TokenVesting.sol";

contract PrivateSale1Vesting is TokenVesting {
    uint256 public constant DURATION = 180 days;
    uint256 public constant INITIAL_RELEASE_PERCENTAGE = 10;

	constructor(
        IERC20 token,
        uint256 start,
        address[] memory beneficiaries,
        uint256[] memory amounts
    ) TokenVesting(token, start, DURATION, INITIAL_RELEASE_PERCENTAGE, beneficiaries, amounts) {}
}
