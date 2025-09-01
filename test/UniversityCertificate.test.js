// const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("UniversityCertificate", function () {
    let UniversityCertificate;
    let universityCertificate;
    let owner;
    let university;
    let student;
    let otherAccount;

    beforeEach(async function () {
        [owner, university, student, otherAccount] = await ethers.getSigners();

        UniversityCertificate = await ethers.getContractFactory("UniversityCertificate");
        universityCertificate = await UniversityCertificate.deploy();
    });

    describe("University Registration", function () {
        it("Should register a university", async function () {
            await universityCertificate.connect(university).registerUniversity(
                "Harvard University",
                "HU001"
            );

            const universityDetails = await universityCertificate.getUniversityDetails(university.address);
            expect(universityDetails.name).to.equal("Harvard University");
            expect(universityDetails.registrationNumber).to.equal("HU001");
            expect(universityDetails.isVerified).to.be.false;
            expect(universityDetails.admin).to.equal(university.address);
        });

        it("Should not allow duplicate university registration", async function () {
            await universityCertificate.connect(university).registerUniversity(
                "Harvard University",
                "HU001"
            );

            await expect(
                universityCertificate.connect(university).registerUniversity(
                    "Harvard University 2",
                    "HU002"
                )
            ).to.be.revertedWith("University already registered");
        });

        it("Should verify a university", async function () {
            await universityCertificate.connect(university).registerUniversity(
                "Harvard University",
                "HU001"
            );

            await universityCertificate.connect(owner).verifyUniversity(university.address);

            const isVerified = await universityCertificate.isUniversityVerified(university.address);
            expect(isVerified).to.be.true;
        });
    });

    describe("Certificate Issuance", function () {
        beforeEach(async function () {
            await universityCertificate.connect(university).registerUniversity(
                "Harvard University",
                "HU001"
            );
            await universityCertificate.connect(owner).verifyUniversity(university.address);
        });

        it("Should issue a certificate", async function () {
            const completionDate = Math.floor(Date.now() / 1000) - 86400; // Yesterday

            await expect(
                universityCertificate.connect(university).issueCertificate(
                    student.address,
                    "John Doe",
                    "Computer Science",
                    "QmTestHash123",
                    "A+",
                    completionDate
                )
            ).to.emit(universityCertificate, "CertificateIssued");

            const [certificate, isValid] = await universityCertificate.verifyCertificate(1);

            expect(certificate.studentName).to.equal("John Doe");
            expect(certificate.courseName).to.equal("Computer Science");
            expect(certificate.university).to.equal("Harvard University");
            expect(certificate.ipfsHash).to.equal("QmTestHash123");
            expect(certificate.grade).to.equal("A+");
            expect(isValid).to.be.true;
        });

        it("Should not allow unverified universities to issue certificates", async function () {
            await universityCertificate.connect(otherAccount).registerUniversity(
                "Fake University",
                "FU001"
            );

            const completionDate = Math.floor(Date.now() / 1000) - 86400;

            await expect(
                universityCertificate.connect(otherAccount).issueCertificate(
                    student.address,
                    "John Doe",
                    "Computer Science",
                    "QmTestHash123",
                    "A+",
                    completionDate
                )
            ).to.be.revertedWith("University not verified");
        });
    });

    describe("Certificate Verification", function () {
        beforeEach(async function () {
            await universityCertificate.connect(university).registerUniversity(
                "Harvard University",
                "HU001"
            );
            await universityCertificate.connect(owner).verifyUniversity(university.address);

            const completionDate = Math.floor(Date.now() / 1000) - 86400;
            await universityCertificate.connect(university).issueCertificate(
                student.address,
                "John Doe",
                "Computer Science",
                "QmTestHash123",
                "A+",
                completionDate
            );
        });

        it("Should verify certificate by ID", async function () {
            const [certificate, isValid] = await universityCertificate.verifyCertificate(1);

            expect(certificate.studentName).to.equal("John Doe");
            expect(isValid).to.be.true;
        });

        it("Should verify certificate by IPFS hash", async function () {
            const [certificate, isValid] = await universityCertificate.verifyCertificateByHash("QmTestHash123");

            expect(certificate.studentName).to.equal("John Doe");
            expect(isValid).to.be.true;
        });
    });

    describe("Student Certificates", function () {
        beforeEach(async function () {
            await universityCertificate.connect(university).registerUniversity(
                "Harvard University",
                "HU001"
            );
            await universityCertificate.connect(owner).verifyUniversity(university.address);
        });

        it("Should return student certificates", async function () {
            const completionDate = Math.floor(Date.now() / 1000) - 86400;

            await universityCertificate.connect(university).issueCertificate(
                student.address,
                "John Doe",
                "Computer Science",
                "QmTestHash1",
                "A+",
                completionDate
            );

            await universityCertificate.connect(university).issueCertificate(
                student.address,
                "John Doe",
                "Mathematics",
                "QmTestHash2",
                "A",
                completionDate
            );

            const certificates = await universityCertificate.getStudentCertificates(student.address);
            expect(certificates.length).to.equal(2);
            expect(certificates[0]).to.equal(1);
            expect(certificates[1]).to.equal(2);
        });
    });
});
