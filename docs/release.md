# Publish and install

This branch prepares an installable package and a release-triggered npm workflow;
it does not assert that npm already hosts the package.

1. Review and merge the PR after the full CI (including package smoke) passes.
2. Confirm ownership/availability of npm package `@matuto-ai/antigravity-broker-connector`.
   For first publication, the maintainer may need npm's initial package creation
   flow. Do not send npm tokens through chat or commit them to GitHub.
3. Configure npm Trusted Publishing for GitHub owner `matuto-ai`, repository
   `antigravity-broker-connector`, workflow `npm-publish.yml`. This is an account
   security configuration performed by the maintainer, not by this code change.
4. Set package version and create a GitHub release whose tag is exactly
   `v<package.json version>` on the reviewed commit (next `v0.1.1`).
5. The workflow runs syntax checks, all tests, and an isolated tarball install;
   only then it runs `npm publish --access public --provenance --ignore-scripts`.
6. Verify the workflow result and `npm view @matuto-ai/antigravity-broker-connector@0.1.1`
   before advertising the npm install command.

The workflow follows the user's existing release/OIDC pattern, with test and
version gates added. It does not need a long-lived NPM_TOKEN in source or workflow.
An unconfigured trusted publisher fails publishing; it does not silently fall
back to another identity. Git/packed-tarball installation remains available even
before npm setup. Release publication, credential creation, and broker enrollment
are distinct from preparing or merging connector code.

## Patch release

This PR prepares `0.1.1`; the intended GitHub release tag is `v0.1.1`.
After review and merge, the maintainer can publish that release from the merged
commit to exercise npm Trusted Publishing. This code change does not itself
create a tag, release, or npm publication. Verify the workflow succeeds and the
scoped npm version exists before recommending it for installation.

Existing `0.1.0` npm packages and old GitHub tags remain untouched. Do not reuse
or move an old release tag; the new tag must exactly match the package version.
