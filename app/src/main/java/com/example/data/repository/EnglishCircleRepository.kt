package com.example.data.repository

import android.content.Context
import android.util.Log
import com.example.data.local.AppDatabase
import com.example.data.local.FriendEntity
import com.example.data.local.Message
import com.example.data.local.MessageEntity
import com.example.data.local.User
import com.example.data.local.UserEntity
import com.example.data.local.toDomain
import com.example.data.local.toEntity
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.firestore.ListenerRegistration
import com.google.firebase.storage.FirebaseStorage
import com.example.ui.NotificationHelper
import com.google.android.gms.tasks.Task
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.firstOrNull
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.launch
import kotlinx.coroutines.suspendCancellableCoroutine
import java.util.UUID
import kotlin.coroutines.resume
import kotlin.coroutines.resumeWithException

class EnglishCircleRepository(private val context: Context) {

    private val db = AppDatabase.getDatabase(context)
    private val userDao = db.userDao()
    private val messageDao = db.messageDao()
    private val friendDao = db.friendDao()

    private val scope = CoroutineScope(Dispatchers.IO)

    private var usersListener: ListenerRegistration? = null
    private var activeChatListener: ListenerRegistration? = null
    private var currentChatPartnerId: String? = null

    private suspend fun <T> Task<T>.await(): T {
        if (isComplete) {
            val e = exception
            if (e != null) {
                throw e
            } else {
                return result as T
            }
        }
        return suspendCancellableCoroutine { cont ->
            addOnCompleteListener { task ->
                val e = task.exception
                if (e != null) {
                    cont.resumeWithException(e)
                } else {
                    cont.resume(task.result as T)
                }
            }
        }
    }

    // --- Firebase Lazy Initializers with Crash-Proof Fallbacks ---
    private val firebaseAuth: FirebaseAuth? by lazy {
        try {
            FirebaseAuth.getInstance()
        } catch (e: Exception) {
            Log.w("Repository", "Firebase Auth not available, running in Local-Only mode: ${e.message}")
            null
        }
    }

    private val firestore: FirebaseFirestore? by lazy {
        try {
            FirebaseFirestore.getInstance()
        } catch (e: Exception) {
            Log.w("Repository", "Firebase Firestore not available: ${e.message}")
            null
        }
    }

    private val firebaseStorage: FirebaseStorage? by lazy {
        try {
            FirebaseStorage.getInstance()
        } catch (e: Exception) {
            Log.w("Repository", "Firebase Storage not available: ${e.message}")
            null
        }
    }

    // --- Local Auth / Session State (Fallback when Firebase auth is not active) ---
    private val _localUserFlow = MutableStateFlow<User?>(null)
    val localUserFlow: StateFlow<User?> = _localUserFlow.asStateFlow()

    init {
        // Initialize local database with seed data if empty
        scope.launch {
            seedInitialUsersIfNeeded()
            loadLocalUserSession()
        }
    }

    private suspend fun loadLocalUserSession() {
        val me = userDao.getMe().map { it?.toDomain() }.firstOrNull()
        _localUserFlow.value = me
        if (me != null) {
            startUsersRealtimeSync()
        }
    }

    fun startUsersRealtimeSync() {
        val fstore = firestore ?: return
        usersListener?.remove()
        
        usersListener = fstore.collection("users")
            .addSnapshotListener { snapshot, error ->
                if (error != null) {
                    Log.e("Repository", "Firestore users sync failed: ${error.message}")
                    return@addSnapshotListener
                }
                if (snapshot != null) {
                    scope.launch {
                        val currentMeId = _localUserFlow.value?.id ?: ""
                        val usersList = snapshot.documents.mapNotNull { doc ->
                            val id = doc.id
                            if (id == currentMeId) return@mapNotNull null
                            
                            val name = doc.getString("name") ?: return@mapNotNull null
                            val country = doc.getString("country") ?: "United States"
                            val nativeLanguage = doc.getString("nativeLanguage") ?: "Spanish"
                            val englishLevel = doc.getString("englishLevel") ?: "Intermediate"
                            val interestsStr = doc.getString("interests") ?: "Tech,Music,Travel"
                            val profilePicture = doc.getString("profilePicture") ?: "avatar_me"
                            val isOnline = doc.getBoolean("isOnline") ?: false
                            
                            UserEntity(
                                id = id,
                                name = name,
                                country = country,
                                nativeLanguage = nativeLanguage,
                                englishLevel = englishLevel,
                                interests = interestsStr,
                                profilePicture = profilePicture,
                                isOnline = isOnline,
                                isMe = false
                            )
                        }
                        if (usersList.isNotEmpty()) {
                            userDao.insertUsers(usersList)
                        }
                    }
                }
            }
    }

    fun startChatRealtimeSync(myId: String, otherUserId: String) {
        val fstore = firestore ?: return
        if (otherUserId == currentChatPartnerId && activeChatListener != null) return
        
        activeChatListener?.remove()
        currentChatPartnerId = otherUserId
        
        val chatId = if (myId < otherUserId) "${myId}_${otherUserId}" else "${otherUserId}_${myId}"
        
        activeChatListener = fstore.collection("chats")
            .whereEqualTo("chatId", chatId)
            .addSnapshotListener { snapshot, error ->
                if (error != null) {
                    Log.e("Repository", "Firestore chats sync failed: ${error.message}")
                    return@addSnapshotListener
                }
                if (snapshot != null) {
                    scope.launch {
                        val messagesList = snapshot.documents.mapNotNull { doc ->
                            val id = doc.getString("id") ?: return@mapNotNull null
                            val senderId = doc.getString("senderId") ?: return@mapNotNull null
                            val receiverId = doc.getString("receiverId") ?: return@mapNotNull null
                            val text = doc.getString("text") ?: return@mapNotNull null
                            val timestamp = doc.getLong("timestamp") ?: return@mapNotNull null
                            MessageEntity(id, senderId, receiverId, text, timestamp)
                        }
                        
                        if (messagesList.isNotEmpty()) {
                            // Find any new message from other user to trigger push notification
                            val lastMsg = messagesList.maxByOrNull { it.timestamp }
                            if (lastMsg != null && lastMsg.senderId == otherUserId) {
                                val existing = messageDao.getMessagesForChat(myId, otherUserId).first()
                                val isAlreadySaved = existing.any { it.id == lastMsg.id }
                                if (!isAlreadySaved) {
                                    val sender = userDao.getUserById(otherUserId)
                                    val senderName = sender?.name ?: "English Circle"
                                    NotificationHelper.showNotification(context, senderName, lastMsg.text)
                                }
                            }
                            
                            messagesList.forEach { messageDao.insertMessage(it) }
                        }
                    }
                }
            }
    }

    // --- Seed Data Creation ---
    private suspend fun seedInitialUsersIfNeeded() {
        // Check if we already have seed users
        val currentUsers = userDao.getAllOtherUsers().first()
        if (currentUsers.isEmpty()) {
            val seedList = listOf(
                UserEntity(
                    id = "sofia_123",
                    name = "Sofia Silva",
                    country = "Brazil",
                    nativeLanguage = "Portuguese",
                    englishLevel = "Intermediate",
                    interests = "Music,Travel,Dancing,Cooking",
                    profilePicture = "avatar_sofia",
                    isOnline = true,
                    isMe = false
                ),
                UserEntity(
                    id = "kenji_456",
                    name = "Kenji Tanaka",
                    country = "Japan",
                    nativeLanguage = "Japanese",
                    englishLevel = "Beginner",
                    interests = "Tech,Gaming,Anime,Movies",
                    profilePicture = "avatar_kenji",
                    isOnline = false,
                    isMe = false
                ),
                UserEntity(
                    id = "chloe_789",
                    name = "Chloe Dubois",
                    country = "France",
                    nativeLanguage = "French",
                    englishLevel = "Advanced",
                    interests = "Literature,Art,Cinema,History",
                    profilePicture = "avatar_chloe",
                    isOnline = true,
                    isMe = false
                ),
                UserEntity(
                    id = "ahmed_101",
                    name = "Ahmed Mansour",
                    country = "Egypt",
                    nativeLanguage = "Arabic",
                    englishLevel = "Intermediate",
                    interests = "Football,Cooking,History,Tech",
                    profilePicture = "avatar_ahmed",
                    isOnline = true,
                    isMe = false
                ),
                UserEntity(
                    id = "elena_202",
                    name = "Elena Petrova",
                    country = "Russia",
                    nativeLanguage = "Russian",
                    englishLevel = "Advanced",
                    interests = "Chess,Coding,Hiking,Books",
                    profilePicture = "avatar_elena",
                    isOnline = false,
                    isMe = false
                ),
                UserEntity(
                    id = "hans_303",
                    name = "Hans Müller",
                    country = "Germany",
                    nativeLanguage = "German",
                    englishLevel = "Intermediate",
                    interests = "Engineering,Cars,Hiking,Beer",
                    profilePicture = "avatar_hans",
                    isOnline = true,
                    isMe = false
                )
            )
            userDao.insertUsers(seedList)

            // Seed some default system / chat message history
            val initialMessage = MessageEntity(
                id = UUID.randomUUID().toString(),
                senderId = "sofia_123",
                receiverId = "me", // Placeholder for my ID
                text = "Hey there! I would love to practice English with you. Let's talk about our travel goals!",
                timestamp = System.currentTimeMillis() - 3600000
            )
            messageDao.insertMessage(initialMessage)
        }
    }

    // --- Authentication Actions ---

    fun isFirebaseEnabled(): Boolean = firebaseAuth != null

    suspend fun signUp(email: String, name: String, country: String, nativeLanguage: String, englishLevel: String, interests: List<String>): Boolean {
        var uid = UUID.randomUUID().toString()
        var signUpSuccess = false
        val password = "${email.reversed()}!123_EC" // Stable derived password for simplified seamless Firebase Auth flow
        
        if (firebaseAuth != null) {
            try {
                val authResult = firebaseAuth!!.createUserWithEmailAndPassword(email, password).await()
                uid = authResult.user?.uid ?: uid
                signUpSuccess = true
            } catch (e: Exception) {
                Log.w("Repository", "Firebase auth createUser failed, trying signIn: ${e.message}")
                try {
                    val authResult = firebaseAuth!!.signInWithEmailAndPassword(email, password).await()
                    uid = authResult.user?.uid ?: uid
                    signUpSuccess = true
                } catch (e2: Exception) {
                    Log.e("Repository", "Firebase auth fallback signIn failed: ${e2.message}")
                }
            }
        }

        val me = User(
            id = uid,
            name = name,
            country = country,
            nativeLanguage = nativeLanguage,
            englishLevel = englishLevel,
            interests = interests,
            profilePicture = "avatar_me",
            isOnline = true,
            isMe = true
        )

        // Save locally
        userDao.insertUser(me.toEntity())
        _localUserFlow.value = me

        // Sync profile to Firestore
        if (firestore != null) {
            try {
                val userMap = hashMapOf(
                    "name" to me.name,
                    "email" to email,
                    "country" to me.country,
                    "nativeLanguage" to me.nativeLanguage,
                    "englishLevel" to me.englishLevel,
                    "interests" to me.interests.joinToString(","),
                    "profilePicture" to me.profilePicture,
                    "isOnline" to true,
                    "lastActive" to System.currentTimeMillis()
                )
                firestore!!.collection("users").document(uid).set(userMap).await()
                startUsersRealtimeSync()
            } catch (e: Exception) {
                Log.e("Repository", "Firebase Firestore profile sync failed: ${e.message}")
            }
        }
        return true
    }

    suspend fun login(email: String): Boolean {
        val password = "${email.reversed()}!123_EC"
        
        if (firebaseAuth != null) {
            try {
                val authResult = firebaseAuth!!.signInWithEmailAndPassword(email, password).await()
                val uid = authResult.user?.uid ?: throw Exception("User ID not found")
                
                // Fetch profile from Firestore
                if (firestore != null) {
                    val doc = firestore!!.collection("users").document(uid).get().await()
                    if (doc.exists()) {
                        val name = doc.getString("name") ?: email.substringBefore("@")
                        val country = doc.getString("country") ?: "United States"
                        val nativeLanguage = doc.getString("nativeLanguage") ?: "Spanish"
                        val englishLevel = doc.getString("englishLevel") ?: "Intermediate"
                        val interestsStr = doc.getString("interests") ?: "Tech,Music,Travel"
                        val profilePicture = doc.getString("profilePicture") ?: "avatar_me"
                        
                        val me = User(
                            id = uid,
                            name = name,
                            country = country,
                            nativeLanguage = nativeLanguage,
                            englishLevel = englishLevel,
                            interests = if (interestsStr.isEmpty()) emptyList() else interestsStr.split(","),
                            profilePicture = profilePicture,
                            isOnline = true,
                            isMe = true
                        )
                        
                        // Save profile in local DB
                        userDao.insertUser(me.toEntity())
                        _localUserFlow.value = me
                        
                        // Set online status in Firestore
                        firestore!!.collection("users").document(uid).update("isOnline", true, "lastActive", System.currentTimeMillis()).await()
                        
                        // Start real-time syncs
                        startUsersRealtimeSync()
                        return true
                    }
                }
            } catch (e: Exception) {
                Log.e("Repository", "Firebase login failed: ${e.message}")
            }
        }

        // --- Local Fallback ---
        val localMe = userDao.getMe().first()
        if (localMe != null) {
            val updated = localMe.copy(isOnline = true)
            userDao.insertUser(updated)
            _localUserFlow.value = updated.toDomain()
            return true
        }

        // Auto-signup if no user exists locally
        return signUp(
            email = email,
            name = email.substringBefore("@").replaceFirstChar { it.uppercase() },
            country = "United States",
            nativeLanguage = "Spanish",
            englishLevel = "Intermediate",
            interests = listOf("Tech", "Music", "Travel")
        )
    }

    suspend fun logout() {
        val currentMe = userDao.getMeSuspended()
        if (currentMe != null) {
            val loggedOut = currentMe.copy(isOnline = false)
            userDao.insertUser(loggedOut)
            
            // Set offline status in Firestore
            try {
                firestore?.collection("users")?.document(currentMe.id)?.update("isOnline", false)?.await()
            } catch (e: Exception) {
                Log.e("Repository", "Firebase logout offline status sync failed: ${e.message}")
            }
        }
        
        _localUserFlow.value = null
        
        // Remove snapshot listeners
        usersListener?.remove()
        usersListener = null
        activeChatListener?.remove()
        activeChatListener = null
        currentChatPartnerId = null
        
        try {
            firebaseAuth?.signOut()
        } catch (e: Exception) {
            Log.e("Repository", "Firebase logout failed: ${e.message}")
        }
    }

    // --- User Profile Management ---

    fun getMeFlow(): Flow<User?> {
        return userDao.getMe().map { it?.toDomain() }
    }

    suspend fun updateProfile(user: User) {
        userDao.insertUser(user.toEntity())
        _localUserFlow.value = user
        try {
            val userMap = hashMapOf(
                "name" to user.name,
                "country" to user.country,
                "nativeLanguage" to user.nativeLanguage,
                "englishLevel" to user.englishLevel,
                "interests" to user.interests.joinToString(","),
                "profilePicture" to user.profilePicture,
                "isOnline" to user.isOnline,
                "lastActive" to System.currentTimeMillis()
            )
            firestore?.collection("users")?.document(user.id)?.set(userMap)?.await()
        } catch (e: Exception) {
            Log.e("Repository", "Firebase profile update failed: ${e.message}")
        }
    }

    // --- User Querying & Matching ---

    fun getOtherUsersFlow(): Flow<List<User>> {
        return combine(
            userDao.getAllOtherUsers().map { list -> list.map { it.toDomain() } },
            friendDao.getAllFriendStatuses()
        ) { users, statuses ->
            val blockedIds = statuses.filter { it.isBlocked }.map { it.userId }.toSet()
            users.filter { !blockedIds.contains(it.id) }
        }
    }

    suspend fun findMatch(level: String, interests: List<String>): User? {
        delay(2000) // Realistic matching search delay
        
        if (firestore != null) {
            try {
                val snapshot = firestore!!.collection("users")
                    .whereEqualTo("isOnline", true)
                    .get().await()
                
                val meId = _localUserFlow.value?.id ?: ""
                val onlineUsers = snapshot.documents.mapNotNull { doc ->
                    val id = doc.id
                    if (id == meId) return@mapNotNull null
                    
                    val name = doc.getString("name") ?: return@mapNotNull null
                    val country = doc.getString("country") ?: "United States"
                    val nativeLanguage = doc.getString("nativeLanguage") ?: "Spanish"
                    val englishLevel = doc.getString("englishLevel") ?: "Intermediate"
                    val interestsStr = doc.getString("interests") ?: "Tech,Music,Travel"
                    val profilePicture = doc.getString("profilePicture") ?: "avatar_me"
                    val isOnline = doc.getBoolean("isOnline") ?: false
                    
                    User(
                        id = id,
                        name = name,
                        country = country,
                        nativeLanguage = nativeLanguage,
                        englishLevel = englishLevel,
                        interests = if (interestsStr.isEmpty()) emptyList() else interestsStr.split(","),
                        profilePicture = profilePicture,
                        isOnline = isOnline,
                        isMe = false
                    )
                }
                
                if (onlineUsers.isNotEmpty()) {
                    val matched = onlineUsers.map { user ->
                        var score = 0
                        if (user.englishLevel.equals(level, ignoreCase = true)) {
                            score += 3
                        }
                        val commonInterests = user.interests.intersect(interests.toSet())
                        score += commonInterests.size * 2
                        user to score
                    }.sortedByDescending { it.second }.map { it.first }.firstOrNull()
                    
                    if (matched != null) {
                        userDao.insertUser(matched.toEntity())
                        return matched
                    }
                }
            } catch (e: Exception) {
                Log.e("Repository", "Firestore matchmaking failed: ${e.message}")
            }
        }
        
        // --- Local Fallback ---
        val others = getOtherUsersFlow().first()
        if (others.isEmpty()) return null

        val matched = others.map { user ->
            var score = 0
            if (user.englishLevel.equals(level, ignoreCase = true)) {
                score += 3
            }
            val commonInterests = user.interests.intersect(interests.toSet())
            score += commonInterests.size * 2
            if (user.isOnline) {
                score += 5
            }
            user to score
        }.sortedByDescending { it.second }.map { it.first }.firstOrNull()

        matched?.let {
            userDao.updateOnlineStatus(it.id, true)
        }

        return matched
    }

    // --- Friends, Blocks, Reports ---

    fun getFriendStatusesFlow(): Flow<List<FriendEntity>> = friendDao.getAllFriendStatuses()

    suspend fun toggleFriend(userId: String) {
        val currentStatus = friendDao.getFriendStatus(userId)
        val newStatus = if (currentStatus == null) {
            FriendEntity(userId = userId, isFriend = true)
        } else {
            currentStatus.copy(isFriend = !currentStatus.isFriend)
        }
        friendDao.insertFriendStatus(newStatus)
        
        try {
            val meId = _localUserFlow.value?.id ?: "me"
            val friendMap = hashMapOf(
                "isFriend" to newStatus.isFriend,
                "timestamp" to System.currentTimeMillis()
            )
            firestore?.collection("users")?.document(meId)
                ?.collection("friends")?.document(userId)?.set(friendMap)?.await()
        } catch (e: Exception) {
            Log.e("Repository", "Firebase friend status sync failed: ${e.message}")
        }
    }

    suspend fun blockUser(userId: String) {
        val currentStatus = friendDao.getFriendStatus(userId) ?: FriendEntity(userId = userId)
        val newStatus = currentStatus.copy(isBlocked = true, isFriend = false)
        friendDao.insertFriendStatus(newStatus)
        userDao.updateOnlineStatus(userId, false)
        
        try {
            val meId = _localUserFlow.value?.id ?: "me"
            val blockMap = hashMapOf(
                "isBlocked" to true,
                "timestamp" to System.currentTimeMillis()
            )
            firestore?.collection("users")?.document(meId)
                ?.collection("blocks")?.document(userId)?.set(blockMap)?.await()
        } catch (e: Exception) {
            Log.e("Repository", "Firebase block sync failed: ${e.message}")
        }
    }

    suspend fun reportUser(userId: String) {
        val currentStatus = friendDao.getFriendStatus(userId) ?: FriendEntity(userId = userId)
        val newStatus = currentStatus.copy(isReported = true, isBlocked = true, isFriend = false)
        friendDao.insertFriendStatus(newStatus)
        userDao.updateOnlineStatus(userId, false)
        
        try {
            val meId = _localUserFlow.value?.id ?: "me"
            val reportMap = hashMapOf(
                "reportedUserId" to userId,
                "reporterId" to meId,
                "timestamp" to System.currentTimeMillis()
            )
            firestore?.collection("reports")?.document(UUID.randomUUID().toString())?.set(reportMap)?.await()
        } catch (e: Exception) {
            Log.e("Repository", "Firebase report sync failed: ${e.message}")
        }
    }

    // --- Chat Messages Engine ---

    fun getChatMessagesFlow(otherUserId: String): Flow<List<Message>> {
        val meId = _localUserFlow.value?.id ?: "me"
        startChatRealtimeSync(meId, otherUserId)
        return messageDao.getMessagesForChat(meId, otherUserId).map { list ->
            list.map { it.toDomain() }
        }
    }

    suspend fun sendMessage(receiverId: String, text: String) {
        val meId = _localUserFlow.value?.id ?: "me"
        val chatId = if (meId < receiverId) "${meId}_${receiverId}" else "${receiverId}_${meId}"
        val message = Message(
            id = UUID.randomUUID().toString(),
            senderId = meId,
            receiverId = receiverId,
            text = text,
            timestamp = System.currentTimeMillis()
        )

        messageDao.insertMessage(message.toEntity())

        try {
            if (firestore != null) {
                val firestoreMsg = hashMapOf(
                    "id" to message.id,
                    "chatId" to chatId,
                    "senderId" to message.senderId,
                    "receiverId" to message.receiverId,
                    "text" to message.text,
                    "timestamp" to message.timestamp
                )
                firestore!!.collection("chats").document(message.id).set(firestoreMsg).await()
            }
        } catch (e: Exception) {
            Log.e("Repository", "Firebase message send failed: ${e.message}")
        }

        val isMockUser = receiverId.startsWith("sofia") || receiverId.startsWith("kenji") || 
                         receiverId.startsWith("chloe") || receiverId.startsWith("ahmed") ||
                         receiverId.startsWith("elena") || receiverId.startsWith("hans")
        if (isMockUser) {
            triggerSimulatedReply(receiverId, text)
        }
    }

    private fun triggerSimulatedReply(partnerId: String, lastUserMessage: String) {
        scope.launch {
            delay(2000)
            val partner = userDao.getUserById(partnerId)?.toDomain() ?: return@launch
            val replyText = when {
                lastUserMessage.contains("hello", ignoreCase = true) || lastUserMessage.contains("hi", ignoreCase = true) -> {
                    "Hello! It's so great to meet you. I'm ${partner.name} from ${partner.country}. How are you practicing your English today?"
                }
                lastUserMessage.contains("level", ignoreCase = true) || lastUserMessage.contains("english", ignoreCase = true) -> {
                    "My English level is ${partner.englishLevel}. I practice by reading and listening to podcasts. What about you? How do you practice?"
                }
                lastUserMessage.contains("interest", ignoreCase = true) || lastUserMessage.contains("like", ignoreCase = true) || lastUserMessage.contains("hobby", ignoreCase = true) -> {
                    "That's so interesting! I really love ${partner.interests.take(2).joinToString(" and ")}. Do you have similar hobbies?"
                }
                lastUserMessage.contains("call", ignoreCase = true) || lastUserMessage.contains("voice", ignoreCase = true) || lastUserMessage.contains("video", ignoreCase = true) -> {
                    "I would love to practice speaking! Click the Call button in the top right to start our voice or video session now! Let's do it."
                }
                lastUserMessage.contains("where", ignoreCase = true) || lastUserMessage.contains("country", ignoreCase = true) -> {
                    "I live in ${partner.country}! It's a beautiful place. Where are you located, and what's it like there?"
                }
                else -> {
                    "That's wonderful! Tell me more about that. Since we are here to practice English, what is your main goal in learning the language?"
                }
            }

            val replyMessage = Message(
                id = UUID.randomUUID().toString(),
                senderId = partnerId,
                receiverId = _localUserFlow.value?.id ?: "me",
                text = replyText,
                timestamp = System.currentTimeMillis()
            )
            messageDao.insertMessage(replyMessage.toEntity())
        }
    }
}
