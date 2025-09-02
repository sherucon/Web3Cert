// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title UniversityCertificate
 * @dev Smart contract for issuing and verifying university certificates
 * @notice This contract allows universities to issue tamper-proof certificates on blockchain
 */
contract UniversityCertificate is Ownable, ReentrancyGuard {
    
    uint256 private _certificateIdCounter;
    
    struct Certificate {
        uint256 id;
        string studentName;
        string courseName;
        string university;
        string ipfsHash; // IPFS hash of the PDF certificate
        uint256 issueDate;
        address issuer;
        bool isValid;
        string grade;
        uint256 completionDate;
    }
    
    struct University {
        string name;
        string registrationNumber;
        bool isVerified;
        address admin;
    }
    
    // Mapping from certificate ID to Certificate
    mapping(uint256 => Certificate) public certificates;
    
    // Mapping from university address to University details
    mapping(address => University) public universities;
    
    // Mapping from student address to array of certificate IDs
    mapping(address => uint256[]) public studentCertificates;
    
    // Mapping from IPFS hash to certificate ID (to prevent duplicates)
    mapping(string => uint256) public ipfsHashToCertificateId;
    
    // Events
    event CertificateIssued(
        uint256 indexed certificateId,
        address indexed student,
        address indexed university,
        string courseName,
        string ipfsHash
    );
    
    event UniversityRegistered(
        address indexed universityAddress,
        string name,
        string registrationNumber
    );
    
    event UniversityVerified(address indexed universityAddress);
    
    event CertificateRevoked(uint256 indexed certificateId);
    
    modifier onlyVerifiedUniversity() {
        require(universities[msg.sender].isVerified, "University not verified");
        _;
    }
    
    modifier onlyUniversityAdmin(address universityAddress) {
        require(universities[universityAddress].admin == msg.sender, "Not university admin");
        _;
    }
    
    constructor() Ownable(msg.sender) {
        _certificateIdCounter = 0;
    }
    
    /**
     * @dev Register a new university
     * @param name University name
     * @param registrationNumber Official registration number
     */
    function registerUniversity(
        string memory name,
        string memory registrationNumber
    ) external {
        require(bytes(universities[msg.sender].name).length == 0, "University already registered");
        
        universities[msg.sender] = University({
            name: name,
            registrationNumber: registrationNumber,
            isVerified: false,
            admin: msg.sender
        });
        
        emit UniversityRegistered(msg.sender, name, registrationNumber);
    }
    
    /**
     * @dev Verify a university (only contract owner can do this)
     * @param universityAddress Address of the university to verify
     */
    function verifyUniversity(address universityAddress) external onlyOwner {
        require(bytes(universities[universityAddress].name).length > 0, "University not registered");
        universities[universityAddress].isVerified = true;
        emit UniversityVerified(universityAddress);
    }
    
    /**
     * @dev Issue a new certificate
     * @param studentAddress Address of the student
     * @param studentName Name of the student
     * @param courseName Name of the course
     * @param ipfsHash IPFS hash of the certificate PDF
     * @param grade Grade achieved
     * @param completionDate Date of course completion
     */
    function issueCertificate(
        address studentAddress,
        string memory studentName,
        string memory courseName,
        string memory ipfsHash,
        string memory grade,
        uint256 completionDate
    ) external onlyVerifiedUniversity nonReentrant {
        require(studentAddress != address(0), "Invalid student address");
        require(bytes(studentName).length > 0, "Student name required");
        require(bytes(courseName).length > 0, "Course name required");
        require(bytes(ipfsHash).length > 0, "IPFS hash required");
        require(completionDate <= block.timestamp, "Invalid completion date");
        require(ipfsHashToCertificateId[ipfsHash] == 0, "Certificate already exists");
        
        _certificateIdCounter++;
        uint256 newCertificateId = _certificateIdCounter;
        
        certificates[newCertificateId] = Certificate({
            id: newCertificateId,
            studentName: studentName,
            courseName: courseName,
            university: universities[msg.sender].name,
            ipfsHash: ipfsHash,
            issueDate: block.timestamp,
            issuer: msg.sender,
            isValid: true,
            grade: grade,
            completionDate: completionDate
        });
        
        studentCertificates[studentAddress].push(newCertificateId);
        ipfsHashToCertificateId[ipfsHash] = newCertificateId;
        
        emit CertificateIssued(
            newCertificateId,
            studentAddress,
            msg.sender,
            courseName,
            ipfsHash
        );
    }
    
    /**
     * @dev Verify a certificate by ID
     * @param certificateId ID of the certificate to verify
     * @return certificate Certificate details
     * @return isValid Validity status
     */
    function verifyCertificate(uint256 certificateId) 
        external 
        view 
        returns (
            Certificate memory certificate,
            bool isValid
        ) 
    {
        require(certificateId <= _certificateIdCounter && certificateId > 0, "Certificate does not exist");
        Certificate memory cert = certificates[certificateId];
        return (cert, cert.isValid);
    }
    
    /**
     * @dev Verify a certificate by IPFS hash
     * @param ipfsHash IPFS hash of the certificate
     * @return certificate Certificate details
     * @return isValid Validity status
     */
    function verifyCertificateByHash(string memory ipfsHash)
        external
        view
        returns (
            Certificate memory certificate,
            bool isValid
        )
    {
        uint256 certificateId = ipfsHashToCertificateId[ipfsHash];
        require(certificateId > 0, "Certificate not found");
        Certificate memory cert = certificates[certificateId];
        return (cert, cert.isValid);
    }
    
    /**
     * @dev Revoke a certificate (only issuing university can do this)
     * @param certificateId ID of the certificate to revoke
     */
    /**
     * @dev Revoke a certificate (only issuing university can do this)
     * @param certificateId ID of the certificate to revoke
     */
    
    /**
     * @dev Get all certificates for a student
     * @param studentAddress Address of the student
     * @return Array of certificate IDs
     */
    function getStudentCertificates(address studentAddress) 
        external 
        view 
        returns (uint256[] memory) 
    {
        return studentCertificates[studentAddress];
    }
    
    /**
     * @dev Get total number of certificates issued
     * @return Total certificate count
     */
    /**
     * @dev Get total number of certificates issued
     * @return Total certificate count
     */
    
    /**
     * @dev Check if a university is verified
     * @param universityAddress Address of the university
     * @return Whether the university is verified
     */
    function isUniversityVerified(address universityAddress) 
        external 
        view 
        returns (bool) 
    {
        return universities[universityAddress].isVerified;
    }
    
    /**
     * @dev Get university details
     * @param universityAddress Address of the university
     * @return University details
     */
    /**
     * @dev Get university details
     * @param universityAddress Address of the university
     * @return University details
     */
}
