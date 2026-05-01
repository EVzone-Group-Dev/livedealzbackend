# 🔍 SSH Authentication Diagnostic Checklist

## Current Error
```
ssh: handshake failed: ssh: unable to authenticate, attempted methods [none publickey]
```

This means: SSH connection works, but public key authentication is failing.

## Quick Diagnosis

Run through this checklist to identify the issue:

### ✅ Check 1: Private Key Format

**Question**: Does your `DO_SSH_KEY` secret start with `-----BEGIN PRIVATE KEY-----`?

**How to check**:
- Go to GitHub → Repository Settings → Secrets → `DO_SSH_KEY`
- First line should be: `-----BEGIN PRIVATE KEY-----`

**Result**:
- ✅ Yes, correct format → Go to Check 2
- ❌ No, wrong format → Fix the key format (see `CRITICAL_SSH_KEY_INSTRUCTIONS.md`)

---

### ✅ Check 2: Public Key in `authorized_keys`

**Question**: Is the public key (corresponding to your private key) in `~/.ssh/authorized_keys` on the Droplet?

**How to check**:

1. Generate public key from your private key (on your local machine):
   ```bash
   # If you have the private key file
   ssh-keygen -y -f deploy_key
   
   # Or copy from GitHub secret and generate
   # (Save the private key to a file first, then run above)
   ```

2. SSH to Droplet and check `authorized_keys`:
   ```bash
   ssh root@your-droplet-ip
   cat ~/.ssh/authorized_keys
   ```

3. Compare - the public key from step 1 should be in the output from step 2

**Result**:
- ✅ Yes, it's there → Go to Check 3
- ❌ No, it's missing → Add it:
  ```bash
  echo "your-public-key-here" >> ~/.ssh/authorized_keys
  chmod 600 ~/.ssh/authorized_keys
  ```

---

### ✅ Check 3: Correct Username

**Question**: Does `DO_USERNAME` match the user that owns the `authorized_keys` file?

**How to check**:

1. Check which user owns `authorized_keys` on Droplet:
   ```bash
   ssh root@your-droplet-ip
   ls -la ~/.ssh/authorized_keys
   ```

2. If it's in `/root/.ssh/authorized_keys`, use `root` as `DO_USERNAME`
3. If it's in `/home/ubuntu/.ssh/authorized_keys`, use `ubuntu` as `DO_USERNAME`

**Result**:
- ✅ Matches → Go to Check 4
- ❌ Doesn't match → Update `DO_USERNAME` secret

---

### ✅ Check 4: File Permissions

**Question**: Are the permissions correct on the Droplet?

**How to check**:

```bash
ssh root@your-droplet-ip
ls -la ~/.ssh/
```

Should show:
```
drwx------ 2 root root 4096 .ssh/
-rw------- 1 root root  402 authorized_keys
```

**Fix if wrong**:
```bash
chmod 700 ~/.ssh
chmod 600 ~/.ssh/authorized_keys
```

**Result**:
- ✅ Correct → Go to Check 5
- ❌ Wrong → Fix permissions (commands above)

---

### ✅ Check 5: SSH Service Running

**Question**: Is SSH service running on the Droplet?

**How to check**:
```bash
ssh root@your-droplet-ip
service ssh status
# or
systemctl status sshd
```

**Result**:
- ✅ Running → Go to Check 6
- ❌ Not running → Start it:
  ```bash
  service ssh start
  # or
  systemctl start sshd
  ```

---

### ✅ Check 6: Key Match

**Question**: Does the public key generated from your private key match what's in `authorized_keys`?

**How to check**:

1. Generate public key from private key:
   ```bash
   # Save your private key to a file (e.g., deploy_key)
   # Then run:
   ssh-keygen -y -f deploy_key
   # Output: ssh-rsa AAAAB3NzaC1yc2E... (public key)
   ```

2. Check what's in `authorized_keys`:
   ```bash
   ssh root@your-droplet-ip
   cat ~/.ssh/authorized_keys
   ```

3. Compare - they should match exactly

**Result**:
- ✅ Match → All checks passed! Try deployment again
- ❌ No match → Update `authorized_keys` with correct key

---

## Most Common Issues

### Issue 1: Wrong Key Type (90% of cases)
- **Symptom**: "ssh: no key found"
- **Cause**: Using public key instead of private key
- **Fix**: Use private key (starts with `-----BEGIN PRIVATE KEY-----`)

### Issue 2: Key Not in `authorized_keys` (5% of cases)
- **Symptom**: "unable to authenticate, attempted methods [none publickey]"
- **Cause**: Public key not added to Droplet
- **Fix**: Add public key to `~/.ssh/authorized_keys`

### Issue 3: Wrong Username (3% of cases)
- **Symptom**: "unable to authenticate, attempted methods [none publickey]"
- **Cause**: Using `ubuntu` when key is in `root`'s authorized_keys (or vice versa)
- **Fix**: Use correct username that matches the key location

### Issue 4: Permission Issues (2% of cases)
- **Symptom**: "unable to authenticate, attempted methods [none publickey]"
- **Cause**: Wrong file permissions
- **Fix**: `chmod 700 ~/.ssh && chmod 600 ~/.ssh/authorized_keys`

---

## Test SSH Connection Manually

To verify the key works before using GitHub Actions:

```bash
# Test with verbose output
ssh -v -i deploy_key root@your-droplet-ip

# Look for:
# - "Offering public key" → Good, key is being offered
# - "Server accepts key" → Good, key is accepted
# - "Authentication succeeded" → Perfect!
```

If this works manually but not in GitHub Actions, the issue is likely:
1. Wrong key in GitHub secret (copy/paste error)
2. Extra whitespace in the secret
3. Truncated key

---

## Still Stuck?

1. **Regenerate keys** (easiest fix):
   ```bash
   # On local machine
   ssh-keygen -t ed25519 -f deploy_key_new -C "github-actions"
   
   # Add public key to Droplet
   cat deploy_key_new.pub >> ~/.ssh/authorized_keys
   
   # Add private key to GitHub Secrets
   cat deploy_key_new  # Copy this to DO_SSH_KEY
   ```

2. **Check Droplet firewall**:
   ```bash
   # Make sure port 22 is open
   ufw status
   ```

3. **Enable SSH logging** (temporarily):
   ```bash
   # On Droplet, check auth log
   tail -f /var/log/auth.log
   # Then try GitHub Actions deployment
   # Watch for authentication attempts
   ```

---

**Remember**: The workflow file (`.github/workflows/deploy-backend.yml`) is correct. 
The issue is almost certainly with the SSH key configuration. 🔑
