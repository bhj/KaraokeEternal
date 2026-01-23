# Contributing to Karaoke Eternal Automated

Thank you for your interest in contributing!

## How to Contribute

**All contributions start in [GitHub Discussions](https://github.com/Zardoz8901/KaraokeEternalAutomated/discussions).**

This project follows a discussion-first model:

1. **Open a Discussion** — Share your bug report, feature idea, or question in Discussions
2. **Community Input** — Get feedback and refine the idea with the community
3. **Maintainer Triage** — The maintainer will promote relevant discussions to Issues when ready for implementation
4. **Implementation** — Once an Issue exists, you can submit a Pull Request

**Do not open Issues directly.** Issues are reserved for maintainer-tracked work items.

## Why This Model?

- Keeps the issue tracker focused and actionable
- Allows ideas to be refined before committing to implementation
- Reduces noise from duplicates and incomplete reports
- Ensures alignment with project direction before work begins

## Pull Requests

PRs are welcome for existing Issues. Before submitting:

1. Reference the Issue number in your PR
2. Run linting and tests: `npm run lint && npm test`
3. Keep commits atomic and focused
4. Follow existing code patterns

## Development Environment

This project uses **Nix** for reproducible builds:

```bash
nix develop
npm install
npm run dev
```

## Contributor License Agreement

By contributing, you agree to the [CLA](.github/CLA.md). This protects the project while you retain ownership of your work.

## Security

For security vulnerabilities, **do not** open a Discussion or Issue. Use [GitHub Security Advisories](https://github.com/Zardoz8901/KaraokeEternalAutomated/security/advisories) or contact the maintainer directly.
