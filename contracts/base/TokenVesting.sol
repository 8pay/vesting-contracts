// SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.7.0 <0.9.0;

import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";

contract TokenVesting is Ownable {
    IERC20 public token;
    uint256 public start;
    uint256 public duration;
    uint256 public initialReleasePercentage;

    mapping (address => uint256) private grantedTokens;
    mapping (address => uint256) private claimedTokens;

    event TokensGranted(address indexed beneficiary, uint256 value);
    event TokensClaimed(address indexed beneficiary, uint256 value);

	constructor(
        IERC20 _token,
        uint256 _start,
        uint256 _duration,
        uint256 _initialReleasePercentage
    ) {
        token = _token;
        start = _start;
        duration = _duration;
        initialReleasePercentage = _initialReleasePercentage;
	}

    function grantTokens(address[] memory _beneficiaries, uint256[] memory _amounts)
        public
        onlyOwner
    {
        require(
            _beneficiaries.length == _amounts.length, 
            "Vesting: beneficiaries and amounts length mismatch"
        );

        for (uint256 i = 0; i < _beneficiaries.length; i++) {
            require(_beneficiaries[i] != address(0), "Vesting: beneficiary is 0 address");
            grantedTokens[_beneficiaries[i]] = _amounts[i];

            emit TokensGranted(_beneficiaries[i], _amounts[i]);
        }
    }

    function getGrantedTokens(address _beneficiary) public view returns (uint256 amount) {
        return grantedTokens[_beneficiary];
    }

    function getClaimedTokens(address _beneficiary) public view returns (uint256 amount) {
        return claimedTokens[_beneficiary];
    }

    function getClaimableTokens(address _beneficiary) public view returns (uint256 amount) {
        uint256 releasedTokens = getReleasedTokensAtTimestamp(_beneficiary, block.timestamp);
        return releasedTokens - claimedTokens[_beneficiary];
    }

    function getReleasedTokensAtTimestamp(address _beneficiary, uint256 _timestamp) 
        public
        view
        returns (uint256 amount)
    {
        if (_timestamp < start) {
            return 0;
        }
        
        uint256 elapsedTime = _timestamp - start;

        if (elapsedTime >= duration) {
            return grantedTokens[_beneficiary];
        }

        uint256 initialRelease = grantedTokens[_beneficiary] * initialReleasePercentage / 100;
        uint256 remainingTokensAfterInitialRelease = grantedTokens[_beneficiary] - initialRelease;
        uint256 subsequentRelease = remainingTokensAfterInitialRelease * elapsedTime / duration;
        uint256 totalReleasedTokens = initialRelease + subsequentRelease;

        return totalReleasedTokens;
    }

    function claimTokens(address[] memory _beneficiaries) public {
        for (uint256 i = 0; i < _beneficiaries.length; i++) {
            uint256 claimableTokens = getClaimableTokens(_beneficiaries[i]);
            require(claimableTokens > 0, "Vesting: no claimable tokens");

            claimedTokens[_beneficiaries[i]] += claimableTokens;
            token.transfer(_beneficiaries[i], claimableTokens);

            emit TokensClaimed(_beneficiaries[i], claimableTokens);
        }
    }
}
