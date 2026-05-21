# Repository Engineering Record

## [Fixed] Git Push 403 Permission Denied – Switch to Fork Workflow

**Date**: 2026-05-21  
**Scope**: `conduit-realworld-example-app`  
**Issue**: `git push` failed with HTTP 403 and SSH permission denied to `marvelouslying` on upstream repository `TonyMckes/conduit-realworld-example-app`.  
**Root Cause**: The local repository was using HTTPS remote with invalid credentials, and the user `marvelouslying` lacked write access to the upstream repository.  

---

### Diagnosis Steps

| Command                                                | Output / Observation                                         |
| ------------------------------------------------------ | ------------------------------------------------------------ |
| `git push`                                             | `remote: Permission to TonyMckes/… denied to marvelouslying. fatal: unable to access 'https://…': The requested URL returned error: 403` |
| `ssh -T git@github.com`                                | `Hi marvelouslying! You've successfully authenticated, but GitHub does not provide shell access.` → SSH key valid. |
| `git remote -v`                                        | `origin  https://github.com/TonyMckes/… (fetch/push)` → Remote uses HTTPS, not SSH. |
| `git remote set-url origin git@github.com:TonyMckes/…` | Switched to SSH protocol, but still lacked write permission to upstream. |

---

### Solution Applied

Because the user does not have write access to `TonyMckes/conduit-realworld-example-app`, the standard **fork + personal remote** workflow was adopted.

#### Steps Performed

1. **Fork the upstream repository** on GitHub (via web UI) → `marvelouslying/conduit-realworld-example-app`.

2. **Rename existing remote** to `upstream` (preserves reference to original repo):
   ```bash
   git remote rename origin upstream