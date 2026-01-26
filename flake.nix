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
        # Production package
        packages.default = pkgs.buildNpmPackage rec {
          pname = "karaoke-eternal-automated";
          version = "unstable-2026-01-24-2";

          src = ./.;

          inherit nodejs;
          npmDepsHash = "sha256-Unt71lHNRwtNnwZitzIJyi+DnR93v/WYcWaYHV6tGK0=";

          nativeBuildInputs = with pkgs; [ python3 gnumake gcc ];

          buildPhase = ''
            runHook preBuild
            npm run build
            runHook postBuild
          '';

          installPhase = ''
            runHook preInstall
            mkdir -p $out/{bin,lib/karaoke-eternal}
            cp -r build assets package.json node_modules $out/lib/karaoke-eternal/

            cat > $out/bin/karaoke-eternal << EOF
            #!${pkgs.bash}/bin/bash
            exec ${nodejs}/bin/node $out/lib/karaoke-eternal/build/server/main.js "\$@"
            EOF
            chmod +x $out/bin/karaoke-eternal
            runHook postInstall
          '';

          meta = with pkgs.lib; {
            description = "Karaoke Eternal with Authentik header auth";
            homepage = "https://github.com/Zardoz8901/KaraokeEternalAutomated";
            license = licenses.isc;
          };
        };

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
