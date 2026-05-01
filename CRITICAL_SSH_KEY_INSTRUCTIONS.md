# 🚨 CRITICAL: SSH Key Configuration for GitHub Actions

## The Problem

Your deployment is failing with:
```
ssh.ParsePrivateKey: ssh: no key found
ssh: handshake failed: ssh: unable to authenticate
```

## The Root Cause

**You are using a PUBLIC KEY instead of a PRIVATE KEY in the `DO_SSH_KEY` GitHub secret!**

### What You Showed Us

You shared the contents of `/root/.ssh/authorized_keys` which contains **PUBLIC keys**:
```
ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABgQDn2J4qnb659Ngopxv1eKBso9AyiuGX89fxpR72kECHK+jCVO8vmw+1nXiFDb6e/SoD9JntMyt/X8ckid1xad+QLQuDo/PRcURoZHirEmS4FvMxITBLSQuKbqY/Qu4Io2aQKJcU5xL1Cn6p7CpOMrWSdnM2uQIL22nXIEeen28JnaJo75VcyiGy/Df2iqfoe9MkwqB82knNaLpEolzDzxOYn+JwYbY5XWwVAzbMGku+k+X9J9tDDsqeYzFwwfKKOZRi0FVjZrDYLl6kzhauKahyYnf2/Eq9caiG7I3wuGUSZ58GVFm64ZWSEfzkurcYkCsnwEoOtUInD7A57Vhi2iSh9zj6WM++SMVFV9aSN7Fy2xDVdnmsyttvpydptWlcW4ZX2HbSh0Foqz4ZQUoSNQvMDPIU3Xgf0iTamvXpvtpEtsL0queTgcL0NeTFn9SHSwlRAoQwRQr7v6kSjPFZPRG1iNzTanDuM0BhxV/j8EAW4jdRkgBywQmLnWg64NNHmk8=
```

**This is a PUBLIC key!** It starts with `ssh-rsa`.

**You CANNOT use this as the `DO_SSH_KEY` secret!**

## The Solution

### What You Need

The `DO_SSH_KEY` secret must contain the **PRIVATE KEY**, which looks like:

```
-----BEGIN OPENSSH PRIVATE KEY-----
b3BlbnNzaC1rZXktdjEAAAAABG5vbmUAAAAEbm9uZQAAAAAAAAABAAABlwAAAAdzc2gtcn
NhAAAAAwEAAQAAAYEAn3...
-----END OPENSSH PRIVATE KEY-----
```

### Where to Find the Private Key

**The private key is NOT stored on the Droplet.** It's stored on the machine where you generated it (your local computer).

When you ran `ssh-keygen`, it created TWO files:
1. `deploy_key` (or similar name) - **PRIVATE KEY** ⚠️ KEEP THIS SECRET!
2. `deploy_key.pub` - **PUBLIC KEY** - This is what's in `authorized_keys`

### Steps to Fix

#### Step 1: Find Your Private Key

On your **local machine** (where you generated the key), look for files like:
- `deploy_key`
- `id_ed25519`
- `id_rsa`
- Or whatever name you used

#### Step 2: View the Private Key

```bash
cat deploy_key
```

You should see:
```
-----BEGIN OPENSSH PRIVATE KEY-----
b3BlbnNzaC1rZXktdjEAAAAABG5vbmUAAAAEbm9uZQAAAAAAAAABAAABlwAAAAdzc2gtcn
NhAAAAAwEAAQAAAYEAn3...
-----END OPENSSH PRIVATE KEY-----
```

#### Step 3: Copy to GitHub Secrets

1. Go to GitHub → Repository Settings → Secrets and variables → Actions
2. Click "New repository secret"
3. Name: `DO_SSH_KEY`
4. Value: **Paste the ENTIRE private key content** (including the BEGIN/END lines)
5. Click "Add secret"

### 🚨 CRITICAL REMINDER

- ❌ **NEVER** use a key that starts with `ssh-rsa`, `ssh-ed25519`, or `ecdsa-sha2-nistp256`
- ✅ **ALWAYS** use a key that starts with `-----BEGIN OPENSSH PRIVATE KEY-----`
- 🔒 The private key should **NEVER** be shared or stored on the server
- 🔒 The public key (in `authorized_keys`) is safe to share

## How to Generate a New Key Pair (If Needed)

If you don't have the private key anymore, generate a new one:

```bash
# On your LOCAL machine (not the Droplet)
ssh-keygen -t ed25519 -f deploy_key -C "github-actions-deploy"
```

This creates:
- `deploy_key` - **PRIVATE** key (add this to GitHub Secrets)
- `deploy_key.pub` - **PUBLIC** key (add this to Droplet's `authorized_keys`)

### Add Public Key to Droplet

```bash
# Copy to Droplet
ssh-copy-id -i deploy_key.pub root@your-droplet-ip

# Or manually:
cat deploy_key.pub >> ~/.ssh/authorized_keys
```

### Add Private Key to GitHub

```bash
# View private key
cat deploy_key

# Copy ENTIRE output and add to GitHub Secrets as DO_SSH_KEY
```

## Verification

After configuring the secret, test by pushing to `main`:

```bash
git add .
git commit -m "Test deployment"
git push origin main
```

Monitor in GitHub → Actions tab.

## Troubleshooting Common Errors

### Error: "ssh: handshake failed: ssh: unable to authenticate, attempted methods [none publickey]"

This error means the SSH connection is working, but authentication is failing. Common causes:

#### 1. Public Key Not in `authorized_keys`

**Check**: The public key corresponding to your private key must be in `~/.ssh/authorized_keys` on the Droplet.

**Fix**:
```bash
# On your local machine, get the public key
cat deploy_key.pub

# SSH to Droplet and check if it's in authorized_keys
ssh root@your-droplet-ip
cat ~/.ssh/authorized_keys

# If not there, add it
cat deploy_key.pub >> ~/.ssh/authorized_keys
```

#### 2. Wrong Permissions

**Fix**: Set correct permissions on the Droplet:
```bash
chmod 700 ~/.ssh
chmod 600 ~/.ssh/authorized_keys
```

#### 3. Wrong User

**Check**: Make sure `DO_USERNAME` matches the user that owns the `authorized_keys` file.

- If the key is in `root`'s `authorized_keys`, use `root` as `DO_USERNAME`
- If the key is in `ubuntu`'s `authorized_keys`, use `ubuntu` as `DO_USERNAME`

#### 4. Wrong Private Key

**Check**: Make sure the private key in `DO_SSH_KEY` matches the public key in `authorized_keys`.

```bash
# Generate public key from private key (on your local machine)
ssh-keygen -y -f deploy_key

# Compare with what's in authorized_keys on Droplet
```

They should match (the public key from this command should be in `authorized_keys`).

### Error: "Permission denied (publickey)"

Similar causes as above. Check:
1. Public key is in `authorized_keys`
2. Permissions are correct (700 for `.ssh`, 600 for `authorized_keys`)
3. Correct username is being used
4. SSH service is running on Droplet

### Error: "ssh: no key found"

The private key format is wrong. Make sure it:
- Starts with `-----BEGIN OPENSSH PRIVATE KEY-----` or `-----BEGIN RSA PRIVATE KEY-----`
- Includes the END line
- Has no extra spaces or line breaks

## Summary

| Location | Key Type | Format | Example |
|----------|----------|--------|---------|
| **GitHub Secret `DO_SSH_KEY`** | **PRIVATE** | `-----BEGIN OPENSSH PRIVATE KEY-----` | ✅ Correct |
| **Droplet `authorized_keys`** | **PUBLIC** | `ssh-rsa AAAAB3N...` | ✅ Correct |
| **GitHub Secret `DO_SSH_KEY`** | **PUBLIC** | `ssh-rsa AAAAB3N...` | ❌ Wrong! |

**Remember: GitHub needs the PRIVATE key. The Droplet needs the PUBLIC key.**

---

## 📋 Understanding DO_USERNAME

**What is `DO_USERNAME`?**

`DO_USERNAME` is the SSH username for your Droplet - the user you use to log in via SSH.

**Common values:**
- `root` - The administrator user (most common on DigitalOcean)
- `ubuntu` - Default user on Ubuntu-based Droplets
- `admin` - Sometimes used on other distributions

**How to find your username:**

When you SSH into your Droplet, what command do you use?

```bash
# If you use this command:
ssh root@123.45.67.89
# Then your DO_USERNAME is: root

# If you use this command:
ssh ubuntu@123.45.67.89
# Then your DO_USERNAME is: ubuntu
```

**Why is this important?**

The `DO_USERNAME` must match the user that owns the `authorized_keys` file where your public key is stored.

- If your public key is in `/root/.ssh/authorized_keys` → Use `root`
- If your public key is in `/home/ubuntu/.ssh/authorized_keys` → Use `ubuntu`

**Example Configuration:**

```
DO_HOST: 123.45.67.89          # Your Droplet's IP
DO_USERNAME: root               # SSH username (root or ubuntu)
DO_SSH_KEY: -----BEGIN PRIVATE KEY-----  # Your PRIVATE key
              b3BlbnNzaC1rZXktdjEAAAA...
              -----END PRIVATE KEY-----
```

---

**Still stuck?** 
1. Check that your private key has the correct format
2. Ensure no extra spaces or line breaks were added
3. Verify the key wasn't truncated when copying
4. Generate a new key pair if needed
5. Verify `DO_USERNAME` matches the key owner
