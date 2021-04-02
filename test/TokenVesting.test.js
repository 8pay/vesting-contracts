const { BN, time, expectEvent, expectRevert, constants } = require('@openzeppelin/test-helpers');
const { expect } = require('chai');

const MockToken = artifacts.require('MockToken');
const TokenVesting = artifacts.require('TokenVesting');

contract('TokenVesting', (accounts) => {
  const [owner, beneficiary1, beneficiary2, nonOwner] = accounts;
  const initialReleasePercentage = new BN(10);
  const duration = time.duration.days(120);

  const allocatedTokens = {
    [beneficiary1]: new BN(web3.utils.toWei('1', 'ether')),
    [beneficiary2]: new BN(web3.utils.toWei('3', 'ether')),
  };

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

  it('should perform an emergency withdraw', async () => {
    const contractInitialBalance = await this.token.balanceOf(this.vesting.address);
    const recipientInitialBalance = await this.token.balanceOf(owner);
    await this.vesting.emergencyWithdraw(this.token.address, owner);
    const contractFinalBalance = await this.token.balanceOf(this.vesting.address);
    const recipientFinalBalance = await this.token.balanceOf(owner);

    expect(contractFinalBalance).to.be.bignumber.equal('0');
    expect(recipientFinalBalance).to.be.bignumber.equal(recipientInitialBalance.add(contractInitialBalance));
  });

  it('reverts when performing an emergency withdraw from non-owner', async () => {
    await expectRevert(
      this.vesting.emergencyWithdraw(this.token.address, owner, { from: nonOwner }),
      'Ownable: caller is not the owner',
    );
  });

  describe('when tokens are not allocated', async () => {
    it('should allocate some tokens', async () => {
      await this.vesting.allocateTokens(
        [beneficiary1, beneficiary2],
        [allocatedTokens[beneficiary1], allocatedTokens[beneficiary2]],
      );

      const actualAllocatedTokens = {
        [beneficiary1]: await this.vesting.getAllocatedTokens(beneficiary1),
        [beneficiary2]: await this.vesting.getAllocatedTokens(beneficiary2),
      };

      expect(actualAllocatedTokens[beneficiary1]).to.be.bignumber.equal(allocatedTokens[beneficiary1]);
      expect(actualAllocatedTokens[beneficiary2]).to.be.bignumber.equal(allocatedTokens[beneficiary2]);
    });

    it('reverts when calling the allocate function with different array lengts', async () => {
      await expectRevert(
        this.vesting.allocateTokens([beneficiary1], []),
        'Vesting: beneficiaries and amounts length mismatch',
      );
    });

    it('reverts when allocating tokens to the 0 address', async () => {
      await expectRevert(
        this.vesting.allocateTokens([constants.ZERO_ADDRESS], [allocatedTokens[beneficiary1]]),
        'Vesting: beneficiary is 0 address',
      );
    });

    it('reverts when allocating tokens from non-owner address', async () => {
      await expectRevert(
        this.vesting.allocateTokens([beneficiary1], [allocatedTokens[beneficiary1]], { from: nonOwner }),
        'Ownable: caller is not the owner',
      );
    });

    describe('before start', () => {
      it('released tokens should be 0', async () => {
        const timestamp = this.start.sub(new BN(1));
        const releasedTokens = {
          [beneficiary1]: await this.vesting.getReleasedTokensAtTimestamp(beneficiary1, timestamp),
          [beneficiary2]: await this.vesting.getReleasedTokensAtTimestamp(beneficiary2, timestamp),
        };

        expect(releasedTokens[beneficiary1]).to.be.bignumber.equal('0');
        expect(releasedTokens[beneficiary2]).to.be.bignumber.equal('0');
      });
    });

    describe('on start', () => {
      it('released tokens should be 0', async () => {
        const timestamp = this.start;
        const releasedTokens = {
          [beneficiary1]: await this.vesting.getReleasedTokensAtTimestamp(beneficiary1, timestamp),
          [beneficiary2]: await this.vesting.getReleasedTokensAtTimestamp(beneficiary2, timestamp),
        };

        expect(releasedTokens[beneficiary1]).to.be.bignumber.equal('0');
        expect(releasedTokens[beneficiary2]).to.be.bignumber.equal('0');
      });
    });

    describe('at half vesting period', () => {
      it('released tokens should be 0', async () => {
        const halfDuration = new BN(duration / 2);
        const timestamp = this.start.add(halfDuration);
        const releasedTokens = {
          [beneficiary1]: await this.vesting.getReleasedTokensAtTimestamp(beneficiary1, timestamp),
          [beneficiary2]: await this.vesting.getReleasedTokensAtTimestamp(beneficiary2, timestamp),
        };

        expect(releasedTokens[beneficiary1]).to.be.bignumber.equal('0');
        expect(releasedTokens[beneficiary2]).to.be.bignumber.equal('0');
      });
    });

    describe('on end', () => {
      it('released tokens should be 0', async () => {
        const timestamp = this.start.add(duration);
        const releasedTokens = {
          [beneficiary1]: await this.vesting.getReleasedTokensAtTimestamp(beneficiary1, timestamp),
          [beneficiary2]: await this.vesting.getReleasedTokensAtTimestamp(beneficiary2, timestamp),
        };

        expect(releasedTokens[beneficiary1]).to.be.bignumber.equal('0');
        expect(releasedTokens[beneficiary2]).to.be.bignumber.equal('0');
      });
    });
  });

  describe('when tokens are allocated', () => {
    beforeEach(async () => {
      const { logs } = await this.vesting.allocateTokens(
        [beneficiary1, beneficiary2],
        [allocatedTokens[beneficiary1], allocatedTokens[beneficiary2]],
      );

      this.logs = logs;
    });

    it('emits TokensAllocated event', async () => {
      expectEvent.inLogs(this.logs, 'TokensAllocated', {
        beneficiary: beneficiary1,
        value: allocatedTokens[beneficiary1],
      });

      expectEvent.inLogs(this.logs, 'TokensAllocated', {
        beneficiary: beneficiary2,
        value: allocatedTokens[beneficiary2],
      });
    });

    describe('token release', () => {
      describe('before start', () => {
        it('released tokens should be 0', async () => {
          const timestamp = this.start.sub(new BN(1));
          const releasedTokens = {
            [beneficiary1]: await this.vesting.getReleasedTokensAtTimestamp(beneficiary1, timestamp),
            [beneficiary2]: await this.vesting.getReleasedTokensAtTimestamp(beneficiary2, timestamp),
          };

          expect(releasedTokens[beneficiary1]).to.be.bignumber.equal('0');
          expect(releasedTokens[beneficiary2]).to.be.bignumber.equal('0');
        });
      });

      describe('on start', () => {
        it('released token should be equal to the inital release', async () => {
          const timestamp = this.start;
          const expectedReleasedTokens = {
            [beneficiary1]: allocatedTokens[beneficiary1].mul(initialReleasePercentage).div(new BN(100)),
            [beneficiary2]: allocatedTokens[beneficiary2].mul(initialReleasePercentage).div(new BN(100)),
          };
          const actualReleasedTokens = {
            [beneficiary1]: await this.vesting.getReleasedTokensAtTimestamp(beneficiary1, timestamp),
            [beneficiary2]: await this.vesting.getReleasedTokensAtTimestamp(beneficiary2, timestamp),
          };

          expect(actualReleasedTokens[beneficiary1]).to.be.bignumber.equal(expectedReleasedTokens[beneficiary1]);
          expect(actualReleasedTokens[beneficiary2]).to.be.bignumber.equal(expectedReleasedTokens[beneficiary2]);
        });
      });

      describe('at half vesting period', () => {
        it('released tokens should be equal to inital amount + half remaining tokens', async () => {
          const halfDuration = new BN(duration / 2);
          const durationPercentage = new BN(50);
          const timestamp = this.start.add(halfDuration);

          const initialReleasedTokens = {
            [beneficiary1]: allocatedTokens[beneficiary1].mul(initialReleasePercentage).div(new BN(100)),
            [beneficiary2]: allocatedTokens[beneficiary2].mul(initialReleasePercentage).div(new BN(100)),
          };

          const newlyReleaseTokens = {
            [beneficiary1]: allocatedTokens[beneficiary1]
              .sub(initialReleasedTokens[beneficiary1]).mul(durationPercentage).div(new BN(100)),
            [beneficiary2]: allocatedTokens[beneficiary2]
              .sub(initialReleasedTokens[beneficiary2]).mul(durationPercentage).div(new BN(100)),
          };

          const expectedReleasedTokens = {
            [beneficiary1]: initialReleasedTokens[beneficiary1].add(newlyReleaseTokens[beneficiary1]),
            [beneficiary2]: initialReleasedTokens[beneficiary2].add(newlyReleaseTokens[beneficiary2]),
          };

          const actualReleasedTokens = {
            [beneficiary1]: await this.vesting.getReleasedTokensAtTimestamp(beneficiary1, timestamp),
            [beneficiary2]: await this.vesting.getReleasedTokensAtTimestamp(beneficiary2, timestamp),
          };

          expect(actualReleasedTokens[beneficiary1]).to.be.bignumber.equal(expectedReleasedTokens[beneficiary1]);
          expect(actualReleasedTokens[beneficiary2]).to.be.bignumber.equal(expectedReleasedTokens[beneficiary2]);
        });
      });

      describe('on end', () => {
        it('release tokens should be equal to total allocated tokens', async () => {
          const timestamp = this.start.add(duration);
          const actualReleasedTokens = {
            [beneficiary1]: await this.vesting.getReleasedTokensAtTimestamp(beneficiary1, timestamp),
            [beneficiary2]: await this.vesting.getReleasedTokensAtTimestamp(beneficiary2, timestamp),
          };

          expect(actualReleasedTokens[beneficiary1]).to.be.bignumber.equal(allocatedTokens[beneficiary1]);
          expect(actualReleasedTokens[beneficiary2]).to.be.bignumber.equal(allocatedTokens[beneficiary2]);
        });
      });
    });

    describe('claim', () => {
      describe('before start', () => {
        it('claimable tokens should be 0', async () => {
          const claimableTokens = {
            [beneficiary1]: await this.vesting.getClaimableTokens(beneficiary1),
            [beneficiary2]: await this.vesting.getClaimableTokens(beneficiary2),
          };

          expect(claimableTokens[beneficiary1]).to.be.bignumber.equal('0');
          expect(claimableTokens[beneficiary2]).to.be.bignumber.equal('0');
        });

        it('claimed tokens should be 0', async () => {
          const claimedTokens = {
            [beneficiary1]: await this.vesting.getClaimedTokens(beneficiary1),
            [beneficiary2]: await this.vesting.getClaimedTokens(beneficiary2),
          };

          expect(claimedTokens[beneficiary1]).to.be.bignumber.equal('0');
          expect(claimedTokens[beneficiary2]).to.be.bignumber.equal('0');
        });
      });

      describe('after start', () => {
        beforeEach(async () => {
          await time.increaseTo(this.start);
        });

        it('claimable tokens should be close to the initial release', async () => {
          const actualClaimableTokens = {
            [beneficiary1]: await this.vesting.getClaimableTokens(beneficiary1),
            [beneficiary2]: await this.vesting.getClaimableTokens(beneficiary2),
          };

          const timestamp = await time.latest();

          const expectedClaimableTokens = {
            [beneficiary1]: await this.vesting.getReleasedTokensAtTimestamp(beneficiary1, timestamp),
            [beneficiary2]: await this.vesting.getReleasedTokensAtTimestamp(beneficiary2, timestamp),
          };

          expect(actualClaimableTokens[beneficiary1]).to.be.bignumber.equal(expectedClaimableTokens[beneficiary1]);
          expect(actualClaimableTokens[beneficiary2]).to.be.bignumber.equal(expectedClaimableTokens[beneficiary2]);
        });

        it('claimed tokens should be 0', async () => {
          const claimedTokens = {
            [beneficiary1]: await this.vesting.getClaimedTokens(beneficiary1),
            [beneficiary2]: await this.vesting.getClaimedTokens(beneficiary1),
          };

          expect(claimedTokens[beneficiary1]).to.be.bignumber.equal('0');
          expect(claimedTokens[beneficiary2]).to.be.bignumber.equal('0');
        });

        it('should claim tokens', async () => {
          const beneficiaryInitialBalances = {
            [beneficiary1]: await this.token.balanceOf(beneficiary1),
            [beneficiary2]: await this.token.balanceOf(beneficiary2),
          };

          const contractInitialBalance = await this.token.balanceOf(this.vesting.address);

          await this.vesting.claimTokens([beneficiary1, beneficiary2]);
          const claimTimestamp = await time.latest();

          const expectedClaimedTokens = {
            [beneficiary1]: await this.vesting.getReleasedTokensAtTimestamp(beneficiary1, claimTimestamp),
            [beneficiary2]: await this.vesting.getReleasedTokensAtTimestamp(beneficiary2, claimTimestamp),
          };

          const beneficiaryFinalBalances = {
            [beneficiary1]: await this.token.balanceOf(beneficiary1),
            [beneficiary2]: await this.token.balanceOf(beneficiary2),
          };

          const contractFinalBalance = await this.token.balanceOf(this.vesting.address);

          expect(beneficiaryFinalBalances[beneficiary1])
            .to.be.bignumber.equal(beneficiaryInitialBalances[beneficiary1].add(expectedClaimedTokens[beneficiary1]));
          expect(beneficiaryFinalBalances[beneficiary2])
            .to.be.bignumber.equal(beneficiaryInitialBalances[beneficiary2].add(expectedClaimedTokens[beneficiary2]));
          expect(contractFinalBalance).to.be.bignumber.equal(
            contractInitialBalance.sub(expectedClaimedTokens[beneficiary1]).sub(expectedClaimedTokens[beneficiary2]),
          );
        });

        describe('after claiming tokens', () => {
          beforeEach(async () => {
            const { logs } = await this.vesting.claimTokens([beneficiary1, beneficiary2]);

            this.logs = logs;
            this.claimTimestamp = await time.latest();

            this.claimedTokens = {
              [beneficiary1]: await this.vesting.getReleasedTokensAtTimestamp(beneficiary1, this.claimTimestamp),
              [beneficiary2]: await this.vesting.getReleasedTokensAtTimestamp(beneficiary2, this.claimTimestamp),
            };
          });

          it('emits TokensClaimed event', () => {
            expectEvent.inLogs(this.logs, 'TokensClaimed', {
              beneficiary: beneficiary1,
              value: this.claimedTokens[beneficiary1],
            });

            expectEvent.inLogs(this.logs, 'TokensClaimed', {
              beneficiary: beneficiary2,
              value: this.claimedTokens[beneficiary2],
            });
          });

          it('claimable tokens should be 0', async () => {
            const claimableTokens = {
              [beneficiary1]: await this.vesting.getClaimableTokens(beneficiary1),
              [beneficiary2]: await this.vesting.getClaimableTokens(beneficiary2),
            };

            expect(claimableTokens[beneficiary1]).to.be.bignumber.equal('0');
            expect(claimableTokens[beneficiary2]).to.be.bignumber.equal('0');
          });

          it('claimed tokens should be equal to the received amount', async () => {
            const claimedTokens = {
              [beneficiary1]: await this.vesting.getClaimedTokens(beneficiary1),
              [beneficiary2]: await this.vesting.getClaimedTokens(beneficiary2),
            };

            expect(claimedTokens[beneficiary1]).to.be.bignumber.equal(this.claimedTokens[beneficiary1]);
            expect(claimedTokens[beneficiary2]).to.be.bignumber.equal(this.claimedTokens[beneficiary2]);
          });

          describe('after half vesting period', () => {
            beforeEach(async () => {
              await time.increase(duration / 2);
            });

            it('claimable tokens should be close to half of the remaining tokens', async () => {
              const timestamp = await time.latest();

              const releasedTokens = {
                [beneficiary1]: await this.vesting.getReleasedTokensAtTimestamp(beneficiary1, timestamp),
                [beneficiary2]: await this.vesting.getReleasedTokensAtTimestamp(beneficiary2, timestamp),
              };

              const expectedClaimableTokens = {
                [beneficiary1]: releasedTokens[beneficiary1].sub(this.claimedTokens[beneficiary1]),
                [beneficiary2]: releasedTokens[beneficiary2].sub(this.claimedTokens[beneficiary2]),
              };

              const actualClaimableTokens = {
                [beneficiary1]: await this.vesting.getClaimableTokens(beneficiary1),
                [beneficiary2]: await this.vesting.getClaimableTokens(beneficiary2),
              };

              expect(actualClaimableTokens[beneficiary1])
                .to.be.bignumber.equal(expectedClaimableTokens[beneficiary1]);

              expect(actualClaimableTokens[beneficiary2])
                .to.be.bignumber.equal(expectedClaimableTokens[beneficiary2]);
            });

            it('should claim more tokens', async () => {
              const beneficiaryInitialBalances = {
                [beneficiary1]: await this.token.balanceOf(beneficiary1),
                [beneficiary2]: await this.token.balanceOf(beneficiary2),
              };

              const contractInitialBalance = await this.token.balanceOf(this.vesting.address);

              await this.vesting.claimTokens([beneficiary1, beneficiary2]);
              const claimTimestamp = await time.latest();

              const totalReleasedTokens = {
                [beneficiary1]: await this.vesting.getReleasedTokensAtTimestamp(beneficiary1, claimTimestamp),
                [beneficiary2]: await this.vesting.getReleasedTokensAtTimestamp(beneficiary2, claimTimestamp),
              };

              const expectedClaimedTokens = {
                [beneficiary1]: totalReleasedTokens[beneficiary1].sub(this.claimedTokens[beneficiary1]),
                [beneficiary2]: totalReleasedTokens[beneficiary2].sub(this.claimedTokens[beneficiary2]),
              };

              const beneficiaryFinalBalances = {
                [beneficiary1]: await this.token.balanceOf(beneficiary1),
                [beneficiary2]: await this.token.balanceOf(beneficiary2),
              };

              const contractFinalBalance = await this.token.balanceOf(this.vesting.address);

              expect(beneficiaryFinalBalances[beneficiary1])
                .to.be.bignumber.equal(beneficiaryInitialBalances[beneficiary1].add(expectedClaimedTokens[beneficiary1]));
              expect(beneficiaryFinalBalances[beneficiary2])
                .to.be.bignumber.equal(beneficiaryInitialBalances[beneficiary2].add(expectedClaimedTokens[beneficiary2]));
              expect(contractFinalBalance).to.be.bignumber.equal(
                contractInitialBalance.sub(expectedClaimedTokens[beneficiary1]).sub(expectedClaimedTokens[beneficiary2]),
              );
            });

            describe('after claiming more tokens', () => {
              beforeEach(async () => {
                await this.vesting.claimTokens([beneficiary1, beneficiary2]);
                this.claimTimestamp = await time.latest();
                this.claimedTokens = {
                  [beneficiary1]: await this.vesting.getReleasedTokensAtTimestamp(beneficiary1, this.claimTimestamp),
                  [beneficiary2]: await this.vesting.getReleasedTokensAtTimestamp(beneficiary2, this.claimTimestamp),
                };
              });

              describe('on end', () => {
                beforeEach(async () => {
                  await time.increaseTo(this.start.add(duration));
                });

                it('claimable tokens should be equal to all remaining tokens', async () => {
                  const timestamp = await time.latest();
                  const releasedTokens = {
                    [beneficiary1]: await this.vesting.getReleasedTokensAtTimestamp(beneficiary1, timestamp),
                    [beneficiary2]: await this.vesting.getReleasedTokensAtTimestamp(beneficiary2, timestamp),
                  };

                  const expectedClaimableTokens = {
                    [beneficiary1]: releasedTokens[beneficiary1].sub(this.claimedTokens[beneficiary1]),
                    [beneficiary2]: releasedTokens[beneficiary2].sub(this.claimedTokens[beneficiary2]),
                  };

                  const actualClaimableTokens = {
                    [beneficiary1]: await this.vesting.getClaimableTokens(beneficiary1),
                    [beneficiary2]: await this.vesting.getClaimableTokens(beneficiary2),
                  };

                  expect(actualClaimableTokens[beneficiary1])
                    .to.be.bignumber.equal(expectedClaimableTokens[beneficiary1]);

                  expect(actualClaimableTokens[beneficiary2])
                    .to.be.bignumber.equal(expectedClaimableTokens[beneficiary2]);
                });

                it('should claim the remaining tokens', async () => {
                  const beneficiaryInitialBalances = {
                    [beneficiary1]: await this.token.balanceOf(beneficiary1),
                    [beneficiary2]: await this.token.balanceOf(beneficiary2),
                  };

                  const contractInitialBalance = await this.token.balanceOf(this.vesting.address);

                  await this.vesting.claimTokens([beneficiary1, beneficiary2]);

                  const expectedClaimedTokens = {
                    [beneficiary1]: allocatedTokens[beneficiary1].sub(this.claimedTokens[beneficiary1]),
                    [beneficiary2]: allocatedTokens[beneficiary2].sub(this.claimedTokens[beneficiary2]),
                  };

                  const beneficiaryFinalBalances = {
                    [beneficiary1]: await this.token.balanceOf(beneficiary1),
                    [beneficiary2]: await this.token.balanceOf(beneficiary2),
                  };

                  const contractFinalBalance = await this.token.balanceOf(this.vesting.address);

                  expect(beneficiaryFinalBalances[beneficiary1])
                    .to.be.bignumber.equal(beneficiaryInitialBalances[beneficiary1].add(expectedClaimedTokens[beneficiary1]));
                  expect(beneficiaryFinalBalances[beneficiary2])
                    .to.be.bignumber.equal(beneficiaryInitialBalances[beneficiary2].add(expectedClaimedTokens[beneficiary2]));
                  expect(contractFinalBalance).to.be.bignumber.equal(
                    contractInitialBalance.sub(expectedClaimedTokens[beneficiary1]).sub(expectedClaimedTokens[beneficiary2]),
                  );
                });

                describe('after claiming all tokens', () => {
                  beforeEach(async () => {
                    await this.vesting.claimTokens([beneficiary1, beneficiary2]);
                  });

                  it('claimable tokens should be 0', async () => {
                    const actualClaimableTokens = {
                      [beneficiary1]: await this.vesting.getClaimableTokens(beneficiary1),
                      [beneficiary2]: await this.vesting.getClaimableTokens(beneficiary2),
                    };

                    expect(actualClaimableTokens[beneficiary1]).to.be.bignumber.equal('0');
                    expect(actualClaimableTokens[beneficiary2]).to.be.bignumber.equal('0');
                  });

                  it('reverts when calling the claim function', async () => {
                    await expectRevert(
                      this.vesting.claimTokens([beneficiary1, beneficiary2]),
                      'Vesting: no claimable tokens',
                    );
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
