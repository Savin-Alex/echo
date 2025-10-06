# Echo Build Guide

This guide explains how to build and distribute the Echo AI Interview & Meeting Copilot application.

## Quick Build Commands

### Development Builds
```bash
# Pack application (no installer)
npm run pack:mac     # macOS
npm run pack:win     # Windows
npm run pack:linux   # Linux

# Create distributable packages
npm run dist:mac     # macOS DMG + ZIP
npm run dist:win     # Windows NSIS + Portable
npm run dist:linux   # Linux AppImage + DEB + RPM
npm run dist:all     # All platforms
```

### Build Management
```bash
# Clean build directory
npm run clean

# Rebuild from scratch
npm run rebuild

# Install app dependencies (after npm install)
npm run postinstall
```

## Build Outputs

### macOS Builds
- **DMG Files**: `Echo-1.0.0.dmg` (Intel), `Echo-1.0.0-arm64.dmg` (Apple Silicon)
- **ZIP Files**: `Echo-1.0.0-mac.zip` (Intel), `Echo-1.0.0-arm64-mac.zip` (Apple Silicon)
- **App Bundles**: `dist/mac/Echo.app` (Intel), `dist/mac-arm64/Echo.app` (Apple Silicon)

### Windows Builds
- **NSIS Installer**: `Echo-1.0.0.exe` (x64), `Echo-1.0.0-ia32.exe` (x86)
- **Portable**: `Echo-1.0.0-portable.exe` (x64)
- **App Directory**: `dist/win-unpacked/`

### Linux Builds
- **AppImage**: `Echo-1.0.0.AppImage` (x64)
- **DEB Package**: `Echo-1.0.0.deb` (x64)
- **RPM Package**: `Echo-1.0.0.rpm` (x64)

## Build Configuration

### Package.json Build Settings

The build configuration is defined in `package.json` under the `"build"` section:

```json
{
  "build": {
    "appId": "com.criticalsuccess.echo",
    "productName": "Echo",
    "copyright": "Copyright © 2024 CriticalSuccess",
    "directories": {
      "output": "dist",
      "buildResources": "build"
    }
  }
}
```

### Key Build Features

- **Multi-Architecture**: Supports x64 and ARM64 on macOS, x64 and x86 on Windows
- **Code Signing**: Disabled for development (set `identity: null`)
- **Native Dependencies**: Automatically rebuilds `better-sqlite3` for target platform
- **File Optimization**: Excludes unnecessary files and development assets
- **Platform-Specific**: Different installers and packaging for each OS

## Build Assets

### Required Assets (in `build/` directory)
- `icon.icns` - macOS icon (512x512)
- `icon.ico` - Windows icon (256x256)
- `icon.png` - Linux icon (512x512)
- `entitlements.mac.plist` - macOS entitlements (for production)

### Creating Icons
```bash
# Generate placeholder icons
node scripts/create-icons.js

# For production, create proper icons using:
# - Design tools (Figma, Sketch)
# - Icon utilities (iconutil, ImageMagick)
# - Professional icon services
```

## Build Process

### 1. Pre-Build Setup
```bash
# Install dependencies
npm install

# Install app dependencies (rebuilds native modules)
npm run postinstall

# Generate placeholder assets (if needed)
node scripts/create-icons.js
```

### 2. Development Build
```bash
# Pack application (faster, no installer)
npm run pack:mac

# Test the built app
open dist/mac-arm64/Echo.app
```

### 3. Production Build
```bash
# Create distributable packages
npm run dist:mac

# Check outputs
ls -la dist/
```

### 4. Multi-Platform Build
```bash
# Build for all platforms
npm run dist:all

# Or build specific platforms
npm run dist:win
npm run dist:linux
```

## Testing Built Applications

### macOS Testing
```bash
# Test Intel build
open dist/mac/Echo.app

# Test ARM64 build
open dist/mac-arm64/Echo.app

# Test DMG installation
open dist/Echo-1.0.0.dmg
```

### Windows Testing
```bash
# Test NSIS installer
# Run dist/Echo-1.0.0.exe

# Test portable version
# Run dist/Echo-1.0.0-portable.exe

# Test unpacked app
# Navigate to dist/win-unpacked/ and run Echo.exe
```

### Linux Testing
```bash
# Test AppImage
chmod +x dist/Echo-1.0.0.AppImage
./dist/Echo-1.0.0.AppImage

# Install and test DEB package
sudo dpkg -i dist/Echo-1.0.0.deb
echo

# Install and test RPM package
sudo rpm -i dist/Echo-1.0.0.rpm
echo
```

## Build Optimization

### File Size Optimization
The build configuration excludes unnecessary files:
- Development tools and configs
- Test files and documentation
- Source maps and debug info
- Git and IDE files

### Performance Optimization
- Native dependencies are rebuilt for target architecture
- Electron runtime is optimized for production
- Unused modules are tree-shaken

### Security Considerations
- Code signing is disabled for development
- Hardened runtime is disabled for development
- Entitlements are configured for required permissions

## Troubleshooting

### Common Build Issues

#### 1. Native Module Rebuild Errors
```bash
# Solution: Rebuild native dependencies
npm run postinstall
# or
npm rebuild
```

#### 2. Code Signing Errors
```bash
# Solution: Disable code signing in package.json
"identity": null
```

#### 3. Missing Assets
```bash
# Solution: Generate placeholder assets
node scripts/create-icons.js
```

#### 4. Permission Errors
```bash
# Solution: Clean and rebuild
npm run clean
npm run rebuild
```

### Build Debug Information
- Debug info is saved to `dist/builder-debug.yml`
- Check this file for detailed build logs
- Use `--debug` flag for verbose output

## Distribution

### Internal Distribution
- Use ZIP files for internal testing
- DMG files for macOS distribution
- NSIS installers for Windows distribution
- AppImage for Linux distribution

### Public Distribution
- Code sign applications for public distribution
- Set up automated builds with CI/CD
- Use update servers for automatic updates
- Publish to app stores (Mac App Store, Microsoft Store)

### Release Checklist
- [ ] Test all platform builds
- [ ] Verify application functionality
- [ ] Check file permissions and security
- [ ] Update version numbers
- [ ] Create release notes
- [ ] Upload to distribution channels

## CI/CD Integration

### GitHub Actions Example
```yaml
name: Build
on: [push, release]
jobs:
  build:
    runs-on: ${{ matrix.os }}
    strategy:
      matrix:
        os: [macos-latest, windows-latest, ubuntu-latest]
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run postinstall
      - run: npm run dist
      - uses: actions/upload-artifact@v2
        with:
          name: dist-${{ matrix.os }}
          path: dist/
```

## Production Deployment

### Code Signing (Production)
1. Obtain code signing certificates
2. Update `package.json` with signing identity
3. Enable hardened runtime
4. Configure entitlements properly

### Auto-Updater Setup
1. Set up update server
2. Configure update channels
3. Implement update checking
4. Test update process

### App Store Submission
1. Follow platform guidelines
2. Prepare store assets
3. Submit for review
4. Handle rejection feedback

## Support

For build issues:
- Check the [electron-builder documentation](https://www.electron.build/)
- Review build logs in `dist/builder-debug.yml`
- Test with minimal configuration first
- Ensure all dependencies are properly installed

## Build Statistics

### Current Build Sizes (v1.0.0)
- **macOS DMG**: ~100MB (Intel), ~100MB (ARM64)
- **Windows NSIS**: ~95MB (x64), ~85MB (x86)
- **Linux AppImage**: ~90MB (x64)

### Build Times (on modern hardware)
- **macOS**: ~2-3 minutes
- **Windows**: ~3-4 minutes
- **Linux**: ~2-3 minutes
- **All Platforms**: ~8-10 minutes
