package com.example.data.local

import androidx.room.Entity
import androidx.room.PrimaryKey

// --- Database Entities ---

@Entity(tableName = "users")
data class UserEntity(
    @PrimaryKey val id: String,
    val name: String,
    val country: String,
    val nativeLanguage: String,
    val englishLevel: String,
    val interests: String, // Comma separated, e.g., "Tech,Travel,Music"
    val profilePicture: String, // String Uri, Base64 or icon code
    val isOnline: Boolean = false,
    val isMe: Boolean = false
)

@Entity(tableName = "messages")
data class MessageEntity(
    @PrimaryKey val id: String,
    val senderId: String,
    val receiverId: String,
    val text: String,
    val timestamp: Long
)

@Entity(tableName = "friends")
data class FriendEntity(
    @PrimaryKey val userId: String,
    val isFriend: Boolean = false,
    val isBlocked: Boolean = false,
    val isReported: Boolean = false
)

// --- Domain Models for use in ViewModel & UI ---

data class User(
    val id: String,
    val name: String,
    val country: String,
    val nativeLanguage: String,
    val englishLevel: String, // Beginner, Intermediate, Advanced
    val interests: List<String>,
    val profilePicture: String,
    val isOnline: Boolean,
    val isMe: Boolean = false
)

data class Message(
    val id: String,
    val senderId: String,
    val receiverId: String,
    val text: String,
    val timestamp: Long
)

// --- Extension Converters ---

fun UserEntity.toDomain(): User = User(
    id = id,
    name = name,
    country = country,
    nativeLanguage = nativeLanguage,
    englishLevel = englishLevel,
    interests = if (interests.isEmpty()) emptyList() else interests.split(","),
    profilePicture = profilePicture,
    isOnline = isOnline,
    isMe = isMe
)

fun User.toEntity(): UserEntity = UserEntity(
    id = id,
    name = name,
    country = country,
    nativeLanguage = nativeLanguage,
    englishLevel = englishLevel,
    interests = interests.joinToString(","),
    profilePicture = profilePicture,
    isOnline = isOnline,
    isMe = isMe
)

fun MessageEntity.toDomain(): Message = Message(
    id = id,
    senderId = senderId,
    receiverId = receiverId,
    text = text,
    timestamp = timestamp
)

fun Message.toEntity(): MessageEntity = MessageEntity(
    id = id,
    senderId = senderId,
    receiverId = receiverId,
    text = text,
    timestamp = timestamp
)
