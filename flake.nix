{
  description = "Karaoke Eternal with Authentik Header Auth";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = { self, nixpkgs, flake-utils }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs = nixpkgs.legacyPackages.${system};
        nodejs = pkgs.nodejs_24;
      in
      {
        # Development shell
        devShells.default = pkgs.mkShell {
          buildInputs = with pkgs; [
            # Runtime
            nodejs_24

            # Build dependencies (native modules)
            python3
            gnumake
            gcc
            pkg-config

            # Dev tools
            nodePackages.typescript
            nodePackages.typescript-language-server
            nodePackages.eslint
          ];

          shellHook = ''
            echo ""
            echo "╔════════════════════════════════════════════╗"
            echo "║     Karaoke Eternal Development Shell      ║"
            echo "╚════════════════════════════════════════════╝"
            echo ""
            echo "Node.js: $(node --version)"
            echo "npm:     $(npm --version)"
            echo ""
            echo "Commands:"
            echo "  npm install     Install dependencies"
            echo "  npm run dev     Start dev server (port 3000)"
            echo "  npm run build   Build for production"
            echo "  npm run test    Run tests"
            echo "  npm run lint    Run linter"
            echo ""
          '';
        };
      }
    );
}
