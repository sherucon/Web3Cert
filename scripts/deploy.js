const { ethers } = require("hardhat");

async function main() {
    console.log("Deploying UniversityCertificate contract...");

    // Get the ContractFactory and Signers here.
    const [deployer] = await ethers.getSigners();

    console.log("Deploying contracts with the account:", deployer.address);
    console.log("Account balance:", (await deployer.provider.getBalance(deployer.address)).toString());

    // Deploy the contract
    const UniversityCertificate = await ethers.getContractFactory("UniversityCertificate");
    const universityCertificate = await UniversityCertificate.deploy();

    await universityCertificate.waitForDeployment();

    console.log("UniversityCertificate deployed to:", await universityCertificate.getAddress());
    console.log("Transaction hash:", universityCertificate.deploymentTransaction().hash);

    // Save contract address and ABI
    const fs = require('fs');
    const contractAddress = await universityCertificate.getAddress();

    const deploymentInfo = {
        address: contractAddress,
        network: "amoy",
        deployedAt: new Date().toISOString(),
        deployer: deployer.address
    };

    fs.writeFileSync('./deployment.json', JSON.stringify(deploymentInfo, null, 2));
    console.log("Deployment info saved to deployment.json");

    // Verify the contract on Polygonscan (optional)
    if (process.env.POLYGONSCAN_API_KEY) {
        console.log("Waiting for block confirmations...");
        await universityCertificate.deploymentTransaction().wait(5);

        try {
            await hre.run("verify:verify", {
                address: contractAddress,
                constructorArguments: [],
            });
            console.log("Contract verified on Polygonscan");
        } catch (error) {
            console.log("Verification failed:", error.message);
        }
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
