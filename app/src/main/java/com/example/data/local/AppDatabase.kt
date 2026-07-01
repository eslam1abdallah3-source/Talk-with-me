package com.example.data.local

import android.content.Context
import androidx.room.Dao
import androidx.room.Database
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import androidx.room.Room
import androidx.room.RoomDatabase
import kotlinx.coroutines.flow.Flow

@Dao
interface UserDao {
    @Query("SELECT * FROM users WHERE isMe = 0")
    fun getAllOtherUsers(): Flow<List<UserEntity>>

    @Query("SELECT * FROM users WHERE id = :id LIMIT 1")
    suspend fun getUserById(id: String): UserEntity?

    @Query("SELECT * FROM users WHERE isMe = 1 LIMIT 1")
    fun getMe(): Flow<UserEntity?>

    @Query("SELECT * FROM users WHERE isMe = 1 LIMIT 1")
    suspend fun getMeSuspended(): UserEntity?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertUser(user: UserEntity)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertUsers(users: List<UserEntity>)

    @Query("UPDATE users SET isOnline = :isOnline WHERE id = :id")
    suspend fun updateOnlineStatus(id: String, isOnline: Boolean)

    @Query("DELETE FROM users WHERE id = :id")
    suspend fun deleteUser(id: String)

    @Query("DELETE FROM users WHERE isMe = 0")
    suspend fun deleteAllOtherUsers()
}

@Dao
interface MessageDao {
    @Query("""
        SELECT * FROM messages 
        WHERE (senderId = :myId AND receiverId = :otherId) 
           OR (senderId = :otherId AND receiverId = :myId)
        ORDER BY timestamp ASC
    """)
    fun getMessagesForChat(myId: String, otherId: String): Flow<List<MessageEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertMessage(message: MessageEntity)

    @Query("DELETE FROM messages WHERE senderId = :userId OR receiverId = :userId")
    suspend fun deleteMessagesWithUser(userId: String)
}

@Dao
interface FriendDao {
    @Query("SELECT * FROM friends")
    fun getAllFriendStatuses(): Flow<List<FriendEntity>>

    @Query("SELECT * FROM friends WHERE userId = :userId LIMIT 1")
    suspend fun getFriendStatus(userId: String): FriendEntity?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertFriendStatus(friend: FriendEntity)

    @Query("UPDATE friends SET isFriend = :isFriend WHERE userId = :userId")
    suspend fun updateFriendship(userId: String, isFriend: Boolean)

    @Query("UPDATE friends SET isBlocked = :isBlocked WHERE userId = :userId")
    suspend fun updateBlocking(userId: String, isBlocked: Boolean)

    @Query("UPDATE friends SET isReported = :isReported WHERE userId = :userId")
    suspend fun updateReporting(userId: String, isReported: Boolean)
}

@Database(
    entities = [UserEntity::class, MessageEntity::class, FriendEntity::class],
    version = 1,
    exportSchema = false
)
abstract class AppDatabase : RoomDatabase() {
    abstract fun userDao(): UserDao
    abstract fun messageDao(): MessageDao
    abstract fun friendDao(): FriendDao

    companion object {
        @Volatile
        private var INSTANCE: AppDatabase? = null

        fun getDatabase(context: Context): AppDatabase {
            return INSTANCE ?: synchronized(this) {
                val instance = Room.databaseBuilder(
                    context.applicationContext,
                    AppDatabase::class.java,
                    "english_circle_db"
                )
                .fallbackToDestructiveMigration()
                .build()
                INSTANCE = instance
                instance
            }
        }
    }
}
