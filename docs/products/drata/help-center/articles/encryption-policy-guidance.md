# Encryption Policy Guidance

Source: https://help.drata.com/en/articles/7874603-encryption-policy-guidance
Collection: Policy Guidance
Updated: 2026-08-05
Fetched: 2026-11-22

## Article text

The following article contains guidance explaining portions of the Encryption Policy that we frequently see questions around, explaining what the sections mean.

Guidance statements will appear in bold and enclosed in brackets “[]” below the statements of the policy.

### Encryption Policy

### [COMPANY NAME]

______________________________________________________________________

### Purpose 

This policy defines organizational requirements for the use of cryptographic controls, as well as the requirements for cryptographic keys, in order to protect the confidentiality, integrity, authenticity, and nonrepudiation of information.

### Scope

This policy applies to all systems, equipment, facilities and information within the scope of [COMPANY NAME]’s information security program. All employees, contractors, part-time, and temporary workers, service providers, and those employed by others to perform work on behalf of the organization having to do with cryptographic systems, algorithms, or keying material are subject to this policy and must comply with it.

### Background

This policy defines the high level objectives and implementation instructions for [COMPANY NAME]’s use of cryptographic algorithms and keys. It is vital that the organization adopt a standard approach to cryptographic controls across all work centers in order to ensure end-to-end security, while also promoting interoperability. This document defines the specific algorithms approved for use, requirements for key management and protection, and requirements for using cryptography in cloud environments.

### Roles and Responsibilities

**<ROLES AND RESPONSIBILITIES>**

**[Additional guidance on what roles and responsibilities to list in this policy can be found here: [https://help.drata.com/en/articles/5829670-roles-and-responsibilities-guidance](roles-and-responsibilities-guidance.md). To use that article, you should list the answer to each question here as a role. For example: “Who is responsible for updating, reviewing, and maintaining this policy?” may become “The CISO is responsible for updating, reviewing, and maintaining this policy.”]**

### Policy

### Cryptography Controls

[COMPANY NAME] must protect individual systems or information by means of cryptographic controls as defined in Table 3:

*Table 3: Cryptographic Controls*

| **Name of System/ Type of Information** | **Cryptographic Tool** | **Algorithm** | **Key Size** |
|---|---|---|---|
| PKI for Authentication | OpenSSL | AES-256 | 256-bit key |
| Data Encryption Keys | OpenSSL | AES-256 | 256-bit key |
| Virtual Private Network (VPN) keys | OpenSSL and OpenVPN | AES-256 | 256-bit key |
| Website SSL Certificate | OpenSSL, CERT | AES-256 | 256-bit key |

**[The items and values in this table are for illustrative purposes. Your implementation may be different than the above. For instance, you may require Data Encryption Keys (which would consist of customer data-at-rest encryption as well as workstations) to use AES-512 with a 512-bit key. Similarly, you may use different forms of encryption, such as digital signatures, in which case you will likely list an asymmetric encryption algorithm.]**

### Obtaining Information

When required, customers of [COMPANY NAME]’s cloud-based software platform offering must be able to obtain information regarding:

- The cryptographic tools used to protect their information.
- Any capabilities that are available to allow cloud service customers to apply their own cryptographic solutions.
- The identity of the countries where the cryptographic tools are used to store or transfer cloud service customers’ data.

**[This section means that if a customer asks how their data is encrypted, you will provide that information to them.]**

### Governing Law

The use of organizationally-approved encryption must be governed in accordance with the laws of the country, region, or other regulating entity in which users perform their work. Encryption must not be used to violate any laws or regulations including import/export restrictions. The encryption used by [COMPANY NAME] conforms to international standards and U.S. import/export requirements, and thus can be used across international boundaries for business purposes.

**[This language is specific to ISO 27001. If you are not targeting ISO 27001, you may remove this. If you are a non-US based company, you may remove the language related to US import/export laws. If you want to check the laws of your country or countries you operate in, this is a good resource: [https://www.gp-digital.org/world-map-of-encryption/](https://www.gp-digital.org/world-map-of-encryption/)]**

### Key Management

Except where otherwise stated, keys must be managed by their owners. Cryptographic keys must be protected against loss, change or destruction by applying appropriate access control mechanisms to prevent unauthorized use and backing up keys on a regular basis.

Key Management Service

All key management must be performed using software that automatically manages key generation, access control, secure storage, backup and rotation of keys. Specifically:

- The key management service must provide key access to specifically-designated users, with the ability to encrypt/decrypt information and generate data encryption keys.
- The key management service must provide key administration access to specifically-designated users, with the ability to create, schedule delete, enable/disable rotation, and set usage policies for keys.
- The key management service must store and backup keys for the entirety of their operational lifetime.
- The key management service must rotate keys at least once every 12 months.

**[The Key Management and Key Management Service sections may be updated as appropriate. You may rely entirely on the Key Management Service provided by your cloud infrastructure provider, such as AWS KMS. In that case, you will want to note that in the above sections and explain how those services handle the key management process.]**

Secret Key

Keys used for secret key encryption (symmetric cryptography) must be protected as they are distributed to all parties that will use them.

- During distribution, the symmetric encryption keys must be encrypted using a stronger algorithm with a key of the longest key length for that algorithm.
- If the keys are for the strongest algorithm, then the key must be split, each portion of the key encrypted with a different key that is the longest key length authorized and each encrypted portion is transmitted using different transmission mechanisms.

Symmetric encryption keys, when at rest, must be protected with security measures at least as stringent as the measures used for distribution of that key.

**[This section may be updated with how you specifically use symmetric encryption and how you protect the keys used in symmetric encryption. You may utilize a different process or you may rely entirely on your cloud provider’s process. In this event, you should update this section to reflect that.]**

Public Key

Public key cryptography (asymmetric cryptography) uses public-private key pairs. The public key is passed to the certificate authority to be included in the digital certificate issued to the end user. The digital certificate is available to everyone once it is issued. The private key should only be available to the end user to whom the corresponding digital certificate is issued.

- [COMPANY NAME]’s Public Key Infrastructure (PKI)
   - The public-private key pairs used by the [COMPANY NAME]’s public key infrastructure (PKI) are generated on the tamper-resistant smart card issued to an individual end user.
   - The private key associated with an end user’s identity certificate, which are only used for digital signatures, will never leave the smart card. This prevents the Infosec Team from escrowing any private keys associated with identity certificates.
   - The private key associated with any encryption certificates, which are used to encrypt email and other documents, must be escrowed in compliance with [COMPANY NAME] policies.
   - Access to the private keys stored on a [COMPANY NAME]-issued smart card will be protected by a personal identification number (PIN) known only to the individual to whom the smart card is issued. The smart card software will be configured to require entering the PIN prior to any private key contained on the smart card being accessed.

**[The use of smart cards is not required. This language may be removed or replaced as appropriate.]**

**[This section may be updated as appropriate. You may use public key cryptography for other purposes, such as code signing certificates. In this case, you should update this section to reflect how your organization utilizes public key cryptography.]**

Other Public Key

Other types of keys may be generated in software on the end user’s computer and can be stored as files on the hard drive or on a hardware token. If the public-private key pair is generated on a smartcard, the requirements for protecting the private keys are the same as those for private keys associated with [COMPANY NAME] PKI.

- If the keys are generated in software, the end user is required to create at least one backup of these keys and store any backup copies securely.
- The user is also required to create an escrow copy of any private keys used for encrypting data and deliver the escrow copy to the local Information Security representative for secure storage.
- The Infosec Team shall not escrow any private keys associated with identity certificates.
- All backups, including escrow copies, shall be protected with a password or passphrase that is compliant with [COMPANY NAME] *Password Policy*.

**[As written, this section would cover any other Public Key usage not associated with identity certificates, such as time-stamping services. This section can be combined with the above section if desired.]**

Commercial/Outside Organization Public Key Infrastructure (PKI)

In working with business partners, the relationship may require the end users to use public-private key pairs that are generated in software on the end user’s computer. In these cases:

- The public-private key pairs are stored in files on the hard drive of the end user.
- The private keys are only protected by the strength of the password or passphrase chosen by the end user.

**[This section is specifically to call out uses of Public Key Cryptography using another organization’s Public Key Infrastructure, which may happen when working with a vendor or a business partner. This section can be updated as appropriate if you have additional controls in place around this use case, or eliminated if not applicable to your organization.] **

PGP Key Pairs

If the business partner requires the use of PGP, the public-private key pairs can be stored in the user’s key ring files on the computer hard drive or on a hardware token, for example, a USB drive or a smart card. Since the protection of the private keys is the passphrase on the secret keying, it is preferable that the public-private keys are stored on a hardware token. PGP will be configured to require entering the passphrase for every use of the private keys in the secret key ring.

**[This section is specifically for the use of PGP keys/encryption. If you don’t utilize PGP, this section may not be applicable and could be removed.]**

Hardware Token Storage

Hardware tokens storing encryption keys will be treated as sensitive company equipment, as described in [COMPANY NAME]’s *Physical Security Policy*, when outside company offices.

- All hardware tokens, smartcards, USB tokens, etc., will not be stored or left connected to any end user’s computer when not in use.
- For end users traveling with hardware tokens, they will not be stored or carried in the same container or bag as any computer.

**[This section is specifically for storing encryption keys on hardware tokens. If you do not store encryption keys on hardware tokens, you may remove this section.]**

Personal Identification Numbers (PINs), Passwords and Passphrases

All PINs, passwords or passphrases used to protect encryption keys must meet complexity and length requirements described in [COMPANY NAME]’s *Password Policy*.

Loss and Theft

The loss, theft, or potential unauthorized disclosure of any encryption key covered by this policy must be reported immediately.

**Cloud Service Use of Cryptographic Controls**

***[The Cloud Service Use of Cryptographic Controls section is OPTIONAL for SOC 2, but may be REQUIRED for other frameworks such as ISO 27017:2015]***

(For Cloud Service Customers) Based on the results of risk analysis, [COMPANY NAME] will apply cryptographic controls for its cloud services usage. The implemented controls will be robust enough to counter the identified risks, whether these controls are provided by [COMPANY NAME] or its cloud service provider.

When cryptographic options are offered by the cloud service provider, [COMPANY NAME] will review any provided information to verify that the cryptographic capabilities:

- Align with [COMPANY NAME]'s policy requirements.
- Are compatible with any other cryptographic protections used by [COMPANY NAME].
- Are applied to data at rest and data in transit to, from, and within the cloud service.

(For Cloud Service Providers) [COMPANY NAME] will share with its cloud service customers information about its use of cryptography to protect the information it processes. [COMPANY NAME] will also disclose any capabilities it offers to its cloud service customers that may assist in them implementing their own cryptographic protection.

**Cloud Service Use of Cryptographic Key Management**

***[The Cloud Service Use of Cryptographic Key Management section is OPTIONAL for SOC 2, but may be REQUIRED for other frameworks such as ISO 27017:2015]***

(For Cloud Service Customers) [COMPANY NAME] will track the cryptographic keys associated with each cloud service in use and through its key management procedures.

If a cloud service offers key management functions, [COMPANY NAME] will inquire about the following aspects of key management related to the cloud service:

- Type of keys being used
- Specifications of the key management system, including procedures for each stage of the key lifecycle (i.e., generation, updating, storage, retirement, retrieval, retention, and destruction)
- Recommended key management procedures for use by [COMPANY NAME]

(For Cloud Service Providers) [COMPANY NAME] will not store and manage the encryption keys for cryptographic operations when its cloud service customers utilize their own key management system or a separate and distinct key management service.

**Cloud Service Regulation of Cryptographic Controls**

***[The Cloud Service Regulation of Cryptographic Controls section is OPTIONAL for SOC 2, but may be REQUIRED for other frameworks such as ISO 27017:2015.]***

- (For Cloud Service Customers) Cryptographic controls will be utilized in accordance with all pertinent contracts, legal obligations, and regulations. [COMPANY NAME] will ensure that the cryptographic controls, applicable to the use of a cloud service, comply with relevant agreements, laws, and regulations.
- (For Cloud Service Providers) [COMPANY NAME] will furnish cloud service customers with descriptions of the implemented cryptographic controls, enabling them to review compliance with the applicable contracts, legislation, and regulations.

## Related articles

- [Test 67: Cryptography Policy](test-67-cryptography-policy.md)
- [Test 127: Security Policies Cover Encryption](test-127-security-policies-cover-encryption.md)
- [Asset Management Policy Guidance](asset-management-policy-guidance.md)
- [Vendor Management Policy Guidance](vendor-management-policy-guidance.md)
- [Data Protection Policy Guidance](data-protection-policy-guidance.md)
