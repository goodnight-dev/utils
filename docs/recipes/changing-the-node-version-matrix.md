# Recipe: changing the Node.js version matrix

The CI `check` job runs a matrix of Node.js versions, and each matrix entry
produces a status check named `check (node <version>)`. The `main protection`
ruleset requires those checks **by exact name**, so the matrix and the ruleset
are coupled — change one without the other and they fall out of sync.

## The gotcha

If you remove a Node version from the matrix but leave it in the ruleset's
required checks, GitHub keeps waiting for a status that no job will ever report.
The pull request shows that check as **"Expected"** and is blocked; only an
admin bypass can merge it. Conversely, a version you add to the matrix does not
gate merges until it is added to the required checks too.

## Steps

1. Edit the matrix in `.github/workflows/ci.yml`:

   ```yaml
   matrix:
     node: [22, 24, 26]
   ```

2. Resolve the ruleset id by name rather than hardcoding it (the id changes if
   the ruleset is ever recreated):

   ```sh
   RULESET_ID=$(gh api repos/goodnight-dev/utils/rulesets \
     --jq '.[] | select(.name == "main protection") | .id')
   ```

3. Read the ruleset, rewrite the `check (node …)` contexts, and write it back in
   one pipeline. Going through the live ruleset preserves every other rule plus
   its conditions and bypass actors:

   ```sh
   gh api repos/goodnight-dev/utils/rulesets/"$RULESET_ID" \
     | jq '{
         name, target, enforcement, conditions, bypass_actors,
         rules: (.rules | map(
           if .type == "required_status_checks"
           then .parameters.required_status_checks = [
             {context: "check (node 22)"},
             {context: "check (node 24)"},
             {context: "check (node 26)"}
           ]
           else . end
         ))
       }' \
     | gh api --method PUT repos/goodnight-dev/utils/rulesets/"$RULESET_ID" \
       --input -
   ```

4. Confirm the required set matches the matrix:

   ```sh
   gh api repos/goodnight-dev/utils/rulesets/"$RULESET_ID" \
     | jq -c '.rules[] | select(.type == "required_status_checks")
              | .parameters.required_status_checks'
   ```

Land both edits together so `main` is never guarded by a check that no longer
runs, or missing one that does.
