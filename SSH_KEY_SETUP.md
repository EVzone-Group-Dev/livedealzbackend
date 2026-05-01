# SSH Key Setup Guide for GitHub Actions Deployment

## Problem Identified

The deployment is failing with the error:
```
ssh.ParsePrivateKey: ssh: no key found
ssh: handshake failed: ssh: unable to authenticate
```

## Root Cause

This error occurs when:
1. Using a **public key** instead of a **private key** in the GitHub secret
2. The SSH key is in the wrong format (PEM instead of OpenSSH format)
3. The key is missing the required headers

### 🚨 CRITICAL: Public Key vs Private Key Confusion

Looking at your Droplet's `authorized_keys` file, you see entries like:
```
ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABgQDn2J4qnb659Ngopxv1eKBso9AyiuGX89fxpR72kECHK+jCVO8vmw+1nXiFDb6e/SoD9JntMyt/X8ckid1xad+QLQuDo/PRcURoZHirEmS4FvMxITBLSQuKbqY/Qu4Io2aQKJcU5xL1Cn6p7CpOMrWSdnM2uQIL22nXIEeen28JnaJo75VcyiGy/Df2iqfoe9MkwqB82knNaLpEolzDzxOYn+JwYbY5XWwVAzbMGku+k+X9J9tDDsqeYzFwwfKKOZRi0FVjZrDYLl6kzhauKahyYnf2/Eq9caiG7I3wuGUSZ58GVFm64ZWSEfzkurcYkCsnwEoOtUInD7A57Vhi2iSh9zj6WM++SMVFV9aSN7Fy2xDVdnmsyttvpydptWlcW4ZX2HbSh0Foqz4ZQUoSNQvMDPIU3Xgf0iTamvXpvtpEtsL0queTgcL0NeTFn9SHSwlRAoQwRQr7v6kSjPFZPRG1iNzTanDuM0BhxV/j8EAW4jdRkgBywQmLnWg64NNHmk8=
```

**These are PUBLIC keys!** They start with `ssh-rsa`, `ssh-ed25519`, or `ecdsa-sha2-nistp256`.

**You CANNOT use these as the `DO_SSH_KEY` secret!**

The `DO_SSH_KEY` secret must contain the **PRIVATE KEY**, which looks like:
```
-----BEGIN OPENSSH PRIVATE KEY-----
b3BlbnNzaC1rZXktdjEAAAAABG5vbmUAAAAEbm9uZQAAAAAAAAABAAABlwAAAAdzc2gtcn
NhAAAAAwEAAQAAAYEAn3...
-----END OPENSSH PRIVATE KEY-----
```

**The private key is NOT stored on the Droplet.** It's stored on your local machine where you generated it.

## Solution

### Step 1: Generate a New SSH Key Pair (Correct Format)

Run this command on your **local machine** (not the Droplet):

```bash
ssh-keygen -t ed25519 -f deploy_key -C "github-actions-deploy"
```

This creates two files:
- `deploy_key` - **PRIVATE** key (keep this secret!)
- `deploy_key.pub` - Public key (add to Droplet)

### Step 2: Add Public Key to Droplet

```bash
# Copy the public key to your Droplet
ssh-copy-id -i deploy_key.pub user@your-droplet-ip

# Or manually:
cat deploy_key.pub >> ~/.ssh/authorized_keys
```

### Step 3: Add Private Key to GitHub Secrets

1. View the private key:
   ```bash
   cat deploy_key
   ```

2. Copy the **entire output**, which should look like:
   ```
   -----BEGIN OPENSSH PRIVATE KEY-----
   b3BlbnNzaC1rZXktdjEAAAAABG5vbmUAAAAEbm9uZQAAAAAAAAABAAABlwAAAAdzc2gtcn
   NhAAAAAwEAAQAAAYEAn3...
   -----END OPENSSH PRIVATE KEY-----
   ```

3. Go to GitHub → Repository Settings → Secrets and variables → Actions
4. Click "New repository secret"
5. Name: `DO_SSH_KEY`
6. Value: Paste the **entire** private key content (including headers)
7. Click "Add secret"

### Step 4: Add Other Required Secrets

Add these additional secrets:

- **`DO_HOST`**: Your Droplet's IP address (e.g., `123.45.67.89`)
- **`DO_USERNAME`**: SSH username (e.g., `ubuntu` or `root`)

### Step 5: Verify the Key Format

**Correct format (OpenSSH):**
```
-----BEGIN OPENSSH PRIVATE KEY-----
b3BlbnNzaC1rZXktdjEAAAAABG5vbmUAAAAEbm9uZQAAAAAAAAAB...
-----END OPENSSH PRIVATE KEY-----
```

**Wrong format (PEM/Public key):**
```
ssh-rsa AAAAB3NzaC1yc2E... user@host  ❌
-----BEGIN RSA PRIVATE KEY-----  ❌
```

## Testing the Setup

After configuring the secrets:

1. Push a commit to the `main` branch:
   ```bash
   git add .
   git commit -m "Test deployment"
   git push origin main
   ```

2. Monitor the deployment:
   - Go to GitHub → Actions tab
   - Watch the workflow run
   - Check for any errors

3. If it fails with "ssh: no key found":
   - Verify you're using the **private** key (not public)
   - Check the key has the correct headers
   - Ensure no extra spaces or line breaks were added

## Troubleshooting

### Error: "ssh: no key found"

**Cause**: Wrong key format or using public key instead of private key

**Fix**:
1. Generate a new key pair with `ssh-keygen -t ed25519`
2. Use the **private** key (file without `.pub` extension)
3. Ensure it includes `-----BEGIN OPENSSH PRIVATE KEY-----` header

### Error: "Permission denied (publickey)"

**Cause**: Public key not properly added to Droplet

**Fix**:
1. Verify public key is in `~/.ssh/authorized_keys` on Droplet
2. Check permissions: `chmod 600 ~/.ssh/authorized_keys`
3. Ensure SSH service is running on Droplet

### Error: "Could not resolve hostname"

**Cause**: Incorrect `DO_HOST` value

**Fix**:
1. Verify `DO_HOST` secret contains correct IP address
2. Check Droplet is accessible: `ping your-droplet-ip`

## Key Differences: Public vs Private Key

| Feature | Public Key | Private Key |
|---------|-----------|-------------|
| **Purpose** | Added to server | Added to GitHub |
| **Format** | `ssh-rsa AAA...` | `-----BEGIN...` |
| **Security** | Can be shared | Must be kept secret |
| **Location** | `authorized_keys` | GitHub Secrets |
| **File** | `deploy_key.pub` | `deploy_key` |

## Security Best Practices

1. 🔒 **Never commit private keys** to the repository
2. 🔒 **Rotate keys** periodically (every 90 days)
3. 🔒 **Use dedicated keys** for each environment
4. 🔒 **Restrict key usage** with command restrictions if needed
5. 🔒 **Monitor access** logs on the Droplet
6. 🔒 **Use firewall** to restrict SSH access

## Additional Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [SSH Key Generation Guide](https://docs.github.com/en/authentication/connecting-to-github-with-ssh/generating-a-new-ssh-key-and-adding-it-to-the-ssh-agent)
- [DigitalOcean SSH Documentation](https://docs.digitalocean.com/products/droplets/how-to/add-ssh-keys/)

---

**Status**: Ready for deployment  
**Last Updated**: 2026-05-01  
**Next Step**: Configure GitHub Secrets and test deployment 🚀
