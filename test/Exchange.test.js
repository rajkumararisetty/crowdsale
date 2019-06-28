const Exchange = artifacts.require('Exchange');
import {EVM_REVERT, tokens, ether, ETHER_ADDRESS} from './helpers';
const Token = artifacts.require('Token');
require('chai').use(require('chai-as-promised')).should();

contract('Exchange', ([deployer, feeAccount, user1, user2]) => {
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
            amount = ether(1);
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

    describe('Withdraw Ether', async () => {
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

    describe('balance of', () => {
        beforeEach(async () => {
            const amount = ether(1);
            await exchange.depositEther({from: user1, value: amount});
        });
        it('user token balance', async () => {
            const balance = await exchange.balanceOf(ETHER_ADDRESS, {from: user1});
            balance.toString().should.equal(ether(1).toString());
        });
    });

    describe('Making order', () => {
        let result;
        beforeEach(async () => {
            result = await exchange.makeOrder(token.address, tokens(10), ETHER_ADDRESS, ether(1), {from: user1});
        });

        it('tracks the newly created order', async () => {
            const orderCount = await exchange.orderCount();
            orderCount.toString().should.equal('1');
            const order = await exchange.orders('1');
            order.id.toString().should.equal('1', 'id is correct');
            order.user.should.equal(user1, 'user is correct');
            order.tokenGet.should.equal(token.address, 'tokenGet is correct');
            order.amountGet.toString().should.equal(tokens(10).toString(), 'amountGet is correct');
            order.tokenGive.should.equal(ETHER_ADDRESS, 'tokenGive is correct');
            order.amountGive.toString().should.equal(ether(1).toString(), 'amountGive is correct');
            order.timestamp.toString().length.should.be.at.least(1, 'timestamp is present');
        });

         it('emit an "Order" event', async () => {
            const log = result.logs[0];
            log.event.should.equal('Order');
            const event = log.args;
            event.id.toString().should.equal('1', 'id is correct');
            event.user.should.equal(user1, 'user is correct');
            event.tokenGet.should.equal(token.address, 'tokenGet is correct');
            event.amountGet.toString().should.equal(tokens(10).toString(), 'amountGet is correct');
            event.tokenGive.should.equal(ETHER_ADDRESS, 'tokenGive is correct');
            event.amountGive.toString().should.equal(ether(1).toString(), 'amountGive is correct');
            event.timestamp.toString().length.should.be.at.least(1, 'timestamp is present');
        });
    });

    describe('Order Actions', () => {
        let result;
        beforeEach(async () => {
            // User1 deposit ether
            await exchange.depositEther({from: user1, value: ether(2)});
            // user2 get tokens from deployer(transfer function)
            await token.transfer(user2, tokens(10), {from: deployer});
            // user2 approvs tokens to exchange
            await token.approve(exchange.address, tokens(2), {from: user2});
            // Deposit tokens
            await exchange.depositTokens(token.address, tokens(2), {from: user2});
            // user1 make order
            await exchange.makeOrder(token.address, tokens(1), ETHER_ADDRESS, ether(1), {from: user1});
        });

        describe('Filling Orders', () => {
            describe('Success', () => {
                beforeEach(async () => {
                // user2 fills order
                result = await exchange.fillOrder('1', {from: user2});
                });

                it('execute the trade & charge fees', async () => {
                    let balance;
                    balance = await exchange.balanceOf(token.address, {from: user1});
                    balance.toString().should.equal(tokens(1).toString());

                    balance = await exchange.balanceOf(ETHER_ADDRESS, {from: user2});
                    balance.toString().should.equal(ether(1).toString());

                    balance = await exchange.balanceOf(token.address, {from: user2});
                    balance.toString().should.equal(tokens(0.9).toString());

                    balance = await exchange.balanceOf(ETHER_ADDRESS, {from: user1});
                    balance.toString().should.equal(ether(1).toString());

                    const feeAccount = await exchange.feeAccount();
                    balance = await exchange.balanceOf(token.address, {from: feeAccount});
                    balance.toString().should.equal(tokens(0.1).toString());
                });

                it('check filled order', async () => {
                    const orderFilled = await exchange.filledOrders(1);
                    orderFilled.should.equal(true);
                });

                it('emits a "Trade" event', async () => {
                    const log = result.logs[0]
                    log.event.should.eq('Trade')
                    const event = log.args
                    event.id.toString().should.equal('1', 'id is correct')
                    event.user.should.equal(user1, 'user is correct')
                    event.tokenGet.should.equal(token.address, 'tokenGet is correct')
                    event.amountGet.toString().should.equal(tokens(1).toString(), 'amountGet is correct')
                    event.tokenGive.should.equal(ETHER_ADDRESS, 'tokenGive is correct')
                    event.amountGive.toString().should.equal(ether(1).toString(), 'amountGive is correct')
                    event.userFill.should.equal(user2, 'userFill is correct')
                    event.timestamp.toString().length.should.be.at.least(1, 'timestamp is present')
                });
            });
        });

        describe('failure', () => {
            it('rejects invalid order ids', async () => {
                const invalidOrderId = 99999;
                await exchange.fillOrder(invalidOrderId, {from: user2}).should.be.rejectedWith(EVM_REVERT)
            });

            it ('rejects already fillded order', async () => {
                // Fill the order
                await exchange.fillOrder('1', {from: user2}).should.be.fulfilled;
                // Try to fill it again
                await exchange.fillOrder('1', {from: user2}).should.be.rejectedWith(EVM_REVERT);
            })

            it ('rejects cancelled orders', async () => {
                // Cancel the order
                await exchange.cancelOrder('1', {from: user1}).should.be.fulfilled;
                // Try to fill the cancelled order
                await exchange.fillOrder('1', {from: user2}).should.be.rejectedWith(EVM_REVERT);

            })
        });
        describe('cacelling orders', () => {
            let result;
            describe('success', () => {
                beforeEach(async () => {
                    result = await exchange.cancelOrder('1', {from: user1});
                });

                it('updates cacelled orders', async () => {
                    const cancelledOrder = await exchange.cancelledOrders(1);
                    cancelledOrder.should.equal(true);
                });

                it('emits a "orderCancel" event', async () => {
                    const log = result.logs[0];
                    log.event.should.equal('orderCancel');
                    const event = log.args;
                    event.id.toString().should.equal('1', 'id is correct');
                    event.user.should.equal(user1, 'user is correct');
                    event.tokenGet.should.equal(token.address, 'tokenGet is correct');
                    event.amountGet.toString().should.equal(tokens(1).toString(), 'amountGet is correct');
                    event.tokenGive.should.equal(ETHER_ADDRESS, 'tokenGive is correct');
                    event.amountGive.toString().should.equal(ether(1).toString(), 'amountGive is correct');
                    event.timestamp.toString().length.should.be.at.least(1, 'timestamp is present');
                });
            });

            describe('failure', () => {
                it('reject invalid order id', async () => {
                    const invalidOptionId = 99999;
                    await exchange.cancelOrder(invalidOptionId, {from: user1}).should.be.rejectedWith(EVM_REVERT);
                });

                it('reject unauthorized cancellation', async () => {
                    // Try to cancel the order from  another user
                    await exchange.cancelOrder('1', {from: user2}).should.be.rejectedWith(EVM_REVERT);
                });
            })
        })
    });
});
