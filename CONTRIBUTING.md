# Contributing to Karaoke Eternal Automated

First off, thank you for considering contributing! It's people like you that make this a great tool for the community.

## ⚖️ Contributor License Agreement (CLA)

By contributing to this project, you agree to the [Contributor License Agreement](.github/CLA.md).

**Why do we have a CLA?**
This project aims to be a sustainable, long-term solution for self-hosted karaoke. To protect the project from "patent trolls" or legal challenges, and to ensure we can always keep the core software free and open, we require a simple agreement that grants the project a license to use your code while you retain ownership.

## 🛠️ Getting Started

### Development Environment
This project uses **Nix** for a reproducible development environment.

1.  Clone the repo.
2.  Run `nix develop` to enter the shell.
3.  Run `npm install`.
4.  Run `npm run dev`.

### Coding Standards
*   **ESM First:** Use ES Modules (imports/exports).
*   **Atomic Commits:** Keep your commits small and focused.
*   **TDD:** If you're adding logic, please add a test. Use `npm test` to run the suite.

## 🚀 How to Contribute

1.  **Search for existing issues.** If you find a bug or have a feature idea, open an issue first to discuss it.
2.  **Fork the repo** and create your branch from `main`.
3.  **Implement your changes.**
4.  **Verify.** Run linting and tests:
    ```bash
    npm run lint
    npm test
    ```
5.  **Submit a Pull Request.** Provide a clear description of what your PR does and why.

## 🛡️ Security
If you find a security vulnerability, please do **not** open an issue. Email the maintainers directly or use the GitHub Security Advisory feature.

---
*Happy Singing!*
