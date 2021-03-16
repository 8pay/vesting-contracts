// SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.7.0 <0.9.0;

import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { TokenVesting } from "./base/TokenVesting.sol";

contract MarketingVesting is TokenVesting {
    uint256 constant DURATION = 300 days;
    uint256 constant INITIAL_RELEASE_PERCENTAGE = 10;

	constructor(
        IERC20 _token,
        uint256 _start
    ) TokenVesting(_token, _start, DURATION, INITIAL_RELEASE_PERCENTAGE) {}
}
