#!/bin/bash
# FCM Quick Verification Script

echo "🔍 Verifying Firebase Cloud Messaging Setup..."
echo ""

echo "1️⃣  Checking AndroidManifest.xml for POST_NOTIFICATIONS..."
if grep -q "android.permission.POST_NOTIFICATIONS" android/app/src/main/AndroidManifest.xml; then
    echo "   ✅ POST_NOTIFICATIONS permission found"
else
    echo "   ❌ POST_NOTIFICATIONS permission NOT found - FCM won't work on Android 13+"
fi

echo ""
echo "2️⃣  Checking google-services.json..."
if [ -f "android/app/google-services.json" ]; then
    echo "   ✅ google-services.json exists in correct location"
    echo "   📦 Package name in file:"
    grep -o '"package_name": "[^"]*' android/app/google-services.json | head -1
else
    echo "   ❌ google-services.json NOT FOUND in android/app/"
fi

echo ""
echo "3️⃣  Checking app/build.gradle for google-services plugin..."
if grep -q "apply plugin: 'com.google.gms.google-services'" android/app/build.gradle; then
    echo "   ✅ google-services plugin is applied"
else
    echo "   ❌ google-services plugin NOT applied"
fi

echo ""
echo "4️⃣  Checking package.json for Firebase dependencies..."
if grep -q "@react-native-firebase/messaging" package.json; then
    echo "   ✅ @react-native-firebase/messaging found"
else
    echo "   ❌ @react-native-firebase/messaging NOT found"
fi

if grep -q "@react-native-firebase/app" package.json; then
    echo "   ✅ @react-native-firebase/app found"
else
    echo "   ❌ @react-native-firebase/app NOT found"
fi

echo ""
echo "5️⃣  Checking notifications.ts for background handler..."
if grep -q "setBackgroundMessageHandler" src/services/notifications.ts; then
    echo "   ✅ Background message handler found"
else
    echo "   ❌ Background message handler NOT found"
fi

echo ""
echo "6️⃣  Checking App.tsx for FCM initialization..."
if grep -q "messaging().getInitialNotification()" App.tsx; then
    echo "   ✅ FCM initialization found in App.tsx"
else
    echo "   ❌ FCM initialization NOT found in App.tsx"
fi

echo ""
echo "═══════════════════════════════════════════════════════"
echo "✨ Verification complete! Check above for any ❌ marks"
echo ""
echo "📝 Next steps:"
echo "   1. If all ✅, rebuild: npx expo run:android"
echo "   2. Check logs: adb logcat | grep FCM"
echo "   3. Look for: '[FCM] ✅ Token nativo registrado'"
echo "═══════════════════════════════════════════════════════"
