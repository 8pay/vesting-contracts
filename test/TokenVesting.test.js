const { BN, time, expectEvent, expectRevert, constants } = require('@openzeppelin/test-helpers');
const { expect } = require('chai');

const MockToken = artifacts.require('MockToken');
const TokenVesting = artifacts.require('TokenVesting');

contract('TokenVesting', (accounts) => {
  const [owner, beneficiary, nonOwner] = accounts;
  const initialReleasePercentage = new BN(10);
  const duration = time.duration.days(120);
  const allocatedTokens = new BN(web3.utils.toWei('1', 'ether'));

  beforeEach(async () => {
    this.token = await MockToken.new();
  });

  beforeEach(async () => {
    this.start = (await time.latest()).add(time.duration.days(30));

    this.vesting = await TokenVesting.new(
      this.token.address,
      this.start.toNumber(),
      duration.toNumber(),
      initialReleasePercentage,
      { from: owner },
    );

    this.token.transfer(this.vesting.address, web3.utils.toWei('100', 'ether'), { from: owner });
  });

  it('has a token', async () => {
    expect(await this.vesting.token()).to.equal(this.token.address);
  });

  it('has a start', async () => {
    expect(await this.vesting.start()).to.be.bignumber.equal(this.start);
  });

  it('has a duration', async () => {
    expect(await this.vesting.duration()).to.be.bignumber.equal(duration);
  });

  it('has an initial release percentage', async () => {
    expect(await this.vesting.initialReleasePercentage()).to.be.bignumber.equal(initialReleasePercentage);
  });

  describe('when tokens are not allocated', async () => {
    it('should allocate some tokens', async () => {
      await this.vesting.allocateTokens([beneficiary], [allocatedTokens]);
      const actualAllocatedTokens = await this.vesting.getAllocatedTokens(beneficiary);

      expect(actualAllocatedTokens).to.be.bignumber.equal(allocatedTokens);
    });

    it('reverts when calling the allocate function with different array lengts', async () => {
      await expectRevert(
        this.vesting.allocateTokens([beneficiary], []),
        'Vesting: beneficiaries and amounts length mismatch',
      );
    });

    it('reverts when allocating tokens to the 0 address', async () => {
      await expectRevert(
        this.vesting.allocateTokens([constants.ZERO_ADDRESS], [allocatedTokens]),
        'Vesting: beneficiary is 0 address',
      );
    });

    it('reverts when allocating tokens from non-owner address', async () => {
      await expectRevert(
        this.vesting.allocateTokens([beneficiary], [allocatedTokens], { from: nonOwner }),
        'Ownable: caller is not the owner',
      );
    });

    describe('before start', () => {
      it('released tokens should be 0', async () => {
        const timestamp = this.start.sub(new BN(1));
        const releasedTokens = await this.vesting.getReleasedTokensAtTimestamp(beneficiary, timestamp);

        expect(releasedTokens).to.be.bignumber.equal('0');
      });
    });

    describe('on start', () => {
      it('released tokens should be 0', async () => {
        const timestamp = this.start;
        const releasedTokens = await this.vesting.getReleasedTokensAtTimestamp(beneficiary, timestamp);

        expect(releasedTokens).to.be.bignumber.equal('0');
      });
    });

    describe('at half vesting period', () => {
      it('released tokens should be 0', async () => {
        const halfDuration = new BN(duration / 2);
        const timestamp = this.start.add(halfDuration);
        const releasedTokens = await this.vesting.getReleasedTokensAtTimestamp(beneficiary, timestamp);

        expect(releasedTokens).to.be.bignumber.equal('0');
      });
    });

    describe('on end', () => {
      it('released tokens should be 0', async () => {
        const timestamp = this.start.add(duration);
        const releasedTokens = await this.vesting.getReleasedTokensAtTimestamp(beneficiary, timestamp);

        expect(releasedTokens).to.be.bignumber.equal('0');
      });
    });
  });

  describe('when tokens are allocated', () => {
    beforeEach(async () => {
      const { logs } = await this.vesting.allocateTokens([beneficiary], [allocatedTokens]);

      this.logs = logs;
    });

    it('emits TokensAllocated event', async () => {
      expectEvent.inLogs(this.logs, 'TokensAllocated', { beneficiary: beneficiary, value: allocatedTokens });
    });

    describe('token release', () => {
      describe('before start', () => {
        it('released tokens should be 0', async () => {
          const timestamp = this.start.sub(new BN(1));
          const releasedTokens = await this.vesting.getReleasedTokensAtTimestamp(beneficiary, timestamp);

          expect(releasedTokens).to.be.bignumber.equal('0');
        });
      });

      describe('on start', () => {
        it('released token should be equal to the inital release', async () => {
          const timestamp = this.start;
          const expectedReleasedTokens = allocatedTokens.mul(initialReleasePercentage).div(new BN(100));
          const actualReleasedTokens = await this.vesting.getReleasedTokensAtTimestamp(beneficiary, timestamp);

          expect(actualReleasedTokens).to.be.bignumber.equal(expectedReleasedTokens);
        });
      });

      describe('at half vesting period', () => {
        it('released tokens should be equal to inital amount + half remaining tokens', async () => {
          const halfDuration = new BN(duration / 2);
          const durationPercentage = new BN(50);
          const timestamp = this.start.add(halfDuration);
          const initialReleasedTokens = allocatedTokens.mul(initialReleasePercentage).div(new BN(100));
          const newlyReleaseTokens = allocatedTokens
            .sub(initialReleasedTokens).mul(durationPercentage).div(new BN(100));
          const expectedReleasedTokens = initialReleasedTokens.add(newlyReleaseTokens);
          const actualReleasedTokens = await this.vesting.getReleasedTokensAtTimestamp(beneficiary, timestamp);

          expect(actualReleasedTokens).to.be.bignumber.equal(expectedReleasedTokens);
        });
      });

      describe('on end', () => {
        it('release tokens should be equal to total allocated tokens', async () => {
          const timestamp = this.start.add(duration);
          const actualReleasedTokens = await this.vesting.getReleasedTokensAtTimestamp(beneficiary, timestamp);

          expect(actualReleasedTokens).to.be.bignumber.equal(allocatedTokens);
        });
      });
    });

    describe('claim', () => {
      describe('before start', () => {
        it('claimable tokens should be 0', async () => {
          const claimableTokens = await this.vesting.getClaimableTokens(beneficiary);

          expect(claimableTokens).to.be.bignumber.equal('0');
        });

        it('claimed tokens should be 0', async () => {
          const claimedTokens = await this.vesting.getClaimedTokens(beneficiary);

          expect(claimedTokens).to.be.bignumber.equal('0');
        });
      });

      describe('after start', () => {
        beforeEach(async () => {
          await time.increaseTo(this.start);
        });

        it('claimable tokens should be close to the initial release', async () => {
          const actualClaimableTokens = await this.vesting.getClaimableTokens(beneficiary);
          const timestamp = await time.latest();
          const expectedClaimableTokens = await this.vesting.getReleasedTokensAtTimestamp(beneficiary, timestamp);

          expect(actualClaimableTokens).to.be.bignumber.equal(expectedClaimableTokens);
        });

        it('claimed tokens should be 0', async () => {
          const claimedTokens = await this.vesting.getClaimedTokens(beneficiary);

          expect(claimedTokens).to.be.bignumber.equal('0');
        });

        it('should claim tokens', async () => {
          const beneficiaryInitialBalance = await this.token.balanceOf(beneficiary);
          const contractInitialBalance = await this.token.balanceOf(this.vesting.address);
          await this.vesting.claimTokens([beneficiary]);
          const claimTimestamp = await time.latest();
          const expectedClaimedTokens = await this.vesting.getReleasedTokensAtTimestamp(beneficiary, claimTimestamp);
          const beneficiaryFinalBalance = await this.token.balanceOf(beneficiary);
          const contractFinalBalance = await this.token.balanceOf(this.vesting.address);

          expect(beneficiaryFinalBalance).to.be.bignumber.equal(beneficiaryInitialBalance.add(expectedClaimedTokens));
          expect(contractFinalBalance).to.be.bignumber.equal(contractInitialBalance.sub(expectedClaimedTokens));
        });

        describe('after claiming tokens', () => {
          beforeEach(async () => {
            const { logs } = await this.vesting.claimTokens([beneficiary]);

            this.logs = logs;
            this.claimTimestamp = await time.latest();
            this.claimedTokens = await this.vesting.getReleasedTokensAtTimestamp(beneficiary, this.claimTimestamp);
          });

          it('emits TokensClaimed event', () => {
            expectEvent.inLogs(this.logs, 'TokensClaimed', { beneficiary: beneficiary, value: this.claimedTokens });
          });

          it('claimable tokens should be 0', async () => {
            const claimableTokens = await this.vesting.getClaimableTokens(beneficiary);

            expect(claimableTokens).to.be.bignumber.equal('0');
          });

          it('claimed tokens should be equal to the received amount', async () => {
            const claimedTokens = await this.vesting.getClaimedTokens(beneficiary);

            expect(claimedTokens).to.be.bignumber.equal(this.claimedTokens);
          });

          describe('after half vesting period', () => {
            beforeEach(async () => {
              await time.increase(duration / 2);
            });

            it('claimable tokens should be close to half of the remaining tokens', async () => {
              const timestamp = await time.latest();
              const releasedTokens = await this.vesting.getReleasedTokensAtTimestamp(beneficiary, timestamp);
              const expectedClaimableTokens = releasedTokens.sub(this.claimedTokens);
              const actualClaimableTokens = await this.vesting.getClaimableTokens(beneficiary);

              expect(actualClaimableTokens).to.be.bignumber.equal(expectedClaimableTokens);
            });

            it('should claim more tokens', async () => {
              const beneficiaryInitialBalance = await this.token.balanceOf(beneficiary);
              const contractInitialBalance = await this.token.balanceOf(this.vesting.address);
              await this.vesting.claimTokens([beneficiary]);
              const claimTimestamp = await time.latest();
              const totalReleasedTokens = await this.vesting.getReleasedTokensAtTimestamp(beneficiary, claimTimestamp);
              const expectedClaimedTokens = totalReleasedTokens.sub(this.claimedTokens);
              const beneficiaryFinalBalance = await this.token.balanceOf(beneficiary);
              const contractFinalBalance = await this.token.balanceOf(this.vesting.address);

              expect(beneficiaryFinalBalance)
                .to.be.bignumber.equal(beneficiaryInitialBalance.add(expectedClaimedTokens));
              expect(contractFinalBalance).to.be.bignumber.equal(contractInitialBalance.sub(expectedClaimedTokens));
            });

            describe('after claiming more tokens', () => {
              beforeEach(async () => {
                await this.vesting.claimTokens([beneficiary]);
                this.claimTimestamp = await time.latest();
                this.claimedTokens = await this.vesting.getReleasedTokensAtTimestamp(beneficiary, this.claimTimestamp);
              });

              describe('on end', () => {
                beforeEach(async () => {
                  await time.increaseTo(this.start.add(duration));
                });

                it('claimable tokens should be equal to all remaining tokens', async () => {
                  const timestamp = await time.latest();
                  const releasedTokens = await this.vesting.getReleasedTokensAtTimestamp(beneficiary, timestamp);
                  const expectedClaimableTokens = releasedTokens.sub(this.claimedTokens);
                  const actualClaimableTokens = await this.vesting.getClaimableTokens(beneficiary);

                  expect(actualClaimableTokens).to.be.bignumber.equal(expectedClaimableTokens);
                });

                it('should claim the remaining tokens', async () => {
                  const beneficiaryInitialBalance = await this.token.balanceOf(beneficiary);
                  const contractInitialBalance = await this.token.balanceOf(this.vesting.address);
                  await this.vesting.claimTokens([beneficiary]);
                  const expectedClaimedTokens = allocatedTokens.sub(this.claimedTokens);
                  const beneficiaryFinalBalance = await this.token.balanceOf(beneficiary);
                  const contractFinalBalance = await this.token.balanceOf(this.vesting.address);

                  expect(beneficiaryFinalBalance)
                    .to.be.bignumber.equal(beneficiaryInitialBalance.add(expectedClaimedTokens));
                  expect(contractFinalBalance).to.be.bignumber.equal(contractInitialBalance.sub(expectedClaimedTokens));
                });

                describe('after claiming all tokens', () => {
                  beforeEach(async () => {
                    await this.vesting.claimTokens([beneficiary]);
                  });

                  it('claimable tokens should be 0', async () => {
                    const actualClaimableTokens = await this.vesting.getClaimableTokens(beneficiary);

                    expect(actualClaimableTokens).to.be.bignumber.equal('0');
                  });

                  it('reverts when calling the claim function', async () => {
                    await expectRevert(this.vesting.claimTokens([beneficiary]), 'Vesting: no claimable tokens');
                  });
                });
              });
            });
          });
        });
      });
    });
  });
});
