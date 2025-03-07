package cloneappsdk.example;
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import android.content.pm.PackageManager

class InstalledAppsModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String {
        return "InstalledAppsModule"
    }

    @ReactMethod
    fun getInstalledApps(promise: Promise) {
        try {
            val pm = reactApplicationContext.packageManager
            val packages = pm.getInstalledApplications(PackageManager.GET_META_DATA)
            val appNames = Arguments.createArray() // Proper initialization

            for (packageInfo in packages) {
                val appName = pm.getApplicationLabel(packageInfo).toString()
                appNames.pushString(appName)
            }

            promise.resolve(appNames)
        } catch (e: Exception) {
            promise.reject("Error", e)
        }
    }
}