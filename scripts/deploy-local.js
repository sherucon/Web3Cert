const { ethers } = require("hardhat");

async function main() {
    console.log("Deploying UniversityCertificate contract to localhost...");

    const [deployer] = await ethers.getSigners();
    console.log("Deploying with account:", deployer.address);
    console.log("Account balance:", (await deployer.provider.getBalance(deployer.address)).toString());

    const UniversityCertificate = await ethers.getContractFactory("UniversityCertificate");
    const universityCertificate = await UniversityCertificate.deploy();

    await universityCertificate.waitForDeployment();

    const contractAddress = await universityCertificate.getAddress();
    console.log("UniversityCertificate deployed to:", contractAddress);

    // Save deployment info for local testing
    const fs = require('fs');
    const deploymentInfo = {
        address: contractAddress,
        network: "localhost",
        deployedAt: new Date().toISOString(),
        deployer: deployer.address
    };

    fs.writeFileSync('./deployment.json', JSON.stringify(deploymentInfo, null, 2));
    console.log("Deployment info saved to deployment.json");

    return contractAddress;
}

if (require.main === module) {
    main()
        .then(() => process.exit(0))
        .catch((error) => {
            console.error(error);
            process.exit(1);
        });
}

module.exports = main;
