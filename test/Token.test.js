const Token = artifacts.require("Token");
import {tokens} from './helpers';
require('chai').use(require('chai-as-promised')).should();

contract('Token', ([deployer]) => {
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
});