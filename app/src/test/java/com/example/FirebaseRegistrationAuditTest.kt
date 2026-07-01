package com.example

import android.content.Context
import androidx.test.core.app.ApplicationProvider
import com.google.firebase.FirebaseApp
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.firestore.FirebaseFirestore
import kotlinx.coroutines.runBlocking
import kotlinx.coroutines.tasks.await
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config
import java.util.UUID

@RunWith(RobolectricTestRunner::class)
@Config(sdk = [36])
class FirebaseRegistrationAuditTest {

    @Test
    fun auditRegistrationAndFirestoreWrite() = runBlocking {
        println("=== START FIREBASE REGISTRATION AUDIT ===")
        val context = ApplicationProvider.getApplicationContext<Context>()
        
        // 1. Initialize Firebase App
        val app = try {
            FirebaseApp.initializeApp(context) ?: FirebaseApp.getInstance()
        } catch (e: Exception) {
            println("[ERROR] Failed to initialize FirebaseApp: ${e.message}")
            return@runBlocking
        }
        
        val auth = FirebaseAuth.getInstance(app)
        val firestore = FirebaseFirestore.getInstance(app)
        
        // Create unique credentials to register
        val uniqueEmail = "audit_user_${UUID.randomUUID().toString().substring(0, 8)}@example.com"
        val password = "TestPassword123!"
        
        println("1. Attempting to create user with Email: $uniqueEmail")
        
        var uid: String? = null
        try {
            val authResult = auth.createUserWithEmailAndPassword(uniqueEmail, password).await()
            uid = authResult.user?.uid
            println("-> [SUCCESS] Auth user created! UID: $uid")
        } catch (e: Exception) {
            println("-> [FAILED] Auth user creation failed: ${e.message}")
            e.printStackTrace()
            return@runBlocking
        }
        
        if (uid != null) {
            println("2. Confirming saveUserProfile() / Firestore writing is being initiated...")
            
            val userMap = hashMapOf(
                "name" to "Audit User",
                "email" to uniqueEmail,
                "country" to "United States",
                "nativeLanguage" to "Spanish",
                "englishLevel" to "Advanced",
                "interests" to "Tech,Music",
                "isOnline" to true,
                "lastActive" to System.currentTimeMillis()
            )
            
            val targetPath = "users/$uid"
            println("3. Firestore target document path: $targetPath")
            
            try {
                println("4. Attempting to write profile to Firestore using set()...")
                firestore.collection("users").document(uid).set(userMap).await()
                println("-> [SUCCESS] Firestore set() succeeded! Document written successfully.")
            } catch (e: Exception) {
                println("-> [FAILED] Firestore set() failed!")
                println("Exception class: ${e.javaClass.name}")
                println("Full Exception Message: ${e.message}")
                
                if (e.message?.contains("PERMISSION_DENIED") == true || e.message?.contains("permission") == true) {
                    println("Rule Evaluation: Firestore Security Rules are REJECTING the write.")
                } else {
                    println("Rule Evaluation: Writing failed due to another reason (e.g., connection or configuration).")
                }
                e.printStackTrace()
            }
        }
        
        println("=== END FIREBASE REGISTRATION AUDIT ===")
    }
}
