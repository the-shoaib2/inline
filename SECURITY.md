# Security Policy

## Supported Versions

We release patches for security vulnerabilities for the following versions:

| Version | Supported          |
| ------- | ------------------ |
| 1.1.x   | :white_check_mark: |
| 1.0.x   | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a Vulnerability

We take the security of Inline seriously. If you believe you have found a security vulnerability, please report it to us as described below.

### How to Report

**Please do NOT report security vulnerabilities through public GitHub issues.**

Instead, please report them via email to: [your-security-email@example.com]

You should receive a response within 48 hours. If for some reason you do not, please follow up via email to ensure we received your original message.

Please include the following information:

- Type of issue (e.g. buffer overflow, SQL injection, cross-site scripting, etc.)
- Full paths of source file(s) related to the manifestation of the issue
- The location of the affected source code (tag/branch/commit or direct URL)
- Any special configuration required to reproduce the issue
- Step-by-step instructions to reproduce the issue
- Proof-of-concept or exploit code (if possible)
- Impact of the issue, including how an attacker might exploit it

### What to Expect

- We will acknowledge receipt of your vulnerability report
- We will confirm the vulnerability and determine its impact
- We will release a fix as soon as possible depending on complexity
- We will publicly disclose the vulnerability after a fix is available

## Security Best Practices

### For Users

1. **Keep Extension Updated**: Always use the latest version
2. **Verify Models**: Only download models from trusted sources
3. **Review Permissions**: Check what permissions the extension requests
4. **Local Processing**: All code completion happens locally - your code never leaves your machine

### For Contributors

1. **Never Commit Secrets**: Use `.env.example` templates, never commit `.env` files
2. **Rotate Tokens**: If tokens are accidentally exposed, rotate them immediately
3. **Code Review**: All PRs must be reviewed for security issues
4. **Dependencies**: Keep dependencies updated and audit regularly
5. **Input Validation**: Always validate and sanitize user inputs
6. **Secure Defaults**: Use secure defaults for all configurations

## Known Security Considerations

### Privacy

- **Offline-First**: All AI processing happens locally on your machine
- **No Telemetry**: No code or usage data is sent to external servers
- **Local Models**: Models are stored and run entirely on your device

### Model Security

- **Model Validation**: All downloaded models are validated before use
- **Checksum Verification**: Model integrity is verified via checksums
- **Sandboxing**: Model inference runs in isolated environment

### Data Security

- **No Cloud Storage**: No code or data is stored in the cloud
- **Local Cache**: All caching happens on your local filesystem
- **Encrypted Storage**: Sensitive data is encrypted at rest (if applicable)

## Security Updates

Security updates will be released as patch versions (e.g., 1.1.1) and announced via:

- GitHub Security Advisories
- Release notes
- Extension marketplace changelog

## Acknowledgments

We appreciate the security research community's efforts in responsibly disclosing vulnerabilities. Contributors who report valid security issues will be acknowledged in our release notes (unless they prefer to remain anonymous).

## Contact

For any security-related questions or concerns, please contact:
- Email: [your-security-email@example.com]
- GitHub: [Create a private security advisory](https://github.com/yourusername/inline/security/advisories/new)

---

**Last Updated:** December 12, 2025
