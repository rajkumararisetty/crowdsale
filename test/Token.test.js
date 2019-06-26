const Token = artifacts.require("Token");
import {tokens, EVM_REVERT} from './helpers';
require('chai').use(require('chai-as-promised')).should();

contract('Token', ([deployer, receiver, exchanger]) => {
    let token;

    const name = "N Token";
    const symbol = "N";
    const decimals = 18;
    const totalSupply = tokens(1000).toString();

    beforeEach(async () => {
        token = await Token.new();
    });

    describe('deployment', () => {
        it('tracks the name', async () => {
            const result = await token.name();
            result.should.equal(name);
        });

        it('tracks the symbol', async () => {
            const result = await token.symbol();
            result.should.equal(result);
        });

        it('tracks the decimals', async () => {
            const result = await token.decimals();
            result.should.equal(result);
        });

        it('tracks the totalSupply', async () => {
            const result = await token.totalSupply();
            result.toString().should.equal(totalSupply);
        });

        it('tracks the token balance of deployer', async () => {
            const result = await token.balanceOf(deployer);
            result.toString().should.equal(totalSupply);
        });
    });

    describe('sending Tokens', () => {
        let amount;
        let result;

        describe('Success', async () => {
            beforeEach(async () => {
                amount = tokens(10);
                result = await token.transfer(receiver, amount, {from: deployer});
            });

            it('transfer token balances', async () => {
                let balanceOf;
                balanceOf = await token.balanceOf(receiver);
                balanceOf.toString().should.equal(amount.toString());

                balanceOf = await token.balanceOf(deployer);
                balanceOf.toString().should.equal(tokens(990).toString());
            });

            it('emits token transfer event', async () => {
                const log = result.logs[0];
                log.event.should.equal('Transfer');
                const event = log.args;
                event.from.should.equal(deployer, 'From is correct');
                event.to.should.equal(receiver, 'To is correct');
                event.value.toString().should.equal(amount.toString());
            });
        });

        describe('Failure', async () => {
            it('reject insufficinet balance', async () => {
                amount = tokens(100);
                await token.transfer(deployer, amount, {from: receiver}).should.be.rejectedWith(EVM_REVERT);
            });

            it('Rejects invalid recipients', async () => {
                await token.transfer(0x0, amount, {from: deployer}).should.be.rejected;
            });
        });
    });

    describe('approve tokens', async () => {
        let amount;
        let result

        describe('Success', () => {
            beforeEach(async () => {
                amount = tokens(20);
                result = await token.approve(exchanger, amount, {from: deployer});
            });

            it ('allocate an allowance for delegated token spending on exchange', async() => {
                const allowance = await token.allowance(deployer, exchanger);
                allowance.toString().should.equal(amount.toString());
            });

            it('Emit approval events', () => {
                const log = result.logs[0];
                log.event.should.equal('Approve');
                const event = log.args;
                event.owner.should.equal(deployer);
                event.spender.should.equal(exchanger);
                event.value.toString().should.equal(amount.toString());
            })
        });

        describe('Failure', () => {
            it('Rejects invalid spender approval calls', async () => {
                amount = tokens(20);
                await token.approve(0x0, amount, {from: deployer}).should.be.rejected;
            });
        });
    });

    describe('deligated tokens transfer', async () => {
        let amount;
        let result;
        let balance;
        let allowance;
        beforeEach(async () => {
            amount = tokens(20);
            result = await token.approve(exchanger, amount, {from: deployer});
        });
        describe('Success', () => {
            beforeEach(async () => {
                amount = tokens(10);
                result = await token.transferFrom(deployer, receiver, amount, {from: exchanger});
            });

            it('Check the balances', async () => {
                balance = await token.balanceOf(deployer);
                balance.toString().should.equal(tokens(990).toString());

                balance = await token.balanceOf(receiver);
                balance.toString().should.equal(tokens(10).toString());

                allowance = await token.allowance(deployer, exchanger);
                allowance.toString().should.equal(tokens(10).toString());
            });

            it('Approval event', async () => {
                const log = result.logs[0];
                log.event.should.equal('Transfer');
                const event = log.args;
                event.from.should.equal(deployer);
                event.to.should.equal(receiver);
                event.value.toString().should.equal(amount.toString());
            });
        });

        describe('Failure', () => {
            it('Transfer more than approved', async () => {
                amount = tokens(30);
                await token.transferFrom(deployer, receiver, amount, {from: exchanger}).should.be.rejected;
            });

            it('Transfer to invalid recipient', async () => {
                amount = tokens(10);
                await token.transferFrom(deployer, 0x0, amount, {from: exchanger}).should.be.rejected;
            });
        });
    });
});

