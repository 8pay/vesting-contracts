// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.3;

import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";

contract TokenVesting is Ownable {
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
        uint256 initialReleasePercentage_
    ) {
        token = token_;
        start = start_;
        duration = duration_;
        initialReleasePercentage = initialReleasePercentage_;
	}

    function allocateTokens(address[] memory beneficiaries, uint256[] memory amounts)
        public
        onlyOwner
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

    function claimTokens(address[] memory beneficiaries) public {
        for (uint256 i = 0; i < beneficiaries.length; i++) {
            uint256 claimableTokens = getClaimableTokens(beneficiaries[i]);
            require(claimableTokens > 0, "Vesting: no claimable tokens");

            _claimedTokens[beneficiaries[i]] += claimableTokens;
            token.transfer(beneficiaries[i], claimableTokens);

            emit TokensClaimed(beneficiaries[i], claimableTokens);
        }
    }

    function emergencyWithdraw(IERC20 erc20, address recipient) public onlyOwner {
        erc20.transfer(recipient, erc20.balanceOf(address(this)));
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
}
