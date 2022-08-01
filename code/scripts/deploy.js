const { ethers } = require("hardhat");
const constructorArguments = require("../utils/constructor-args");

async function main() {
    console.log("Deploying contract...");

    const LandContract = await ethers.getContractFactory("Land");

    const landContract = await LandContract.deploy(...constructorArguments);
    await landContract.deployed();

    console.log("Land Contract Deployed To: ", landContract.address);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.log(error);
        process.exit(1);
    })