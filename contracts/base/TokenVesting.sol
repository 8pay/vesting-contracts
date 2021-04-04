// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.3;

import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { SafeERC20 } from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract TokenVesting {
    using SafeERC20 for IERC20;

    IERC20 public token;
    uint256 public start;
    uint256 public duration;
    uint256 public initialReleasePercentage;

    mapping (address => uint256) private _allocatedTokens;
    mapping (address => uint256) private _claimedTokens;

    event TokensAllocated(address indexed beneficiary, uint256 value);
    event TokensClaimed(address indexed beneficiary, uint256 value);

	constructor(
        IERC20 token_,
        uint256 start_,
        uint256 duration_,
        uint256 initialReleasePercentage_,
        address[] memory beneficiaries_,
        uint256[] memory amounts_
    ) {
        token = token_;
        start = start_;
        duration = duration_;
        initialReleasePercentage = initialReleasePercentage_;

        _allocateTokens(beneficiaries_, amounts_);
	}

    function claimTokens(address[] memory beneficiaries) public {
        for (uint256 i = 0; i < beneficiaries.length; i++) {
            uint256 claimableTokens = getClaimableTokens(beneficiaries[i]);
            require(claimableTokens > 0, "Vesting: no claimable tokens");

            _claimedTokens[beneficiaries[i]] += claimableTokens;
            token.safeTransfer(beneficiaries[i], claimableTokens);

            emit TokensClaimed(beneficiaries[i], claimableTokens);
        }
    }

    function getAllocatedTokens(address beneficiary) public view returns (uint256 amount) {
        return _allocatedTokens[beneficiary];
    }

    function getClaimedTokens(address beneficiary) public view returns (uint256 amount) {
        return _claimedTokens[beneficiary];
    }

    function getClaimableTokens(address beneficiary) public view returns (uint256 amount) {
        uint256 releasedTokens = getReleasedTokensAtTimestamp(beneficiary, block.timestamp);
        return releasedTokens - _claimedTokens[beneficiary];
    }

    function getReleasedTokensAtTimestamp(address beneficiary, uint256 timestamp) 
        public
        view
        returns (uint256 amount)
    {
        if (timestamp < start) {
            return 0;
        }
        
        uint256 elapsedTime = timestamp - start;

        if (elapsedTime >= duration) {
            return _allocatedTokens[beneficiary];
        }

        uint256 initialRelease = _allocatedTokens[beneficiary] * initialReleasePercentage / 100;
        uint256 remainingTokensAfterInitialRelease = _allocatedTokens[beneficiary] - initialRelease;
        uint256 subsequentRelease = remainingTokensAfterInitialRelease * elapsedTime / duration;
        uint256 totalReleasedTokens = initialRelease + subsequentRelease;

        return totalReleasedTokens;
    }

    function _allocateTokens(address[] memory beneficiaries, uint256[] memory amounts)
        internal
    {
        require(
            beneficiaries.length == amounts.length, 
            "Vesting: beneficiaries and amounts length mismatch"
        );

        for (uint256 i = 0; i < beneficiaries.length; i++) {
            require(beneficiaries[i] != address(0), "Vesting: beneficiary is 0 address");
            _allocatedTokens[beneficiaries[i]] = amounts[i];

            emit TokensAllocated(beneficiaries[i], amounts[i]);
        }
    }
}
