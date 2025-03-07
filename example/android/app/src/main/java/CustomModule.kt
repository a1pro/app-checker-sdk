package cloneappsdk.example

import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.WritableArray
import android.content.pm.PackageManager

class CustomModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    init {
        // Initialize any resources here if needed
    }

    override fun getName(): String {
        return "CustomModule"
    }

    @ReactMethod
    fun checkSimilarApps(promise: Promise) {
        try {
            val pm = reactApplicationContext.packageManager
            val packages = pm.getInstalledPackages(0)
            val similarApps: WritableArray = Arguments.createArray()

            for (packageInfo in packages) {
                val packageName = packageInfo.packageName
                if (packageName.contains("bet365", ignoreCase = true) || 
                    packageName.contains("dream11", ignoreCase = true)) {
                    similarApps.pushString(packageName)
                }
            }

            promise.resolve(similarApps)
        } catch (e: Exception) {
            promise.reject("Error", e)
        }
    }
}