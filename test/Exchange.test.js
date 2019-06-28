const Exchange = artifacts.require('Exchange');
import {EVM_REVERT, tokens, ether, ETHER_ADDRESS} from './helpers';
const Token = artifacts.require('Token');
require('chai').use(require('chai-as-promised')).should();

contract('Exchange', ([deployer, feeAccount, user1]) => {
    let exchange;
    let token;
    let feePercent = 10;

    beforeEach(async () => {
        token = await Token.new();
        const amount = tokens(100);
        await token.transfer(user1, amount, {from: deployer});
        exchange = await Exchange.new(feeAccount, feePercent);
    });

    describe('Deployment', async () => {
        let result;
        
        it ('Track the feePercent', async () => {
            result = await exchange.feePercent();
            result.toString().should.equal(feePercent.toString());
        });

        it ('Track the feeAccount', async () => {
            result = await exchange.feeAccount();
            result.should.equal(feeAccount);
        });
    });

    describe('Fallback', () => {
        it('Revert ether if someone send', async () => {
            await exchange.sendTransaction({value: 1, from: user1}).should.be.rejectedWith(EVM_REVERT);
        });
    });

    describe('Deposit Ether', () => {
        let result;
        let amount;

        beforeEach(async () => {
            amount = ether(10);
            result = await exchange.depositEther({from: user1, value: amount});
        });

        it('tracks the ether balances', async () => {
            const balances = await exchange.tokens(ETHER_ADDRESS, user1);
            balances.toString().should.equal(amount.toString());
        });

        it('emits the deposit ether event', async () => {
            const log = result.logs[0];
            log.event.should.equal('Deposit');
            const event = log.args;
            event.token.should.equal(ETHER_ADDRESS);
            event.user.should.equal(user1);
            event.amount.toString().should.equal(amount.toString());
            event.balance.toString().should.equal(amount.toString());
        })
    });

    describe('Withdraw Tokens', async () => {
        let amount;
        let result;
        beforeEach(async () => {
            amount = ether(10);
            await exchange.depositEther({from: user1, value: amount});
        });

        describe('Withdraw ether funds', () => {
            beforeEach(async () => {
                result = await exchange.withdarwEther(amount, {from: user1});
            });

            it('withdraw ether funds', async () => {
                const balance = await exchange.tokens(ETHER_ADDRESS, user1);
                balance.toString().should.equal('0');
            });

            it('emits the withdraw ether event', async () => {
                const log = result.logs[0];
                log.event.should.equal('Withdraw');
                const event = log.args;
                event.token.should.equal(ETHER_ADDRESS);
                event.user.should.equal(user1);
                event.amount.toString().should.equal(amount.toString());
                event.balance.toString().should.equal('0');
            });
        });
    });

    describe('Deposit Tokens', async () => {
        describe('Success', () => {
            let amount;
            let result;

            beforeEach(async () => {
                amount = tokens(10);
                await token.approve(exchange.address, amount, {from: user1});
                result = await exchange.depositTokens(token.address, amount, {from: user1});
            });

            it('track the token deposit', async () => {
                // Check exchange token balances
                let balance;
                balance = await token.balanceOf(exchange.address);
                balance.toString().should.equal(amount.toString());
                balance = await exchange.tokens(token.address, user1);
                balance.toString().should.equal(amount.toString());
            });

            it('Emits the deposit tokens event', async () => {
                const log = result.logs[0]
                log.event.should.equal('Deposit');
                const event = log.args;
                event.token.should.equal(token.address);
                event.user.should.equal(user1);
                event.amount.toString().should.equal(amount.toString());
                event.balance.toString().should.equal(amount.toString());
            });
        });

        describe('Failure', () => {
            it('Reject if ether sent', async () => {
                await exchange.depositTokens(ETHER_ADDRESS, tokens(10), {from: user1}).should.be.rejectedWith(EVM_REVERT);
            });

            it('Failes if no tokens approved', async () => {
                await exchange.depositTokens(token.address, tokens(10), {from: user1}).should.be.rejectedWith(EVM_REVERT);
            });
        });
    });

    describe('Withdraw Tokens', async () => {
        let amount;
        let result;
        describe('Success', () => {
            beforeEach(async () => {
                amount = tokens(10);
                await token.approve(exchange.address, amount, {from: user1});
                await exchange.depositTokens(token.address, amount, {from: user1});

                // withdraw tokens
                result = await exchange.withdrawTokens(token.address, amount, {from: user1});
            });

        
            it('check balances', async () => {
                let balance = await exchange.tokens(token.address, user1);
                balance.toString().should.equal('0');
                balance = await token.balanceOf(user1);
                balance.toString().should.equal(tokens(100).toString());
            });

            it('withdraw Event emit', async () => {
                const log = result.logs[0];
                log.event.should.equal('Withdraw');
                const event = log.args;
                event.token.should.equal(token.address);
                event.user.should.equal(user1);
                event.amount.toString().should.equal(amount.toString());
                event.balance.toString().should.equal('0');
            });
        });

        describe('Failure', () => {
            it('reject ether withdraw', async () => {
                await exchange.withdrawTokens(ETHER_ADDRESS, ether(10), {from: user1}).should.be.rejectedWith(EVM_REVERT);
            });

            it('reject if insufficient balance', async () => {
                await exchange.withdrawTokens(token.address, tokens(10), {from: user1}).should.be.rejectedWith(EVM_REVERT);
            });
        });
    });
});
