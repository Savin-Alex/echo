# Echo Build Assets

This directory contains build assets and configuration files for the Echo application.

## Required Assets

### Icons
- `icon.icns` - macOS icon (512x512 pixels)
- `icon.ico` - Windows icon (256x256 pixels)
- `icon.png` - Linux icon (512x512 pixels)

### macOS Assets
- `dmg-background.png` - DMG installer background (540x380 pixels)

### Entitlements
- `entitlements.mac.plist` - macOS code signing entitlements

## Creating Icons

### macOS Icon (.icns)
1. Create a 512x512 PNG image
2. Use `iconutil` to convert:
   ```bash
   mkdir Echo.iconset
   sips -z 16 16     icon.png --out Echo.iconset/icon_16x16.png
   sips -z 32 32     icon.png --out Echo.iconset/icon_16x16@2x.png
   sips -z 32 32     icon.png --out Echo.iconset/icon_32x32.png
   sips -z 64 64     icon.png --out Echo.iconset/icon_32x32@2x.png
   sips -z 128 128   icon.png --out Echo.iconset/icon_128x128.png
   sips -z 256 256   icon.png --out Echo.iconset/icon_128x128@2x.png
   sips -z 256 256   icon.png --out Echo.iconset/icon_256x256.png
   sips -z 512 512   icon.png --out Echo.iconset/icon_256x256@2x.png
   sips -z 512 512   icon.png --out Echo.iconset/icon_512x512.png
   sips -z 1024 1024 icon.png --out Echo.iconset/icon_512x512@2x.png
   iconutil -c icns Echo.iconset
   mv Echo.icns build/icon.icns
   rm -rf Echo.iconset
   ```

### Windows Icon (.ico)
1. Create a 256x256 PNG image
2. Use ImageMagick to convert:
   ```bash
   convert icon.png -define icon:auto-resize=256,128,64,48,32,16 build/icon.ico
   ```

### Linux Icon (.png)
1. Create a 512x512 PNG image
2. Copy to build directory:
   ```bash
   cp icon.png build/icon.png
   ```

## DMG Background

Create a 540x380 pixel background image for the macOS installer:
- Should include the Echo logo
- Should have space for the application and Applications folder icons
- Save as `build/dmg-background.png`

## Placeholder Assets

If you don't have custom icons yet, you can create simple placeholder icons:

```bash
# Create a simple colored square as placeholder
convert -size 512x512 xc:'#4A90E2' build/icon.png
convert build/icon.png -define icon:auto-resize=256,128,64,48,32,16 build/icon.ico
cp build/icon.png build/icon.icns
```

## Build Process

1. Place all required assets in this directory
2. Run the build command:
   ```bash
   npm run build:mac    # macOS
   npm run build:win    # Windows
   npm run build:linux  # Linux
   npm run build:all    # All platforms
   ```

The built applications will be output to the `dist/` directory.
