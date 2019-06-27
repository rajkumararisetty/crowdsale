const Exchange = artifacts.require('Exchange');
import {EVM_REVERT, tokens} from './helpers';
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
    })
});
